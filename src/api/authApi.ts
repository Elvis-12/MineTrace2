import api from './axios';
import { mockUsers } from './mockData';

export const USE_MOCK = true;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authApi = {
  login: async (data: any) => {
    if (USE_MOCK) {
      await delay(800);
      const user = mockUsers.find(u => u.email === data.email && u.status === 'ACTIVE');
      if (user && data.password) {
        return { data: { token: 'mock-jwt-token-123', ...user } };
      }
      throw new Error('Invalid email or password');
    }
    return api.post('/api/auth/login', data);
  },
  register: async (data: any) => {
    if (USE_MOCK) {
      await delay(800);
      return { data: { id: Math.random().toString(), ...data, status: 'ACTIVE', createdAt: new Date().toISOString() } };
    }
    return api.post('/api/auth/register', data);
  },
  getAllUsers: async () => {
    if (USE_MOCK) {
      await delay(500);
      return { data: mockUsers };
    }
    return api.get('/api/auth/users');
  },
  deactivateUser: async (id: string) => {
    if (USE_MOCK) {
      await delay(500);
      return { data: { success: true } };
    }
    return api.put(`/api/auth/users/${id}/deactivate`);
  },
  activateUser: async (id: string) => {
    if (USE_MOCK) {
      await delay(500);
      return { data: { success: true } };
    }
    return api.put(`/api/auth/users/${id}/activate`);
  },
  updatePassword: async (data: any) => {
    if (USE_MOCK) {
      await delay(800);
      if (data.currentPassword !== 'password') throw new Error('Current password is incorrect');
      return { data: { success: true } };
    }
    return api.put('/api/auth/profile/password', data);
  }
};
