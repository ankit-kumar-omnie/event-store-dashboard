import axios from 'axios';
import { EventSourcingResult, EventTimeline, EventStatistics } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors and network issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Don't redirect in development to avoid breaking the app
      if (process.env.NODE_ENV === 'production') {
        window.location.href = '/login';
      }
    }
    
    // Handle network errors gracefully
    if (!error.response) {
      console.warn('Network error:', error.message);
      return Promise.reject(new Error('Network error - please check your connection'));
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/user/signin', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (userData: any) => {
    try {
      const response = await api.post('/user/create', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
};

export const eventSourcingApi = {
  // General event sourcing endpoints
  replayEvents: async (entityId: string, options?: any): Promise<EventSourcingResult> => {
    try {
      console.log('Making replay request to:', `/events/${entityId}/replay`, 'with options:', options);
      const response = await api.get(`/events/${entityId}/replay`, { params: options });
      console.log('Replay response:', response.data);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Replay events error:', error);
      console.error('Error details:', (error as any)?.response?.data);
      throw error;
    }
  },

  getStateAtTime: async (entityId: string, timestamp: string): Promise<EventSourcingResult> => {
    try {
      const response = await api.get(`/events/${entityId}/state-at/${timestamp}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Get state at time error:', error);
      throw error;
    }
  },

  getStateAfterEvents: async (entityId: string, eventCount: number): Promise<EventSourcingResult> => {
    try {
      const response = await api.get(`/events/${entityId}/state-after/${eventCount}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Get state after events error:', error);
      throw error;
    }
  },

  getEventTimeline: async (entityId: string): Promise<EventTimeline> => {
    try {
      const response = await api.get(`/events/${entityId}/timeline`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Get event timeline error:', error);
      throw error;
    }
  },

  compareStates: async (entityId: string, fromDate: string, toDate: string) => {
    try {
      console.log('Making compare request to:', `/events/${entityId}/compare`, 'with params:', { fromDate, toDate });
      const response = await api.get(`/events/${entityId}/compare`, {
        params: { fromDate, toDate }
      });
      console.log('Compare response:', response.data);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Compare states error:', error);
      console.error('Error details:', (error as any)?.response?.data);
      throw error;
    }
  },

  getEventStatistics: async (entityId: string): Promise<EventStatistics> => {
    try {
      const response = await api.get(`/events/${entityId}/statistics`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Get event statistics error:', error);
      throw error;
    }
  },

  getEntityEvents: async (entityId: string, eventTypes?: string[]) => {
    try {
      const response = await api.get(`/events/${entityId}/events`, {
        params: eventTypes ? { eventTypes: eventTypes.join(',') } : {}
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Get entity events error:', error);
      throw error;
    }
  },

  getStreamBatch: async (entityId: string, batchNumber: number, batchSize: number = 50) => {
    try {
      const response = await api.get(`/events/${entityId}/stream/${batchNumber}`, {
        params: { batchSize }
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Get stream batch error:', error);
      throw error;
    }
  },

  // Get total events count across all entities
  getTotalEventsCount: async () => {
    try {
      // Since there's no dedicated endpoint, we'll need to get all users and sum their events
      // This is a workaround - ideally there should be a dedicated analytics endpoint
      const users = await api.get('/users/all');
      const userList = users.data?.data || users.data || [];
      
      let totalEvents = 0;
      for (const user of userList) {
        try {
          const events = await api.get(`/events/${user.id}/events`);
          const eventList = events.data?.data || events.data || [];
          totalEvents += Array.isArray(eventList) ? eventList.length : 0;
        } catch (error) {
          // Skip users with no events or errors
          console.warn(`Could not get events for user ${user.id}:`, error.message);
        }
      }
      
      return { totalEvents };
    } catch (error) {
      console.error('Get total events count error:', error);
      return { totalEvents: 0 };
    }
  },
};

export const usersApi = {
  getAllUsers: async () => {
    try {
      console.log('Fetching all users...');
      const response = await api.get('/users/all');
      console.log('Users response:', response.data);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Get all users error:', error);
      console.error('Error response:', (error as any)?.response?.data);
      console.error('Error status:', (error as any)?.response?.status);
      // Return empty array when API fails
      return [];
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  getUsersByRole: async (role: string) => {
    try {
      const response = await api.get(`/users/${role}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Get users by role error:', error);
      return [];
    }
  },

  updateUser: async (userData: any) => {
    try {
      const response = await api.put('/user/update', userData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },
};

export const healthApi = {
  getHealth: async () => {
    try {
      const response = await api.get('/health');
      console.log('Health API response:', response.data);
      // The response structure is { success: true, data: { status, timestamp, uptime }, timestamp }
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Get health error:', error);
      throw error;
    }
  },
};

export const notificationsApi = {
  getNotifications: async (page: number = 1, limit: number = 20, unreadOnly: boolean = false) => {
    try {
      const response = await api.get('/notifications', {
        params: { page, limit, unreadOnly }
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Get notifications error:', error);
      return { notifications: [], total: 0, unreadCount: 0 };
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Get unread count error:', error);
      return { unreadCount: 0 };
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  },

  createTestNotification: async (title?: string, message?: string) => {
    try {
      const response = await api.post('/notifications/test', {
        title: title || 'Test Notification',
        message: message || 'This is a test notification'
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Create test notification error:', error);
      throw error;
    }
  },
};

export default api;