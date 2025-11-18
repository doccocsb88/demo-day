# 🧩 Remote Config Review System

AI-assisted Approval Workflow for Firebase Remote Config

## Overview

This project builds a UI system similar to Firebase Remote Config Console, but with a review & approval process before publishing to Firebase.

Instead of editing directly on Firebase Console (which is error-prone and lacks review process), this system provides:

- React UI to edit Remote Config (parameters + conditions)
- Backend using Firebase Admin to:
  - Load current remote config snapshot
  - Create "change request"
  - Compare diff
  - Generate AI summary
  - Publish after reviewer approval
- Workflow similar to Pull Request / Code Review

## Project Structure

```
/backend
  /src
    /controllers    # API controllers
    /models         # Database models
    /routes         # Express routes
    /services       # Business logic (Firebase, Diff, AI)
    /middlewares    # Auth middleware
    /types          # TypeScript types

/frontend
  /src
    /pages          # Main pages (Dashboard, Editor, Preview, Audit)
    /components     # Reusable components
    /hooks          # React hooks
    /services       # API client
    /types          # TypeScript types
    /config         # Firebase config
```

## Setup

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure environment variables:
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Firebase Admin private key
- `FIREBASE_CLIENT_EMAIL`: Firebase Admin client email
- `OPENAI_API_KEY`: OpenAI API key (optional, for AI summaries)
- `MONGODB_URI`: MongoDB connection string

5. Run the backend:
```bash
npm run dev
```

Backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure Firebase environment variables:
- `VITE_FIREBASE_API_KEY`: Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
- Other Firebase config values

5. Run the frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Features

### 1. Dashboard
- List all change requests
- Filter by environment, status, creator
- Create new change requests

### 2. Editor
- Edit parameters (default values, conditional values)
- Edit conditions (expressions, tags)
- Save as draft or submit for review
- UI similar to Firebase Console

### 3. Preview Changes
- View diff between current and proposed config
- AI-generated summary of changes
- Approve/Reject workflow
- Publish to Firebase (Admin only)

### 4. Audit Log
- Timeline of all actions
- Filter by change request ID
- Track who did what and when

## Workflow

1. **Editor** creates a change request and edits parameters/conditions
2. **Editor** submits for review
3. **Backend** generates diff and AI summary
4. **Reviewer** reviews changes in Preview screen
5. **Reviewer** approves or rejects
6. **Admin** publishes approved changes to Firebase

## API Endpoints

### Remote Config
- `GET /api/remote-config/snapshot?env=prod` - Get current config snapshot
- `POST /api/remote-config` - Create change request
- `GET /api/remote-config` - List change requests (with filters)
- `GET /api/remote-config/:id` - Get change request details
- `POST /api/remote-config/:id/submit` - Submit for review
- `POST /api/remote-config/:id/approve` - Approve change request
- `POST /api/remote-config/:id/reject` - Reject change request
- `POST /api/remote-config/:id/publish` - Publish to Firebase

### Audit Logs
- `GET /api/audit-logs?changeRequestId=xxx&limit=100` - Get audit logs

## Roles & Permissions

- **Viewer**: View config & change requests
- **Editor**: Create draft, submit review
- **Reviewer**: Approve / Reject
- **Admin**: Publish + manage roles

## Technologies

### Backend
- Node.js + Express
- TypeScript
- Firebase Admin SDK
- MongoDB
- OpenAI API (for AI summaries)

### Frontend
- React + TypeScript
- Material-UI (MUI)
- Firebase Auth
- Vite
- React Router

## Development

### Backend
```bash
cd backend
npm run dev    # Development with hot reload
npm run build  # Build for production
npm start      # Run production build
```

### Frontend
```bash
cd frontend
npm run dev    # Development server
npm run build  # Build for production
npm run preview # Preview production build
```

## License

MIT

