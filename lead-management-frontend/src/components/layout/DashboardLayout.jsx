import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, activeTab, onTabChange, role }) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1200);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (windowWidth > 992) {
      setIsCollapsed(!isCollapsed);
    } else {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        isOpen={window.innerWidth > 992 ? true : isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        activeTab={activeTab}
        onTabChange={onTabChange}
        role={role || user?.role}
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
      />

      <div className={`main-content ${isCollapsed ? 'sidebar-closed' : ''}`} style={{ transition: 'margin-left 0.3s ease' }}>
        <Navbar 
          isCollapsed={isCollapsed} 
          userEmail={user?.email} 
          onLogout={logout} 
          onToggleSidebar={toggleSidebar} 
        />
        
        <div className="container-fluid p-4 animate-fade-in" style={{ marginTop: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
