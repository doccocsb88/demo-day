"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const change_request_routes_1 = __importDefault(require("./routes/change-request.routes"));
const audit_log_routes_1 = __importDefault(require("./routes/audit-log.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const auth_middleware_1 = require("./middlewares/auth.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api/remote-config', auth_middleware_1.verifyToken, change_request_routes_1.default);
app.use('/api/audit-logs', auth_middleware_1.verifyToken, audit_log_routes_1.default);
app.use('/api/projects', auth_middleware_1.verifyToken, project_routes_1.default);
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
});
//# sourceMappingURL=index.js.map