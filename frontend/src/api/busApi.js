import apiClient from './apiClient';

const busApi = {
  getAll:  (params = {}) => apiClient.get('/bus/get-all-buses', { params }),
  create:  (formData) =>
    apiClient.post('/bus/bus-create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update:  (id, formData) =>
    apiClient.put(`/bus/update-bus/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete:  (id)      => apiClient.delete(`/bus/delete-bus/${id}`),
  getDependencies: (id) => apiClient.get(`/admin/buses/${id}/dependencies`),
  deactivate: (id) => apiClient.post(`/admin/buses/${id}/deactivate`),
  reactivate: (id) => apiClient.post(`/admin/buses/${id}/reactivate`),
};

export default busApi;
