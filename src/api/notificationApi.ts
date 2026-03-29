import api from './axios';
import { mockNotifications } from './mockData';
import { USE_MOCK } from './authApi';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const notificationApi = {
  getAll: async () => {
    if (USE_MOCK) {
      await delay(400);
      return { data: mockNotifications };
    }
    return api.get('/api/notifications');
  },
  markRead: async (id: string) => {
    if (USE_MOCK) {
      await delay(200);
      return { data: { success: true } };
    }
    return api.patch(`/api/notifications/${id}/read`);
  },
  markAllRead: async () => {
    if (USE_MOCK) {
      await delay(400);
      return { data: { success: true } };
    }
    return api.patch('/api/notifications/read-all');
  },
  getUnreadCount: async () => {
    if (USE_MOCK) {
      return { data: { count: mockNotifications.filter(n => !n.read).length } };
    }
    return api.get('/api/notifications/unread-count');
  }
};
