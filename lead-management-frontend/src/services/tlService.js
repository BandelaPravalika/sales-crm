import api from '../api/api';

const tlService = {
  fetchMyLeads: () => api.get('/tl/leads/my'),
  fetchDashboardStats: (filters) => api.get('/tl/dashboard/stats', { params: filters }),
  fetchMemberPerformance: (filters) => api.get('/tl/reports/member-performance', { params: filters }),
  fetchSubordinates: () => api.get('/tl/subordinates'),
  fetchTrendData: (filters) => api.get('/reports/trend', { params: filters }),
  addLead: (leadData) => api.post('/tl/leads', leadData),
  updateLeadStatus: (leadId, status, note) => api.put(`/tl/leads/${leadId}/status`, null, { params: { status, note } }),
  recordCallOutcome: (leadId, outcomeData) => api.post(`/leads/${leadId}/record-outcome`, outcomeData),
  sendPaymentLink: (leadId, paymentData) => api.post(`/tl/leads/${leadId}/send-payment-link`, paymentData),
  assignLead: (leadId, associateId) => api.post(`/tl/leads/${leadId}/assign/${associateId}`),
  createTask: (taskData) => api.post('/tasks', taskData)
};

export default tlService;
