import { MongoClient, Db, Collection } from 'mongodb';
import { RemoteConfigChangeRequest } from '../types';

export class ChangeRequestModel {
  private db: Db | null = null;
  private collection: Collection<RemoteConfigChangeRequest> | null = null;

  async connect(): Promise<void> {
    if (this.db) return;

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/remote-config-review';
    const client = new MongoClient(uri);
    await client.connect();
    this.db = client.db();
    this.collection = this.db.collection<RemoteConfigChangeRequest>('changeRequests');
    
    // Create indexes
    await this.collection.createIndex({ status: 1 });
    await this.collection.createIndex({ env: 1 });
    await this.collection.createIndex({ createdBy: 1 });
    await this.collection.createIndex({ createdAt: -1 });
  }

  async create(changeRequest: RemoteConfigChangeRequest): Promise<RemoteConfigChangeRequest> {
    await this.connect();
    await this.collection!.insertOne(changeRequest);
    return changeRequest;
  }

  async findById(id: string): Promise<RemoteConfigChangeRequest | null> {
    await this.connect();
    return await this.collection!.findOne({ id });
  }

  async findAll(filters?: {
    env?: 'prod' | 'staging';
    status?: string;
    createdBy?: string;
  }): Promise<RemoteConfigChangeRequest[]> {
    await this.connect();
    const query: any = {};
    if (filters?.env) query.env = filters.env;
    if (filters?.status) query.status = filters.status;
    if (filters?.createdBy) query.createdBy = filters.createdBy;
    
    return await this.collection!.find(query).sort({ createdAt: -1 }).toArray();
  }

  async update(id: string, updates: Partial<RemoteConfigChangeRequest>): Promise<void> {
    await this.connect();
    await this.collection!.updateOne({ id }, { $set: updates });
  }

  async delete(id: string): Promise<void> {
    await this.connect();
    await this.collection!.deleteOne({ id });
  }
}

