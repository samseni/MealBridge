import axios from './axios';

export const searchAPI = {
  saveSearch: (searchParams) => axios.post('/search/save', searchParams),
  getSavedSearches: () => axios.get('/search/saved'),
  getSearchHistory: () => axios.get('/search/history'),
  deleteSearch: (id) => axios.delete(`/search/saved/${id}`),
};

export default searchAPI;