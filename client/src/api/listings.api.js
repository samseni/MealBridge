import axios from './axios';

export const listingsAPI = {
  create: (listingData) => axios.post('/listings', listingData),
  getAll: (lat, lng) => axios.get('/listings/all', { params: { lat, lng } }),
  getNearby: (lat, lng, radius) => axios.get('/listings/nearby', { params: { lat, lng, radius } }),
  getMine: () => axios.get('/listings/mine'),
  getById: (id) => axios.get(`/listings/${id}`),
  update: (id, data) => axios.patch(`/listings/${id}`, data),
  delete: (id) => axios.delete(`/listings/${id}`)
};