import { MongoClient, Db, Collection } from 'mongodb';
import { AuditLog } from '../types';

export class AuditLogModel {
  private db: Db | null = null;
  private collection: Collection<AuditLog> | null = null;

  async connect(): Promise<void> {
    if (this.db) return;

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/remote-config-review';
    const client = new MongoClient(uri);
    await client.connect();
    this.db = client.db();
    this.collection = this.db.collection<AuditLog>('auditLogs');
    
    await this.collection.createIndex({ changeRequestId: 1 });
    await this.collection.createIndex({ performedAt: -1 });
  }

  async create(log: AuditLog): Promise<AuditLog> {
    await this.connect();
    await this.collection!.insertOne(log);
    return log;
  }

  async findByChangeRequestId(changeRequestId: string): Promise<AuditLog[]> {
    await this.connect();
    return await this.collection!.find({ changeRequestId }).sort({ performedAt: -1 }).toArray();
  }

  async findAll(limit: number = 100): Promise<AuditLog[]> {
    await this.connect();
    return await this.collection!.find({}).sort({ performedAt: -1 }).limit(limit).toArray();
  }
}

