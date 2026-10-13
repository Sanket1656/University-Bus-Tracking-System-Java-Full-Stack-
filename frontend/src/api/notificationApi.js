import apiClient from './apiClient';

const notificationApi = {
  /** GET /api/notifications */
  getNotifications: (limit = 50) =>
    apiClient.get('/notifications', { params: { limit } }),

  /** PUT /api/notifications/:id/read */
  markAsRead: (id) =>
    apiClient.put(`/notifications/${id}/read`),

  /** PUT /api/notifications/read-all */
  markAllAsRead: () =>
    apiClient.put('/notifications/read-all'),
};

export default notificationApi;
