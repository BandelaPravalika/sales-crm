import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PieChart, 
  TrendingUp, 
  Settings, 
  LogOut, 
  X,
  Layers,
  Target,
  FileText
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, activeTab, onTabChange, role, userEmail }) => {
  const getNavItems = () => {
    const commonItems = [
      { id: 'overview', label: 'System Overview', icon: LayoutDashboard },
    ];

    if (role === 'ADMIN') {
      return [
        ...commonItems,
        { id: 'users', label: 'Users & Roles', icon: Users },
        { id: 'pipeline', label: 'Pipeline Explorer', icon: Layers },
        { id: 'revenue', label: 'Revenue Flow', icon: TrendingUp },
      ];
    }

    if (role === 'MANAGER') {
      return [
        ...commonItems,
        { id: 'hierarchy', label: 'Team Hierarchy', icon: Layers },
        { id: 'pipeline', label: 'Lead Lifecycle', icon: Target },
        { id: 'reports', label: 'Strategic Reports', icon: FileText },
      ];
    }

    if (role === 'TEAM_LEADER') {
      return [
        ...commonItems,
        { id: 'leads', label: 'Team Leads', icon: Target },
        { id: 'performance', label: 'Performance Tracker', icon: PieChart },
      ];
    }

    if (role === 'ASSOCIATE') {
      return [
        ...commonItems,
        { id: 'leads', label: 'My Leads', icon: Target },
        { id: 'tasks', label: 'Today\'s Task', icon: FileText },
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop Overlay - Responsive */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 d-lg-none"
          onClick={onClose}
        />
      )}

      <aside 
        className={`glass-sidebar ${isOpen ? 'show' : ''}`}
      >
        <div className="d-flex flex-column h-100">
          {/* Header Mobile Only */}
          <div className="d-lg-none p-4 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-5">
            <span className="fw-bold text-white small tracking-wider">NAVIGATION</span>
            <button className="btn btn-link text-muted p-0 border-0" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-grow-1 overflow-auto custom-scroll pt-lg-5 pt-2 mt-lg-2">
            <div className="d-flex flex-column">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      if (window.innerWidth < 992) onClose();
                    }}
                    className={`nav-link-premium ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer Profile Tooltip Style */}
          <div className="p-4 border-top border-white border-opacity-5">
            <div className="d-flex align-items-center gap-3 p-2 rounded-3 transition-all hover-bg-dark border border-transparent hover-border-white hover-border-opacity-10">
              <div className="p-2 bg-primary bg-opacity-10 rounded-circle border border-primary border-opacity-20 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                <TrendingUp size={16} className="text-primary" />
              </div>
              <div className="overflow-hidden flex-grow-1">
                <div className="fw-bold text-white text-truncate" style={{ fontSize: '13px' }}>{userEmail}</div>
                <div className="text-muted fw-medium" style={{ fontSize: '11px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{role?.replace(/_/g, ' ')}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
