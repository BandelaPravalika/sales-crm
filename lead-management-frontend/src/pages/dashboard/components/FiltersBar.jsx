import React from 'react';
import { Calendar, LayoutDashboard, RefreshCcw } from 'lucide-react';
import { Button } from '../../../components/common/Components';

const FiltersBar = ({ filters, onChange, onSync, title = "Operational Scope" }) => {
  return (
    <div className="premium-card p-3 mb-4 animate-fade-in border-0 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(20px)' }}>
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">
        <div className="d-flex align-items-center gap-3">
           <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-pill border border-primary border-opacity-10 shadow-glow">
              <LayoutDashboard size={16} />
           </div>
           <div>
              <h6 className="fw-black mb-0 text-main small tracking-widest text-uppercase">{title}</h6>
              <small className="text-muted fw-bold opacity-50" style={{ fontSize: '8px' }}>CORE OPERATIONAL DOMAIN</small>
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
                  style={{ width: '110px', fontSize: '11px', outline: 'none', letterSpacing: '0.02em' }}
                />
                <span className="text-muted small px-1 opacity-25">|</span>
                <input 
                  type="date" 
                  className="bg-transparent border-0 text-main fw-black px-1"
                  value={filters.to?.split('T')[0] || ""}
                  onChange={(e) => onChange({...filters, to: e.target.value + 'T23:59:59'})}
                  style={{ width: '110px', fontSize: '11px', outline: 'none', letterSpacing: '0.02em' }}
                />
            </div>
          </div>
          
          <Button 
            variant="secondary"
            className="py-2 px-4 rounded-pill border-0 shadow-sm"
            onClick={() => onChange({
              from: new Date().toISOString().split('T')[0] + 'T00:00:00',
              to: new Date().toISOString().split('T')[0] + 'T23:59:59',
              userId: null
            })}
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
