import axios from './axios';

export const messagesAPI = {
  sendMessage: (data) => axios.post('/messages', data),
  getClaimMessages: (claimId) => axios.get(`/messages/claim/${claimId}`),
  getUserConversations: () => axios.get('/messages/conversations'),
  markAsRead: (claimId) => axios.patch(`/messages/claim/${claimId}/read`),
};

export default messagesAPI;