import React from 'react';
import { ShieldHalf, X } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-toastify';

const UserEditModal = ({ 
  isOpen, 
  onClose, 
  user, 
  setUser, 
  onSubmit, 
  roles = [], 
  permissions = [],
  teamLeaders = [],
  shifts = []
}) => {
  const { isDarkMode } = useTheme();
  
  if (!isOpen || !user) return null;

  console.log("MODAL_STATE_PROBE:", user);

  // Defensive safety guards to prevent crashes if props are not arrays
  const safeShifts = Array.isArray(shifts) ? shifts : [];
  const safeRoles = Array.isArray(roles) ? roles : [];
  const safePermissions = Array.isArray(permissions) ? permissions : [];
  const safeTeamLeaders = Array.isArray(teamLeaders) ? teamLeaders : [];

  const selectedShift = safeShifts.find(s => s?.id === user.shiftId);

  return (
    <div 
      className="modal show d-block animate-fade-in" 
      tabIndex="-1" 
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.85)', 
        backdropFilter: 'blur(12px)', 
        zIndex: 1100005,
        pointerEvents: 'all'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ pointerEvents: 'all' }}>
        <div className="premium-card shadow-lg border-0 rounded-4 bg-card" style={{ width: '100%', maxWidth: '580px', position: 'relative', zIndex: 1100010 }}>
          <div className="modal-header p-4 border-0 d-flex align-items-center justify-content-between border-bottom border-white border-opacity-5">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle shadow-glow">
                <ShieldHalf size={20} />
              </div>
              <div>
                <h6 className="fw-black text-main mb-0 text-uppercase tracking-widest small">Edit Staff Profile</h6>
                <small className="text-muted fw-bold opacity-50" style={{ fontSize: '8px' }}>RECONFIGURE IDENTITY NODE</small>
              </div>
            </div>
            <button type="button" className="btn btn-link p-0 text-muted shadow-none border-0" onClick={onClose}><X size={20}/></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body p-4 custom-scroll" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div className="row g-4">
                {/* Identity Cluster */}
                <div className="col-12 col-md-8">
                  <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>Full Name</label>
                  <input 
                    type="text" 
                    className="form-control border border-white border-opacity-10 shadow-none bg-surface text-main fw-bold py-2.5 rounded-3" 
                    value={user.name || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUser(prev => ({...prev, name: val}));
                    }}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>Role</label>
                  <select 
                    className="form-select border border-white border-opacity-10 shadow-none fw-bold bg-surface text-main py-2.5 rounded-3"
                    value={user.role || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUser(prev => ({...prev, role: val}));
                    }}
                    required
                  >
                    {safeRoles.map(role => (
                      <option key={role.id} value={role.name}>{role.name.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Contact & Hierarchy */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control border border-white border-opacity-10 shadow-none bg-surface text-main fw-bold py-2.5 rounded-3" 
                    value={user.mobile || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUser(prev => ({...prev, mobile: val}));
                    }}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>Reports To</label>
                  <select 
                    className="form-select border border-white border-opacity-10 shadow-none fw-bold bg-surface text-main py-2.5 rounded-3"
                    value={user.supervisorId || ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : null;
                      setUser(prev => ({...prev, supervisorId: val}));
                    }}
                  >
                    <option value="">Independent Operator</option>
                    {safeTeamLeaders.filter(tl => (tl.role === 'TEAM_LEADER' || tl.role === 'MANAGER') && tl.id !== user.id).map(tl => (
                      <option key={tl.id} value={tl.id}>{tl.name} ({tl.role})</option>
                    ))}
                  </select>
                </div>

                {/* Shift Configuration Cluster */}
                <div className="col-12">
                   <div className="p-3 rounded-4 border border-primary border-opacity-10 bg-primary bg-opacity-5">
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label small fw-black text-uppercase text-primary mb-2 tracking-widest" style={{ fontSize: '10px' }}>Attendance Shift</label>
                          <select 
                            className="form-select border border-primary border-opacity-10 shadow-none fw-bold bg-surface text-main py-2 rounded-3"
                            value={user.shiftId || ''}
                            onChange={(e) => {
                              const val = e.target.value ? parseInt(e.target.value) : null;
                              setUser(prev => ({...prev, shiftId: val}));
                            }}
                          >
                            {safeShifts.length === 0 ? (
                              <option value="">Syncing shifts...</option>
                            ) : (
                              <>
                                <option value="">Select Shift Node...</option>
                                {safeShifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </>
                            )}
                          </select>
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>From</label>
                          <div className="form-control border-0 bg-surface text-main py-2 rounded-3 fw-black small text-center opacity-75">
                             {selectedShift ? selectedShift.startTime.substring(0, 5) : '--:--'}
                          </div>
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>To</label>
                          <div className="form-control border-0 bg-surface text-main py-2 rounded-3 fw-black small text-center opacity-75">
                             {selectedShift ? selectedShift.endTime.substring(0, 5) : '--:--'}
                          </div>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Privileges */}
                <div className="col-12 mt-2">
                  <label className="form-label small fw-black text-uppercase text-muted d-block mb-3 tracking-widest" style={{ fontSize: '10px' }}>Permission Set Override</label>
                  <div className="bg-surface p-3 rounded-4 shadow-inner overflow-auto text-main border border-white border-opacity-5" style={{ maxHeight: '120px' }}>
                    <div className="d-flex flex-column gap-2">
                      {safePermissions.map(perm => (
                        <div key={perm} className="form-check custom-check">
                          <input 
                             className="form-check-input shadow-none" 
                             style={{ cursor: 'pointer' }}
                             type="checkbox" 
                             id={`edit-perm-${perm}`}
                             checked={(user.permissions || []).includes(perm)}
                             onChange={() => {
                               setUser(prev => {
                                 const currentPerms = prev.permissions || [];
                                 const perms = currentPerms.includes(perm)
                                   ? currentPerms.filter(p => p !== perm)
                                   : [...currentPerms, perm];
                                 return {...prev, permissions: perms};
                               });
                               toast.info(`Privilege [${perm}] toggled`, { autoClose: 800 });
                             }}
                          />
                          <label className="form-check-label small fw-bold opacity-75 ms-2 cursor-pointer" htmlFor={`edit-perm-${perm}`}>
                             {perm.replace(/_/g, ' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 p-4 pt-2 d-flex gap-2">
              <button type="button" className="btn btn-link text-muted fw-black text-uppercase text-decoration-none small tracking-widest me-auto p-0" onClick={onClose}>Abort</button>
              <button type="submit" className="btn btn-primary fw-black text-uppercase px-5 shadow-glow rounded-pill py-2.5">Sync Profile</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
