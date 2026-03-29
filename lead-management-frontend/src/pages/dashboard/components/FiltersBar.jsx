import React from 'react';
import { Calendar, LayoutDashboard, RefreshCcw } from 'lucide-react';

const FiltersBar = ({ filters, onChange, theme }) => {
  return (
    <div className="card overflow-hidden mb-4 border border-white border-opacity-5">
      <div className="card-body p-3 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4 animate-fade-in">
        <div className="d-flex align-items-center gap-3 ps-2">
          <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-lg border border-primary border-opacity-10 shadow-sm">
            <LayoutDashboard size={20} />
          </div>
          <div className="d-flex flex-column">
            <h6 className="fw-black mb-0 text-white small" style={{ letterSpacing: '0.02em' }}>Operational Scope</h6>
            <small className="text-muted fw-bold opacity-50 text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Global Performance Window</small>
          </div>
        </div>
        
        <div className="d-flex flex-wrap align-items-center gap-3 w-100 w-lg-auto justify-content-end">
          <div className="d-flex align-items-center gap-2 bg-white bg-opacity-5 p-1 px-3 rounded-pill border border-white border-opacity-10">
            <Calendar size={14} className="text-primary opacity-50" />
            <div className="d-flex align-items-center">
                <input 
                type="date" 
                className="bg-transparent border-0 text-white shadow-none fw-bold px-1"
                value={filters.from?.split('T')[0] || ""}
                onChange={(e) => onChange({...filters, from: e.target.value + 'T00:00:00'})}
                style={{ width: '120px', fontSize: '11px', outline: 'none' }}
                />
                <span className="text-muted small px-2 opacity-50 fw-black">»</span>
                <input 
                type="date" 
                className="bg-transparent border-0 text-white shadow-none fw-bold px-1"
                value={filters.to?.split('T')[0] || ""}
                onChange={(e) => onChange({...filters, to: e.target.value + 'T23:59:59'})}
                style={{ width: '120px', fontSize: '11px', outline: 'none' }}
                />
            </div>
          </div>
          
          <button 
            className="btn-premium py-2 px-4 d-flex align-items-center gap-2"
            style={{ fontSize: '10px' }}
            onClick={() => onChange(filters)} 
          >
            <RefreshCcw size={14} />
            SYNC CORE
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;
