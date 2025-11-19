import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { MongoClient, Db, Collection } from 'mongodb';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Use default credentials (for Vercel environment)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

interface FirebaseProject {
  id: string;
  name: string;
  projectId: string;
  privateKey: string;
  clientEmail: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  generalConfig?: string;
  slackWebhookUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

let client: MongoClient | null = null;
let db: Db | null = null;
let collection: Collection<FirebaseProject> | null = null;

async function getCollection(): Promise<Collection<FirebaseProject>> {
  if (collection) return collection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  console.log('Connecting to MongoDB...');
  
  // Reuse existing client if available
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log('MongoDB client connected');
  }
  
  if (!db) {
    db = client.db();
    console.log('MongoDB database selected');
  }
  
  if (!collection) {
    collection = db.collection<FirebaseProject>('projects');
    console.log('MongoDB collection retrieved');
    
    // Create indexes (only once)
    try {
      await collection.createIndex({ projectId: 1 }, { unique: true });
      await collection.createIndex({ createdBy: 1 });
      await collection.createIndex({ createdAt: -1 });
      console.log('MongoDB indexes created');
    } catch (error) {
      // Indexes might already exist, ignore error
      console.log('Index creation skipped (may already exist)');
    }
  }
  
  return collection;
}

async function verifyToken(req: VercelRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow requests without auth for now (can be restricted later)
      // This helps with debugging and allows the API to be accessible
      console.warn('No auth token provided, using dev user');
      return { uid: 'dev-user', email: 'dev@example.com' };
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (tokenError) {
      // If token verification fails, log but allow dev user for now
      console.warn('Token verification failed:', tokenError);
      return { uid: 'dev-user', email: 'dev@example.com' };
    }
  } catch (error) {
    console.error('Auth error:', error);
    // Allow dev user for now to ensure API is accessible
    return { uid: 'dev-user', email: 'dev@example.com' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[Projects API] ${req.method} ${req.url}`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify authentication (currently allows dev user for debugging)
  const user = await verifyToken(req);
  if (!user) {
    console.error('No user found after token verification');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Getting MongoDB collection...');
    const projectsCollection = await getCollection();
    console.log('Collection retrieved successfully');

    if (req.method === 'GET') {
      // List all projects
      console.log('Fetching all projects...');
      const projects = await projectsCollection.find({}).sort({ createdAt: -1 }).toArray();
      console.log(`Found ${projects.length} projects`);
      const safeProjects = projects.map(({ privateKey, ...project }) => project);
      return res.json(safeProjects);
    }

    if (req.method === 'POST') {
      // Create new project
      const {
        name,
        projectId,
        privateKey,
        clientEmail,
        apiKey,
        authDomain,
        storageBucket,
        messagingSenderId,
        appId,
        measurementId,
        generalConfig,
        slackWebhookUrl,
      } = req.body;

      if (!name || !projectId || !privateKey || !clientEmail ||
          !apiKey || !authDomain || !storageBucket || !messagingSenderId || !appId) {
        return res.status(400).json({
          error: 'Missing required fields: name, projectId, privateKey, clientEmail, apiKey, authDomain, storageBucket, messagingSenderId, appId'
        });
      }

      // Check if project with same projectId already exists
      const existing = await projectsCollection.findOne({ projectId });
      if (existing) {
        return res.status(400).json({ error: 'Project with this projectId already exists' });
      }

      const project: FirebaseProject = {
        id: `project-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name,
        projectId,
        privateKey,
        clientEmail,
        apiKey,
        authDomain,
        storageBucket,
        messagingSenderId,
        appId,
        measurementId: measurementId || undefined,
        generalConfig: generalConfig || undefined,
        slackWebhookUrl: slackWebhookUrl || undefined,
        createdBy: user.email || user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await projectsCollection.insertOne(project);

      // Return project without sensitive data
      const { privateKey: _, ...projectResponse } = project;
      return res.status(201).json(projectResponse);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in projects API:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

