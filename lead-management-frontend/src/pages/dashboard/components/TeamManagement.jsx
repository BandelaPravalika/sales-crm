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
  const [expandedIds, setExpandedIds] = useState([]);

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

  const toggleExpand = (id) => {
    setExpandedIds(prev => 
      prev.some(eid => isSameId(eid, id)) 
        ? prev.filter(eid => !isSameId(eid, id)) 
        : [...prev, id]
    );
  };

  const UserRow = ({ user, level = 0, children }) => {
    const isExpanded = expandedIds.some(eid => isSameId(eid, user.id));
    const hasChildren = (user.role === 'MANAGER' || user.role === 'TEAM_LEADER');
    
    return (
      <React.Fragment>
        <tr className={`border-bottom border-white border-opacity-5 transition-smooth hover-bg-surface ${level > 0 ? 'bg-surface bg-opacity-10' : ''}`}>
          <td className="ps-4" style={{ paddingLeft: `${24 + (level * 20)}px` }}>
            {hasChildren && (
              <button 
                className="btn btn-link link-primary p-0 shadow-none border-0" 
                onClick={() => toggleExpand(user.id)}
              >
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            )}
            {!hasChildren && level > 0 && <span className="text-muted opacity-25">└</span>}
          </td>
          <td>
            <div className="d-flex align-items-center gap-2">
              <span className={`fw-black ${level === 0 ? 'text-primary' : 'text-main'}`} style={{ fontSize: level === 0 ? '14px' : '13px' }}>
                {user.name}
              </span>
              <BarChart2 
                size={14} 
                className="text-primary cursor-pointer hover-opacity-75" 
                onClick={() => { setSelectedPerfUserId(user.id); setActiveTab('payments'); }} 
              />
            </div>
            <small className="text-muted fw-bold opacity-50" style={{ fontSize: '9px' }}>{user.email}</small>
          </td>
          <td className="text-center">
            <span className={`ui-badge small py-1 px-3 rounded-pill fw-black ${
              user.role === 'MANAGER' ? 'bg-warning bg-opacity-10 text-warning' : 
              user.role === 'TEAM_LEADER' ? 'bg-primary bg-opacity-10 text-primary' : 
              'bg-surface text-muted'
            }`} style={{ fontSize: '9px' }}>
              {user.role.replace(/_/g, ' ')}
            </span>
          </td>
          <td className="text-center">
             {user.role === 'MANAGER' ? (
               <span className="text-muted small fw-bold opacity-50 tracking-widest" style={{ fontSize: '8px' }}>ORGANIZATION ROOT</span>
             ) : (
                <select 
                  className="form-select form-select-sm border-0 bg-transparent text-primary fw-black tracking-widest mx-auto" 
                  style={{ fontSize: '9px', width: 'fit-content' }}
                  value={user.supervisorId || ''}
                  onChange={(e) => handleAssignSupervisor(user.id, e.target.value)}
                >
                  <option value="">{user.role === 'TEAM_LEADER' ? 'Link to Manager...' : 'Link to TL...'}</option>
                  {teamLeaders.filter(u => {
                    if (user.role === 'TEAM_LEADER') return u.role === 'MANAGER';
                    if (user.role === 'ASSOCIATE') return u.role === 'TEAM_LEADER' || u.role === 'MANAGER';
                    return false;
                  }).map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
             )}
          </td>
          <td className="pe-4 text-end">
            <div className="d-flex align-items-center justify-content-end gap-1">
               <button onClick={() => handleEditUser(user)} className="btn btn-sm btn-link text-primary shadow-none"><Edit size={14} /></button>
               <button onClick={() => handleDeleteUser(user.id)} className="btn btn-sm btn-link text-danger shadow-none"><Trash2 size={14} /></button>
            </div>
          </td>
        </tr>
        {isExpanded && children}
      </React.Fragment>
    );
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
                  className="ui-input py-3 w-100 fw-black text-uppercase tracking-widest cursor-pointer hover-bg-surface-light transition-all" 
                  style={{ fontSize: '11px', appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, gray 50%), linear-gradient(135deg, gray 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 5px), calc(100% - 15px) calc(1em + 5px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                >
                  <option value="" className="text-dark bg-white">Select Target Role...</option>
                  {roles.map(r => <option key={r.id} value={r.name} className="text-dark bg-white">{r.name.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              {(formData.role === 'ASSOCIATE' || formData.role === 'TEAM_LEADER') && (
                <div className="col-12 animate-fade-in">
                  <label className="form-label small fw-black text-uppercase text-primary mb-2 tracking-widest" style={{ fontSize: '10px' }}>Reports To</label>
                  <select 
                    className="ui-input py-3 w-100 border-primary border-opacity-30 fw-black text-uppercase tracking-widest cursor-pointer" 
                    style={{ fontSize: '10px', appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, #0d6efd 50%), linear-gradient(135deg, #0d6efd 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 5px), calc(100% - 15px) calc(1em + 5px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                    value={formData.supervisorId} 
                    onChange={(e) => setFormData({...formData, supervisorId: e.target.value})}
                    required
                  >
                    <option value="" className="text-dark bg-white">Select Supervisor...</option>
                    {teamLeaders
                      .filter(u => {
                        if (formData.role === 'ASSOCIATE') return u.role === 'TEAM_LEADER' || u.role === 'MANAGER';
                        if (formData.role === 'TEAM_LEADER') return u.role === 'MANAGER';
                        return false;
                      })
                      .map(sup => (
                        <option key={sup.id} value={sup.id} className="text-dark bg-white">
                          {sup.name} ({sup.role})
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
                {teamLeaders.filter(u => u.role === 'MANAGER').map(mgr => {
                  const tlsUnderMgr = teamLeaders.filter(u => u.role === 'TEAM_LEADER' && isSameId(u.supervisorId, mgr.id));
                  const assocsUnderMgr = teamLeaders.filter(u => u.role === 'ASSOCIATE' && isSameId(u.supervisorId, mgr.id));
                  const hasAnything = tlsUnderMgr.length > 0 || assocsUnderMgr.length > 0;

                  return (
                    <UserRow key={mgr.id} user={mgr}>
                      {hasAnything ? (
                        <React.Fragment>
                          {/* 2. Team Leaders under Managers */}
                          {tlsUnderMgr.map(tl => {
                             const assocs = teamLeaders.filter(u => u.role === 'ASSOCIATE' && isSameId(u.supervisorId, tl.id));
                             return (
                               <UserRow key={tl.id} user={tl} level={1}>
                                 {assocs.length > 0 ? (
                                   assocs.map(assoc => <UserRow key={assoc.id} user={assoc} level={2} />)
                                 ) : (
                                   <tr className="bg-surface bg-opacity-10 opacity-75"><td colSpan="5" className="py-2 ps-5 small text-muted italic" style={{paddingLeft: '64px'}}>No associates assigned</td></tr>
                                 )}
                               </UserRow>
                             );
                          })}
                          {/* 4. Associates directly under Managers */}
                          {assocsUnderMgr.map(assoc => (
                            <UserRow key={assoc.id} user={assoc} level={1} />
                          ))}
                        </React.Fragment>
                      ) : (
                        <tr className="bg-surface bg-opacity-10 opacity-75"><td colSpan="5" className="py-2 ps-5 small text-muted italic" style={{paddingLeft: '44px'}}>No operational nodes assigned</td></tr>
                      )}
                    </UserRow>
                  );
                })}

                {/* 5. Orphan Team Leaders (Top Level) */}
                {teamLeaders.filter(u => u.role === 'TEAM_LEADER' && !u.supervisorId).map(tl => {
                  const assocs = teamLeaders.filter(u => u.role === 'ASSOCIATE' && isSameId(u.supervisorId, tl.id));
                  return (
                    <UserRow key={tl.id} user={tl}>
                      {assocs.length > 0 ? (
                        assocs.map(assoc => <UserRow key={assoc.id} user={assoc} level={1} />)
                      ) : (
                        <tr className="bg-surface bg-opacity-10 opacity-75"><td colSpan="5" className="py-2 ps-4 small text-muted italic" style={{paddingLeft: '44px'}}>No associates assigned</td></tr>
                      )}
                    </UserRow>
                  );
                })}

                {/* 6. Orphan Associates (Top Level) */}
                {teamLeaders.filter(u => u.role === 'ASSOCIATE' && !u.supervisorId).map(assoc => (
                  <UserRow key={assoc.id} user={assoc} />
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
