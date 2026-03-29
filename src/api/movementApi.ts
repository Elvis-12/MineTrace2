import api from './axios';
import { mockMovements } from './mockData';
import { USE_MOCK } from './authApi';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const movementApi = {
  getAll: async (filters?: any) => {
    if (USE_MOCK) {
      await delay(400);
      let data = [...mockMovements];
      if (filters?.batchId) {
        data = data.filter(m => m.batchId === filters.batchId);
      }
      return { data };
    }
    return api.get('/api/movements', { params: filters });
  },
  create: async (data: any) => {
    if (USE_MOCK) {
      await delay(600);
      return { data: { id: Math.random().toString(), ...data, timestamp: new Date().toISOString() } };
    }
    return api.post('/api/movements', data);
  }
};
