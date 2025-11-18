"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeRequestController = void 0;
const change_request_model_1 = require("../models/change-request.model");
const audit_log_model_1 = require("../models/audit-log.model");
const project_model_1 = require("../models/project.model");
const firebase_admin_service_1 = require("../services/firebase-admin.service");
const diff_service_1 = require("../services/diff.service");
const ai_summary_service_1 = require("../services/ai-summary.service");
const slack_service_1 = require("../services/slack.service");
class ChangeRequestController {
    constructor() {
        this.changeRequestModel = new change_request_model_1.ChangeRequestModel();
        this.auditLogModel = new audit_log_model_1.AuditLogModel();
        this.projectModel = new project_model_1.ProjectModel();
        this.firebaseAdmin = new firebase_admin_service_1.FirebaseAdminService();
        this.diffService = new diff_service_1.DiffService();
        this.aiSummaryService = new ai_summary_service_1.AISummaryService();
        this.slackService = new slack_service_1.SlackService();
    }
    async getSnapshot(req, res) {
        try {
            const env = req.query.env || 'prod';
            const createdBy = req.user?.uid || 'system';
            const snapshot = await this.firebaseAdmin.getSnapshot(env, createdBy);
            res.json(snapshot);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createChangeRequest(req, res) {
        try {
            const { title, description, newConfig, env, projectId } = req.body;
            const createdBy = req.user?.uid || req.body.createdBy || 'anonymous';
            // Get base version
            const baseConfig = await this.firebaseAdmin.getSnapshot(env || 'prod', createdBy);
            // Generate diff
            const diff = this.diffService.generateDiff(baseConfig, newConfig);
            const changeRequest = {
                id: `cr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title,
                description,
                baseVersionId: baseConfig.id,
                projectId: projectId || undefined,
                env: env || 'prod',
                newConfig,
                diff,
                status: 'draft',
                createdBy,
                createdAt: new Date().toISOString(),
                reviewers: [],
            };
            await this.changeRequestModel.create(changeRequest);
            await this.auditLogModel.create({
                id: `log-${Date.now()}`,
                changeRequestId: changeRequest.id,
                action: 'created',
                performedBy: createdBy,
                performedAt: new Date().toISOString(),
                details: { title },
            });
            res.json(changeRequest);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async submitForReview(req, res) {
        try {
            const { id } = req.params;
            const changeRequest = await this.changeRequestModel.findById(id);
            if (!changeRequest) {
                return res.status(404).json({ error: 'Change request not found' });
            }
            // Generate AI summary
            const aiSummary = await this.aiSummaryService.generateSummary(changeRequest);
            await this.changeRequestModel.update(id, {
                status: 'pending_review',
                aiSummary,
            });
            await this.auditLogModel.create({
                id: `log-${Date.now()}`,
                changeRequestId: id,
                action: 'submitted_for_review',
                performedBy: req.user?.uid || changeRequest.createdBy,
                performedAt: new Date().toISOString(),
            });
            const updated = await this.changeRequestModel.findById(id);
            // Send Slack notification if project has webhook URL
            if (updated && updated.projectId) {
                try {
                    const project = await this.projectModel.findById(updated.projectId);
                    if (project && project.slackWebhookUrl) {
                        await this.slackService.sendNotification(project.slackWebhookUrl, updated, 'submitted_for_review');
                    }
                }
                catch (slackError) {
                    console.error('Error sending Slack notification:', slackError);
                    // Don't fail the request if Slack fails
                }
            }
            res.json(updated);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async addReviewer(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;
            const changeRequest = await this.changeRequestModel.findById(id);
            if (!changeRequest) {
                return res.status(404).json({ error: 'Change request not found' });
            }
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            // Check if reviewer already exists
            const existingReviewer = changeRequest.reviewers.find(r => r.userId === userId);
            if (existingReviewer) {
                return res.status(400).json({ error: 'Reviewer already added' });
            }
            // Check if trying to add creator as reviewer
            if (userId === changeRequest.createdBy) {
                return res.status(400).json({ error: 'Creator cannot be added as reviewer' });
            }
            const newReviewer = {
                userId,
                status: 'pending',
            };
            const updatedReviewers = [...changeRequest.reviewers, newReviewer];
            await this.changeRequestModel.update(id, {
                reviewers: updatedReviewers,
            });
            await this.auditLogModel.create({
                id: `log-${Date.now()}`,
                changeRequestId: id,
                action: 'reviewer_added',
                performedBy: req.user?.uid || 'system',
                performedAt: new Date().toISOString(),
                details: { reviewerId: userId },
            });
            const updated = await this.changeRequestModel.findById(id);
            // Send Slack notification if project has webhook URL
            if (updated && updated.projectId) {
                try {
                    const project = await this.projectModel.findById(updated.projectId);
                    if (project && project.slackWebhookUrl) {
                        // Send notification to channel
                        await this.slackService.sendNotification(project.slackWebhookUrl, updated, 'reviewer_added', userId);
                    }
                }
                catch (slackError) {
                    console.error('Error sending Slack notification:', slackError);
                    // Don't fail the request if Slack fails
                }
            }
            res.json(updated);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async reviewerApprove(req, res) {
        try {
            const { id } = req.params;
            const { message } = req.body;
            const reviewerId = req.user?.uid;
            const reviewerEmail = req.user?.email;
            if (!reviewerId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const changeRequest = await this.changeRequestModel.findById(id);
            if (!changeRequest) {
                return res.status(404).json({ error: 'Change request not found' });
            }
            // Check if user is the creator (by uid or email)
            if (changeRequest.createdBy === reviewerId || changeRequest.createdBy === reviewerEmail) {
                return res.status(403).json({ error: 'Creator cannot approve their own change request' });
            }
            // Find reviewer by both uid and email
            const reviewerIndex = changeRequest.reviewers.findIndex(r => r.userId === reviewerId || r.userId === reviewerEmail);
            if (reviewerIndex === -1) {
                return res.status(403).json({ error: 'You are not assigned as a reviewer for this change request' });
            }
            // Update reviewer status
            const updatedReviewers = [...changeRequest.reviewers];
            updatedReviewers[reviewerIndex] = {
                ...updatedReviewers[reviewerIndex],
                status: 'approved',
                message: message || '',
                reviewedAt: new Date().toISOString(),
            };
            await this.changeRequestModel.update(id, {
                reviewers: updatedReviewers,
            });
            await this.auditLogModel.create({
                id: `log-${Date.now()}`,
                changeRequestId: id,
                action: 'reviewer_approved',
                performedBy: reviewerId,
                performedAt: new Date().toISOString(),
                details: { message },
            });
            const updated = await this.changeRequestModel.findById(id);
            res.json(updated);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async reviewerDeny(req, res) {
        try {
            const { id } = req.params;
            const { message } = req.body;
            const reviewerId = req.user?.uid;
            const reviewerEmail = req.user?.email;
            if (!reviewerId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const changeRequest = await this.changeRequestModel.findById(id);
            if (!changeRequest) {
                return res.status(404).json({ error: 'Change request not found' });
            }
            // Check if user is the creator (by uid or email)
            if (changeRequest.createdBy === reviewerId || changeRequest.createdBy === reviewerEmail) {
                return res.status(403).json({ error: 'Creator cannot deny their own change request' });
            }
            // Find reviewer by both uid and email
            const reviewerIndex = changeRequest.reviewers.findIndex(r => r.userId === reviewerId || r.userId === reviewerEmail);
            if (reviewerIndex === -1) {
                return res.status(403).json({ error: 'You are not assigned as a reviewer for this change request' });
            }
            // Update reviewer status
            const updatedReviewers = [...changeRequest.reviewers];
            updatedReviewers[reviewerIndex] = {
                ...updatedReviewers[reviewerIndex],
                status: 'denied',
                message: message || '',
                reviewedAt: new Date().toISOString(),
            };
            await this.changeRequestModel.update(id, {
                reviewers: updatedReviewers,
            });
            await this.auditLogModel.create({
                id: `log-${Date.now()}`,
                changeRequestId: id,
                action: 'reviewer_denied',
                performedBy: reviewerId,
                performedAt: new Date().toISOString(),
                details: { message },
            });
            const updated = await this.changeRequestModel.findById(id);
            res.json(updated);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async approve(req, res) {
        try {
            const { id } = req.params;
            const changeRequest = await this.changeRequestModel.findById(id);
            if (!changeRequest) {
                return res.status(404).json({ error: 'Change request not found' });
            }
            const approvedBy = req.user?.uid || 'system';
            // Check if user is the creator
            if (changeRequest.createdBy === approvedBy) {
                return res.status(403).json({ error: 'Creator cannot approve their own change request' });
            }
            await this.changeRequestModel.update(id, {
                status: 'approved',
                approvedBy,
                approvedAt: new Date().toISOString(),
            });
            await this.auditLogModel.create({
                id: `log-${Date.now()}`,
                changeRequestId: id,
                action: 'approved',
                performedBy: approvedBy,
                performedAt: new Date().toISOString(),
            });
            const updated = await this.changeRequestModel.findById(id);
            res.json(updated);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async reject(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const changeRequest = await this.changeRequestModel.findById(id);
            if (!changeRequest) {
                return res.status(404).json({ error: 'Change request not found' });
            }
            const rejectedBy = req.user?.uid || 'system';
            await this.changeRequestModel.update(id, {
                status: 'rejected',
                rejectedBy,
                rejectedAt: new Date().toISOString(),
                rejectedReason: reason,
            });
            await this.auditLogModel.create({
                id: `log-${Date.now()}`,
                changeRequestId: id,
                action: 'rejected',
                performedBy: rejectedBy,
                performedAt: new Date().toISOString(),
                details: { reason },
            });
            const updated = await this.changeRequestModel.findById(id);
            res.json(updated);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async publish(req, res) {
        try {
            const { id } = req.params;
            const changeRequest = await this.changeRequestModel.findById(id);
            if (!changeRequest) {
                return res.status(404).json({ error: 'Change request not found' });
            }
            const publishedBy = req.user?.uid || 'system';
            const publishedByEmail = req.user?.email;
            // Check if user is the creator (by uid or email)
            if (changeRequest.createdBy !== publishedBy && changeRequest.createdBy !== publishedByEmail) {
                return res.status(403).json({ error: 'Only the creator can publish this change request' });
            }
            // Check if at least one reviewer has approved
            const approvedReviewers = changeRequest.reviewers.filter(r => r.status === 'approved');
            if (approvedReviewers.length === 0) {
                return res.status(400).json({ error: 'At least one reviewer must approve before publishing' });
            }
            // Publish to Firebase
            await this.firebaseAdmin.publishTemplate(changeRequest.newConfig);
            await this.changeRequestModel.update(id, {
                status: 'published',
                publishedBy,
                publishedAt: new Date().toISOString(),
            });
            await this.auditLogModel.create({
                id: `log-${Date.now()}`,
                changeRequestId: id,
                action: 'published',
                performedBy: publishedBy,
                performedAt: new Date().toISOString(),
                details: { env: changeRequest.env },
            });
            const updated = await this.changeRequestModel.findById(id);
            res.json(updated);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getChangeRequest(req, res) {
        try {
            const { id } = req.params;
            const changeRequest = await this.changeRequestModel.findById(id);
            if (!changeRequest) {
                return res.status(404).json({ error: 'Change request not found' });
            }
            res.json(changeRequest);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async listChangeRequests(req, res) {
        try {
            const filters = {};
            if (req.query.env)
                filters.env = req.query.env;
            if (req.query.status)
                filters.status = req.query.status;
            if (req.query.createdBy)
                filters.createdBy = req.query.createdBy;
            const changeRequests = await this.changeRequestModel.findAll(filters);
            res.json(changeRequests);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.ChangeRequestController = ChangeRequestController;
//# sourceMappingURL=change-request.controller.js.map