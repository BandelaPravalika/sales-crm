import React from 'react';
import { Calendar, LayoutDashboard, RefreshCcw } from 'lucide-react';

const FiltersBar = ({ filters, onChange, theme }) => {
  return (
    <div className="card shadow-sm border-0 bg-dark bg-opacity-50 rounded-4 overflow-hidden mb-4 border border-white border-opacity-5">
      <div className="card-body p-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-4">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3 shadow-sm">
            <LayoutDashboard size={20} />
          </div>
          <div className="d-flex flex-column">
            <h6 className="fw-semibold mb-0 text-white small">Operational Scope</h6>
            <small className="text-muted" style={{ fontSize: '9px' }}>Global Performance Window</small>
          </div>
        </div>
        
        <div className="d-flex flex-wrap align-items-center gap-3 w-100 w-md-auto justify-content-end">
          <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-50 p-1 px-2 rounded-pill border border-white border-opacity-10 shadow-inner">
            <Calendar size={14} className="text-primary opacity-75" />
            <input 
              type="date" 
              className="form-control form-control-sm border-0 bg-transparent text-white shadow-none small fw-semibold px-1"
              value={filters.from?.split('T')[0] || ""}
              onChange={(e) => onChange({...filters, from: e.target.value + 'T00:00:00'})}
              style={{ width: '120px', fontSize: '11px' }}
            />
            <span className="text-muted small px-1">to</span>
            <input 
              type="date" 
              className="form-control form-control-sm border-0 bg-transparent text-white shadow-none small fw-semibold px-1"
              value={filters.to?.split('T')[0] || ""}
              onChange={(e) => onChange({...filters, to: e.target.value + 'T23:59:59'})}
              style={{ width: '120px', fontSize: '11px' }}
            />
          </div>
          
          <button 
            className="btn btn-primary btn-sm rounded-pill px-4 fw-semibold d-flex align-items-center gap-2 shadow-sm transition-all hover-translate-y"
            style={{ fontSize: '11px' }}
            onClick={() => onChange(filters)} // Trigger parent reload if needed
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
