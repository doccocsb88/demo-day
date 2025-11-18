import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import changeRequestRoutes from './routes/change-request.routes';
import auditLogRoutes from './routes/audit-log.routes';
import projectRoutes from './routes/project.routes';
import { verifyToken } from './middlewares/auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/remote-config', verifyToken, changeRequestRoutes);
app.use('/api/audit-logs', verifyToken, auditLogRoutes);
app.use('/api/projects', verifyToken, projectRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

