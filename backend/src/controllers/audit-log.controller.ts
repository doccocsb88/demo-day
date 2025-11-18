import { Request, Response } from 'express';
import { AuditLogModel } from '../models/audit-log.model';

export class AuditLogController {
  private auditLogModel = new AuditLogModel();

  async getAuditLogs(req: Request, res: Response) {
    try {
      const { changeRequestId } = req.query;
      const limit = parseInt(req.query.limit as string) || 100;

      if (changeRequestId) {
        const logs = await this.auditLogModel.findByChangeRequestId(changeRequestId as string);
        return res.json(logs);
      }

      const logs = await this.auditLogModel.findAll(limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

