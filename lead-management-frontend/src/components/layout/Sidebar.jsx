import React from 'react';
import { 
  LayoutDashboard, Users, Layers, Target, TrendingUp, Settings, 
  LogOut, Phone as PhoneIcon, Upload, IndianRupee, FileText, Menu, X, ShieldHalf 
} from 'lucide-react';
import AttendanceWidget from './AttendanceWidget';

const Sidebar = ({ isOpen, onClose, activeTab, onTabChange, role, isCollapsed, onToggle }) => {
  const getNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'hierarchy', label: 'Management Matrix', icon: Layers },
          { id: 'pipeline', label: 'Leads', icon: Target },
          { id: 'tasks', label: 'Task Matrix', icon: Layers },
          { id: 'users', label: 'Staff Node', icon: Users },
          { id: 'revenue', label: 'Revenues', icon: TrendingUp },
          { id: 'ingestion', label: 'Bulk Ingestion', icon: Upload },
          { id: 'attendance-logs', label: 'Attendance', icon: FileText },
          { id: 'call-logs', label: 'Call Logs', icon: PhoneIcon },
          { id: 'tickets', label: 'Support Ledger', icon: ShieldHalf },
          { id: 'attendance-settings', label: 'Settings', icon: Settings },
        ];
      case 'MANAGER':
        return [
          { id: 'my-stats', label: 'Personal Command', icon: ShieldHalf },
          { id: 'overview', label: 'Team Performance', icon: LayoutDashboard },
          { id: 'hierarchy', label: 'Management Matrix', icon: Layers },
          { id: 'pipeline', label: 'Leads', icon: Target },
          { id: 'tasks', label: 'Task Matrix', icon: Layers },
          { id: 'users', label: 'Staff Node', icon: Users },
          { id: 'payments', label: 'Revenues', icon: IndianRupee },
          { id: 'ingestion', label: 'Bulk Ingestion', icon: Upload },
          { id: 'attendance-logs', label: 'Attendance', icon: FileText },
          { id: 'call-logs', label: 'Call Logs', icon: PhoneIcon },
          { id: 'tickets', label: 'Raise Ticket', icon: ShieldHalf },
        ];
      case 'TEAM_LEADER':
        return [
          { id: 'my-stats', label: 'Personal Command', icon: ShieldHalf },
          { id: 'overview', label: 'Team Performance', icon: LayoutDashboard },
          { id: 'pipeline', label: 'Leads', icon: Target },
          { id: 'tasks', label: 'Task Matrix', icon: Layers },
          { id: 'payments', label: 'Revenues', icon: IndianRupee },
          { id: 'attendance', label: 'Attendance', icon: FileText },
          { id: 'call-logs', label: 'Call Logs', icon: PhoneIcon },
          { id: 'reports', label: 'Reports', icon: TrendingUp },
          { id: 'ingestion', label: 'Bulk Ingestion', icon: Upload },
          { id: 'tickets', label: 'Raise Ticket', icon: ShieldHalf },
        ];
      case 'ASSOCIATE':
        return [
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'leads', label: 'Leads', icon: Target },
          { id: 'tasks', label: 'Task Matrix', icon: Layers },
          { id: 'call-logs', label: 'Call Logs', icon: PhoneIcon },
          { id: 'payments', label: 'Revenues', icon: IndianRupee },
          { id: 'attendance', label: 'Attendance', icon: FileText },
          { id: 'reports', label: 'Reports', icon: TrendingUp },
          { id: 'tickets', label: 'Raise Ticket', icon: ShieldHalf },
        ];
      default:
        return [{ id: 'overview', label: 'Dashboard', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      <div 
        className={`fixed-top w-100 h-100 bg-black opacity-50 z-index-top d-lg-none ${isOpen ? 'd-block' : 'd-none'}`} 
        style={{ zIndex: 1040 }} 
        onClick={onClose} 
      />
      
      <aside 
        className={`glass-sidebar ${isCollapsed ? 'closed' : ''} ${isOpen ? 'show' : ''}`}
      >
        <div className="d-flex flex-column h-100">
          <div className="p-4 d-flex align-items-center justify-content-between border-bottom border-white border-opacity-5">
            {!isCollapsed && (
              <div className="d-flex align-items-center gap-2">
                <div className="p-1.5 bg-primary rounded-pill">
                  <ShieldHalf size={18} className="text-white" />
                </div>
                <span className="fw-black tracking-widest small text-main">GYNATRIX</span>
              </div>
            )}
            {isCollapsed && <ShieldHalf size={24} className="text-primary mx-auto" />}
            
            {/* Desktop toggle button */}
            <button 
              className="btn btn-link text-main p-1 border-0 ms-2 hover-bg-surface rounded-circle transition-all d-none d-lg-flex" 
              onClick={onToggle} 
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              <Menu size={18} className="opacity-75" />
            </button>

            {/* Mobile close button */}
            <button
              className="btn btn-link text-main p-1 border-0 sidebar-mobile-close"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-grow-1 py-3 overflow-auto custom-scroll">
            <div className="d-flex flex-column">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onTabChange(item.id); if (window.innerWidth < 992) onClose(); }}
                    className={`nav-link-premium border-0 ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon size={18} className={isActive ? 'text-primary' : 'text-muted'} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="mt-auto border-top border-white border-opacity-5 p-2 bg-surface bg-opacity-10">
            <AttendanceWidget isCollapsed={isCollapsed} />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
