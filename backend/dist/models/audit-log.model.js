"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogModel = void 0;
const mongodb_1 = require("mongodb");
class AuditLogModel {
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
        this.collection = this.db.collection('auditLogs');
        await this.collection.createIndex({ changeRequestId: 1 });
        await this.collection.createIndex({ performedAt: -1 });
    }
    async create(log) {
        await this.connect();
        await this.collection.insertOne(log);
        return log;
    }
    async findByChangeRequestId(changeRequestId) {
        await this.connect();
        return await this.collection.find({ changeRequestId }).sort({ performedAt: -1 }).toArray();
    }
    async findAll(limit = 100) {
        await this.connect();
        return await this.collection.find({}).sort({ performedAt: -1 }).limit(limit).toArray();
    }
}
exports.AuditLogModel = AuditLogModel;
//# sourceMappingURL=audit-log.model.js.map