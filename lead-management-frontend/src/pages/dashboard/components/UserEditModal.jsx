import React from 'react';
import { ShieldHalf, X, ShieldCheck, Key, RefreshCw, Send } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-toastify';
import adminService from '../../../services/adminService';

const UserEditModal = ({ 
  isOpen, 
  onClose, 
  user, 
  setUser, 
  onSubmit, 
  roles = [], 
  permissions = [],
  teamLeaders = [],
  shifts = [],
  offices = []
}) => {
  const { isDarkMode } = useTheme();
  const [showOtpPanel, setShowOtpPanel] = React.useState(false);
  const [resetData, setResetData] = React.useState({ otp: '', newPassword: '', serverOtp: '' });
  const [isGenerating, setIsGenerating] = React.useState(false);

  if (!isOpen || !user) return null;

  // Defensive safety guards to prevent crashes if props are not arrays
  const safeShifts = Array.isArray(shifts) ? shifts : [];
  const safeRoles = Array.isArray(roles) ? roles : [];
  const safePermissions = Array.isArray(permissions) ? permissions : [];
  const safeTeamLeaders = Array.isArray(teamLeaders) ? teamLeaders : [];
  const safeOffices = Array.isArray(offices) ? offices : [];

  const selectedShift = safeShifts.find(s => s?.id === user.shiftId);

  const handleGenerateOtp = async () => {
    setIsGenerating(true);
    try {
      const res = await adminService.generateResetOtp(user.id);
      setResetData(prev => ({ ...prev, serverOtp: res.data.otp }));
      setShowOtpPanel(true);
      toast.success("Security OTP Generated! Share this with the user.");
    } catch (err) {
      toast.error("Failed to initiate security handshake.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!resetData.otp || !resetData.newPassword) {
      toast.warning("Complete security fields first.");
      return;
    }
    try {
      await adminService.verifyResetOtp(user.id, resetData.otp, resetData.newPassword);
      toast.success("User Access Key Synchronized!");
      setShowOtpPanel(false);
      setResetData({ otp: '', newPassword: '', serverOtp: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid Security Token.");
    }
  };

  return (
    <div 
      className="modal show d-block animate-fade-in" 
      tabIndex="-1" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
        backdropFilter: 'blur(10px)', 
        zIndex: 1100005,
        pointerEvents: 'all',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(var(--bs-primary-rgb), 0.3); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(var(--bs-primary-rgb), 0.6); }
      `}</style>
      <div className="modal-dialog modal-lg my-md-5 my-2 mx-auto" style={{ pointerEvents: 'all', maxWidth: '95%', width: '750px' }}>
        <div className="premium-card shadow-lg border-0 rounded-4 bg-card" style={{ width: '100%', position: 'relative', zIndex: 1100010 }}>
          <div className="modal-header p-3 p-md-4 border-0 d-flex align-items-center justify-content-between border-bottom border-white border-opacity-5">
            <div className="d-flex align-items-center gap-2 gap-md-3">
              <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle shadow-glow d-none d-sm-block">
                <ShieldHalf size={24} />
              </div>
              <div>
                <h6 className="fw-black text-main mb-0 text-uppercase tracking-widest fs-6">Edit Staff Profile</h6>
                <small className="text-muted fw-bold opacity-50 text-uppercase d-block" style={{ fontSize: '7px', letterSpacing: '1px' }}>Operational Node Reconfiguration</small>
              </div>
            </div>
            <button type="button" className="btn btn-link p-0 text-muted shadow-none border-0 transition-all hover-scale" onClick={onClose}><X size={20}/></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body p-3 p-md-4 custom-scroll" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div className="row g-3 g-md-4">
                {/* Basic Identity */}
                <div className="col-12 col-md-7">
                  <label className="form-label small fw-black text-uppercase text-muted mb-1 tracking-widest" style={{ fontSize: '9px' }}>Full Name</label>
                  <input 
                    type="text" 
                    className="form-control border border-white border-opacity-10 shadow-none bg-surface text-main fw-bold py-2 rounded-3" 
                    value={user.name || ''}
                    onChange={(e) => setUser(prev => ({...prev, name: e.target.value}))}
                    required
                  />
                </div>
                <div className="col-12 col-md-5">
                  <label className="form-label small fw-black text-uppercase text-muted mb-1 tracking-widest" style={{ fontSize: '9px' }}>Role</label>
                  <select 
                    className="form-select border border-white border-opacity-10 shadow-none fw-bold bg-surface text-main py-2 rounded-3"
                    value={user.role || ''}
                    onChange={(e) => setUser(prev => ({...prev, role: e.target.value}))}
                    required
                  >
                    {safeRoles.map(role => (
                      <option key={role.id} value={role.name}>{role.name.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-black text-uppercase text-muted mb-1 tracking-widest" style={{ fontSize: '9px' }}>Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control border border-white border-opacity-10 shadow-none bg-surface text-main fw-bold py-2 rounded-3" 
                    value={user.mobile || ''}
                    onChange={(e) => setUser(prev => ({...prev, mobile: e.target.value}))}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-black text-uppercase text-muted mb-1 tracking-widest" style={{ fontSize: '9px' }}>Reports To</label>
                  <select 
                    className="form-select border border-white border-opacity-10 shadow-none fw-bold bg-surface text-main py-2 rounded-3"
                    value={user.supervisorId || ''}
                    onChange={(e) => setUser(prev => ({...prev, supervisorId: e.target.value ? parseInt(e.target.value) : null}))}
                  >
                    <option value="">Independent Operator</option>
                    {safeTeamLeaders.filter(tl => {
                      if (user.role === 'ASSOCIATE') return tl.role === 'TEAM_LEADER';
                      if (user.role === 'TEAM_LEADER') return tl.role === 'MANAGER';
                      if (user.role === 'MANAGER') return tl.role === 'ADMIN' || tl.role === 'MANAGER';
                      return false;
                    })
                    .filter(tl => tl.id !== user.id)
                    .map(tl => (
                      <option key={tl.id} value={tl.id}>{tl.name} ({tl.role})</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                   <label className="form-label small fw-black text-uppercase text-muted mb-1 tracking-widest" style={{ fontSize: '9px' }}>Office Terminal</label>
                   <select 
                     className="form-select border border-white border-opacity-10 shadow-none fw-bold bg-surface text-main py-2 rounded-3"
                     value={user.officeId || ''}
                     onChange={(e) => setUser(prev => ({...prev, officeId: e.target.value ? parseInt(e.target.value) : null}))}
                   >
                     <option value="">Select Location...</option>
                     {safeOffices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                   </select>
                </div>

                {/* Shift Info */}
                <div className="col-12">
                   <div className="p-3 rounded-4 border border-primary border-opacity-10 bg-primary bg-opacity-5">
                      <div className="row g-2 g-md-3 align-items-end">
                        <div className="col-12 col-md-6">
                           <label className="form-label small fw-black text-uppercase text-primary mb-1 tracking-widest" style={{ fontSize: '9px' }}>Attendance Shift</label>
                           <select 
                             className="form-select border border-primary border-opacity-10 shadow-none fw-bold bg-surface text-main py-2 rounded-3"
                             value={user.shiftId || ''}
                             onChange={(e) => setUser(prev => ({...prev, shiftId: e.target.value ? parseInt(e.target.value) : null}))}
                           >
                             <option value="">Select Shift...</option>
                             {safeShifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>
                        </div>
                        <div className="col-6 col-md-3">
                           <label className="form-label small fw-black text-uppercase text-muted mb-1 tracking-widest" style={{ fontSize: '9px' }}>Start</label>
                           <div className="form-control border-0 bg-surface text-main py-2 rounded-3 fw-black small text-center opacity-75">
                              {selectedShift?.startTime?.substring(0, 5) || '--:--'}
                           </div>
                        </div>
                        <div className="col-6 col-md-3">
                           <label className="form-label small fw-black text-uppercase text-muted mb-1 tracking-widest" style={{ fontSize: '9px' }}>End</label>
                           <div className="form-control border-0 bg-surface text-main py-2 rounded-3 fw-black small text-center opacity-75">
                              {selectedShift?.endTime?.substring(0, 5) || '--:--'}
                           </div>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Permissions & Security */}
                <div className="col-12 col-md-6">
                   <label className="form-label small fw-black text-uppercase text-muted d-block mb-2 tracking-widest" style={{ fontSize: '9px' }}>Permission Set Override</label>
                   <div className="bg-surface p-3 rounded-4 shadow-inner overflow-auto text-main border border-white border-opacity-5 transition-all hover-border-primary custom-scroll" style={{ maxHeight: '160px' }}>
                     <div className="d-flex flex-column gap-2">
                       {safePermissions.map(perm => (
                         <div key={perm} className="form-check custom-check d-flex align-items-center">
                           <input 
                              className="form-check-input shadow-none mt-0" 
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
                                toast.info(`Shield Node [${perm}] updated`, { autoClose: 800 });
                              }}
                           />
                           <label className="form-check-label small fw-bold opacity-75 ms-2 cursor-pointer mb-0" htmlFor={`edit-perm-${perm}`}>
                              {perm.replace(/_/g, ' ')}
                           </label>
                         </div>
                       ))}
                     </div>
                   </div>
                </div>

                <div className="col-12 col-md-6">
                   <label className="form-label small fw-black text-uppercase text-warning d-block mb-2 tracking-widest" style={{ fontSize: '9px' }}>Security Terminal</label>
                   <div className="p-3 rounded-4 border border-warning border-opacity-10 bg-warning bg-opacity-5 h-100" style={{ minHeight: '160px' }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                           <Key size={14} className="text-warning" />
                           <span className="small fw-black text-uppercase text-warning" style={{ fontSize: '9px' }}>Access Control</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={handleGenerateOtp}
                          disabled={isGenerating}
                          className="btn btn-link p-0 text-warning small fw-black text-uppercase text-decoration-none transition-all hover-white" 
                          style={{ fontSize: '9px' }}
                        >
                          {isGenerating ? <RefreshCw className="animate-spin" size={12} /> : 'Sync Passkey'}
                        </button>
                      </div>

                      {showOtpPanel ? (
                        <div className="animate-fade-in bg-surface bg-opacity-50 p-3 rounded-3 border border-white border-opacity-5">
                           <div className="p-2 mb-2 bg-warning bg-opacity-10 text-warning rounded-2 text-center border border-warning border-opacity-20">
                              <span className="fw-black font-monospace tracking-widest small">{resetData.serverOtp}</span>
                           </div>
                           <div className="d-flex flex-column gap-2 mb-2">
                              <input 
                                type="text" 
                                placeholder="OTP"
                                className="form-control form-control-sm bg-surface border-0 fw-black text-warning text-center py-2"
                                value={resetData.otp}
                                onChange={(e) => setResetData(prev => ({...prev, otp: e.target.value}))}
                              />
                              <input 
                                type="password" 
                                placeholder="New Passkey"
                                className="form-control form-control-sm bg-surface border-0 fw-black text-warning py-2"
                                value={resetData.newPassword}
                                onChange={(e) => setResetData(prev => ({...prev, newPassword: e.target.value}))}
                              />
                           </div>
                           <button 
                             type="button" 
                             onClick={handleVerifyAndReset}
                             className="btn btn-warning btn-sm w-100 fw-black text-uppercase shadow-sm py-2"
                           >
                             Authorize Reset
                           </button>
                        </div>
                      ) : (
                        <div className="d-flex flex-column align-items-center justify-content-center text-center opacity-50 py-4 h-100">
                           <ShieldCheck size={24} className="mb-2 text-warning opacity-25" />
                           <small className="fw-bold opacity-50" style={{ fontSize: '8px', letterSpacing: '1px' }}>SECURE HANDSHAKE PENDING</small>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 p-3 p-md-4 d-flex flex-column flex-sm-row justify-content-end gap-2 gap-md-3 bg-card border-top border-white border-opacity-5">
              <button type="button" className="btn btn-link text-muted fw-black text-uppercase text-decoration-none small tracking-widest p-0 transition-all hover-white order-2 order-sm-1" onClick={onClose}>Abort</button>
              <button type="submit" className="btn btn-primary fw-black text-uppercase px-5 shadow-glow rounded-pill py-2.5 transition-all hover-scale order-1 order-sm-2 w-100 w-sm-auto">Sync profile</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
