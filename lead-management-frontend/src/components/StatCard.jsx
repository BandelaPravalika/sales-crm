import React from 'react';
import { useTheme } from '../context/ThemeContext';

const StatCard = ({ title, value, sub, icon, color = 'primary' }) => {
  const { isDarkMode } = useTheme();
  
  const colorToken = {
    primary: 'var(--primary)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    error: 'var(--danger)',
    info: 'var(--info)'
  }[color] || 'var(--primary)';

  return (
    <div className="premium-card h-100 overflow-hidden transition-all hover-translate-y border-0">
      <div className="card-body p-3 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div className={`p-2.5 rounded-3 d-flex align-items-center justify-content-center border`} 
               style={{ width: '42px', height: '42px', borderColor: `${colorToken}20`, backgroundColor: `${colorToken}10`, color: colorToken }}>
            {React.cloneElement(icon, { size: 18, strokeWidth: 2.5 })}
          </div>
          <div className="text-end">
            <div className="text-muted fw-bold opacity-50 mb-0" style={{ fontSize: '9px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</div>
            <h4 className="fw-black mb-0" style={{ letterSpacing: '-0.02em', fontSize: '1.25rem' }}>{value}</h4>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-medium text-muted small opacity-75">{sub}</span>
            <span className={`badge bg-opacity-10 small rounded-pill fw-bold`} 
                  style={{ fontSize: '10px', backgroundColor: `${colorToken}20`, color: colorToken }}>Active</span>
          </div>
          <div className="progress rounded-pill bg-white bg-opacity-5" style={{ height: '4px' }}>
            <div 
              className={`progress-bar rounded-pill shadow-sm transition-all duration-1000`} 
              role="progressbar" 
              style={{ width: '100%', backgroundColor: colorToken, boxShadow: `0 0 10px ${colorToken}40` }}
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
