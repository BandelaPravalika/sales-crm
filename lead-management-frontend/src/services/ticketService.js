import axios from './axiosConfig';

const ticketService = {
  raiseTicket: (ticket) => axios.post('/tickets/raise', ticket),
  getMyTickets: () => axios.get('/tickets/my'),
  getAllTickets: () => axios.get('/tickets/all'),
  updateStatus: (id, status) => axios.patch(`/tickets/${id}/status?status=${status}`)
};

export default ticketService;
