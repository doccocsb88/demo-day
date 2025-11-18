import { MongoClient, Db, Collection } from 'mongodb';
import { FirebaseProject } from '../types';

export class ProjectModel {
  private db: Db | null = null;
  private collection: Collection<FirebaseProject> | null = null;

  async connect(): Promise<void> {
    if (this.db) return;

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/remote-config-review';
    const client = new MongoClient(uri);
    await client.connect();
    this.db = client.db();
    this.collection = this.db.collection<FirebaseProject>('projects');
    
    // Create indexes
    await this.collection.createIndex({ projectId: 1 }, { unique: true });
    await this.collection.createIndex({ createdBy: 1 });
    await this.collection.createIndex({ createdAt: -1 });
  }

  async create(project: FirebaseProject): Promise<FirebaseProject> {
    await this.connect();
    await this.collection!.insertOne(project);
    return project;
  }

  async findById(id: string): Promise<FirebaseProject | null> {
    await this.connect();
    return await this.collection!.findOne({ id });
  }

  async findByProjectId(projectId: string): Promise<FirebaseProject | null> {
    await this.connect();
    return await this.collection!.findOne({ projectId });
  }

  async findAll(): Promise<FirebaseProject[]> {
    await this.connect();
    return await this.collection!.find({}).sort({ createdAt: -1 }).toArray();
  }

  async update(id: string, updates: Partial<FirebaseProject>): Promise<void> {
    await this.connect();
    await this.collection!.updateOne({ id }, { $set: { ...updates, updatedAt: new Date().toISOString() } });
  }

  async delete(id: string): Promise<void> {
    await this.connect();
    await this.collection!.deleteOne({ id });
  }
}

