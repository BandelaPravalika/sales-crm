// NAVIGATION STABILIZED - CACHE BREAKER v1.1
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
  FileText,
  IndianRupee,
  Upload,
  Menu,
  Phone as PhoneIcon
} from 'lucide-react';
import AttendanceWidget from './AttendanceWidget';

const Sidebar = ({ isOpen, onClose, activeTab, onTabChange, role, userEmail, isCollapsed, onToggle }) => {
  const getNavItems = () => {
    const isAdmin = role === 'ADMIN';
    const isManager = role === 'MANAGER';
    const isTL = role === 'TEAM_LEADER' || role === 'ASSOCIATE_TEAM_LEAD';
    const isAssociate = role === 'ASSOCIATE';

    if (isAdmin) {
      return [
        { id: 'overview', label: 'Operational Intelligence', icon: LayoutDashboard },
        { id: 'hierarchy', label: 'Global Team Hierarchy', icon: Layers },
        { id: 'pipeline', label: 'Dynamic Lead Pipeline', icon: Target },
        { id: 'users', label: 'Access & Identity Control', icon: Users },
        { id: 'revenue', label: 'Financial Audit Trail', icon: TrendingUp },
        { id: 'attendance-logs', label: 'Workforce Attendance', icon: FileText },
        { id: 'attendance-settings', label: 'Governance Settings', icon: Settings },
        { id: 'call-logs', label: 'Communication Archive', icon: PhoneIcon },
      ];
    }

    if (isManager) {
      return [
        { id: 'overview', label: 'Branch Analytics', icon: LayoutDashboard },
        { id: 'hierarchy', label: 'Team Hierarchy', icon: Layers },
        { id: 'pipeline', label: 'Lead Lifecycle', icon: Target },
        { id: 'users', label: 'Staff Management', icon: Users },
        { id: 'ingestion', label: 'Lead Ingestion', icon: Upload },
        { id: 'payments', label: 'Payment Ledger', icon: IndianRupee },
        { id: 'attendance-logs', label: 'Attendance Logs', icon: FileText },
        { id: 'call-logs', label: 'Call Archive', icon: PhoneIcon },
        { id: 'reports', label: 'Strategic Reports', icon: FileText },
      ];
    }

    if (isTL) {
      return [
        { id: 'performance', label: 'Team Analytics', icon: LayoutDashboard },
        { id: 'leads', label: 'Team Lead Pool', icon: Target },
        { id: 'team', label: 'My Team', icon: Users },
        { id: 'tasks', label: 'Follow-up Tasks', icon: FileText },
        { id: 'ingestion', label: 'Lead Ingestion', icon: Upload },
        { id: 'payments', label: 'Team Conversions', icon: IndianRupee },
        { id: 'call-logs', label: 'Call Archive', icon: PhoneIcon },
      ];
    }

    if (isAssociate) {
      return [
        { id: 'performance', label: 'Performance Hub', icon: LayoutDashboard },
        { id: 'leads', label: 'My Lead Pool', icon: Target },
        { id: 'ingestion', label: 'Lead Ingestion', icon: Upload },
        { id: 'tasks', label: 'Today\'s Task List', icon: FileText },
        { id: 'payments', label: 'My Conversions', icon: IndianRupee },
      ];
    }

    return [{ id: 'overview', label: 'Dashboard', icon: LayoutDashboard }];
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

      <aside className={`glass-sidebar ${isOpen ? 'show' : ''} ${isCollapsed ? 'closed' : ''}`}>
        <div className="d-flex flex-column h-100">
          <div className={`p-4 d-flex align-items-center border-bottom border-white border-opacity-5 transition-all ${isCollapsed ? 'justify-content-center' : 'justify-content-between'}`}>
            {!isCollapsed && (
              <div className="d-flex align-items-center gap-2">
                <div className="p-1 bg-primary bg-opacity-10 rounded text-primary">
                  <Layers size={16} />
                </div>
                <span className="fw-black text-white small tracking-widest opacity-75">NAVIGATION</span>
              </div>
            )}
            <button 
                className="btn btn-link text-white p-0 border-0 shadow-none opacity-50 hover-opacity-100 transition-all"
                onClick={onToggle || onClose}
            >
                {isCollapsed ? <Menu size={20} className="text-primary" /> : <Menu size={18} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-grow-1 overflow-auto custom-scroll py-2">
             {!isCollapsed && (
               <div className="px-4 mb-3 d-none d-lg-block opacity-25">
                  <div className="h-px bg-white w-25"></div>
               </div>
             )}
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
                    title={item.label}
                  >
                    <Icon size={20} />
                    {!isCollapsed && <span className="animate-fade-in">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer with Widget */}
          <div className="mt-auto border-top border-white border-opacity-5 pt-2">
            <AttendanceWidget isCollapsed={isCollapsed} />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
