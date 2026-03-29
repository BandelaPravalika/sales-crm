import api from '../api/api';

const managerService = {
    fetchDashboardData: (filters) => {
        const statsParams = {
            start: filters.from,
            end: filters.to,
            userId: filters.userId
        };
        const trendParams = {
            from: filters.from?.split('T')[0],
            to: filters.to?.split('T')[0],
            userId: filters.userId
        };
        return Promise.all([
            api.get('/manager/dashboard/stats', { params: statsParams }),
            api.get('/manager/reports/member-performance', { params: statsParams }),
            api.get('/manager/team-tree'),
            api.get('/reports/trend', { params: trendParams })
        ]);
    },
    fetchLeads: () => api.get('/manager/leads'),
    fetchTeamLeaders: () => api.get('/manager/team-leaders'),
    fetchRoles: () => api.get('/manager/roles'),
    fetchPermissions: () => api.get('/manager/permissions'),
    createUser: (formData) => api.post('/manager/users', formData),
    updateUser: (id, userData) => api.put(`/manager/users/${id}`, userData),
    deleteUser: (id) => api.delete(`/manager/users/${id}`),
    assignSupervisor: (associateId, supervisorId) => api.post(`/manager/users/${associateId}/assign-supervisor/${supervisorId}`),
    addLead: (leadData) => api.post('/manager/leads', leadData),
    assignLead: (leadId, tlId) => api.post(`/manager/assign-lead/${leadId}/${tlId}`),
    bulkAssignLeads: (leadIds, tlId) => api.post('/manager/leads/bulk-assign', { leadIds, tlId }),
    recordCallOutcome: (leadId, data) => api.post(`/leads/${leadId}/record-outcome`, data),
    bulkUploadLeads: (file, assignedToIds) => {
        const formData = new FormData();
        formData.append('file', file);
        if (assignedToIds) formData.append('assignedToIds', assignedToIds);
        return api.post('/manager/leads/bulk-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export default managerService;
