"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const change_request_controller_1 = require("../controllers/change-request.controller");
const router = (0, express_1.Router)();
const controller = new change_request_controller_1.ChangeRequestController();
router.get('/snapshot', controller.getSnapshot.bind(controller));
router.post('/', controller.createChangeRequest.bind(controller));
router.get('/', controller.listChangeRequests.bind(controller));
router.get('/:id', controller.getChangeRequest.bind(controller));
router.post('/:id/submit', controller.submitForReview.bind(controller));
router.post('/:id/reviewer', controller.addReviewer.bind(controller));
router.post('/:id/reviewer/approve', controller.reviewerApprove.bind(controller));
router.post('/:id/reviewer/deny', controller.reviewerDeny.bind(controller));
router.post('/:id/approve', controller.approve.bind(controller));
router.post('/:id/reject', controller.reject.bind(controller));
router.post('/:id/publish', controller.publish.bind(controller));
exports.default = router;
//# sourceMappingURL=change-request.routes.js.map