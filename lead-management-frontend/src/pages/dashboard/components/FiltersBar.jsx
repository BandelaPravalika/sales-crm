import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCcw, User, Users, ShieldHalf, Filter } from 'lucide-react';
import { Button } from '../../../components/common/Components';
import adminService from '../../../services/adminService';

const FiltersBar = ({ filters, onChange, onSync, title = "COMMAND CENTER", role = "", currentUserId }) => {
  const [selectedMgrId, setSelectedMgrId] = useState("");
  const [selectedTlId, setSelectedTlId] = useState("");
  const [selectedAssocId, setSelectedAssocId] = useState("");

  const [managers, setManagers] = useState([]);
  const [tls, setTls] = useState([]);
  const [associates, setAssociates] = useState([]);

  const isManager = role === 'MANAGER';
  const isTL = role === 'TEAM_LEADER';
  const isAssociate = role === 'ASSOCIATE';
  const effectiveUserId = isManager ? currentUserId : selectedMgrId;

  // Fetch Managers on Load (Admin only)
  useEffect(() => {
    if (role === 'ADMIN') {
      adminService.fetchManagers().then(res => setManagers(res.data)).catch(() => {});
    }
  }, [role]);

  // Fetch Teams on Manager Change (Admin/Manager only)
  useEffect(() => {
    if (effectiveUserId && (role === 'ADMIN' || role === 'MANAGER')) {
      adminService.fetchTeamsByManager(effectiveUserId).then(res => setTls(res.data)).catch(() => {});
    } else {
      setTls([]);
    }
  }, [effectiveUserId, role]);

  // Fetch Associates on Team Change
  useEffect(() => {
    if (selectedTlId) {
      adminService.fetchAssociates(selectedTlId, null).then(res => setAssociates(res.data)).catch(() => {});
    } else if (effectiveUserId) {
      adminService.fetchAssociates(null, effectiveUserId).then(res => setAssociates(res.data)).catch(() => {});
    } else {
      setAssociates([]);
    }
  }, [selectedTlId, effectiveUserId]);

  useEffect(() => {
    let targetUserId = null;
    if (selectedAssocId) targetUserId = selectedAssocId;
    else if (selectedTlId) targetUserId = selectedTlId;
    else if (selectedMgrId) targetUserId = selectedMgrId;
    else if (isManager) targetUserId = currentUserId;

    if (filters?.userId !== targetUserId) {
      onChange({ ...filters, userId: targetUserId });
    }
  }, [selectedMgrId, selectedTlId, selectedAssocId, filters?.userId]);

  return (
    <div className="bg-white p-2 mb-3 animate-fade-in border border-light shadow-sm rounded-pill px-4">
      <div className="d-flex align-items-center justify-content-between gap-2 overflow-x-auto no-scrollbar">
        {/* Left Section: Title + Dropdowns */}
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2 pe-3 border-end border-light">
            <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle">
              <Filter size={16} />
            </div>
            <div className="d-none d-xxl-block">
              <h5 className="fw-black mb-0 text-dark tracking-wide text-uppercase" style={{ fontSize: '11px' }}>{title}</h5>
              <p className="text-muted small mb-0 fw-bold opacity-50 text-uppercase" style={{ fontSize: '7px', letterSpacing: '0.4px' }}>
                ANALYSIS
              </p>
            </div>
          </div>

          {!isAssociate && (
            <div className="d-flex align-items-center gap-2">
              {role === 'ADMIN' && (
                <div className="bg-light p-1 px-3 rounded-pill border border-light">
                  <select
                    className="bg-transparent border-0 text-main fw-bold small text-uppercase outline-none py-1"
                    style={{ fontSize: '9px', minWidth: '130px' }}
                    value={selectedMgrId}
                    onChange={(e) => {
                      setSelectedMgrId(e.target.value);
                      setSelectedTlId("");
                      setSelectedAssocId("");
                    }}
                  >
                    <option value="">CHOOSE MANAGER</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Team selection for Admin, Manager and TL (if applicable) */}
              {(role === 'ADMIN' || isManager) && (
                <div className="bg-light p-1 px-3 rounded-pill border border-light">
                  <select
                    className="bg-transparent border-0 text-main fw-bold small text-uppercase outline-none py-1"
                    style={{ fontSize: '9px', minWidth: '130px' }}
                    value={selectedTlId}
                    onChange={(e) => {
                      setSelectedTlId(e.target.value);
                      setSelectedAssocId("");
                    }}
                    disabled={!effectiveUserId}
                  >
                    <option value="">{effectiveUserId ? 'ALL TEAMS' : '---'}</option>
                    {tls.map(t => (
                      <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Associate selection for Admin, Manager and TL */}
              {(role === 'ADMIN' || isManager || isTL) && (
                <div className="bg-light p-1 px-3 rounded-pill border border-light">
                  <select
                    className="bg-transparent border-0 text-main fw-bold small text-uppercase outline-none py-1"
                    style={{ fontSize: '9px', minWidth: '130px' }}
                    value={selectedAssocId}
                    onChange={(e) => setSelectedAssocId(e.target.value)}
                    disabled={!effectiveUserId && role !== 'TEAM_LEADER'}
                  >
                    <option value="">{(effectiveUserId || isTL) ? 'ALL ASSOCIATES' : '---'}</option>
                    {associates.map(a => (
                      <option key={a.id} value={a.id}>{a.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Calendar + Reset + Sync */}
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-2 bg-light p-1 px-3 rounded-pill border border-light">
            <Calendar size={12} className="text-muted" />
            <div className="d-flex align-items-center gap-1">
              <input
                type="date"
                className="bg-transparent border-0 text-main fw-bold px-1"
                value={filters.from?.split('T')[0] || ""}
                onChange={(e) => onChange({ ...filters, from: e.target.value + 'T00:00:00' })}
                style={{ width: '105px', fontSize: '10px', outline: 'none' }}
              />
              <span className="text-muted small opacity-25">|</span>
              <input
                type="date"
                className="bg-transparent border-0 text-main fw-bold px-1"
                value={filters.to?.split('T')[0] || ""}
                onChange={(e) => onChange({ ...filters, to: e.target.value + 'T23:59:59' })}
                style={{ width: '105px', fontSize: '10px', outline: 'none' }}
              />
            </div>
          </div>

          <button
            className="btn btn-outline-secondary rounded-pill border-light py-1.5 px-3 fw-bold text-uppercase"
            onClick={() => {
              setSelectedMgrId("");
              setSelectedTlId("");
              setSelectedAssocId("");
              onChange({
                from: new Date().toISOString().split('T')[0] + 'T00:00:00',
                to: new Date().toISOString().split('T')[0] + 'T23:59:59',
                userId: isManager ? currentUserId : null
              });
            }}
            style={{ fontSize: '9px' }}
          >
            RESET
          </button>
          
          <button
            className="btn btn-primary rounded-pill py-1.5 px-3 border-0 fw-bold text-uppercase d-flex align-items-center gap-2 shadow-sm"
            onClick={() => onSync ? onSync() : onChange(filters)}
            style={{ fontSize: '9px' }}
          >
            <RefreshCcw size={12} />
            SYNC CORE
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;
