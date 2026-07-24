import axios from './axios';

export const ratingsAPI = {
  create: (data) => axios.post('/ratings', data),
  getByUser: (userId) => axios.get(`/ratings/user/${userId}`),
  replyToRating: (ratingId, reply) => axios.post(`/ratings/${ratingId}/reply`, { reply }),
  reportRating: (ratingId, reason) => axios.post(`/ratings/${ratingId}/report`, { reason }),
  markHelpful: (ratingId) => axios.post(`/ratings/${ratingId}/helpful`),
  unmarkHelpful: (ratingId) => axios.delete(`/ratings/${ratingId}/helpful`),
};

export default ratingsAPI;