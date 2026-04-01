import React from 'react';
import { LogOut, Sun, Moon, Bell, Search, User as UserIcon, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Navbar = ({ isCollapsed, userEmail, onLogout, onToggleSidebar }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <nav 
      className="position-fixed top-0 end-0 d-flex align-items-center justify-content-between px-4"
      style={{ 
        height: 'var(--header-height)', 
        left: (window.innerWidth > 992) ? (isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)') : '0',
        width: 'auto',
        backgroundColor: 'var(--nav-bg)',
        borderBottom: '1px solid var(--border-color)',
        zIndex: 1010,
        backdropFilter: 'var(--glass-blur)',
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className="d-flex align-items-center gap-2">
          <div className="d-none d-xl-flex align-items-center gap-3 bg-surface bg-opacity-50 px-3 py-1.5 rounded-pill border border-white border-opacity-5">
            <Search size={14} className="text-muted" />
            <input 
              type="text" 
              className="bg-transparent border-0 text-main fw-medium small" 
              placeholder="Search identity node..." 
              style={{outline: 'none', width: '200px', fontSize: '12px'}}
            />
         </div>
      </div>

      <div className="d-flex align-items-center gap-3 gap-md-4">
        <div className="d-flex align-items-center gap-2 p-1 bg-surface bg-opacity-50 rounded-pill border border-white border-opacity-5">
           <button 
             className={`p-1.5 rounded-circle border-0 d-flex transition-all ${!isDarkMode ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-muted opacity-50'}`}
             onClick={() => isDarkMode && toggleTheme()}
           >
              <Sun size={12} />
           </button>
           <button 
             className={`p-1.5 rounded-circle border-0 d-flex transition-all ${isDarkMode ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-muted opacity-50'}`}
             onClick={() => !isDarkMode && toggleTheme()}
           >
              <Moon size={12} />
           </button>
        </div>

        <div className="d-flex align-items-center gap-2 gap-md-3">
          <div className="text-end d-none d-md-block">
             <p className="mb-0 fw-black text-main" style={{ fontSize: '11px', letterSpacing: '0.02em' }}>{userEmail?.split('@')[0].toUpperCase()}</p>
             <p className="mb-0 text-muted fw-bold opacity-50" style={{fontSize: '8px', textTransform: 'uppercase'}}>Identity Node Active</p>
          </div>
          <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-pill border border-primary border-opacity-10 shadow-glow">
             <UserIcon size={16} />
          </div>
          
          <div className="d-none d-sm-block bg-border-color" style={{width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 8px'}}></div>
          
          <button 
            onClick={onLogout} 
            className="ui-btn ui-btn-secondary py-1.5 px-3 rounded-pill"
            style={{ fontSize: '10px' }}
          >
            <LogOut size={12} />
            <span className="ms-1 d-none d-sm-inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
