import React, { useState } from 'react';
import { UserPlus, Edit, Trash2, ChevronDown, ChevronRight, BarChart2, Users } from 'lucide-react';

const TeamManagement = ({ 
  teamLeaders, 
  roles, 
  permissions, 
  theme, 
  handleCreateUser, 
  handleDeleteUser, 
  handleEditUser,
  handleAssignSupervisor,
  setSelectedPerfUserId,
  setActiveTab
}) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    mobile: '', 
    password: '', 
    role: '', 
    permissions: [],
    supervisorId: '' 
  });
  const [expandedTlId, setExpandedTlId] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault();
    handleCreateUser(formData);
    setFormData({ name: '', email: '', mobile: '', password: '', role: '', permissions: [], supervisorId: '' });
  };

  return (
    <div className="animate-fade-in row g-4">
      <div className="col-12 col-xl-4">
        <div className="premium-card overflow-hidden mb-4 h-100">
          <div className="card-header bg-transparent p-4 border-0 d-flex align-items-center gap-3 border-bottom border-white border-opacity-5">
             <div className="p-2 bg-primary bg-opacity-10 text-primary rounded shadow-sm">
               <UserPlus size={20} />
             </div>
             <h5 className="card-title fw-bold mb-0 text-uppercase tracking-wider text-white">Onboard Staff</h5>
          </div>
          <form onSubmit={onSubmit} autoComplete="off" className="p-4">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label small fw-bold text-uppercase text-muted mb-1">Full Identity</label>
                <input 
                  className="form-control border-0 bg-dark text-white shadow-none fw-bold" 
                  placeholder="Rahul Sharma" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-bold text-uppercase text-muted mb-1">Email Terminal</label>
                <input 
                  className="form-control border-0 bg-dark text-white shadow-none fw-bold" 
                  placeholder="rahul@nexus.com" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-uppercase text-muted mb-1">Mobile Contact</label>
                <input 
                  className="form-control border-0 bg-dark text-white shadow-none fw-bold" 
                  placeholder="+91 00000 00000" 
                  value={formData.mobile} 
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})} 
                  required 
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-uppercase text-muted mb-1">Access Cipher</label>
                <input 
                  type="password" 
                  className="form-control border-0 bg-dark text-white shadow-none fw-bold" 
                  placeholder="Secure string..." 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  required 
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-bold text-uppercase text-muted mb-1">Assigned Designation</label>
                <select 
                  className="form-select border-0 bg-dark text-white shadow-none fw-bold" 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                >
                  <option value="" className="bg-dark">Designation...</option>
                  {roles.map(r => <option key={r.id} value={r.name} className="bg-dark">{r.name.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              {(formData.role === 'ASSOCIATE' || formData.role === 'USER' || formData.role === 'TEAM_LEADER' || formData.role === 'ASSOCIATE_TEAM_LEAD') && (
                <div className="col-12 animate-fade-in">
                  <label className="form-label small fw-bold text-uppercase text-primary mb-1">Supervisor Node (TL/Manager)</label>
                  <select 
                    className="form-select border-primary border-opacity-25 bg-dark text-white fw-bold shadow-none" 
                    value={formData.supervisorId} 
                    onChange={(e) => setFormData({...formData, supervisorId: e.target.value})}
                  >
                    <option value="" className="bg-dark text-muted">Direct Report (Select Supervisor)...</option>
                    {/* Filter to only allow valid supervisors (Managers/TLs) */}
                    {teamLeaders
                      .filter(u => u.role === 'TEAM_LEADER' || u.role === 'MANAGER')
                      .map(tl => (
                        <option key={tl.id} value={tl.id} className="bg-dark text-white">
                          {tl.name} ({tl.role.replace('_', ' ')})
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}
              
              <div className="col-12">
                <label className="form-label small fw-bold text-uppercase text-muted d-block mb-1">Privilege Stack</label>
                <div className="p-3 rounded-4 border-0 bg-dark text-white overflow-auto shadow-inner" style={{ maxHeight: '120px' }}>
                  <div className="row g-2">
                    {permissions.map(perm => (
                      <div key={perm} className="col-12">
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id={`perm-${perm}`}
                            checked={formData.permissions.includes(perm)}
                            onChange={() => {
                              const perms = formData.permissions.includes(perm)
                                ? formData.permissions.filter(p => p !== perm)
                                : [...formData.permissions, perm];
                              setFormData({...formData, permissions: perms});
                            }}
                          />
                          <label className="form-check-label small" htmlFor={`perm-${perm}`}>
                             {perm.replace(/_/g, ' ')}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-12 mt-3">
                <button type="submit" className="btn btn-primary w-100 fw-bold text-uppercase shadow-sm rounded-pill py-3">Initialize Account</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="col-12 col-xl-8">
        <div className="premium-card overflow-hidden h-100">
           <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5">
              <h5 className="fw-bold text-uppercase mb-0 d-flex align-items-center gap-2 text-white">
                 <Users size={20} className="text-primary glow-icon" />
                 Active Personnel Hierarchy
              </h5>
           </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr className="text-uppercase text-muted small fw-bold">
                  <th className="ps-4" style={{ width: '40px' }}></th>
                  <th>Member Identity</th>
                  <th className="text-center">Role</th>
                  <th className="text-center">Reports To</th>
                  <th className="pe-4 text-end">Management</th>
                </tr>
              </thead>
              <tbody>
                {teamLeaders.filter(u => u.role === 'TEAM_LEADER' || u.role === 'MANAGER').map(tl => (
                  <React.Fragment key={tl.id}>
                    <tr className="bg-white bg-opacity-5 border-white border-opacity-5">
                       <td className="ps-4">
                         <button 
                           className="btn btn-link link-primary p-0 shadow-none border-0" 
                           onClick={() => setExpandedTlId(expandedTlId === tl.id ? null : tl.id)}
                         >
                           {expandedTlId === tl.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                         </button>
                       </td>
                       <td>
                         <div className="d-flex align-items-center gap-2">
                           <span className="fw-bold text-primary">{tl.name}</span>
                           <BarChart2 
                             size={14} 
                             className="text-primary cursor-pointer hover-opacity-75" 
                             onClick={() => { setSelectedPerfUserId(tl.id); setActiveTab('payments'); }} 
                           />
                         </div>
                         <small className="text-muted small">{tl.email}</small>
                       </td>
                       <td className="text-center">
                         <span className={`badge rounded-pill ${tl.role === 'MANAGER' ? 'bg-warning text-dark' : 'bg-info text-dark'} fw-bold px-3`} style={{ fontSize: '9px' }}>{tl.role.replace(/_/g, ' ')}</span>
                       </td>
                       <td className="text-center text-muted small fst-italic">
                          {tl.role === 'MANAGER' ? 'Organization Root' : 'Direct Node'}
                       </td>
                       <td className="pe-4 text-end">
                         <div className="d-flex align-items-center justify-content-end gap-1">
                            <button onClick={() => handleEditUser(tl)} className="btn btn-sm btn-link text-primary"><Edit size={14} /></button>
                            <button onClick={() => handleDeleteUser(tl.id)} className="btn btn-sm btn-link text-danger"><Trash2 size={14} /></button>
                         </div>
                       </td>
                     </tr>
                     {expandedTlId === tl.id && teamLeaders.filter(u => u.supervisorId === tl.id).map(assoc => (
                       <tr key={assoc.id} className="animate-fade-in border-start border-primary border-4 bg-dark bg-opacity-25 border-white border-opacity-5">
                         <td className="ps-4 text-center text-muted small">└</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="small fw-bold">{assoc.name}</span>
                            <BarChart2 
                              size={12} 
                              className="text-info cursor-pointer hover-opacity-75" 
                              onClick={() => { setSelectedPerfUserId(assoc.id); setActiveTab('payments'); }} 
                            />
                          </div>
                          <small className="text-muted d-block small" style={{ fontSize: '10px' }}>{assoc.email}</small>
                        </td>
                        <td className="text-center">
                          <span className="badge rounded-pill bg-secondary text-white" style={{ fontSize: '9px' }}>{assoc.role.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="text-center">
                          <select 
                            className="form-select form-select-sm border-0 bg-transparent text-primary fw-bold" 
                            style={{ fontSize: '11px' }}
                            value={assoc.supervisorId || ''}
                            onChange={(e) => handleAssignSupervisor(assoc.id, e.target.value)}
                          >
                            <option value="">Move to...</option>
                            {teamLeaders.filter(u => (u.role === 'TEAM_LEADER' || u.role === 'MANAGER') && u.id !== tl.id).map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.role.split('_')[0]})</option>
                            ))}
                          </select>
                        </td>
                        <td className="pe-4 text-end">
                           <div className="d-flex align-items-center justify-content-end gap-1">
                              <button onClick={() => handleEditUser(assoc)} className="btn btn-sm btn-link text-primary"><Edit size={12} /></button>
                              <button onClick={() => handleDeleteUser(assoc.id)} className="btn btn-sm btn-link text-danger"><Trash2 size={12} /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}

                {/* Unassigned members */}
                {teamLeaders.filter(u => u.role !== 'TEAM_LEADER' && u.role !== 'MANAGER' && !u.supervisorId && u.role !== 'ADMIN').map(assoc => (
                  <tr key={assoc.id} className="animate-fade-in border-start border-warning border-4 bg-white bg-opacity-5">
                    <td className="ps-4"></td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold">{assoc.name}</span>
                        <BarChart2 
                          size={14} 
                          className="text-info cursor-pointer hover-opacity-75" 
                          onClick={() => { setSelectedPerfUserId(assoc.id); setActiveTab('payments'); }} 
                        />
                      </div>
                      <small className="text-muted d-block small" style={{ fontSize: '10px' }}>{assoc.email}</small>
                    </td>
                    <td className="text-center">
                      <span className="badge rounded-pill bg-warning text-dark fw-bold px-3" style={{ fontSize: '9px' }}>UNASSIGNED</span>
                    </td>
                    <td className="text-center">
                      <select 
                        className="form-select form-select-sm border-0 bg-transparent text-primary fw-bold" 
                        style={{ fontSize: '11px' }}
                        value={assoc.supervisorId || ''}
                        onChange={(e) => handleAssignSupervisor(assoc.id, e.target.value)}
                      >
                        <option value="">Link to Node...</option>
                        {teamLeaders.filter(u => u.role === 'TEAM_LEADER' || u.role === 'MANAGER').map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.role.split('_')[0]})</option>
                        ))}
                      </select>
                    </td>
                    <td className="pe-4 text-end">
                       <div className="d-flex align-items-center justify-content-end gap-1">
                          <button onClick={() => handleEditUser(assoc)} className="btn btn-sm btn-link text-primary"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteUser(assoc.id)} className="btn btn-sm btn-link text-danger"><Trash2 size={14} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
