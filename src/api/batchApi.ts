import api from './axios';
import { mockBatches } from './mockData';
import { USE_MOCK } from './authApi';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const batchApi = {
  getAll: async (filters?: any) => {
    if (USE_MOCK) {
      await delay(500);
      let data = [...mockBatches];
      if (filters?.search) {
        data = data.filter(b => b.batchCode.toLowerCase().includes(filters.search.toLowerCase()));
      }
      if (filters?.mineId) {
        data = data.filter(b => b.mineId === filters.mineId);
      }
      return { data };
    }
    return api.get('/api/batches', { params: filters });
  },
  getById: async (id: string) => {
    if (USE_MOCK) {
      await delay(400);
      const batch = mockBatches.find(b => b.id === id || b.batchCode === id);
      if (batch) return { data: batch };
      throw new Error('Batch not found');
    }
    return api.get(`/api/batches/${id}`);
  },
  create: async (data: any) => {
    if (USE_MOCK) {
      await delay(800);
      const newBatch = {
        id: Math.random().toString(),
        batchCode: `MT-2026-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        ...data,
        status: 'REGISTERED',
        riskLevel: 'UNKNOWN',
        createdAt: new Date().toISOString(),
        anomalyScore: 0,
        flags: { weight: false, route: false, duplicate: false, license: false, handover: false }
      };
      return { data: newBatch };
    }
    return api.post('/api/batches', data);
  },
  runFraudAnalysis: async (id: string) => {
    if (USE_MOCK) {
      await delay(1500);
      return { data: { success: true } };
    }
    return api.post(`/api/batches/${id}/analyze`);
  },
  overrideRisk: async (id: string, note: string) => {
    if (USE_MOCK) {
      await delay(600);
      return { data: { success: true } };
    }
    return api.put(`/api/batches/${id}/override`, { note });
  }
};
