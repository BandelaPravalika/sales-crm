import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare,
  Filter,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-toastify';
import ticketService from '../services/ticketService';
import { useAuth } from '../context/AuthContext';

const TicketManager = ({ role }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', category: 'SYSTEM', priority: 'MEDIUM' });

  const isAdmin = role === 'ADMIN';

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = isAdmin ? await ticketService.getAllTickets() : await ticketService.getMyTickets();
      setTickets(res.data);
    } catch (err) {
      toast.error('Failed to sync ticket ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [isAdmin]);

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    try {
      await ticketService.raiseTicket(newTicket);
      toast.success('Ticket transmission successful - Admin notified');
      setShowRaiseModal(false);
      setNewTicket({ subject: '', description: '', category: 'SYSTEM', priority: 'MEDIUM' });
      fetchTickets();
    } catch (err) {
      toast.error('Transmission failed');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await ticketService.updateStatus(id, status);
      toast.success(`Ticket #${id} status synchronized to ${status}`);
      fetchTickets();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const getPriorityBadge = (p) => {
    const colors = { LOW: 'bg-info', MEDIUM: 'bg-warning', HIGH: 'bg-danger', URGENT: 'bg-danger shadow-glow-danger' };
    return <span className={`ui-badge ${colors[p] || 'bg-surface'} text-white border-0 fw-black shadow-none`} style={{ fontSize: '8px' }}>{p}</span>;
  };

  const getStatusBadge = (s) => {
    const colors = { OPEN: 'bg-primary text-primary', IN_PROGRESS: 'bg-warning text-warning', RESOLVED: 'bg-success text-success', CLOSED: 'bg-surface text-muted' };
    return <span className={`ui-badge ${colors[s]} bg-opacity-10 border border-current border-opacity-10 fw-black`} style={{ fontSize: '9px' }}>{s.replace('_', ' ')}</span>;
  };

  return (
    <div className="container-fluid p-0 animate-fade-in">
      {/* Header Area */}
      <div className="d-flex justify-content-between align-items-center mb-4 px-1">
        <div>
          <h4 className="fw-black text-main mb-1 text-uppercase tracking-widest">Support Ledger</h4>
          <p className="text-muted small fw-bold opacity-75 mb-0">System tickets & operational assistance requests</p>
        </div>
        <button 
          onClick={() => setShowRaiseModal(true)}
          className="btn btn-primary d-flex align-items-center gap-2 rounded-pill shadow-glow px-4 fw-black text-uppercase small"
        >
          <Plus size={18} /> Raise Ticket
        </button>
      </div>

      {/* Stats Summary Area */}
      <div className="row g-3 mb-4">
          <div className="col-md-3">
              <div className="premium-card p-3 border-0 shadow-lg bg-surface h-100">
                  <div className="small fw-black text-muted text-uppercase tracking-widest opacity-50 mb-1" style={{ fontSize: '8px' }}>Active Tickets</div>
                  <div className="fs-4 fw-black text-main">{tickets.filter(t => t.status !== 'CLOSED').length}</div>
              </div>
          </div>
          <div className="col-md-3">
              <div className="premium-card p-3 border-0 shadow-lg bg-surface h-100">
                  <div className="small fw-black text-muted text-uppercase tracking-widest opacity-50 mb-1" style={{ fontSize: '8px' }}>Resolved Today</div>
                  <div className="fs-4 fw-black text-success tabular-nums">{tickets.filter(t => t.status === 'RESOLVED').length}</div>
              </div>
          </div>
          <div className="col-md-3">
              <div className="premium-card p-3 border-0 shadow-lg bg-surface h-100">
                  <div className="small fw-black text-muted text-uppercase tracking-widest opacity-50 mb-1" style={{ fontSize: '8px' }}>Critical Response</div>
                  <div className="fs-4 fw-black text-danger tabular-nums">{tickets.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length}</div>
              </div>
          </div>
          <div className="col-md-3">
              <div className="premium-card p-3 border-0 shadow-lg bg-surface h-100">
                  <div className="small fw-black text-muted text-uppercase tracking-widest opacity-50 mb-1" style={{ fontSize: '8px' }}>System Efficiency</div>
                  <div className="fs-4 fw-black text-primary">High</div>
              </div>
          </div>
      </div>

      {/* Ticket List Area */}
      <div className="premium-card border-0 shadow-lg overflow-hidden bg-surface">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-surface bg-opacity-30 border-bottom border-white border-opacity-5">
              <tr>
                <th className="px-4 py-3 small fw-black text-muted text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Index Node</th>
                <th className="px-4 py-3 small fw-black text-muted text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Subject & Intel</th>
                <th className="px-4 py-3 small fw-black text-muted text-uppercase tracking-widest text-center" style={{ fontSize: '10px' }}>Priority</th>
                <th className="px-4 py-3 small fw-black text-muted text-uppercase tracking-widest text-center" style={{ fontSize: '10px' }}>Identity</th>
                <th className="px-4 py-3 small fw-black text-muted text-uppercase tracking-widest text-center" style={{ fontSize: '10px' }}>Status</th>
                <th className="px-4 py-3 small fw-black text-muted text-uppercase tracking-widest text-end" style={{ fontSize: '10px' }}>Transmission</th>
                {isAdmin && <th className="px-4 py-3 small fw-black text-muted text-uppercase tracking-widest text-end" style={{ fontSize: '10px' }}>Protocol</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    <span className="text-muted fw-bold small opacity-75">POLING TICKET CLOUD...</span>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="opacity-25 py-4">
                       <CheckCircle size={48} className="text-muted mb-2" />
                       <div className="fw-black text-muted text-uppercase small">Zero active nodes in the support spectrum</div>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((t, idx) => (
                  <tr key={t.id} className="border-bottom border-white border-opacity-5 transition-smooth hover-bg-surface-light">
                    <td className="px-4 py-4 text-muted small fw-bold">#{t.id.toString().padStart(4, '0')}</td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="fw-black text-main small text-uppercase mb-1">{t.subject}</div>
                        <div className="small text-muted fw-bold opacity-50 text-truncate" style={{ maxWidth: '250px' }}>{t.description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getPriorityBadge(t.priority)}
                    </td>
                    <td className="px-4 py-4 text-center">
                       <div className="d-flex flex-column align-items-center">
                          <span className="small fw-black text-main">{t.createdBy?.name || 'UNKNOWN'}</span>
                          <span className="text-muted fw-bold opacity-50" style={{ fontSize: '8px' }}>{t.createdBy?.role}</span>
                       </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="px-4 py-4 text-end">
                       <div className="d-flex flex-column align-items-end">
                          <span className="small fw-black text-muted mb-1 tabular-nums">{new Date(t.createdAt).toLocaleDateString()}</span>
                          <span className="text-muted fw-bold opacity-25" style={{ fontSize: '8px' }}>{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-4 text-end">
                        <div className="dropdown">
                          <button className="btn btn-link p-0 text-muted opacity-50 hover-opacity-100" type="button" data-bs-toggle="dropdown">
                             <MoreVertical size={16} />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end bg-surface border-white border-opacity-10 shadow-lg">
                             <li><button className="dropdown-item small fw-bold text-warning" onClick={() => updateStatus(t.id, 'IN_PROGRESS')}>In Progress</button></li>
                             <li><button className="dropdown-item small fw-bold text-success" onClick={() => updateStatus(t.id, 'RESOLVED')}>Resolve</button></li>
                             <li><button className="dropdown-item small fw-bold text-muted" onClick={() => updateStatus(t.id, 'CLOSED')}>Close</button></li>
                          </ul>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raise Ticket Modal */}
      {showRaiseModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="card border-0 shadow-lg bg-dark text-white rounded-4 w-100 mx-3 animate-zoom-in" style={{ maxWidth: '500px' }}>
            <div className="card-header border-bottom border-white border-opacity-10 p-4 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-black mb-1 text-uppercase tracking-widest">Raise System Ticket</h5>
                <p className="text-white opacity-50 small mb-0">Describe your technical or operational issue</p>
              </div>
              <button 
                onClick={() => setShowRaiseModal(false)}
                className="btn-close btn-close-white opacity-50 shadow-none"
              ></button>
            </div>
            <div className="card-body p-4">
               <form onSubmit={handleRaiseTicket} className="d-flex flex-column gap-3">
                  <div>
                     <label className="small fw-black text-muted text-uppercase tracking-widest mb-2" style={{ fontSize: '10px' }}>Subject</label>
                     <input 
                       className="form-control bg-surface border-white border-opacity-10 text-white shadow-none py-2.5 rounded-3 fw-bold" 
                       placeholder="Enter issue synopsis..."
                       required
                       value={newTicket.subject}
                       onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                     />
                  </div>
                  <div className="row g-3">
                     <div className="col-md-6">
                        <label className="small fw-black text-muted text-uppercase tracking-widest mb-2" style={{ fontSize: '10px' }}>Category</label>
                        <select 
                          className="form-select bg-surface border-white border-opacity-10 text-white shadow-none py-2.5 rounded-3 fw-bold"
                          value={newTicket.category}
                          onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                        >
                           <option value="SYSTEM">System/Technical</option>
                           <option value="OPERATIONAL">Operational</option>
                           <option value="FINANCIAL">Financial</option>
                           <option value="HUMAN_RESOURCE">Human Resource</option>
                        </select>
                     </div>
                     <div className="col-md-6">
                        <label className="small fw-black text-muted text-uppercase tracking-widest mb-2" style={{ fontSize: '10px' }}>Priority</label>
                        <select 
                          className="form-select bg-surface border-white border-opacity-10 text-white shadow-none py-2.5 rounded-3 fw-bold text-danger"
                          value={newTicket.priority}
                          onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                        >
                           <option value="LOW">Low Level</option>
                           <option value="MEDIUM">Medium Level</option>
                           <option value="HIGH">High Criticality</option>
                           <option value="URGENT">Urgent Deployment</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="small fw-black text-muted text-uppercase tracking-widest mb-2" style={{ fontSize: '10px' }}>Detailed Intelligence</label>
                     <textarea 
                       className="form-control bg-surface border-white border-opacity-10 text-white shadow-none py-2.5 rounded-3 fw-bold" 
                       rows="4" 
                       placeholder="Explain the operational block in detail..."
                       required
                       value={newTicket.description}
                       onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                     ></textarea>
                  </div>
                  
                  <div className="mt-2 pt-3 border-top border-white border-opacity-5">
                     <button type="submit" className="btn btn-primary w-100 rounded-pill py-2.5 fw-black text-uppercase shadow-glow">
                        Initialize Ticket Node
                     </button>
                  </div>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketManager;
