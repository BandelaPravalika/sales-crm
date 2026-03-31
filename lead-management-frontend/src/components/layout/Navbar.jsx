import React from 'react';
import { 
  Zap, 
  Search, 
  Bell, 
  LogOut, 
  Sun,
  Moon,
  Menu,
  Users
} from 'lucide-react';

const Navbar = ({ role, userEmail, onLogout, theme, onToggleTheme, onToggleSidebar, className }) => {
  return (
    <nav className={`navbar-minimal d-flex align-items-center justify-content-between px-3 px-md-4 ${className || ''}`}>
      {/* Single Mobile Toggle Button - Moved to Sidebar for consistency */}

      {/* Left: Search Bar (Hidden on Mobile) */}
      <div className="d-none d-md-flex align-items-center flex-grow-1">
        <div className="position-relative search-container ms-1">
          <Search className="position-absolute translate-middle-y text-muted opacity-50" size={14} style={{ top: '50%', left: '14px' }} />
          <input 
            type="search" 
            className="glass-input ps-5 pe-3 py-2 text-white w-100" 
            placeholder="Search leads, users..." 
            style={{ fontSize: '13px' }} 
          />
        </div>
      </div>

      {/* Right: Actions Grouped */}
      <div className="header-right gap-2 gap-md-3">
        {/* User Profile Chip - Inspired by User Screenshot */}
        <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-50 p-1 pe-3 rounded-pill border border-white border-opacity-10 shadow-sm d-none d-sm-flex transition-all hover-bg-opacity-70">
           <div className="flex-shrink-0 p-2 bg-primary bg-opacity-20 rounded-circle border border-primary border-opacity-30 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
              <Users size={14} className="text-primary" />
           </div>
           <div className="d-flex flex-column" style={{ lineHeight: '1.2' }}>
              <span className="text-white fw-bold" style={{ fontSize: '11px' }}>{userEmail?.split('@')[0] || 'User'}</span>
              <span className="text-muted text-uppercase fw-black" style={{ fontSize: '9px', letterSpacing: '0.05em' }}>{role?.replace(/_/g, ' ')}</span>
           </div>
        </div>

        <button className="btn btn-link text-white opacity-50 p-2 border-0 hover-opacity-100 transition-all">
          <Bell size={18} />
        </button>
        
        <button 
          className="btn btn-link opacity-50 p-2 border-0 hover-opacity-100 transition-all d-none d-sm-inline-block"
          onClick={() => onToggleTheme()}
          style={{ color: 'var(--text-main)' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        <div className="vr bg-white opacity-10 mx-1 d-none d-md-block" style={{ height: '20px' }}></div>

        <button 
          className="btn-premium px-3 px-md-4 py-2 small fw-bold text-uppercase"
          style={{ fontSize: '10px' }}
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
