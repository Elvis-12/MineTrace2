import api from './axios';
import { mockBatches } from './mockData';
import { USE_MOCK } from './authApi';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fraudApi = {
  getAll: async (filters?: any) => {
    if (USE_MOCK) {
      await delay(500);
      let data = mockBatches.filter(b => b.riskLevel !== 'UNKNOWN');
      if (filters?.riskLevel) {
        data = data.filter(b => b.riskLevel === filters.riskLevel);
      }
      return { data };
    }
    return api.get('/api/fraud', { params: filters });
  },
  analyzeAll: async () => {
    if (USE_MOCK) {
      await delay(2000);
      return { data: { success: true, analyzedCount: mockBatches.length } };
    }
    return api.post('/api/fraud/analyze-all');
  }
};
