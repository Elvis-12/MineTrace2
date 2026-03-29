import api from './axios';
import { mockOrganizations } from './mockData';
import { USE_MOCK } from './authApi';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const organizationApi = {
  getAll: async () => {
    if (USE_MOCK) {
      await delay(400);
      return { data: mockOrganizations };
    }
    return api.get('/api/organizations');
  },
  create: async (data: any) => {
    if (USE_MOCK) {
      await delay(600);
      return { data: { id: Math.random().toString(), ...data, usersCount: 0, createdAt: new Date().toISOString() } };
    }
    return api.post('/api/organizations', data);
  },
  update: async (id: string, data: any) => {
    if (USE_MOCK) {
      await delay(600);
      return { data: { id, ...data } };
    }
    return api.put(`/api/organizations/${id}`, data);
  }
};
