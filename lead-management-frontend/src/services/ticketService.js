import api from '../api/api';

const ticketService = {
  raiseTicket: (ticket) => api.post('/tickets/raise', ticket),
  getMyTickets: () => api.get('/tickets/my'),
  getAllTickets: () => api.get('/tickets/all'),
  updateStatus: (id, status) => api.patch(`/tickets/${id}/status?status=${status}`)
};

export default ticketService;
