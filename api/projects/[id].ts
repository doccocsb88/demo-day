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
  }
  
  return collection;
}

async function verifyToken(req: VercelRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow requests without auth for now (can be restricted later)
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
  console.log(`[Project API] ${req.method} ${req.url}`);
  
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

  const { id } = req.query;
  console.log('Project ID:', id);

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  try {
    const projectsCollection = await getCollection();

    if (req.method === 'GET') {
      // Get project by ID
      const project = await projectsCollection.findOne({ id });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      const { privateKey, ...projectResponse } = project;
      return res.json(projectResponse);
    }

    if (req.method === 'PUT') {
      // Update project
      const project = await projectsCollection.findOne({ id });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

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

      const updates: Partial<FirebaseProject> = {};
      if (name) updates.name = name;
      if (projectId) {
        // Check if new projectId conflicts with existing project
        const existing = await projectsCollection.findOne({ projectId });
        if (existing && existing.id !== id) {
          return res.status(400).json({ error: 'Project with this projectId already exists' });
        }
        updates.projectId = projectId;
      }
      if (privateKey) updates.privateKey = privateKey;
      if (clientEmail) updates.clientEmail = clientEmail;
      if (apiKey) updates.apiKey = apiKey;
      if (authDomain) updates.authDomain = authDomain;
      if (storageBucket) updates.storageBucket = storageBucket;
      if (messagingSenderId) updates.messagingSenderId = messagingSenderId;
      if (appId) updates.appId = appId;
      if (measurementId !== undefined) updates.measurementId = measurementId;
      if (generalConfig !== undefined) updates.generalConfig = generalConfig;
      if (slackWebhookUrl !== undefined) updates.slackWebhookUrl = slackWebhookUrl;

      updates.updatedAt = new Date().toISOString();

      await projectsCollection.updateOne({ id }, { $set: updates });

      const updated = await projectsCollection.findOne({ id });
      if (!updated) {
        return res.status(404).json({ error: 'Project not found' });
      }
      const { privateKey: _, ...projectResponse } = updated;
      return res.json(projectResponse);
    }

    if (req.method === 'DELETE') {
      // Delete project
      const project = await projectsCollection.findOne({ id });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      await projectsCollection.deleteOne({ id });
      return res.status(204).send();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in project API:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

