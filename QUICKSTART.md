# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB running (local or remote)
- Firebase project with Admin SDK enabled
- OpenAI API key (optional, for AI summaries)

## Step 1: Backend Setup

```bash
cd backend
npm install
```

**Environment Variables Configuration:**

Create a `.env` file in the `backend` directory with the following variables:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration (optional - defaults to mongodb://localhost:27017/remote-config-review)
MONGODB_URI=mongodb://localhost:27017/remote-config-review

# OpenAI API Configuration (optional - for AI summaries)
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your-openai-api-key-here
```

**Firebase Credentials Configuration (choose one option):**

**Option 1: Use service account JSON file (easiest for development)**
- Place your Firebase service account JSON file in the project root directory
- The service will automatically detect and use it
- Example: `upwork-tiktok-firebase-adminsdk-gmuur-194edc9117.json`

**Option 2: Use environment variable for JSON file path**
```bash
export FIREBASE_SERVICE_ACCOUNT_PATH=../path/to/your-service-account.json
```

**Option 3: Use individual environment variables**
Add to your `.env` file:
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

**Note:** If you don't set `OPENAI_API_KEY`, the system will use a fallback summary generator. AI summaries provide more detailed analysis of changes.

```bash
npm run dev
```

Backend runs on `http://localhost:3001`

## Step 2: Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Firebase config
npm run dev
```

Frontend runs on `http://localhost:3000`

## Step 3: Configure Firebase

1. Get Firebase Admin credentials:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Generate new private key
   - Use one of the three methods above to configure credentials (JSON file is recommended for development)

2. Get Firebase Web config:
   - Go to Firebase Console > Project Settings > General
   - Copy Web app config to frontend `.env`

## Step 4: Test the Application

1. Open `http://localhost:3000`
2. Login with Firebase Auth (create user in Firebase Console if needed)
3. Navigate to Editor to create a change request
4. Submit for review
5. View in Preview Changes
6. Approve and publish (if you have admin role)

## Troubleshooting

### Backend won't start
- Check MongoDB is running
- Verify Firebase credentials in `.env`
- Check port 3001 is available

### Frontend won't start
- Check port 3000 is available
- Verify Firebase config in `.env`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Authentication issues
- **Enable Email/Password authentication:**
  1. Go to Firebase Console > Authentication > Sign-in method
  2. Click on "Email/Password"
  3. Enable the "Email/Password" provider (toggle it ON)
  4. Click "Save"
- Ensure Firebase Auth is enabled in Firebase Console
- Check Firebase config values match your project
- In development mode, backend allows requests without auth token
- **Create a test user:**
  1. Go to Firebase Console > Authentication > Users
  2. Click "Add user"
  3. Enter email and password
  4. Click "Add user"

## Step 5: Configure OpenAI API (Optional)

To enable AI-powered summaries for change requests:

1. Get your OpenAI API key:
   - Go to https://platform.openai.com/api-keys
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy the API key

2. Add to your backend `.env` file:
   ```bash
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. Restart the backend server

**Note:** Without `OPENAI_API_KEY`, the system will automatically use a fallback summary generator that provides basic change information.

## Next Steps

- Configure user roles (viewer, editor, reviewer, admin)
- Set up MongoDB indexes for better performance
- Set up production environment variables

