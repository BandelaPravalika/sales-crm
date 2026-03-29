import { Send, Clock, CheckCircle, XCircle, ExternalLink, Copy, MessageSquare, MessageCircle, BookOpen, Phone, Heart, Zap, TrendingUp } from 'lucide-react';
import RejectionModal from './RejectionModal';
import { useState } from 'react';
import { toast } from 'react-toastify';
import CallOutcomeModal from './CallOutcomeModal';
import GeneratePaymentLinkModal from './GeneratePaymentLinkModal';

const LeadTable = ({ leads, onSendPaymentLink, onUpdateStatus, onRecordCallOutcome, onAssignLead, associates = [], role, showActions = true, theme }) => {
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
          <table className={`table table-hover align-middle mb-0 ${theme === 'dark' ? 'table-dark border-0' : ''}`}>
            <thead className={theme === 'dark' ? 'bg-dark bg-opacity-50 border-0' : 'table-light'}>
              <tr className="text-uppercase text-muted-premium small fw-bold">
                <th>Lead Info</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Note/Remarks</th>
                {showActions && <th className="text-end">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className="d-flex flex-column">
                      <span className="fw-bold">{lead.name}</span>
                      <small className="text-muted">{lead.email}</small>
                      <small className="text-muted fw-bold">{lead.mobile}</small>
                      
                      {/* Persistent Rejection/Follow-up Details */}
                      {lead.status === 'NOT_INTERESTED' && (
                        <div className="d-flex flex-column gap-1 mt-2 p-2 bg-secondary bg-opacity-10 rounded border border-secondary border-opacity-25" style={{ fontSize: '0.75rem' }}>
                          <div className="d-flex align-items-center gap-2 text-danger">
                            <XCircle size={14} />
                            <span className="fw-bold">{lead.rejectionReason?.replace('_', ' ')}</span>
                          </div>
                          {lead.rejectionNote && <p className="text-muted fst-italic mb-0">"{lead.rejectionNote}"</p>}
                          {lead.followUpRequired && (
                            <div className="d-flex align-items-center gap-2 text-primary mt-1 fw-bold">
                              <Clock size={14} />
                              <span>Remind: {new Date(lead.followUpDate).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(lead.status)}>
                      {lead.status}
                    </span>
                  </td>
                  <td>
                    {role === 'TEAM_LEADER' ? (
                      <div className="d-flex align-items-center gap-2">
                        {lead.assignedToId ? (
                           <div className="d-flex align-items-center bg-success bg-opacity-10 border border-success border-opacity-25 rounded px-2 py-1">
                             <span className="small fw-bold text-success text-truncate" style={{ maxWidth: '100px' }}>{lead.assignedToName}</span>
                             <select 
                                className="form-select form-select-sm border-0 bg-transparent shadow-none p-0 ms-1"
                                style={{ width: '20px', color: 'transparent' }}
                                value={lead.assignedToId || ''}
                                onChange={(e) => onAssignLead && onAssignLead(lead.id, e.target.value)}
                              >
                                {associates && associates.map(a => (
                                  <option key={a.id} value={a.id} style={{ color: 'initial' }}>{a.name}</option>
                                ))}
                              </select>
                           </div>
                        ) : (
                          <select 
                            className="form-select form-select-sm border-0 bg-warning bg-opacity-10 text-warning fw-bold shadow-none"
                            style={{ fontSize: '0.75rem', minWidth: '120px' }}
                            value={lead.assignedToId || ''}
                            onChange={(e) => onAssignLead && onAssignLead(lead.id, e.target.value)}
                          >
                            <option value="">Assign to...</option>
                            {associates && associates.map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                    <span className={`small fw-bold px-2 py-1 rounded border border-secondary border-opacity-10 ${theme === 'dark' ? 'bg-secondary bg-opacity-25 text-muted' : 'bg-light text-muted'}`}>
                        {lead.assignedToName || 'Unassigned'}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 rounded px-2 py-1 w-100" style={{ minWidth: '150px' }}>
                      <MessageSquare size={14} className="text-muted" />
                      <input 
                        type="text" 
                        placeholder="Add note..."
                        className="form-control form-control-sm border-0 bg-transparent shadow-none p-0"
                        id={`note-${lead.id}`}
                        defaultValue={lead.note || ""}
                        onBlur={(e) => {
                          if (e.target.value !== lead.note) {
                            onUpdateStatus(lead.id, lead.status, { note: e.target.value });
                          }
                        }}
                      />
                    </div>
                  </td>
                  {showActions && (
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        {/* Status Update / Call Result Buttons */}
                        {(lead.status !== 'PAID' && lead.status !== 'LOST' && lead.status !== 'NOT_INTERESTED') && (
                          <div className="d-flex gap-2">
                            <button className="btn btn-outline-primary btn-sm fw-bold border-0 d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }} onClick={() => setSelectedOutcomeLead(lead)}>
                              <Phone size={12} /> Log / Update
                            </button>
                          </div>
                        )}

                        {(lead.status === 'NEW' || lead.status === 'CONTACTED' || lead.status === 'INTERESTED' || lead.status === 'PAYMENT_FAILED' || lead.status === 'EMI' || lead.status === 'FOLLOW_UP') && (
                          <div className="d-flex flex-column flex-sm-row align-items-end justify-content-end gap-2 w-100">
                            <button 
                              className="btn btn-primary btn-sm d-flex align-items-center fw-bold text-nowrap rounded-3 px-3"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => setSelectedLinkLead(lead)}
                            >
                              <Zap size={12} className="me-1" />
                              {lead.status === 'INTERESTED' ? 'Generate Link' : 'Regenerate'}
                            </button>

                            <div className="d-flex gap-2 align-items-center">
                              <button className="btn btn-sm d-flex align-items-center justify-content-center rounded" style={{ background: '#25D366', color: 'white', width: '32px', height: '30px' }} onClick={() => handleWhatsAppShare(lead)} title="Share on WhatsApp">
                                <MessageCircle size={16} />
                              </button>
                              <button className="btn btn-sm d-flex align-items-center justify-content-center rounded" style={{ background: '#6366f1', color: 'white', width: '32px', height: '30px' }} onClick={() => handleCopyLink(lead)} title="Copy Link">
                                <Copy size={16} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Recovery: NOT_INTERESTED -> Recovery */}
                        {lead.status === 'NOT_INTERESTED' && (
                          <div className="d-flex align-items-center justify-content-end w-100">
                            <button className="btn btn-outline-primary btn-sm d-flex align-items-center fw-bold border-0" style={{ fontSize: '0.7rem' }} onClick={() => onUpdateStatus(lead.id, 'INTERESTED')}>
                              <Heart size={12} className="me-1" /> Recover
                            </button>
                          </div>
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
          theme={theme}
          onSendPaymentLink={onSendPaymentLink}
          onSubmit={async (data) => {
            if (onRecordCallOutcome) {
              await onRecordCallOutcome(selectedOutcomeLead.id, data);
            } else {
              // Fallback to onUpdateStatus
              onUpdateStatus(selectedOutcomeLead.id, data.status, data);
            }
            setSelectedOutcomeLead(null);
          }}
        />
      )}

      {selectedRejectionLead && (
        <RejectionModal 
          isOpen={!!selectedRejectionLead}
          onClose={() => setSelectedRejectionLead(null)}
          leadName={selectedRejectionLead.name}
          theme={theme}
          onSubmit={(data) => {
            onUpdateStatus(selectedRejectionLead.id, 'NOT_INTERESTED', data);
            setSelectedRejectionLead(null);
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
