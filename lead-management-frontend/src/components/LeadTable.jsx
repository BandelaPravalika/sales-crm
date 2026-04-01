import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Send, Clock, CheckCircle, XCircle, ExternalLink, Copy, MessageSquare, MessageCircle, BookOpen, Phone, Heart, Zap, TrendingUp } from 'lucide-react';
import { Button, Card, Input, Table } from './common/Components';
import RejectionModal from './RejectionModal';
import { toast } from 'react-toastify';
import CallOutcomeModal from './CallOutcomeModal';
import GeneratePaymentLinkModal from './GeneratePaymentLinkModal';

const LeadTable = ({ 
  leads, 
  onSendPaymentLink, 
  onViewInvoice, 
  onUpdateStatus, 
  onRecordCallOutcome, 
  onAssignLead, 
  associates = [], 
  role, 
  showActions = true,
  currentUser = null 
}) => {
  const { isDarkMode } = useTheme();
  const [selectedOutcomeLead, setSelectedOutcomeLead] = useState(null);
  const [selectedLinkLead, setSelectedLinkLead] = useState(null);

  const isLocked = (status) => ['PAID', 'CONVERTED', 'SUCCESSFUL'].includes(status);

  const getStatusBadge = (status) => {
    let variant = 'bg-surface text-muted';
    if (['NEW', 'PENDING'].includes(status)) variant = 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10';
    if (isLocked(status)) variant = 'bg-success bg-opacity-10 text-success border border-success border-opacity-10';
    if (['WORKING', 'CONTACTED', 'INTERESTED'].includes(status)) variant = 'bg-info bg-opacity-10 text-info border border-info border-opacity-10';
    if (['EMI', 'RETRY', 'FOLLOW_UP'].includes(status)) variant = 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-10';
    if (['LOST', 'NOT_INTERESTED', 'PAYMENT_FAILED'].includes(status)) variant = 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-10';

    return (
      <span className={`ui-badge ${variant}`} style={{ minWidth: '80px', textAlign: 'center', display: 'inline-block' }}>
        {status || 'IDENTIFIED'}
      </span>
    );
  };

  return (
    <div className="w-100 animate-fade-in">
      <Table 
        headers={['Lead Entity', 'Current Status', 'Assignment Node', 'Operational Notes', ...(showActions ? ['Engagement'] : [])]}
        data={leads}
        renderRow={(lead) => (
          <>
            <td>
              <div className="d-flex flex-column gap-0.5">
                <span className="fw-bold text-main">{lead.name}</span>
                <span className="text-muted small opacity-75">{lead.email}</span>
                <span className="text-primary small fw-semibold">{lead.mobile}</span>
              </div>
            </td>
            <td className="text-center">
              {getStatusBadge(lead.status)}
            </td>
            <td>
              {role === 'TEAM_LEADER' ? (
                <select 
                  className={`ui-input py-1 px-2 mb-0 ${isLocked(lead.status) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ fontSize: '11px', width: 'fit-content', border: isDarkMode ? 'none' : '1px solid #ddd' }}
                  value={lead.assignedToId || ""}
                  onChange={(e) => onAssignLead && onAssignLead(lead.id, e.target.value)}
                  disabled={isLocked(lead.status)}
                >
                  <option value="">Assign...</option>
                  {currentUser && currentUser.id && (
                    <option key="me" value={currentUser.id} className="fw-black text-primary bg-primary bg-opacity-10 text-uppercase">
                      ★ ME ({currentUser.name || 'Owner'})
                    </option>
                  )}
                  {associates && associates.length > 0 && (
                    <optgroup label="Squad Nodes (Associates)">
                      {associates.map((a) => (
                        <option key={a.id} value={a.id}>↳ {a.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <div className={`p-1 rounded-circle ${lead.assignedToId ? 'bg-success' : 'bg-muted opacity-25'}`} style={{ width: '6px', height: '6px' }}></div>
                  <span className={`small fw-bold ${lead.assignedToId ? 'text-main' : 'text-muted italic opacity-50'}`}>
                    {lead.assignedToName || 'Awaiting Node'}
                  </span>
                </div>
              )}
            </td>
            <td>
              <div className="d-flex align-items-center gap-2 bg-surface rounded-3 px-2 py-1.5 border" style={{ borderColor: 'var(--border-color)' }}>
                <MessageSquare size={12} className="text-muted" />
                <input 
                  type="text" 
                  placeholder="Annotate..."
                  className="bg-transparent border-0 shadow-none p-0 text-main small"
                  style={{ fontSize: '12px', outline: 'none', width: '100%' }}
                  defaultValue={lead.note || ""}
                />
              </div>
            </td>
            {showActions && (
              <td className="text-end">
                <div className="d-flex align-items-center justify-content-end gap-2">
                  <button 
                    className="btn btn-link text-primary p-2 border-0" 
                    onClick={() => setSelectedOutcomeLead(lead)}
                  >
                    <Phone size={16} />
                  </button>
                  <Button variant="primary" className="py-1 px-3" style={{ fontSize: '11px' }} onClick={() => setSelectedLinkLead(lead)}>
                    <Zap size={12} className="me-1" /> LINK
                  </Button>
                  {['PAID', 'CONVERTED', 'EMI', 'SUCCESSFUL'].includes(lead.status) && (
                    <Button variant="secondary" className="py-1 px-3" style={{ fontSize: '11px' }} onClick={() => onViewInvoice && onViewInvoice(lead)}>
                      <BookOpen size={12} className="me-1" /> BILL
                    </Button>
                  )}
                </div>
              </td>
            )}
          </>
        )}
      />

      {selectedOutcomeLead && (
        <CallOutcomeModal 
          isOpen={!!selectedOutcomeLead}
          onClose={() => setSelectedOutcomeLead(null)}
          lead={selectedOutcomeLead}
          theme={isDarkMode ? 'dark' : 'light'}
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
