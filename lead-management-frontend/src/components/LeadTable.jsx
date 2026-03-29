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
          <table className={`table table-hover align-middle mb-0 table-dark border-0`}>
            <thead>
              <tr className="text-muted small fw-semibold border-bottom border-white border-opacity-5">
                <th className="ps-4">Lead Info</th>
                <th>Status</th>
                <th>Assigned Node</th>
                <th>Note/Remarks</th>
                {showActions && <th className="pe-4 text-end">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-bottom border-white border-opacity-5">
                  <td className="ps-4 py-3">
                    <div className="d-flex flex-column">
                      <span className="fw-bold">{lead.name}</span>
                      <small className="text-muted">{lead.email}</small>
                      <small className="text-muted fw-bold">{lead.mobile}</small>
                    </div>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(lead.status)}>
                      {lead.status}
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-secondary bg-opacity-25 text-muted px-2 py-1">
                      {lead.assignedToName || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 rounded px-2 py-1 w-100" style={{ minWidth: '150px' }}>
                      <MessageSquare size={14} className="text-muted" />
                      <input 
                        type="text" 
                        placeholder="Add note..."
                        className="form-control form-control-sm border-0 bg-transparent shadow-none p-0 text-white"
                        defaultValue={lead.note || ""}
                      />
                    </div>
                  </td>
                  {showActions && (
                    <td className="text-end pe-4">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <button className="btn btn-outline-primary btn-sm border-0" onClick={() => setSelectedOutcomeLead(lead)}>
                          <Phone size={14} />
                        </button>
                        <button className="btn btn-primary btn-sm rounded-pill px-3" onClick={() => setSelectedLinkLead(lead)} style={{ fontSize: '11px' }}>
                          <Zap size={12} className="me-1" /> Link
                        </button>
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
