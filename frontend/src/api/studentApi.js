import apiClient from './apiClient';

const studentApi = {
  getAll:    ()         => apiClient.get('/auth/get-all-students'),
  getProfile: ()        => apiClient.get('/student/profile'),
  getMySchedules: ()    => apiClient.get('/student/my-schedules'),
  create:    (formData) => apiClient.post('/student/profile', formData),
  update:    (formData) => apiClient.put('/student/profile', formData),
  delete:    (id)       => apiClient.delete(`/auth/delete-user/${id}`),
  getDependencies: (id) => apiClient.get(`/admin/students/${id}/dependencies`),
  deactivate: (id)      => apiClient.post(`/admin/students/${id}/deactivate`),
  reactivate: (id)      => apiClient.post(`/admin/students/${id}/reactivate`),
};

export default studentApi;
