import apiClient from './apiClient';

const authApi = {
  login:       (data) => apiClient.post('/auth/login', data),
  register:    (data) => apiClient.post('/auth/register', data),
  getAllUsers:  ()     => apiClient.get('/auth/get-all-users'),
  getAllDrivers: (params = {}) => apiClient.get('/auth/get-all-drivers', { params }),
  getAllStudents: (params = {}) => apiClient.get('/auth/get-all-students', { params }),
  deleteUser:  (id)   => apiClient.delete(`/auth/delete-user/${id}`),
};

export default authApi;
