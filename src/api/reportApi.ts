import api from './axios';
import { mockBatches, mockMovements } from './mockData';
import { USE_MOCK } from './authApi';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const reportApi = {
  getProduction: async (filters?: any) => {
    if (USE_MOCK) {
      await delay(600);
      return { data: { batches: mockBatches } };
    }
    return api.get('/api/reports/production', { params: filters });
  },
  getMovement: async (filters?: any) => {
    if (USE_MOCK) {
      await delay(600);
      return { data: { movements: mockMovements } };
    }
    return api.get('/api/reports/movement', { params: filters });
  },
  getCompliance: async (filters?: any) => {
    if (USE_MOCK) {
      await delay(600);
      return { data: { unverifiedBatches: mockBatches.filter(b => b.status === 'REGISTERED') } };
    }
    return api.get('/api/reports/compliance', { params: filters });
  },
  getRisk: async (filters?: any) => {
    if (USE_MOCK) {
      await delay(600);
      return { data: { highRiskBatches: mockBatches.filter(b => b.riskLevel === 'HIGH') } };
    }
    return api.get('/api/reports/risk', { params: filters });
  }
};
