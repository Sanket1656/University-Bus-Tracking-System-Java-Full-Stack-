import apiClient from './apiClient';

const routeApi = {
  getAll:  (params = {}) => apiClient.get('/routes/get-all-routes', { params }),
  // backend expects stops as plain array of stop IDs; order is derived from array index
  create:  (data)     => apiClient.post('/routes/route-create', data),
  update:  (id, data) => apiClient.put(`/routes/update-route/${id}`, data),
  delete:  (id)       => apiClient.delete(`/routes/delete-route/${id}`),
  getDependencies: (id) => apiClient.get(`/admin/routes/${id}/dependencies`),
  deactivate: (id) => apiClient.post(`/admin/routes/${id}/deactivate`),
  reactivate: (id) => apiClient.post(`/admin/routes/${id}/reactivate`),
};

export default routeApi;
