/**
 * API client for OmniMCP platform
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('omnimcp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const auth = {
  register: (email: string, password: string, name?: string) =>
    apiClient.post('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  me: () => apiClient.get('/auth/me'),
};

// MCP API
export const mcp = {
  deploy: (data: any) => apiClient.post('/mcp/deploy', data),

  status: (serverId: string) => apiClient.get(`/mcp/${serverId}/status`),

  install: (serverId: string, config?: any) =>
    apiClient.post('/mcp/install', { serverId, config }),

  getInstalled: () => apiClient.get('/mcp/installed'),

  delete: (serverId: string) => apiClient.delete(`/mcp/${serverId}`),
};

// Marketplace API
export const marketplace = {
  list: (params?: { search?: string; tags?: string; sort?: string }) =>
    apiClient.get('/marketplace', { params }),

  get: (serverId: string) => apiClient.get(`/marketplace/${serverId}`),

  featured: () => apiClient.get('/marketplace/featured'),
};
