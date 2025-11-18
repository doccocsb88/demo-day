import { Router } from 'express';
import { AuditLogController } from '../controllers/audit-log.controller';

const router = Router();
const controller = new AuditLogController();

router.get('/', controller.getAuditLogs.bind(controller));

export default router;

