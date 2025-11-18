import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Projects
export const projectsApi = {
  list: () => fetchWithAuth('/api/projects'),
  
  get: (id: string) => fetchWithAuth(`/api/projects/${id}`),
  
  create: (data: { name: string; description?: string }) =>
    fetchWithAuth('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    fetchWithAuth(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchWithAuth(`/api/projects/${id}`, {
      method: 'DELETE',
    }),
};

// Components
export const componentsApi = {
  create: (data: {
    projectId: string;
    type: string;
    name: string;
    description?: string;
    schema: any;
    position?: any;
  }) =>
    fetchWithAuth('/api/components', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  get: (id: string) => fetchWithAuth(`/api/components/${id}`),
  
  delete: (id: string) =>
    fetchWithAuth(`/api/components/${id}`, {
      method: 'DELETE',
    }),
};

// AI Generation
export const generateApi = {
  schema: (data: {
    componentType: string;
    name: string;
    description: string;
  }) =>
    fetchWithAuth('/api/generate/schema', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Code Generation
export const codeApi = {
  generate: (projectId: string) =>
    fetchWithAuth(`/api/projects/${projectId}/generate`, {
      method: 'POST',
    }),
  
  preview: (projectId: string) =>
    fetchWithAuth(`/api/projects/${projectId}/preview`),
};

// Deployment
export const deployApi = {
  github: (projectId: string, repoName: string, githubToken: string, isPrivate = false) =>
    fetchWithAuth('/api/deploy/github', {
      method: 'POST',
      body: JSON.stringify({ projectId, repoName, githubToken, isPrivate }),
    }),
  
  railway: (projectId: string) =>
    fetchWithAuth('/api/deploy/railway', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),
};

