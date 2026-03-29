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
    <div className="bg-transparent overflow-hidden">
      <div className="card-header bg-transparent p-4 border-0 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 bg-primary bg-opacity-10 text-primary rounded">
            <Users size={20} />
          </div>
          <h5 className="card-title fw-bold mb-0">Leads Pipeline</h5>
        </div>
        
        <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center">
          <div className="input-group input-group-sm" style={{ maxWidth: '300px' }}>
            <span className="input-group-text border-0 bg-secondary bg-opacity-10"><Search size={14} /></span>
            <input 
              type="text" 
              className="form-control border-0 bg-secondary bg-opacity-10 shadow-none" 
              placeholder="Search leads..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-check form-switch mb-0">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="unassignedSw" 
              checked={filterUnassigned}
              onChange={(e) => setFilterUnassigned(e.target.checked)}
            />
            <label className="form-check-label small fw-bold text-uppercase" htmlFor="unassignedSw">Unassigned</label>
          </div>
        </div>
      </div>

      {selectedLeadIds.length > 0 && (
        <div className="p-3 bg-primary bg-opacity-10 border-top border-bottom animate-fade-in">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <span className="badge bg-primary px-3 py-2 rounded-pill fw-bold">
              {selectedLeadIds.length} Selected
            </span>
            <div className="d-flex gap-2">
              <select 
                className="form-select form-select-sm fw-bold border-0 shadow-sm" 
                style={{ width: '180px' }}
                value={bulkAssignTlId}
                onChange={(e) => setBulkAssignTlId(e.target.value)}
              >
                <option value="">Bulk Assign To...</option>
                {teamLeaders.map(tl => <option key={tl.id} value={tl.id}>{tl.name}</option>)}
              </select>
              <button 
                onClick={() => handleBulkAssign(bulkAssignTlId, teamLeaders)}
                className="btn btn-primary btn-sm fw-bold text-uppercase px-4 shadow-sm"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0" style={{ minWidth: '800px' }}>
          <thead className={theme === 'dark' ? 'table-dark' : 'table-light'}>
            <tr className="text-uppercase small fw-bold text-muted">
              <th className="ps-4" style={{ width: '40px' }}>
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={selectedLeadIds.length === leads.length && leads.length > 0}
                    onChange={toggleSelectAll}
                  />
                </div>
              </th>
              <th>Identity</th>
              <th>Status</th>
              <th>Owner</th>
              <th className="pe-4 text-end">Transfer</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className={selectedLeadIds.includes(lead.id) ? 'table-primary bg-opacity-10' : ''}>
                <td className="ps-4">
                  {!lead.assignedToId && (
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleSelection(lead.id)}
                      />
                    </div>
                  )}
                </td>
                <td>
                  <p className="fw-bold mb-0">{lead.name}</p>
                  <small className="text-muted small">{lead.mobile}</small>
                </td>
                <td>
                  <span className={`badge rounded-pill text-uppercase px-2 py-1 ${
                    lead.status === 'PAID' ? 'bg-success bg-opacity-75 text-white' :
                    lead.status === 'NEW' ? 'bg-primary bg-opacity-75 text-white' :
                    'bg-secondary bg-opacity-75 text-white'
                  }`} style={{ fontSize: '9px', fontWeight: '800' }}>
                    {lead.status}
                  </span>
                </td>
                <td>
                  <span className={`small ${lead.assignedToId ? 'fw-bold' : 'text-muted fst-italic'}`}>
                    {lead.assignedToName || 'Awaiting Assignment'}
                  </span>
                </td>
                <td className="pe-4 text-end">
                  <select 
                    className="form-select form-select-sm border-0 bg-transparent text-primary fw-bold" 
                    style={{ width: '130px' }}
                    onChange={(e) => handleAssignLead(lead.id, e.target.value, teamLeaders)}
                    value={lead.assignedToId || ''}
                  >
                    <option value="">Move To...</option>
                    {teamLeaders.map(tl => <option key={tl.id} value={tl.id}>{tl.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <div className="p-5 text-center">
            <p className="text-muted fw-bold">No operational records found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsTable;
