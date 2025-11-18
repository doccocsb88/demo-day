"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectModel = void 0;
const mongodb_1 = require("mongodb");
class ProjectModel {
    constructor() {
        this.db = null;
        this.collection = null;
    }
    async connect() {
        if (this.db)
            return;
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/remote-config-review';
        const client = new mongodb_1.MongoClient(uri);
        await client.connect();
        this.db = client.db();
        this.collection = this.db.collection('projects');
        // Create indexes
        await this.collection.createIndex({ projectId: 1 }, { unique: true });
        await this.collection.createIndex({ createdBy: 1 });
        await this.collection.createIndex({ createdAt: -1 });
    }
    async create(project) {
        await this.connect();
        await this.collection.insertOne(project);
        return project;
    }
    async findById(id) {
        await this.connect();
        return await this.collection.findOne({ id });
    }
    async findByProjectId(projectId) {
        await this.connect();
        return await this.collection.findOne({ projectId });
    }
    async findAll() {
        await this.connect();
        return await this.collection.find({}).sort({ createdAt: -1 }).toArray();
    }
    async update(id, updates) {
        await this.connect();
        await this.collection.updateOne({ id }, { $set: { ...updates, updatedAt: new Date().toISOString() } });
    }
    async delete(id) {
        await this.connect();
        await this.collection.deleteOne({ id });
    }
}
exports.ProjectModel = ProjectModel;
//# sourceMappingURL=project.model.js.map