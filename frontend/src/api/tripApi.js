import apiClient from './apiClient';

const tripApi = {
  getCurrent: () => apiClient.get('/trips/current'),
  getMyHistory: (params = {}) => apiClient.get('/trips/history', { params }),
  getDetails: (tripId) => apiClient.get(`/trips/${tripId}`),
  start:      (scheduleId) => apiClient.post('/trips/start', { scheduleId }),
  prepareReturn: (scheduleId) => apiClient.post('/trips/prepare-return', { scheduleId }),
  end:        () => apiClient.post('/trips/end'),
};

export default tripApi;
