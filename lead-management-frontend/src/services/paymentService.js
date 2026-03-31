import api from '../api/api';

const paymentService = {
  fetchHistory: (role, filters) => {
    let url = role === 'ADMIN' ? '/admin/payments/history' :
      role === 'MANAGER' ? '/manager/payments/history' :
        '/tl/payments/history';

    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate + 'T00:00:00');
    if (filters.endDate) params.append('endDate', filters.endDate + 'T23:59:59');
    if (filters.tlId) params.append('tlId', filters.tlId);
    if (filters.associateId) params.append('associateId', filters.associateId);
    if (filters.status) params.append('status', filters.status);

    return api.get(`${url}?${params.toString()}`);
  },

  updatePaymentStatus: (id, payload) => {
    // Expected payload: { status, paymentMethod, note, actualPaidAmount, nextDueDate }
    return api.put(`/payments/${id}/status`, null, { params: payload });
  },

  splitPayment: (id, splitRequest) => {
    // splitRequest: { installments: [{ amount, dueDate }], paymentMethod, note }
    return api.post(`/payments/${id}/split`, splitRequest);
  },

  recordManualPayment: (data) => {
    return api.post('/payments/manual-record', data);
  },

  generateInvoice: (orderId) => {
    return api.get('/public/payments/invoice', { params: { order_id: orderId } });
  }
};

export default paymentService;
