import { Request, Response } from 'express';
import { ProjectModel } from '../models/project.model';
import { FirebaseProject } from '../types';

const projectModel = new ProjectModel();

export const createProject = async (req: Request, res: Response) => {
  try {
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
      slackWebhookUrl
    } = req.body;
    const user = (req as any).user;

    if (!name || !projectId || !privateKey || !clientEmail || 
        !apiKey || !authDomain || !storageBucket || !messagingSenderId || !appId) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, projectId, privateKey, clientEmail, apiKey, authDomain, storageBucket, messagingSenderId, appId' 
      });
    }

    // Check if project with same projectId already exists
    const existing = await projectModel.findByProjectId(projectId);
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

    await projectModel.create(project);

    // Return project without sensitive data
    const { privateKey: _, ...projectResponse } = project;
    res.status(201).json(projectResponse);
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
};

export const listProjects = async (req: Request, res: Response) => {
  try {
    const projects = await projectModel.findAll();
    
    // Remove private keys from response
    const safeProjects = projects.map(({ privateKey, ...project }) => project);
    
    res.json(safeProjects);
  } catch (error: any) {
    console.error('Error listing projects:', error);
    res.status(500).json({ error: error.message || 'Failed to list projects' });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await projectModel.findById(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Return project without private key for security
    const { privateKey, ...projectResponse } = project;
    res.json(projectResponse);
  } catch (error: any) {
    console.error('Error getting project:', error);
    res.status(500).json({ error: error.message || 'Failed to get project' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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
      slackWebhookUrl
    } = req.body;

    const project = await projectModel.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updates: Partial<FirebaseProject> = {};
    if (name) updates.name = name;
    if (projectId) {
      // Check if new projectId conflicts with existing project
      const existing = await projectModel.findByProjectId(projectId);
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

    await projectModel.update(id, updates);

    const updated = await projectModel.findById(id);
    const { privateKey: _, ...projectResponse } = updated!;
    res.json(projectResponse);
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: error.message || 'Failed to update project' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await projectModel.findById(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await projectModel.delete(id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
};

