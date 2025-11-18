"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_log_controller_1 = require("../controllers/audit-log.controller");
const router = (0, express_1.Router)();
const controller = new audit_log_controller_1.AuditLogController();
router.get('/', controller.getAuditLogs.bind(controller));
exports.default = router;
//# sourceMappingURL=audit-log.routes.js.map