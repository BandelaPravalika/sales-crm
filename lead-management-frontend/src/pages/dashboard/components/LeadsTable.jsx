import React from 'react';
import { Search, Users, ShieldHalf } from 'lucide-react';

const LeadsTable = ({ 
  leads, 
  theme, 
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
  teamLeaders
}) => {
  return (
    <div className="bg-transparent overflow-hidden h-100 d-flex flex-column">
      <div className="card-header bg-transparent p-4 border-0 d-flex flex-column flex-xl-row align-items-xl-center justify-content-between gap-4">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-lg border border-primary border-opacity-10">
            <Users size={20} />
          </div>
          <div>
            <h5 className="fw-black mb-0 text-white" style={{ letterSpacing: '-0.01em' }}>Leads Pipeline</h5>
            <small className="text-muted fw-bold opacity-50 text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Live Inventory</small>
          </div>
        </div>
        
        <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center">
          <div className="position-relative" style={{ minWidth: '260px' }}>
            <Search className="position-absolute translate-middle-y text-muted opacity-50" size={14} style={{ top: '50%', left: '14px' }} />
            <input 
              type="text" 
              className="glass-input ps-5 pe-3 py-2 text-white w-100 shadow-sm" 
              placeholder="Search leads..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
          <div className="form-check form-switch mb-0 d-flex align-items-center gap-2 ps-0">
            <div className="position-relative">
                <input 
                className="form-check-input ms-0" 
                type="checkbox" 
                role="switch"
                id="unassignedSw" 
                checked={filterUnassigned}
                onChange={(e) => setFilterUnassigned(e.target.checked)}
                style={{ width: '36px', height: '18px', cursor: 'pointer' }}
                />
            </div>
            <label className="text-muted fw-bold small text-uppercase tracking-wider cursor-pointer ms-1" htmlFor="unassignedSw" style={{ fontSize: '10px' }}>Unassigned Only</label>
          </div>
        </div>
      </div>

      {selectedLeadIds.length > 0 && (
        <div className="px-4 py-3 bg-primary bg-opacity-5 border-top border-bottom border-white border-opacity-5 animate-fade-in">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2">
                <div className="p-1 bg-primary rounded-circle"></div>
                <span className="text-white fw-bold small">
                {selectedLeadIds.length} leads selected for bulk action
                </span>
            </div>
            <div className="d-flex gap-2">
              <select 
                className="glass-input py-1.5 fw-bold border-0" 
                style={{ width: '180px', fontSize: '12px' }}
                value={bulkAssignTlId}
                onChange={(e) => setBulkAssignTlId(e.target.value)}
              >
                <option value="">Bulk Assign To...</option>
                {teamLeaders
                  .filter(tl => tl.role === 'TEAM_LEADER')
                  .map(tl => <option key={tl.id} value={tl.id}>{tl.name}</option>)}
              </select>
              <button 
                onClick={() => handleBulkAssign(bulkAssignTlId, teamLeaders)}
                className="btn-premium py-1.5 px-4 small fw-bold text-uppercase"
                style={{ fontSize: '10px' }}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive flex-grow-1 custom-scroll">
        <table className="table table-hover align-middle mb-0 table-dark">
          <thead>
            <tr className="text-uppercase fw-bold text-muted border-bottom border-white border-opacity-5" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
              <th className="ps-4 py-3" style={{ width: '60px' }}>
                <div className="form-check custom-checkbox">
                  <input 
                    className="form-check-input shadow-none" 
                    type="checkbox" 
                    checked={selectedLeadIds.length === leads.length && leads.length > 0}
                    onChange={toggleSelectAll}
                  />
                </div>
              </th>
              <th className="py-3">Staff Identity</th>
              <th className="py-3">Pipeline Status</th>
              <th className="py-3">Lead Owner</th>
              <th className="pe-4 py-3 text-end">Management</th>
            </tr>
          </thead>
          <tbody className="border-0">
            {leads.map(lead => (
              <tr key={lead.id} className={`${selectedLeadIds.includes(lead.id) ? 'bg-primary bg-opacity-5' : ''} border-bottom border-white border-opacity-5 transition-all`}>
                <td className="ps-4">
                  {!lead.assignedToId && (
                    <div className="form-check custom-checkbox">
                      <input 
                        className="form-check-input shadow-none" 
                        type="checkbox" 
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleSelection(lead.id)}
                      />
                    </div>
                  )}
                </td>
                <td className="py-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 bg-surface rounded shadow-sm border border-white border-opacity-5 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                        <ShieldHalf size={16} className="text-muted" />
                    </div>
                    <div>
                        <p className="fw-bold mb-0 text-white" style={{ fontSize: '14px' }}>{lead.name}</p>
                        <small className="text-muted fw-medium font-monospace" style={{ fontSize: '11px' }}>{lead.mobile}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge rounded-sm text-uppercase px-2 py-1 ${
                    lead.status === 'PAID' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-20' :
                    lead.status === 'NEW' ? 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20' :
                    'bg-white bg-opacity-5 text-muted border border-white border-opacity-10'
                  }`} style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.02em' }}>
                    {lead.status}
                  </span>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    {lead.assignedToId && <div className="p-1 bg-success rounded-circle" style={{ width: '6px', height: '6px' }}></div>}
                    <span className={`small ${lead.assignedToId ? 'fw-bold text-white' : 'text-muted fst-italic opacity-50'}`}>
                        {lead.assignedToName || 'Awaiting Assignment'}
                    </span>
                  </div>
                </td>
                <td className="pe-4 text-end">
                  <select 
                    className="glass-input py-1 border-0 text-primary fw-bold text-end" 
                    style={{ width: '130px', fontSize: '12px', background: 'transparent' }}
                    onChange={(e) => handleAssignLead(lead.id, e.target.value, teamLeaders)}
                    value={lead.assignedToId || ''}
                  >
                    <option value="">Move To...</option>
                    {teamLeaders
                      .filter(tl => tl.role === 'TEAM_LEADER')
                      .map(tl => <option key={tl.id} value={tl.id}>{tl.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <div className="p-5 text-center my-4 animate-fade-in">
            <Users size={48} className="text-muted opacity-20 mb-3" />
            <p className="text-muted fw-bold mb-0">No operational records found</p>
            <small className="text-muted opacity-50">Try adjusting your filters or search term</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsTable;
