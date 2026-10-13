import apiClient from './apiClient';

const assignmentApi = {
  getAll:  (params = {}) => apiClient.get('/assignment/get-all-assignments', { params }),
  create:  (data)     => apiClient.post('/assignment/assignment-create', data),
  update:  (id, data) => apiClient.put(`/assignment/update-assignment/${id}`, data),
  delete:  (id)       => apiClient.delete(`/assignment/delete-assignment/${id}`),
  getDependencies: (id) => apiClient.get(`/admin/assignments/${id}/dependencies`),
  deactivate: (id) => apiClient.post(`/admin/assignments/${id}/deactivate`),
  reactivate: (id) => apiClient.post(`/admin/assignments/${id}/reactivate`),
};

export default assignmentApi;
