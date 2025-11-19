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

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/remote-config-review';
  
  // Reuse existing client if available
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  
  if (!db) {
    db = client.db();
  }
  
  if (!collection) {
    collection = db.collection<FirebaseProject>('projects');
  }
  
  return collection;
}

async function verifyToken(req: VercelRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (process.env.NODE_ENV === 'development' || !process.env.VERCEL) {
        return { uid: 'dev-user', email: 'dev@example.com' };
      }
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || !process.env.VERCEL) {
      return { uid: 'dev-user', email: 'dev@example.com' };
    }
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify authentication
  const user = await verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

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
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

