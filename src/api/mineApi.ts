import api from './axios';
import { mockMines } from './mockData';
import { USE_MOCK } from './authApi';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mineApi = {
  getAll: async () => {
    if (USE_MOCK) {
      await delay(400);
      return { data: mockMines };
    }
    return api.get('/api/mines');
  },
  create: async (data: any) => {
    if (USE_MOCK) {
      await delay(600);
      return { data: { id: Math.random().toString(), ...data, active: true, createdAt: new Date().toISOString() } };
    }
    return api.post('/api/mines', data);
  },
  toggleActive: async (id: string) => {
    if (USE_MOCK) {
      await delay(500);
      return { data: { success: true } };
    }
    return api.put(`/api/mines/${id}/toggle`);
  }
};
