import apiClient from './apiClient';

const trackingApi = {
  // ─── DRIVER-ONLY: POST new bus location ──────────────────────────────────
  updateLocation: (payload) => apiClient.post('/tracking/update-location', payload),

  // ─── STUDENT-ONLY: GET current bus location ──────────────────────────────
  getBusLocation: (busId) =>
    apiClient.get(`/tracking/bus/${busId}/location`),

  getBusStatus: (busId) =>
    apiClient.get(`/tracking/bus/${busId}/status`),

  // ─── ADMIN-ONLY: GET all active bus locations ────────────────────────────
  getActiveLocations: () =>
    apiClient.get('/tracking/active-locations'),

  // ─── ADMIN DEMO-ONLY: push simulated location for any bus ────────────────
  demoUpdateLocation: (payload) =>
    apiClient.post('/tracking/demo/update-location', payload),

  subscribe: (/* callback */) => {
    return () => {};
  },
};

export default trackingApi;
