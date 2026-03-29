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
        { id: 'tasks', label: 'Today\'s Tasks', icon: FileText },
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed-top w-100 h-100 bg-black bg-opacity-50 z-40 d-lg-none"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      <aside className={`glass-sidebar ${isOpen ? 'show' : ''}`}>
        <div className="d-flex flex-column h-100">
          {/* Mobile Header */}
          <div className="d-lg-none p-4 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-5">
            <span className="fw-bold text-white small tracking-wider opacity-75">MENU</span>
            <button className="btn btn-link text-white p-0 border-0" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-grow-1 overflow-auto custom-scroll py-4">
             <div className="px-3 mb-2 d-none d-lg-block">
                <span className="text-muted fw-bold small text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Dashboard Matrix</span>
             </div>
            <div className="d-flex flex-column gap-1">
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
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* User Profile Section */}
          <div className="p-4 mt-auto border-top border-white border-opacity-5">
            <div className="p-3 premium-card d-flex align-items-center gap-3">
              <div className="flex-shrink-0 p-2 bg-primary bg-opacity-10 rounded-circle border border-primary border-opacity-20 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <Users size={18} className="text-primary" />
              </div>
              <div className="overflow-hidden">
                <div className="fw-bold text-white text-truncate small">{userEmail}</div>
                <div className="text-muted fw-medium text-uppercase tracking-tighter" style={{ fontSize: '9px' }}>{role?.replace(/_/g, ' ')}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
