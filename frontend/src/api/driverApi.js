import apiClient from './apiClient';

const driverApi = {
  getAll:         ()         => apiClient.get('/auth/get-all-drivers'),
  getProfile:     ()         => apiClient.get('/driver/profile'),
  create:         (formData) =>
    apiClient.post('/driver/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update:         (formData) =>
    apiClient.put('/driver/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  createDriver:   (data) =>
    apiClient.post('/admin/drivers', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),
  updateDriver:   (id, data) =>
    apiClient.put(`/admin/drivers/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),
  delete:         (id)       => apiClient.delete(`/auth/delete-user/${id}`),
  getDependencies: (id)      => apiClient.get(`/admin/drivers/${id}/dependencies`),
  deactivate:     (id)       => apiClient.post(`/admin/drivers/${id}/deactivate`),
  reactivate:     (id)       => apiClient.post(`/admin/drivers/${id}/reactivate`),
  getMyAssignment: ()        => apiClient.get('/driver/my-assignment'),
  getTodaySchedule: ()       => apiClient.get('/driver/today-schedule'),
  getMySchedules:  ()        => apiClient.get('/driver/my-schedules'),
  getMyStudents:   ()        => apiClient.get('/driver/my-students'),
};

export default driverApi;
