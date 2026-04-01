import React from 'react';
import { Search, Users, ShieldHalf, Phone, FileText, Upload } from 'lucide-react';
import { Button, Input, Table } from '../../../components/common/Components';
import BulkUploadModal from './BulkUploadModal';

const LeadsTable = ({ 
  leads, 
  searchTerm, 
  setSearchTerm, 
  filterUnassigned, 
  setFilterUnassigned,
  selectedLeadIds,
  toggleSelection,
  toggleSelectAll,
  bulkAssignTlId,
  setBulkAssignTlId,
  handleBulkAssign,
  handleAssignLead,
  onLogCall,
  onViewInvoice,
  teamLeaders,
  onBulkUploadSuccess
}) => {
  const [isBulkModalOpen, setIsBulkModalOpen] = React.useState(false);
  const getStatusBadge = (status) => {
    let variant = 'bg-surface text-muted';
    if (['NEW', 'PENDING'].includes(status)) variant = 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10';
    if (['PAID', 'CONVERTED', 'SUCCESSFUL'].includes(status)) variant = 'bg-success bg-opacity-10 text-success border border-success border-opacity-10';
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
    <div className="d-flex flex-column h-100">
      <div className="p-4 d-flex flex-column flex-xl-row align-items-xl-center justify-content-between gap-4">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-pill">
            <Users size={18} />
          </div>
          <div>
            <h6 className="mb-0 text-main fw-black">Lead Pipeline</h6>
            <small className="text-muted fw-bold opacity-50 text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Global Operational Registry</small>
          </div>
        </div>
        
          <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center">
            <div style={{ minWidth: '260px' }}>
              <Input 
                icon={<Search size={14} />}
                placeholder="Search identity/contact..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-0 py-2"
              />
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="form-check form-switch mb-0 d-flex align-items-center gap-2 ps-0 border-end border-white border-opacity-10 pe-3">
                <input 
                  className="form-check-input ms-0" 
                  type="checkbox" 
                  role="switch"
                  id="unassignedSw" 
                  checked={filterUnassigned}
                  onChange={(e) => setFilterUnassigned(e.target.checked)}
                  style={{ width: '36px', height: '18px', cursor: 'pointer' }}
                />
                <label className="text-muted fw-bold small text-uppercase tracking-wider cursor-pointer ms-1" htmlFor="unassignedSw" style={{ fontSize: '10px' }}>Unassigned</label>
              </div>

              <Button 
                variant="primary" 
                className="rounded-pill px-4 py-2 d-flex align-items-center gap-2 shadow-glow border-0"
                style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}
                onClick={() => setIsBulkModalOpen(true)}
              >
                <Upload size={14} /> BULK INGESTION
              </Button>
            </div>
          </div>
        </div>

      {selectedLeadIds.length > 0 && (
        <div className="px-4 py-3 bg-primary bg-opacity-5 border-top border-bottom border-white border-opacity-5 animate-fade-in">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2">
                <div className="p-1 bg-primary rounded-circle animate-pulse"></div>
                <span className="text-main fw-bold small">
                  {selectedLeadIds.length} Nodes Locked for Batch Operation
                </span>
            </div>
            <div className="d-flex gap-2">
              <select 
                className="ui-input py-1 px-3" 
                style={{ width: '200px', fontSize: '11px' }}
                value={bulkAssignTlId}
                onChange={(e) => setBulkAssignTlId(e.target.value)}
              >
                <option value="">Bulk Redirect To...</option>
                {teamLeaders
                  .filter(u => ['TEAM_LEADER', 'ASSOCIATE'].includes(u.role))
                  .map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
              <Button 
                onClick={() => handleBulkAssign(bulkAssignTlId, teamLeaders)}
                variant="primary"
                className="py-1.5"
                style={{ fontSize: '10px' }}
              >
                EXECUTE
              </Button>
            </div>
          </div>
        </div>
      )}

      <Table 
        headers={[
          <div className="form-check mb-0">
            <input className="form-check-input" type="checkbox" checked={selectedLeadIds.length === leads.length && leads.length > 0} onChange={toggleSelectAll} />
          </div>,
          'Staff Identity', 'Pipeline Status', 'Lead Owner', 'Management'
        ]}
        data={leads}
        renderRow={(lead) => (
          <>
            <td>
              {!lead.assignedToId && (
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={selectedLeadIds.includes(lead.id)} onChange={() => toggleSelection(lead.id)} />
                </div>
              )}
            </td>
            <td>
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-pill small fw-black text-center" style={{ width: '32px', height: '32px' }}>
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="d-flex flex-column">
                  <span className="fw-bold text-main small">{lead.name}</span>
                  <span className="text-muted small opacity-75" style={{ fontSize: '10px' }}>{lead.mobile || 'No Contact Data'}</span>
                </div>
              </div>
            </td>
            <td>{getStatusBadge(lead.status)}</td>
            <td>
              <div className="d-flex align-items-center gap-2">
                <div className={`p-1 rounded-circle ${lead.assignedToId ? 'bg-success' : 'bg-muted opacity-25'}`} style={{ width: '6px', height: '6px' }}></div>
                <span className={`small fw-bold ${lead.assignedToId ? 'text-main' : 'text-muted italic opacity-50'}`}>
                  {lead.assignedToName || 'Awaiting Node'}
                </span>
              </div>
            </td>
            <td className="text-end">
              <div className="d-flex align-items-center justify-content-end gap-1">
                <button className="btn btn-link text-primary p-2 border-0" title="Log Manual Call" onClick={() => onLogCall && onLogCall(lead)}>
                  <Phone size={16} />
                </button>
                {['PAID', 'CONVERTED', 'EMI', 'SUCCESSFUL'].includes(lead.status) && (
                  <button className="btn btn-link text-success p-2 border-0" title="View Invoice" onClick={() => onViewInvoice && onViewInvoice(lead)}>
                    <FileText size={16} />
                  </button>
                )}
                <select 
                  className={`ui-input py-1 px-2 mb-0 ${['PAID', 'CONVERTED', 'SUCCESSFUL'].includes(lead.status) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ width: '130px', fontSize: '10px' }}
                  onChange={(e) => handleAssignLead(lead.id, e.target.value, teamLeaders)}
                  value={lead.assignedToId || ''}
                  disabled={['PAID', 'CONVERTED', 'SUCCESSFUL'].includes(lead.status)}
                  title={['PAID', 'CONVERTED', 'SUCCESSFUL'].includes(lead.status) ? "Assignment locked for paid leads" : "Redirect lead owner"}
                >
                  <option value="">Move To...</option>
                  {teamLeaders
                    .filter(u => ['TEAM_LEADER', 'ASSOCIATE'].includes(u.role))
                    .map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </td>
          </>
        )}
      />
      <BulkUploadModal 
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          setIsBulkModalOpen(false);
          onBulkUploadSuccess && onBulkUploadSuccess();
        }}
        assignees={teamLeaders?.filter(u => u.role === 'ASSOCIATE') || []}
      />
    </div>
  );
};

export default LeadsTable;
