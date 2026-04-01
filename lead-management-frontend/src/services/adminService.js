import api from '../api/api';

const adminService = {
  fetchDashboardStats: (filters) => api.get('/admin/dashboard/stats', { params: filters }),
  fetchMemberPerformance: (filters) => api.get('/admin/reports/member-performance', { params: filters }),
  fetchTrendData: (filters) => api.get('/reports/trend', { params: filters }),
  fetchUsers: () => api.get('/admin/users'),
  fetchPermissions: () => api.get('/admin/permissions'),
  fetchShifts: () => api.get('/admin/shifts'),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  fetchAssociatesByTl: (tlId) => api.get(`/admin/associates/${tlId}`),
  fetchTeamLeaders: () => api.get('/admin/team-leaders'),
  fetchLeads: () => api.get('/admin/leads'),
  fetchTeamTree: () => api.get('/admin/team-tree'),
  assignLead: (leadId, tlId) => api.post(`/admin/assign-lead/${leadId}/${tlId}`),
  bulkAssignLeads: (leadIds, tlId) => api.post('/admin/leads/bulk-assign', { leadIds, tlId }),

  // Attendance Management
  fetchOffices: () => api.get('/admin/attendance/offices'),
  createOffice: (data) => api.post('/admin/attendance/offices', data),
  updateOffice: (id, data) => api.put(`/admin/attendance/offices/${id}`, data),
  deleteOffice: (id) => api.delete(`/admin/attendance/offices/${id}`),
  fetchPolicies: () => api.get('/admin/attendance/policies'),
  createPolicy: (data) => api.post('/admin/attendance/policies', data),
  updatePolicy: (id, data) => api.put(`/admin/attendance/policies/${id}`, data),
  deletePolicy: (id) => api.delete(`/admin/attendance/policies/${id}`),
  fetchShifts: () => api.get('/admin/attendance/shifts'),
  createShift: (data) => api.post('/admin/attendance/shifts', data),
  updateShift: (id, data) => api.put(`/admin/attendance/shifts/${id}`, data),
  deleteShift: (id) => api.delete(`/admin/attendance/shifts/${id}`),

  // Call Records Audit
  fetchCallLogsAdmin: (filters) => api.get('/call-records/admin/all', { params: filters }),
  fetchGlobalCallStats: () => api.get('/call-records/admin/stats'),
  bulkUploadCallLogs: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/call-records/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  uploadCallRecord: (payload) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    if (payload.leadId) formData.append('leadId', payload.leadId);
    formData.append('phoneNumber', payload.phoneNumber);
    formData.append('callType', payload.callType || 'OUTGOING');
    formData.append('status', payload.status || 'CONNECTED');
    if (payload.note) formData.append('note', payload.note);
    formData.append('duration', payload.duration || 0);

    return api.post('/call-records/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default adminService;
