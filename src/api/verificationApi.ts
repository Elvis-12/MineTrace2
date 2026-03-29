import api from './axios';
import { mockVerifications } from './mockData';
import { USE_MOCK } from './authApi';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const verificationApi = {
  verify: async (data: any) => {
    if (USE_MOCK) {
      await delay(600);
      return { data: { id: Math.random().toString(), ...data, timestamp: new Date().toISOString() } };
    }
    return api.post('/api/verifications', data);
  },
  getLogsForBatch: async (batchId: string) => {
    if (USE_MOCK) {
      await delay(300);
      return { data: mockVerifications.filter(v => v.batchId === batchId) };
    }
    return api.get(`/api/batches/${batchId}/verifications`);
  }
};
