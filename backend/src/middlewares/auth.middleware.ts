import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For development, allow requests without auth
      if (process.env.NODE_ENV === 'development') {
        (req as any).user = { uid: 'dev-user', email: 'dev@example.com' };
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    // For development, allow requests without valid token
    if (process.env.NODE_ENV === 'development') {
      (req as any).user = { uid: 'dev-user', email: 'dev@example.com' };
      return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
  }
}

