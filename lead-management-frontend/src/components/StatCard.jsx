import React from 'react';

const StatCard = ({ title, value, sub, icon, color = 'primary' }) => {
  const colorMap = {
    primary: 'text-primary bg-primary bg-opacity-10 border-primary border-opacity-10',
    success: 'text-success bg-success bg-opacity-10 border-success border-opacity-10',
    warning: 'text-warning bg-warning bg-opacity-10 border-warning border-opacity-10',
    error: 'text-danger bg-danger bg-opacity-10 border-danger border-opacity-10',
    info: 'text-info bg-info bg-opacity-10 border-info border-opacity-10',
  };

  const currentColor = colorMap[color] || colorMap.primary;

  const bgClass = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-danger',
    info: 'bg-info'
  }[color] || 'bg-primary';

  return (
    <div className="card h-100 overflow-hidden transition-all hover-translate-y">
      <div className="card-body p-4 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div className={`p-3 rounded-3 d-flex align-items-center justify-content-center border ${currentColor}`} style={{ width: '48px', height: '48px' }}>
            {React.cloneElement(icon, { size: 22, strokeWidth: 2 })}
          </div>
          <div className="text-end">
            <div className="text-muted fw-bold opacity-50 mb-1" style={{ fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</div>
            <h4 className="fw-black mb-0 text-white" style={{ letterSpacing: '-0.02em' }}>{value}</h4>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-medium text-muted small opacity-75">{sub}</span>
            <span className={`badge ${bgClass} bg-opacity-10 ${bgClass.replace('bg-', 'text-')} small rounded-pill fw-bold`} style={{ fontSize: '10px' }}>Active</span>
          </div>
          <div className="progress rounded-pill bg-white bg-opacity-5" style={{ height: '4px' }}>
            <div 
              className={`progress-bar rounded-pill shadow-sm transition-all duration-1000 ${bgClass}`} 
              role="progressbar" 
              style={{ width: '100%', boxShadow: `0 0 10px var(--primary-glow)` }}
            ></div>
          </div>
        </div>
      </div>
      
      <style>{`
        .hover-translate-y:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.15) !important; }
        .duration-1000 { transition-duration: 1.2s; }
      `}</style>
    </div>
  );
};

export default StatCard;
