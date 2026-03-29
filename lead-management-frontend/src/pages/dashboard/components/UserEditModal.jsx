import React from 'react';
import { ShieldHalf, X } from 'lucide-react';

const UserEditModal = ({ 
  isOpen, 
  onClose, 
  user, 
  setUser, 
  onSubmit, 
  roles, 
  permissions,
  teamLeaders
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="modal show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="modal-header bg-primary text-white p-4 border-0">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded shadow-sm">
                <ShieldHalf size={20} />
              </div>
              <h5 className="modal-title fw-bold mb-0 text-uppercase tracking-wider">Configure Access</h5>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body p-4 bg-light bg-opacity-50">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold text-uppercase text-muted mb-1">Full Identity</label>
                  <input 
                    type="text" 
                    className="form-control border-0 shadow-sm bg-dark text-white fw-bold" 
                    value={user.name}
                    onChange={(e) => setUser({...user, name: e.target.value})}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-uppercase text-muted mb-1">Mobile Contact</label>
                  <input 
                    type="text" 
                    className="form-control border-0 shadow-sm bg-dark text-white fw-bold" 
                    value={user.mobile}
                    onChange={(e) => setUser({...user, mobile: e.target.value})}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-uppercase text-muted mb-1">Assigned Role</label>
                  <select 
                    className="form-select border-0 shadow-sm fw-bold bg-dark text-white"
                    value={user.role}
                    onChange={(e) => setUser({...user, role: e.target.value})}
                    required
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.name} className="bg-dark">{role.name.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small fw-bold text-uppercase text-muted mb-1">Direct Supervisor (Optional)</label>
                  <select 
                    className="form-select border-0 shadow-sm fw-bold bg-dark text-white"
                    value={user.supervisorId || ''}
                    onChange={(e) => setUser({...user, supervisorId: e.target.value ? parseInt(e.target.value) : null})}
                  >
                    <option value="" className="bg-dark">Independent Operator (Manager/Admin)</option>
                    {teamLeaders.filter(tl => tl.role === 'TEAM_LEADER' && tl.id !== user.id).map(tl => (
                      <option key={tl.id} value={tl.id} className="bg-dark">{tl.name} (TL)</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 mt-4">
                  <label className="form-label small fw-bold text-uppercase text-muted d-block mb-2">Access Privileges</label>
                  <div className="bg-dark p-3 rounded-3 shadow-sm overflow-auto text-white" style={{ maxHeight: '180px', backgroundColor: '#1e2024' }}>
                    <div className="row g-2">
                      {permissions.map(perm => (
                        <div key={perm} className="col-12">
                          <div className="form-check">
                            <input 
                               className="form-check-input" 
                               type="checkbox" 
                               id={`edit-perm-${perm}`}
                               checked={user.permissions.includes(perm)}
                               onChange={() => {
                                 const perms = user.permissions.includes(perm)
                                   ? user.permissions.filter(p => p !== perm)
                                   : [...user.permissions, perm];
                                 setUser({...user, permissions: perms});
                               }}
                            />
                            <label className="form-check-label small" htmlFor={`edit-perm-${perm}`}>
                               {perm.replace(/_/g, ' ')}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer bg-white border-0 p-4 pt-0">
              <button type="button" className="btn btn-light fw-bold text-uppercase px-4" onClick={onClose}>Abort</button>
              <button type="submit" className="btn btn-primary fw-bold text-uppercase px-4 shadow-sm rounded-pill">Synchronize Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
