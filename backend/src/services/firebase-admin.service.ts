import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { RemoteConfigParameter, RemoteConfigCondition, RemoteConfigSnapshot } from '../types';

export class FirebaseAdminService {
  private remoteConfig: admin.remoteConfig.RemoteConfig | null = null;
  private initialized = false;

  constructor() {
    // Lazy initialization - don't initialize Firebase Admin until first use
  }

  private initialize(): void {
    if (this.initialized) {
      return;
    }

    if (!admin.apps.length) {
      let credential: admin.ServiceAccount;

      // Option 1: Try loading from JSON file path
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      if (serviceAccountPath) {
        const fullPath = path.isAbsolute(serviceAccountPath) 
          ? serviceAccountPath 
          : path.resolve(__dirname, '..', '..', serviceAccountPath);
        
        if (fs.existsSync(fullPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          credential = {
            projectId: serviceAccount.project_id,
            privateKey: serviceAccount.private_key,
            clientEmail: serviceAccount.client_email,
          };
        } else {
          throw new Error(`Firebase service account file not found at: ${fullPath}`);
        }
      } 
      // Option 2: Use environment variables
      else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        credential = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };
      }
      // Option 3: Try default location (root directory)
      else {
        // Try multiple possible paths
        const possiblePaths = [
          path.resolve(__dirname, '..', '..', '..', 'upwork-tiktok-firebase-adminsdk-gmuur-194edc9117.json'),
          path.resolve(process.cwd(), '..', 'upwork-tiktok-firebase-adminsdk-gmuur-194edc9117.json'),
          path.resolve(process.cwd(), 'upwork-tiktok-firebase-adminsdk-gmuur-194edc9117.json'),
        ];

        let foundPath: string | null = null;
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            foundPath = possiblePath;
            break;
          }
        }

        if (foundPath) {
          const serviceAccount = JSON.parse(fs.readFileSync(foundPath, 'utf8'));
          credential = {
            projectId: serviceAccount.project_id,
            privateKey: serviceAccount.private_key,
            clientEmail: serviceAccount.client_email,
          };
        } else {
          throw new Error(
            'Firebase credentials not found. Please provide either:\n' +
            '1. FIREBASE_SERVICE_ACCOUNT_PATH environment variable pointing to your service account JSON file, or\n' +
            '2. FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables, or\n' +
            '3. Place your service account JSON file in the project root directory.\n' +
            `Searched paths: ${possiblePaths.join(', ')}`
          );
        }
      }

      admin.initializeApp({
        credential: admin.credential.cert(credential),
      });
    }
    this.remoteConfig = admin.remoteConfig();
    this.initialized = true;
  }

  private getRemoteConfig(): admin.remoteConfig.RemoteConfig {
    if (!this.remoteConfig) {
      this.initialize();
    }
    return this.remoteConfig!;
  }

  async getRemoteConfigTemplate(env: 'prod' | 'staging' = 'prod'): Promise<admin.remoteConfig.RemoteConfigTemplate> {
    try {
      const remoteConfig = this.getRemoteConfig();
      const template = await remoteConfig.getTemplate();
      return template;
    } catch (error) {
      console.error('Error fetching remote config template:', error);
      throw error;
    }
  }

  async getSnapshot(env: 'prod' | 'staging' = 'prod', createdBy: string): Promise<RemoteConfigSnapshot> {
    try {
      const template = await this.getRemoteConfigTemplate(env);
      
      const parameters: RemoteConfigParameter[] = Object.entries(template.parameters || {}).map(([key, param]) => {
        // Handle defaultValue - it can be RemoteConfigParameterValue (with value) or InAppDefaultValue (without value)
        let defaultValue: string | undefined;
        if (param.defaultValue) {
          if ('value' in param.defaultValue) {
            defaultValue = param.defaultValue.value;
          } else {
            // InAppDefaultValue case - use undefined or empty string
            defaultValue = undefined;
          }
        }

        // Handle conditionalValues
        let conditionalValues: { [conditionName: string]: string } | undefined;
        if (param.conditionalValues) {
          conditionalValues = Object.fromEntries(
            Object.entries(param.conditionalValues).map(([condName, condValue]) => {
              if ('value' in condValue) {
                return [condName, condValue.value || ''];
              } else {
                return [condName, ''];
              }
            })
          );
        }

        return {
          key,
          defaultValue,
          conditionalValues,
          description: param.description || undefined,
        };
      });

      const conditions: RemoteConfigCondition[] = (template.conditions || []).map((cond) => ({
        name: cond.name,
        expression: cond.expression,
        tag: cond.tagColor || undefined,
      }));

      return {
        id: `snapshot-${Date.now()}`,
        parameters,
        conditions,
        createdAt: new Date().toISOString(),
        createdBy,
      };
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw error;
    }
  }

  async publishTemplate(newConfig: RemoteConfigSnapshot): Promise<void> {
    try {
      // Get current template to preserve etag and parameterGroups
      const currentTemplate = await this.getRemoteConfigTemplate('prod');
      
      const template: admin.remoteConfig.RemoteConfigTemplate = {
        conditions: newConfig.conditions.map((cond) => ({
          name: cond.name,
          expression: cond.expression,
          tagColor: cond.tag as any,
        })),
        parameters: newConfig.parameters.reduce((acc, param) => {
          acc[param.key] = {
            defaultValue: param.defaultValue
              ? { value: param.defaultValue }
              : undefined,
            conditionalValues: param.conditionalValues
              ? Object.fromEntries(
                  Object.entries(param.conditionalValues).map(([condName, value]) => [
                    condName,
                    { value },
                  ])
                )
              : undefined,
            description: param.description,
          };
          return acc;
        }, {} as Record<string, admin.remoteConfig.RemoteConfigParameter>),
        parameterGroups: currentTemplate.parameterGroups || [],
        etag: currentTemplate.etag || '',
      };

      const remoteConfig = this.getRemoteConfig();
      await remoteConfig.publishTemplate(template);
    } catch (error) {
      console.error('Error publishing template:', error);
      throw error;
    }
  }
}

