import axios from './axios';

export const adminAPI = {
  // User management
  getAllUsers: (params) => axios.get('/admin/users', { params }),
  deleteUser: (id) => axios.delete(`/admin/users/${id}`),
  toggleUserStatus: (id, data) => axios.patch(`/admin/users/${id}/status`, data),

  // NGO verification
  getPendingVerifications: () => axios.get('/admin/verifications/pending'),
  getVerificationRequests: (params) => axios.get('/admin/verifications', { params }),
  reviewVerification: (id, data) => axios.patch(`/admin/verifications/${id}/review`, data),
  approveNGO: (id) => axios.patch(`/admin/verifications/${id}/approve`),
  rejectNGO: (id) => axios.patch(`/admin/verifications/${id}/reject`),

  // Platform statistics & analytics
  getPlatformStats: () => axios.get('/admin/stats'),
  getAnalytics: (params) => axios.get('/admin/analytics', { params }),

  // Reports
  exportReport: (params) => axios.get('/admin/reports/export', {
    params,
    responseType: 'blob'
  }),

  // Recent activity
  getRecentActivity: (limit) => axios.get('/admin/activity', { params: { limit } })
};
