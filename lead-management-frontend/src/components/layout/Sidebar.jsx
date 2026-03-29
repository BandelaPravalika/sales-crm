import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  IndianRupee, 
  Zap, 
  ClipboardList, 
  Phone,
  Settings,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  X,
  GitBranch,
  CheckSquare,
  Upload
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, activeTab, onTabChange, role, userEmail }) => {
  const adminItems = [
    { id: 'stats', label: 'System Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users & Roles', icon: ShieldCheck },
    { id: 'leads', label: 'Pipeline Explorer', icon: ClipboardList },
    { id: 'payments', label: 'Revenue Flow', icon: IndianRupee }
  ];

  const managerItems = [
    { id: 'stats', label: 'Strategic Overview', icon: LayoutDashboard },
    { id: 'hierarchy', label: 'Staff Hierarchy', icon: GitBranch },
    { id: 'leads', label: 'Leads Pipeline', icon: Users },
    { id: 'ingestion', label: 'Lead Ingestion', icon: Upload }, // Use Upload icon for Ingestion
    { id: 'users', label: 'Users & Roles', icon: UserPlus },
    { id: 'payments', label: 'Revenue Flow', icon: IndianRupee }
  ];

  const tlItems = [
    { id: 'leads', label: 'My Leads', icon: ClipboardList },
    { id: 'ingestion', label: 'Lead Ingestion', icon: Upload },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'team', label: 'Team Matrix', icon: Users },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'payments', label: 'Revenue Flow', icon: IndianRupee }
  ];

  const associateItems = [
    { id: 'leads', label: 'My Leads', icon: Users },
    { id: 'ingestion', label: 'Lead Ingestion', icon: Upload },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'payments', label: 'Payment History', icon: IndianRupee }
  ];

  const getNavItems = () => {
    switch (role) {
      case 'ADMIN': return adminItems;
      case 'MANAGER': return managerItems;
      case 'TEAM_LEADER': return tlItems;
      case 'ASSOCIATE': return associateItems;
      default: return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 z-50 d-lg-none" 
          onClick={onClose}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`glass-sidebar d-flex flex-column transition-smooth sidebar-permanent shadow-2xl ${isOpen ? 'show' : ''}`}>
        <div className="p-4 d-flex flex-column h-100">
          {/* Brand Section */}
          <div className="p-2 mb-4 border-bottom border-white border-opacity-5">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 bg-primary rounded-3 shadow-sm text-white flex-shrink-0">
                <Zap size={24} fill="currentColor" />
              </div>
              <div className="overflow-hidden">
                <h5 className="fw-bold mb-0 text-white tracking-widest text-uppercase" style={{ fontSize: '13px' }}>NEXUS LMS</h5>
                <p className="mb-0 text-primary fw-bold tracking-widest" style={{ fontSize: '8px', opacity: 0.8 }}>STRATEGIC OPERATIONS</p>
              </div>
            </div>
          </div>

          <nav className="flex-grow-1 overflow-auto custom-scroll pe-2">
            <div className="d-flex flex-column gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onTabChange(item.id);
                      if (window.innerWidth < 992) onClose();
                    }}
                    className={`nav-link-premium border-0 w-100 text-start d-flex align-items-center gap-3 py-3 px-3 rounded-4 mb-1 transition-smooth ${isActive ? 'active' : 'text-muted'}`}
                    style={{ position: 'relative' }}
                  >
                    <Icon size={18} className={`${isActive ? 'text-primary' : ''} flex-shrink-0`} />
                    <span className={`fw-bold small ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer User Profile */}
          <div className="mt-auto pt-4 border-top border-white border-opacity-10">
            <div className="p-3 rounded-4 bg-primary bg-opacity-5 d-flex align-items-center gap-3 border border-primary border-opacity-10 shadow-sm">
              <div className="p-2 bg-dark rounded-circle border border-primary border-opacity-20 text-primary flex-shrink-0">
                <TrendingUp size={16} />
              </div>
              <div className="d-flex flex-column overflow-hidden text-truncate">
                <span className="fw-bold small text-truncate text-white">{userEmail}</span>
                <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '9px' }}>{role?.replace(/_/g, ' ')} Portal</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
