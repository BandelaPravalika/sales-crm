import React, { useState } from 'react';
import { UserPlus, Edit, Trash2, ChevronDown, ChevronRight, BarChart2, Users } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const TeamManagement = ({ 
  teamLeaders, 
  roles, 
  permissions, 
  handleCreateUser, 
  handleDeleteUser, 
  handleEditUser,
  handleAssignSupervisor,
  setSelectedPerfUserId,
  setActiveTab
}) => {
  const { isDarkMode } = useTheme();
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

  // Helper for strict ID comparison (normalizes types)
  const isSameId = (a, b) => {
    if (a === null || a === undefined || b === null || b === undefined) return false;
    return Number(a) === Number(b);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleCreateUser(formData);
    setFormData({ name: '', email: '', mobile: '', password: '', role: '', permissions: [], supervisorId: '' });
  };

  return (
    <div className="animate-fade-in row g-4">
      <div className="col-12 col-xl-4">
        <div className="premium-card overflow-hidden mb-4 h-100 shadow-glow border-0">
          <div className="card-header bg-transparent p-4 border-0 d-flex align-items-center gap-3 border-bottom border-white border-opacity-5">
             <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle shadow-glow">
               <UserPlus size={20} />
             </div>
             <div>
               <h6 className="fw-black mb-0 text-main text-uppercase tracking-widest small">Onboard Staff</h6>
               <small className="text-muted fw-bold opacity-50" style={{ fontSize: '8px' }}>INITIALIZE NEW IDENTITY NODE</small>
             </div>
          </div>
          <form onSubmit={onSubmit} autoComplete="off" className="p-4">
            <div className="row g-4">
              <div className="col-12">
                <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>Full Name</label>
                <input 
                  className="form-control border-0 bg-surface text-main shadow-none fw-bold py-2.5 rounded-3" 
                  placeholder="Rahul Sharma" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>Email Address</label>
                <input 
                  className="form-control border-0 bg-surface text-main shadow-none fw-bold py-2.5 rounded-3" 
                  placeholder="rahul@example.com" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>Phone Number</label>
                <input 
                  className="form-control border-0 bg-surface text-main shadow-none fw-bold py-2.5 rounded-3" 
                  placeholder="+91 00000 00000" 
                  value={formData.mobile} 
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})} 
                  required 
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>Password</label>
                <input 
                  type="password" 
                  className="form-control border-0 bg-surface text-main shadow-none fw-bold py-2.5 rounded-3" 
                  placeholder="Secure string..." 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  required 
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>Role / Designation</label>
                <select 
                  className="form-select border-0 bg-surface text-main shadow-none fw-bold py-2.5 rounded-3" 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                >
                  <option value="" className="text-muted">Select Target Role...</option>
                  {roles.map(r => <option key={r.id} value={r.name}>{r.name.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              {formData.role === 'ASSOCIATE' && (
                <div className="col-12 animate-fade-in">
                  <label className="form-label small fw-black text-uppercase text-primary mb-2 tracking-widest" style={{ fontSize: '10px' }}>Reports To</label>
                  <select 
                    className="form-select border-primary border-opacity-25 bg-surface text-main fw-bold shadow-none py-2.5 rounded-3" 
                    value={formData.supervisorId} 
                    onChange={(e) => setFormData({...formData, supervisorId: e.target.value})}
                    required
                  >
                    <option value="" className="text-muted">Select Direct Node (Team Leader)...</option>
                    {teamLeaders
                      .filter(u => u.role === 'TEAM_LEADER')
                      .map(tl => (
                        <option key={tl.id} value={tl.id}>
                          {tl.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}
              
              <div className="col-12">
                <label className="form-label small fw-black text-uppercase text-muted d-block mb-3 tracking-widest" style={{ fontSize: '10px' }}>Permission Set</label>
                <div className="p-3 rounded-4 border-0 bg-surface text-main overflow-auto shadow-sm" style={{ maxHeight: '150px' }}>
                  <div className="d-flex flex-column gap-2">
                    {permissions.map(perm => (
                      <div key={perm} className="form-check custom-check">
                        <input 
                          className="form-check-input shadow-none" 
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
                        <label className="form-check-label small fw-bold opacity-75" htmlFor={`perm-${perm}`}>
                           {perm.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-12 mt-3">
                <button type="submit" className="btn btn-primary w-100 fw-black text-uppercase shadow-glow rounded-pill py-3">Initialize Account</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="col-12 col-xl-8">
        <div className="premium-card overflow-hidden h-100 border-0 shadow-lg">
           <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5">
              <h6 className="fw-black text-uppercase mb-0 d-flex align-items-center gap-3 text-main tracking-widest">
                 <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle">
                    <Users size={18} />
                 </div>
                 Active Personnel Hierarchy
              </h6>
           </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-surface bg-opacity-50">
                <tr className="text-uppercase text-muted small fw-black tracking-widest" style={{ fontSize: '9px' }}>
                  <th className="ps-4" style={{ width: '40px' }}></th>
                  <th>Member Identity</th>
                  <th className="text-center">Role</th>
                  <th className="text-center">Reports To</th>
                  <th className="pe-4 text-end">Management</th>
                </tr>
              </thead>
              <tbody>
                {/* Managers and Team Leaders form the "Primary Nodes" */}
                {teamLeaders.filter(u => u.role === 'TEAM_LEADER' || u.role === 'MANAGER').map(tl => {
                  const associatesAtThisNode = teamLeaders.filter(u => u.role === 'ASSOCIATE' && isSameId(u.supervisorId, tl.id));
                  
                  return (
                    <React.Fragment key={tl.id}>
                      <tr className="border-bottom border-white border-opacity-5 transition-smooth hover-bg-surface">
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
                             <span className="fw-black text-primary">{tl.name}</span>
                             <BarChart2 
                                size={14} 
                                className="text-primary cursor-pointer hover-opacity-75" 
                                onClick={() => { setSelectedPerfUserId(tl.id); setActiveTab('payments'); }} 
                             />
                           </div>
                           <small className="text-muted fw-bold opacity-50" style={{ fontSize: '9px' }}>{tl.email}</small>
                         </td>
                         <td className="text-center">
                           <span className={`ui-badge small py-1 px-3 rounded-pill fw-black ${tl.role === 'MANAGER' ? 'bg-warning bg-opacity-10 text-warning' : 'bg-primary bg-opacity-10 text-primary'}`} style={{ fontSize: '9px' }}>{tl.role.replace(/_/g, ' ')}</span>
                         </td>
                         <td className="text-center text-muted small fw-bold opacity-50 tracking-widest" style={{ fontSize: '8px' }}>
                            {tl.role === 'MANAGER' ? 'ORGANIZATION ROOT' : 'DIRECT NODE'}
                         </td>
                         <td className="pe-4 text-end">
                           <div className="d-flex align-items-center justify-content-end gap-1">
                              <button onClick={() => handleEditUser(tl)} className="btn btn-sm btn-link text-primary shadow-none"><Edit size={14} /></button>
                              <button onClick={() => handleDeleteUser(tl.id)} className="btn btn-sm btn-link text-danger shadow-none"><Trash2 size={14} /></button>
                           </div>
                         </td>
                       </tr>
                        
                        {expandedTlId === tl.id && (
                          associatesAtThisNode.length > 0 ? (
                            associatesAtThisNode.map(assoc => (
                              <tr key={assoc.id} className="animate-fade-in border-start border-primary border-4 bg-surface bg-opacity-30 border-bottom border-white border-opacity-5">
                                <td className="ps-4 text-center text-muted small">└</td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="small fw-bold text-main">{assoc.name}</span>
                                    <BarChart2 
                                      size={12} 
                                      className="text-info cursor-pointer hover-opacity-75" 
                                      onClick={() => { setSelectedPerfUserId(assoc.id); setActiveTab('payments'); }} 
                                    />
                                  </div>
                                  <small className="text-muted d-block small fw-bold opacity-50" style={{ fontSize: '8px' }}>{assoc.email}</small>
                                </td>
                                <td className="text-center">
                                  <span className="ui-badge bg-surface text-muted small" style={{ fontSize: '9px' }}>{assoc.role.replace(/_/g, ' ')}</span>
                                </td>
                                <td className="text-center">
                                  <select 
                                    className="form-select form-select-sm border-0 bg-transparent text-primary fw-black tracking-widest" 
                                    style={{ fontSize: '9px' }}
                                    value={assoc.supervisorId || ''}
                                    onChange={(e) => handleAssignSupervisor(assoc.id, e.target.value)}
                                  >
                                    <option value="">Move Node...</option>
                                    {teamLeaders
                                      .filter(u => u.role === 'TEAM_LEADER' && !isSameId(u.id, tl.id))
                                      .map(t => (
                                      <option key={t.id} value={t.id}>{t.name} (TL)</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="pe-4 text-end">
                                   <div className="d-flex align-items-center justify-content-end gap-1">
                                      <button onClick={() => handleEditUser(assoc)} className="btn btn-sm btn-link text-primary shadow-none"><Edit size={12} /></button>
                                      <button onClick={() => handleDeleteUser(assoc.id)} className="btn btn-sm btn-link text-danger shadow-none"><Trash2 size={12} /></button>
                                   </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="animate-fade-in bg-surface bg-opacity-10">
                              <td colSpan="5" className="py-3 ps-5">
                                <span className="text-muted small fw-bold opacity-50 text-uppercase tracking-widest" style={{ fontSize: '8px' }}>No operational nodes assigned</span>
                              </td>
                            </tr>
                          )
                        )}
                    </React.Fragment>
                  );
                })}

                {/* Unassigned associates and users */}
                {teamLeaders.filter(u => u.role === 'ASSOCIATE' && !u.supervisorId).map(assoc => (
                  <tr key={assoc.id} className="animate-fade-in border-start border-warning border-4 bg-surface bg-opacity-20 border-bottom border-white border-opacity-5">
                    <td className="ps-4 text-center">
                       <BarChart2 size={16} className="text-warning opacity-50 shadow-glow" />
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-black text-main">{assoc.name}</span>
                        <BarChart2 
                          size={14} 
                          className="text-info cursor-pointer hover-opacity-75" 
                          onClick={() => { setSelectedPerfUserId(assoc.id); setActiveTab('payments'); }} 
                        />
                      </div>
                      <small className="text-muted d-block small fw-bold opacity-50" style={{ fontSize: '9px' }}>{assoc.email}</small>
                    </td>
                    <td className="text-center">
                      <span className="ui-badge bg-warning bg-opacity-10 text-warning px-3 rounded-pill fw-black small" style={{ fontSize: '9px' }}>ORPHAN NODE</span>
                    </td>
                    <td className="text-center">
                      <select 
                        className="form-select form-select-sm border-0 bg-transparent text-primary fw-black tracking-widest" 
                        style={{ fontSize: '9px' }}
                        value={assoc.supervisorId || ''}
                        onChange={(e) => handleAssignSupervisor(assoc.id, e.target.value)}
                      >
                        <option value="">Link to TL...</option>
                        {teamLeaders
                          .filter(u => u.role === 'TEAM_LEADER')
                          .map(t => (
                          <option key={t.id} value={t.id}>{t.name} (TL)</option>
                        ))}
                      </select>
                    </td>
                    <td className="pe-4 text-end">
                       <div className="d-flex align-items-center justify-content-end gap-1">
                          <button onClick={() => handleEditUser(assoc)} className="btn btn-sm btn-link text-primary shadow-none"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteUser(assoc.id)} className="btn btn-sm btn-link text-danger shadow-none"><Trash2 size={14} /></button>
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
;
