import axios from 'axios';
import { auth } from '../config/firebase';
import {
  RemoteConfigSnapshot,
  RemoteConfigChangeRequest,
  AuditLog,
  FirebaseProject,
} from '../types';

// Use environment variable for API URL, fallback to backend domain
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-day-backend-nine.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    
    // Normalize error response structure
    if (error.response?.data) {
      // Ensure error.data.error is always a string if it exists
      if (error.response.data.error && typeof error.response.data.error !== 'string') {
        const err = error.response.data.error;
        if (err.message) {
          error.response.data.error = err.message;
        } else if (err.code) {
          error.response.data.error = `Error ${err.code}: ${err.message || 'Unknown error'}`;
        } else {
          error.response.data.error = JSON.stringify(err);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const remoteConfigApi = {
  getSnapshot: async (env: 'prod' | 'staging' = 'prod'): Promise<RemoteConfigSnapshot> => {
    const response = await api.get('/remote-config/snapshot', { params: { env } });
    return response.data;
  },
};

export const changeRequestApi = {
  create: async (data: {
    title: string;
    description?: string;
    newConfig: RemoteConfigSnapshot;
    env: 'prod' | 'staging';
    projectId?: string;
  }): Promise<RemoteConfigChangeRequest> => {
    const response = await api.post('/remote-config', data);
    return response.data;
  },

  list: async (filters?: {
    env?: 'prod' | 'staging';
    status?: string;
    createdBy?: string;
  }): Promise<RemoteConfigChangeRequest[]> => {
    const response = await api.get('/remote-config', { params: filters });
    return response.data;
  },

  get: async (id: string): Promise<RemoteConfigChangeRequest> => {
    const response = await api.get(`/remote-config/${id}`);
    return response.data;
  },

  submit: async (id: string): Promise<RemoteConfigChangeRequest> => {
    const response = await api.post(`/remote-config/${id}/submit`);
    return response.data;
  },

  approve: async (id: string): Promise<RemoteConfigChangeRequest> => {
    const response = await api.post(`/remote-config/${id}/approve`);
    return response.data;
  },

  reject: async (id: string, reason?: string): Promise<RemoteConfigChangeRequest> => {
    const response = await api.post(`/remote-config/${id}/reject`, { reason });
    return response.data;
  },

  publish: async (id: string): Promise<RemoteConfigChangeRequest> => {
    const response = await api.post(`/remote-config/${id}/publish`);
    return response.data;
  },

  addReviewer: async (id: string, userId: string): Promise<RemoteConfigChangeRequest> => {
    const response = await api.post(`/remote-config/${id}/reviewer`, { userId });
    return response.data;
  },

  reviewerApprove: async (id: string, message?: string): Promise<RemoteConfigChangeRequest> => {
    const response = await api.post(`/remote-config/${id}/reviewer/approve`, { message });
    return response.data;
  },

  reviewerDeny: async (id: string, message?: string): Promise<RemoteConfigChangeRequest> => {
    const response = await api.post(`/remote-config/${id}/reviewer/deny`, { message });
    return response.data;
  },
};

export const auditLogApi = {
  list: async (changeRequestId?: string, limit?: number): Promise<AuditLog[]> => {
    const response = await api.get('/audit-logs', {
      params: { changeRequestId, limit },
    });
    return response.data;
  },
};

export const projectApi = {
  create: async (data: {
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
  }): Promise<FirebaseProject> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  list: async (): Promise<FirebaseProject[]> => {
    const response = await api.get('/projects');
    return response.data;
  },

  get: async (id: string): Promise<FirebaseProject> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  update: async (id: string, data: {
    name?: string;
    projectId?: string;
    privateKey?: string;
    clientEmail?: string;
    apiKey?: string;
    authDomain?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
    generalConfig?: string;
  }): Promise<FirebaseProject> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};

