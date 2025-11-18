import { AuditLog } from '../types';
export declare class AuditLogModel {
    private db;
    private collection;
    connect(): Promise<void>;
    create(log: AuditLog): Promise<AuditLog>;
    findByChangeRequestId(changeRequestId: string): Promise<AuditLog[]>;
    findAll(limit?: number): Promise<AuditLog[]>;
}
//# sourceMappingURL=audit-log.model.d.ts.map