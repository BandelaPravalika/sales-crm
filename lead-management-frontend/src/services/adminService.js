import api from '../api/api';

const adminService = {
  fetchDashboardStats: (filters) => api.get('/admin/dashboard/stats', { params: filters }),
  fetchMemberPerformance: (filters) => api.get('/admin/reports/member-performance', { params: filters }),
  fetchTrendData: (filters) => api.get('/reports/trend', { params: filters }),
  fetchUsers: () => api.get('/admin/users'),
  fetchPermissions: () => api.get('/admin/permissions'),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  fetchAssociatesByTl: (tlId) => api.get(`/admin/associates/${tlId}`),
  fetchTeamLeaders: () => api.get('/admin/team-leaders')
};

export default adminService;
