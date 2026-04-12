import React, { useState, useEffect } from 'react';
import { Calendar, LayoutDashboard, RefreshCcw, ChevronDown, User, Users } from 'lucide-react';
import { Button } from '../../../components/common/Components';

const FiltersBar = ({ filters, onChange, onSync, title = "Operational Scope", users = [], role = "ADMIN" }) => {
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedTlId, setSelectedTlId] = useState("");

  // Options for Admin: Select Manager
  const managers = users.filter(u => u.role === 'MANAGER');
  
  // Options for selected Manager or current Manager: Select TL
  const getTls = (mgrId) => users.filter(u => u.role === 'TEAM_LEADER' && u.supervisorId == mgrId);

  const handleManagerChange = (id) => {
    setSelectedManagerId(id);
    setSelectedTlId("");
    onChange({...filters, userId: id || null});
  };

  const handleTlChange = (id) => {
    setSelectedTlId(id);
    onChange({...filters, userId: id || null});
  };

  return (
    <div className="premium-card p-3 mb-4 animate-fade-in border-0 shadow-lg bg-surface bg-opacity-10 backdrop-blur" style={{ backdropFilter: 'blur(20px)' }}>
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">
        <div className="d-flex flex-wrap align-items-center gap-4">
          <div className="d-flex align-items-center gap-3">
             <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-pill border border-primary border-opacity-10">
                <LayoutDashboard size={16} />
             </div>
             <div>
                <h6 className="fw-black mb-0 text-main small tracking-widest text-uppercase">{title}</h6>
                <small className="text-muted fw-bold opacity-50" style={{ fontSize: '8px' }}>CORE FILTER ENGINE</small>
             </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* 1. Admin Dropdown for Manager */}
            {role === 'ADMIN' && (
              <div className="d-flex align-items-center gap-2 bg-surface bg-opacity-30 p-1 px-3 rounded-pill border border-white border-opacity-5">
                <User size={12} className="text-primary opacity-50" />
                <select 
                  className="bg-transparent border-0 text-main fw-black small text-uppercase tracking-wider outline-none py-1"
                  style={{ fontSize: '10px', minWidth: '120px' }}
                  value={selectedManagerId}
                  onChange={(e) => handleManagerChange(e.target.value)}
                >
                  <option value="">All Managers</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            )}

            {/* 2. Manager/Admin Dropdown for TL (Team Selection) */}
            {(role === 'ADMIN' || role === 'MANAGER') && (
              <div className="d-flex align-items-center gap-2 bg-surface bg-opacity-30 p-1 px-3 rounded-pill border border-white border-opacity-5">
                <Users size={12} className="text-primary opacity-50" />
                <select 
                  className="bg-transparent border-0 text-main fw-black small text-uppercase tracking-wider outline-none py-1"
                  style={{ fontSize: '10px', minWidth: '120px' }}
                  value={selectedTlId}
                  onChange={(e) => handleTlChange(e.target.value)}
                >
                  <option value="">{role === 'MANAGER' ? 'Direct Reports' : 'All Teams'}</option>
                  {getTls(role === 'MANAGER' ? filters.currentUserId : selectedManagerId).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="d-flex align-items-center gap-2 bg-surface bg-opacity-50 p-2 px-3 rounded-pill border border-white border-opacity-5 shadow-sm">
            <Calendar size={14} className="text-primary" />
            <div className="d-flex align-items-center gap-1">
                <input 
                  type="date" 
                  className="bg-transparent border-0 text-main fw-black px-1"
                  value={filters.from?.split('T')[0] || ""}
                  onChange={(e) => onChange({...filters, from: e.target.value + 'T00:00:00'})}
                  style={{ width: '130px', fontSize: '11px', outline: 'none', letterSpacing: '0.02em' }}
                />
                <span className="text-muted small px-1 opacity-25">|</span>
                <input 
                  type="date" 
                  className="bg-transparent border-0 text-main fw-black px-1"
                  value={filters.to?.split('T')[0] || ""}
                  onChange={(e) => onChange({...filters, to: e.target.value + 'T23:59:59'})}
                  style={{ width: '130px', fontSize: '11px', outline: 'none', letterSpacing: '0.02em' }}
                />
            </div>
          </div>
          
          <Button 
            variant="secondary"
            className="py-2 px-4 rounded-pill border-0 shadow-sm"
            onClick={() => {
              setSelectedManagerId("");
              setSelectedTlId("");
              onChange({
                from: new Date().toISOString().split('T')[0] + 'T00:00:00',
                to: new Date().toISOString().split('T')[0] + 'T23:59:59',
                userId: null
              });
            }}
            style={{ fontSize: '10px' }}
          >
            RESET
          </Button>

          <Button 
            variant="primary" 
            className="py-2 px-4 rounded-pill border-0 shadow-glow"
            onClick={() => onSync ? onSync() : onChange(filters)} 
            style={{ fontSize: '10px' }}
          >
            <RefreshCcw size={14} className="me-2" />
            SYNC CORE
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;
