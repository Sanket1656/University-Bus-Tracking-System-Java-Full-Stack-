import apiClient from './apiClient';

const scheduleApi = {
  getSchedules:    (params = {}) => apiClient.get('/schedules', { params }),
  getScheduleById: (id)       => apiClient.get(`/schedules/${id}`),
  createSchedule:  (data)     => apiClient.post('/schedules', data),
  updateSchedule:  (id, data) => apiClient.put(`/schedules/${id}`, data),
  deleteSchedule:  (id)       => apiClient.delete(`/schedules/${id}`),
};

export default scheduleApi;