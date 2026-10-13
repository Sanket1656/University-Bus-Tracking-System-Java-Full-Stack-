import apiClient from './apiClient';

const transportRequestApi = {
  /** POST /api/transport/transport-request */
  createTransportRequest: (preferredStop) =>
    apiClient.post('/transport/transport-request', { preferredStop }),

  /** GET /api/transport/my-transport-request */
  getMyTransportRequest: () =>
    apiClient.get('/transport/my-transport-request'),

  /** PUT /api/transport/transport-request/my-cancel-request */
  cancelMyTransportRequest: (reason) =>
    apiClient.put('/transport/transport-request/my-cancel-request', { reason }),

  /** PUT /api/transport/transport-request/update-preferred-stop */
  updatePreferredStop: (preferredStop) =>
    apiClient.put('/transport/transport-request/update-preferred-stop', { preferredStop }),

  /** GET /api/transport/my-bus/seat-map */
  getBusSeatMap: () =>
    apiClient.get('/transport/my-bus/seat-map'),
};

export default transportRequestApi;
