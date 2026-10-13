import apiClient from './apiClient';

const stopApi = {
  getAll:  (params = {}) => apiClient.get('/stop/get-all-stops', { params }),
  create:  (data)     => apiClient.post('/stop/stop-create', data),
  update:  (id, data) => apiClient.put(`/stop/update-stop/${id}`, data),
  delete:  (id)       => apiClient.delete(`/stop/delete-stop/${id}`),
  getDependencies: (id) => apiClient.get(`/admin/stops/${id}/dependencies`),
  deactivate: (id) => apiClient.post(`/admin/stops/${id}/deactivate`),
  reactivate: (id) => apiClient.post(`/admin/stops/${id}/reactivate`),
};

export default stopApi;
