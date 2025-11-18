"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogController = void 0;
const audit_log_model_1 = require("../models/audit-log.model");
class AuditLogController {
    constructor() {
        this.auditLogModel = new audit_log_model_1.AuditLogModel();
    }
    async getAuditLogs(req, res) {
        try {
            const { changeRequestId } = req.query;
            const limit = parseInt(req.query.limit) || 100;
            if (changeRequestId) {
                const logs = await this.auditLogModel.findByChangeRequestId(changeRequestId);
                return res.json(logs);
            }
            const logs = await this.auditLogModel.findAll(limit);
            res.json(logs);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.AuditLogController = AuditLogController;
//# sourceMappingURL=audit-log.controller.js.map