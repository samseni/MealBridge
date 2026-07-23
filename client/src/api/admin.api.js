import axios from './axios';

export const adminAPI = {
  // User management
  getAllUsers: (params) => axios.get('/admin/users', { params }),
  deleteUser: (id) => axios.delete(`/admin/users/${id}`),
  toggleUserStatus: (id, active) => axios.patch(`/admin/users/${id}/status`, { active }),

  // NGO verification
  getPendingVerifications: () => axios.get('/admin/verifications/pending'),
  approveNGO: (id) => axios.patch(`/admin/verifications/${id}/approve`),
  rejectNGO: (id) => axios.patch(`/admin/verifications/${id}/reject`),

  // Platform statistics
  getPlatformStats: () => axios.get('/admin/stats'),

  // Recent activity
  getRecentActivity: (limit) => axios.get('/admin/activity', { params: { limit } })
};
