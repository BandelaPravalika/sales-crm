import React from 'react';
import { 
  Zap, 
  Search, 
  Bell, 
  LogOut, 
  Sun,
  Moon,
  Menu
} from 'lucide-react';

const Navbar = ({ role, onLogout, theme, onToggleTheme, onToggleSidebar }) => {

  return (
    <nav className="navbar-minimal d-flex align-items-center justify-content-between px-4">
      {/* Left: Sidebar Toggle & Search */}
      <div className="d-flex align-items-center">
        <button 
          className="btn btn-link text-white opacity-75 p-0 border-0 hover-opacity-100 transition-all me-3" 
          onClick={onToggleSidebar}
        >
          <Menu size={20} />
        </button>
        
        <div className="position-relative d-none d-lg-block">
          <Search className="position-absolute translate-middle-y text-muted opacity-50" size={14} style={{ top: '50%', left: '14px' }} />
          <input 
            type="search" 
            className="glass-input ps-5 pe-3 py-2 text-white" 
            placeholder="Search leads, users..." 
            style={{ width: '240px', fontSize: '13px' }} 
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="d-flex align-items-center gap-3 gap-md-4">
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <button className="btn btn-link text-white opacity-50 p-2 border-0 hover-opacity-100 transition-all">
            <Bell size={18} />
          </button>
          
          <button 
            className="btn btn-link text-white opacity-50 p-2 border-0 hover-opacity-100 transition-all"
            onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className="vr bg-white opacity-10 mx-1 d-none d-md-block" style={{ height: '24px' }}></div>

          <button 
            className="btn-premium px-4 py-2 small fw-bold text-uppercase tracking-wider d-flex align-items-center gap-2"
            style={{ fontSize: '11px' }}
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
