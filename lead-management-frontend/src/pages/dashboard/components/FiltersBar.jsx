import React from 'react';
import { Calendar, LayoutDashboard, RefreshCcw } from 'lucide-react';

const FiltersBar = ({ filters, onChange, theme, title = "Operational Scope" }) => {
  return (
    <div className="card overflow-hidden mb-4 border border-white border-opacity-5">
      <div className="card-body p-3 d-flex flex-column flex-lg-row justify-content-end align-items-lg-center gap-4 animate-fade-in">
        
        <div className="d-flex flex-wrap align-items-center gap-2 w-100 w-lg-auto justify-content-center justify-content-lg-end">
          <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 bg-dark bg-opacity-50 p-2 px-3 rounded-4 border border-white border-opacity-10 shadow-sm">
            <Calendar size={14} className="text-primary opacity-75 d-none d-sm-block" />
            <div className="d-flex align-items-center gap-1">
                <input 
                type="date" 
                className="bg-transparent border-0 text-white shadow-none fw-bold px-1"
                value={filters.from?.split('T')[0] || ""}
                onChange={(e) => onChange({...filters, from: e.target.value + 'T00:00:00'})}
                style={{ width: '110px', fontSize: '11px', outline: 'none', colorScheme: 'dark' }}
                />
                <span className="text-muted small px-1 opacity-50 fw-black">»</span>
                <input 
                type="date" 
                className="bg-transparent border-0 text-white shadow-none fw-bold px-1"
                value={filters.to?.split('T')[0] || ""}
                onChange={(e) => onChange({...filters, to: e.target.value + 'T23:59:59'})}
                style={{ width: '110px', fontSize: '11px', outline: 'none', colorScheme: 'dark' }}
                />
            </div>
          </div>
          
          {filters.userId && (
            <button 
              className="btn btn-primary d-flex align-items-center justify-content-center gap-2 shadow-glow animate-fade-in"
              style={{ fontSize: '10px', borderRadius: '8px', fontWeight: '800' }}
              onClick={() => onChange({...filters, userId: null})}
            >
              [ CLEAR INDIVIDUAL FILTER ]
            </button>
          )}

          <button 
            className="btn btn-outline-secondary py-2 px-3 d-flex align-items-center justify-content-center border-white border-opacity-10 hover-bg-danger transition-all opacity-50 hover-opacity-100"
            style={{ fontSize: '10px', borderRadius: '8px' }}
            onClick={() => onChange({
              from: new Date().toISOString().split('T')[0] + 'T00:00:00',
              to: new Date().toISOString().split('T')[0] + 'T23:59:59',
              userId: null
            })}
            title="Reset Filters"
          >
            RESET
          </button>

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
