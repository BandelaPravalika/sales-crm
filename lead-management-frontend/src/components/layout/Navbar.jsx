import React from 'react';
import { 
  Menu, 
  Sun, 
  Moon, 
  LogOut, 
  Search, 
  Bell, 
  Zap 
} from 'lucide-react';

const Navbar = ({ onOpenSidebar, theme, onToggleTheme, onLogout, title, subtitle }) => {
  return (
    <nav className="navbar-premium border-bottom px-4 sticky-top transition-smooth">
      <div className="d-flex align-items-center justify-content-between h-100 container-fluid px-0">
        {/* Left Section: Context */}
        <div className="d-flex align-items-center gap-3 overflow-hidden">
          <button 
            className="btn btn-link link-body-emphasis p-0 d-lg-none" 
            onClick={onOpenSidebar}
          >
            <Menu size={22} className="text-primary" />
          </button>
          
          <div className="d-flex flex-column overflow-hidden text-truncate">
            <h6 className="mb-0 fw-bold tracking-tight text-uppercase small text-primary text-truncate">{title || 'Dashboard'}</h6>
            <span className="text-muted fw-bold italic text-truncate" style={{ fontSize: '10px' }}>{subtitle || 'LMS Control Center'}</span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-grow-1 mx-4 d-none d-md-block max-w-search">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-secondary bg-opacity-10 border-0 text-muted ps-3">
              <Search size={14} />
            </span>
            <input 
              type="text" 
              className="form-control border-0 bg-secondary bg-opacity-10 shadow-none ps-1 text-white fw-bold" 
              placeholder="System search..." 
            />
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
          {/* Notifications */}
          <button className="btn btn-link p-2 text-muted rounded-circle hover-bg-dark position-relative border-0 shadow-none">
            <Bell size={20} />
            <span className="position-absolute top-2 end-2 p-1 bg-primary border-0 rounded-circle pulse-alert" />
          </button>

          {/* Theme Switcher */}
          <div className="d-flex align-items-center bg-secondary bg-opacity-10 p-1 rounded-pill">
            <button 
              onClick={() => onToggleTheme('light')} 
              className={`btn btn-sm rounded-pill p-1 px-3 border-0 transition-smooth ${theme === 'light' ? 'bg-white text-primary shadow' : 'text-muted opacity-50'}`}
            >
              <Sun size={14} />
            </button>
            <button 
              onClick={() => onToggleTheme('dark')} 
              className={`btn btn-sm rounded-pill p-1 px-3 border-0 transition-smooth ${theme === 'dark' ? 'bg-primary text-white shadow' : 'text-muted opacity-50'}`}
            >
              <Moon size={14} />
            </button>
          </div>

          {/* Logout Section */}
          <div className="border-start border-white border-opacity-10 ps-3 ms-2 d-none d-sm-block">
             <button 
                onClick={onLogout} 
                className="btn btn-primary btn-sm rounded-pill px-4 fw-black text-uppercase tracking-wider transition-smooth hover-scale"
             >
                <LogOut size={16} />
                <span className="ms-2 d-none d-lg-inline">Logout</span>
             </button>
          </div>
        </div>
      </div>

      <style>{`
        .navbar-premium {
          height: var(--header-height, 80px);
          background: rgba(11, 15, 26, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 1020;
          width: 100%;
          top: 0;
        }

        .max-w-search { max-width: 400px; }
        
        @media (min-width: 992px) {
          .navbar-premium {
            /* Position sticky within shifted container needs no manual offset */
          }
        }

        .pulse-alert {
          width: 8px;
          height: 8px;
          box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
          animation: pulse-ring 1.5s infinite;
        }

        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }

        .hover-bg-dark:hover { background: rgba(255, 255, 255, 0.05); }
        .hover-scale:hover { transform: scale(1.05); }
      `}</style>
    </nav>
  );
};

export default Navbar;
