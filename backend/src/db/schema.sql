-- Vercel Postgres Schema for Remote Config Review System

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  project_id VARCHAR(255) UNIQUE NOT NULL,
  private_key TEXT NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  auth_domain VARCHAR(255) NOT NULL,
  storage_bucket VARCHAR(255) NOT NULL,
  messaging_sender_id VARCHAR(255) NOT NULL,
  app_id VARCHAR(255) NOT NULL,
  measurement_id VARCHAR(255),
  general_config TEXT,
  slack_webhook_url TEXT,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_project_id ON projects(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Change requests table
CREATE TABLE IF NOT EXISTS change_requests (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  base_version_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255),
  env VARCHAR(20) NOT NULL CHECK (env IN ('prod', 'staging')),
  new_config JSONB NOT NULL,
  diff JSONB NOT NULL,
  ai_summary TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'published')),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewers JSONB DEFAULT '[]'::jsonb,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  rejected_by VARCHAR(255),
  rejected_at TIMESTAMP,
  rejected_reason TEXT,
  published_by VARCHAR(255),
  published_at TIMESTAMP
);

-- Create indexes for change_requests
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_env ON change_requests(env);
CREATE INDEX IF NOT EXISTS idx_change_requests_created_by ON change_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_change_requests_created_at ON change_requests(created_at DESC);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  change_request_id VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  performed_by VARCHAR(255) NOT NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSONB
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_change_request_id ON audit_logs(change_request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs(performed_at DESC);

