"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeRequestModel = void 0;
const mongodb_1 = require("mongodb");
class ChangeRequestModel {
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
        this.collection = this.db.collection('changeRequests');
        // Create indexes
        await this.collection.createIndex({ status: 1 });
        await this.collection.createIndex({ env: 1 });
        await this.collection.createIndex({ createdBy: 1 });
        await this.collection.createIndex({ createdAt: -1 });
    }
    async create(changeRequest) {
        await this.connect();
        await this.collection.insertOne(changeRequest);
        return changeRequest;
    }
    async findById(id) {
        await this.connect();
        return await this.collection.findOne({ id });
    }
    async findAll(filters) {
        await this.connect();
        const query = {};
        if (filters?.env)
            query.env = filters.env;
        if (filters?.status)
            query.status = filters.status;
        if (filters?.createdBy)
            query.createdBy = filters.createdBy;
        return await this.collection.find(query).sort({ createdAt: -1 }).toArray();
    }
    async update(id, updates) {
        await this.connect();
        await this.collection.updateOne({ id }, { $set: updates });
    }
    async delete(id) {
        await this.connect();
        await this.collection.deleteOne({ id });
    }
}
exports.ChangeRequestModel = ChangeRequestModel;
//# sourceMappingURL=change-request.model.js.map