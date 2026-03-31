import { Send, Clock, CheckCircle, XCircle, ExternalLink, Copy, MessageSquare, MessageCircle, BookOpen, Phone, Heart, Zap, TrendingUp } from 'lucide-react';
import RejectionModal from './RejectionModal';
import { useState } from 'react';
import { toast } from 'react-toastify';
import CallOutcomeModal from './CallOutcomeModal';
import GeneratePaymentLinkModal from './GeneratePaymentLinkModal';

const LeadTable = ({ leads, onSendPaymentLink, onViewInvoice, onUpdateStatus, onRecordCallOutcome, onAssignLead, associates = [], role, showActions = true, theme }) => {
  const [selectedOutcomeLead, setSelectedOutcomeLead] = useState(null);
  const [selectedRejectionLead, setSelectedRejectionLead] = useState(null);
  const [selectedLinkLead, setSelectedLinkLead] = useState(null);

  const handleWhatsAppShare = (lead) => {
    if (!lead.paymentLink) {
      toast.warning('Please click "Send Link" to generate a payment link first.');
      return;
    }
    let mobile = lead.mobile.replace(/\D/g, ''); // Remove non-digits
    if (mobile.length === 10) {
      mobile = '91' + mobile; // Default to India country code
    }
    const message = `Hello ${lead.name}, please complete your payment for your admission here: ${lead.paymentLink.trim()}`;
    window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyLink = (lead) => {
    if (!lead.paymentLink) {
      toast.warning('Please click "Send Link" to generate a payment link first.');
      return;
    }
    navigator.clipboard.writeText(lead.paymentLink);
    toast.success('Payment link copied to clipboard!');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'NEW': return 'badge bg-primary';
      case 'PAID': return 'badge bg-success';
      case 'CONTACTED': return 'badge bg-info text-dark';
      case 'INTERESTED': return 'badge bg-warning text-dark';
      case 'UNDER_REVIEW': return 'badge bg-purple text-white';
      case 'CONVERTED': return 'badge bg-success text-white';
      case 'LOST': return 'badge bg-secondary';
      case 'PAYMENT_FAILED': return 'badge bg-danger';
      case 'NOT_INTERESTED': return 'badge bg-secondary';
      case 'EMI': return 'badge bg-warning text-dark';
      case 'RETRY': return 'badge bg-warning text-dark';
      case 'WORKING': return 'badge bg-info text-dark';
      case 'PENDING_MESSAGES': return 'badge bg-primary';
      default: return 'badge bg-dark-subtle text-muted';
    }
  };

  return (
    <div className="w-100 animate-fade-in">
      <div className="p-0">
        <div className="table-responsive">
          <table className={`table table-hover align-middle mb-0 table-dark border-0 glass-table`}>
            <thead>
              <tr className="text-muted small fw-bold text-uppercase tracking-widest border-bottom border-white border-opacity-5">
                <th className="ps-4 py-3">Lead Entity</th>
                <th className="py-3">Current Status</th>
                <th className="py-3">Assignment Node</th>
                <th className="py-3">Operational Notes</th>
                {showActions && <th className="pe-4 text-end py-3">Engagement</th>}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="table-row border-bottom border-white border-opacity-5 transition-all">
                  <td className="ps-4 table-cell">
                    <div className="d-flex flex-column">
                      <span className="value">{lead.name}</span>
                      <small className="label" style={{ fontSize: '10px' }}>{lead.email}</small>
                      <small className="value" style={{ fontSize: '11px', opacity: 0.7 }}>{lead.mobile}</small>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={getStatusBadgeClass(lead.status)}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    {role === 'TEAM_LEADER' && associates.length > 0 ? (
                      <select 
                        className="form-select form-select-sm bg-dark bg-opacity-50 text-white border-white border-opacity-10 shadow-none py-0"
                        style={{ fontSize: '10px', height: '24px', width: 'fit-content' }}
                        value={lead.assignedToId || ""}
                        onChange={(e) => onAssignLead && onAssignLead(lead.id, e.target.value)}
                      >
                        <option value="">Assign Associate...</option>
                        {associates
                          .filter(a => a.role === 'ASSOCIATE')
                          .map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                      </select>
                    ) : (
                      <span className="badge bg-secondary bg-opacity-25 text-muted px-2 py-1" style={{ fontSize: '10px' }}>
                        {lead.assignedToName || (lead.assignedToId ? 'Assigned' : 'Unassigned')}
                      </span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="d-flex align-items-center gap-2 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 rounded px-1 py-1 w-100" style={{ minWidth: '150px' }}>
                      <MessageSquare size={12} className="text-muted" />
                      <input 
                        type="text" 
                        placeholder="Add note..."
                        className="form-control form-control-sm border-0 bg-transparent shadow-none p-0 text-white"
                        style={{ fontSize: '12px' }}
                        defaultValue={lead.note || ""}
                      />
                    </div>
                  </td>
                  {showActions && (
                    <td className="text-end pe-4 table-cell">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <button 
                          className="btn btn-outline-primary btn-sm border-0 p-1 rounded-circle hover-bg-primary hover-text-white transition-smooth" 
                          onClick={() => setSelectedOutcomeLead(lead)}
                          title="Log Interaction"
                        >
                          <Phone size={14} />
                        </button>
                        <button className="btn btn-primary btn-sm rounded-pill px-3" onClick={() => setSelectedLinkLead(lead)} style={{ fontSize: '10px', height: '24px', display: 'flex', alignItems: 'center' }}>
                          <Zap size={10} className="me-1" /> Link
                        </button>
                        {lead.status === 'PAID' && (
                          <button 
                            className="btn btn-success btn-sm rounded-pill px-3 border-0 shadow-sm" 
                            style={{ fontSize: '10px', height: '24px', display: 'flex', alignItems: 'center', backgroundColor: '#10b981' }}
                            onClick={() => onViewInvoice && onViewInvoice(lead)}
                          >
                            <BookOpen size={10} className="me-1" /> Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <div className="text-center p-5 text-muted fw-bold text-uppercase">
              No leads found.
            </div>
          )}
        </div>
      </div>

      {selectedOutcomeLead && (
        <CallOutcomeModal 
          isOpen={!!selectedOutcomeLead}
          onClose={() => setSelectedOutcomeLead(null)}
          lead={selectedOutcomeLead}
          theme={theme || 'dark'}
          onSendPaymentLink={onSendPaymentLink}
          onSubmit={async (data) => {
            if (onRecordCallOutcome) {
              await onRecordCallOutcome(selectedOutcomeLead.id, data);
            } else {
              onUpdateStatus(selectedOutcomeLead.id, data.status, data);
            }
            setSelectedOutcomeLead(null);
          }}
        />
      )}

      {selectedLinkLead && (
        <GeneratePaymentLinkModal 
          show={!!selectedLinkLead}
          onClose={() => setSelectedLinkLead(null)}
          lead={selectedLinkLead}
          onConfirm={(leadId, data) => {
            onSendPaymentLink(leadId, data);
            setSelectedLinkLead(null);
          }}
        />
      )}
    </div>
  );
};

export default LeadTable;
