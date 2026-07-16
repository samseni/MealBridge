import axios from './axios';

export const authAPI = {
  register: (userData) => axios.post('/auth/register', userData),
  login: (credentials) => axios.post('/auth/login', credentials),
  getProfile: () => axios.get('/auth/me'),
  updateProfile: (data) => axios.patch('/auth/profile', data)
};