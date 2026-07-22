import axios from './axios';

export const analyticsAPI = {
  getMyAnalytics: () => axios.get('/analytics/my-analytics')
};
