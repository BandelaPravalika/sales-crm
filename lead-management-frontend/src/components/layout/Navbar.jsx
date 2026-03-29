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
    <nav className="navbar-minimal d-flex align-items-center justify-content-between">
      {/* Left: Sidebar Toggle & Branding */}
      <div className="d-flex align-items-center gap-3">
        <button 
          className="btn btn-link text-secondary p-0 border-0" 
          onClick={onToggleSidebar}
        >
          <Menu size={20} />
        </button>
        
        <div className="d-flex align-items-center gap-2">
          <div className="p-1 bg-primary rounded d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <span className="fw-bold text-white small" style={{ letterSpacing: '0.02em' }}>NEXUS LMS</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="d-flex align-items-center gap-4">
        <div className="position-relative d-none d-md-block">
          <Search className="position-absolute translate-middle-y text-secondary" size={14} style={{ top: '50%', left: '12px' }} />
          <input 
            type="search" 
            className="form-control border-0 shadow-none ps-5 pe-3 py-2 text-white" 
            placeholder="Search leads, users..." 
            style={{ width: '200px', borderRadius: '12px', background: '#1f2937', fontSize: '12px' }} 
          />
        </div>

        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-link text-secondary p-0 border-0">
            <Bell size={18} />
          </button>
          <button 
            className="btn btn-link text-secondary p-0 border-0"
            onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            className="btn btn-primary rounded-pill px-4 py-1.5 fw-semibold border-0"
            style={{ fontSize: '12px' }}
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
