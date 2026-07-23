import axios from './axios';

export const notificationsAPI = {
  // Get all notifications
  getAll: (params) => axios.get('/notifications', { params }),

  // Get unread count
  getUnreadCount: () => axios.get('/notifications/unread-count'),

  // Mark as read
  markAsRead: (id) => axios.patch(`/notifications/${id}/read`),

  // Mark all as read
  markAllAsRead: () => axios.patch('/notifications/read-all'),

  // Delete notification
  delete: (id) => axios.delete(`/notifications/${id}`),

  // Clear all notifications
  clearAll: () => axios.delete('/notifications')
};