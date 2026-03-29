import React from 'react';

const StatCard = ({ title, value, sub, icon, color = 'primary' }) => {
  const colorMap = {
    primary: 'text-primary bg-primary bg-opacity-10 border-primary border-opacity-25',
    success: 'text-success bg-success bg-opacity-10 border-success border-opacity-25',
    warning: 'text-warning bg-warning bg-opacity-10 border-warning border-opacity-25',
    error: 'text-danger bg-danger bg-opacity-10 border-danger border-opacity-25',
    info: 'text-info bg-info bg-opacity-10 border-info border-opacity-25',
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
    <div className="card h-100 border-0 shadow-sm rounded-4 bg-body overflow-hidden transition-all hover-translate-y-2">
      <div className="card-body p-4 d-flex flex-column justify-content-between">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className={`p-3 rounded-4 d-flex align-items-center justify-content-center border ${currentColor}`} style={{ width: '56px', height: '56px' }}>
            {React.cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
          </div>
          <div className="text-end">
            <h6 className="text-uppercase fw-black text-muted mb-1 opacity-50 ls-1" style={{ fontSize: '10px' }}>{title}</h6>
            <h3 className="fw-black mb-0 tracking-tight">{value}</h3>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small fw-bold text-muted opacity-75">{sub}</span>
            <span className="badge bg-primary bg-opacity-10 text-primary small rounded-pill">+0.0%</span>
          </div>
          <div className="progress rounded-pill bg-secondary bg-opacity-10" style={{ height: '6px' }}>
            <div 
              className={`progress-bar rounded-pill shadow-sm transition-all duration-1000 ${bgClass}`} 
              role="progressbar" 
              style={{ width: '100%' }}
            ></div>
          </div>
        </div>
      </div>
      
      <style>{`
        .hover-translate-y-2:hover { transform: translateY(-4px); transition: transform 0.2s ease; }
        .ls-1 { letter-spacing: 0.1em; }
        .fw-black { font-weight: 900; }
        .duration-1000 { transition-duration: 1s; }
      `}</style>
    </div>
  );
};

export default StatCard;
