import apiClient from './apiClient';

const transportApi = {
  // Admin — pending transport requests
  getPendingRequests: () =>
    apiClient.get('/transport/pending-transport-requests'),

  // Admin — approved transport requests
  getApprovedRequests: () =>
    apiClient.get('/transport/approved-transport-requests'),

  // Admin — eligible pending students for an assignment
  getPendingStudentsForAssignment: (assignmentId) =>
    apiClient.get(`/transport/assignment/${assignmentId}/pending-students`),

  // Admin — bulk approve / assign students
  assignStudents: (assignmentId, students) =>
    apiClient.put(`/transport/assignment/${assignmentId}/assign-students`, { students }),

  // Admin — students already on an assignment
  getAssignmentStudents: (assignmentId) =>
    apiClient.get(`/transport/assignment/${assignmentId}/students`),

  // Admin — reject a pending transport request
  rejectRequest: (id, remarks) =>
    apiClient.put(`/transport/transport-request/${id}/reject`, { remarks }),

  // Admin — move approved student to a different assignment
  changeAssignment: (id, assignmentId) =>
    apiClient.put(`/transport/transport-request/${id}/change-assignment`, { assignmentId }),

  // Admin — update an approved student's seat number
  changeSeat: (id, seatNumber) =>
    apiClient.put(`/transport/transport-request/${id}/change-seat`, { seatNumber }),

  // Admin — pending cancellation requests
  getPendingCancellationRequests: () =>
    apiClient.get('/transport/pending-cancellation-requests'),

  // Admin — approve cancellation
  approveCancellation: (id) =>
    apiClient.put(`/transport/transport-request/${id}/approve-cancellation`),

  // Admin — reject cancellation
  rejectCancellation: (id, remarks) =>
    apiClient.put(`/transport/transport-request/${id}/reject-cancellation`, { remarks }),
};

export default transportApi;
