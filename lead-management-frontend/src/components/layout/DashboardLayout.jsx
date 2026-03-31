import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, activeTab, onTabChange, title, subtitle, role }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 992);
  const [isSidebarMobileVisible, setIsSidebarMobileVisible] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth > 992) {
      setIsSidebarOpen(prev => !prev);
    } else {
      setIsSidebarMobileVisible(prev => !prev);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        isOpen={window.innerWidth > 992 ? isSidebarOpen : isSidebarMobileVisible}
        onClose={() => setIsSidebarMobileVisible(false)}
        activeTab={activeTab}
        onTabChange={onTabChange}
        role={role || user?.role}
        userEmail={user?.email}
        isCollapsed={!isSidebarOpen}
        onToggle={handleToggleSidebar}
      />

      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={logout}
        role={role || user?.role}
        userEmail={user?.email}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onToggleSidebar={handleToggleSidebar}
        className={!isSidebarOpen ? 'sidebar-closed' : ''}
      />

      <main className={`main-content ${!isSidebarOpen ? 'sidebar-closed' : ''}`} style={{ backgroundColor: 'var(--bg-body)' }}>
        <div className="container-fluid animate-fade-in p-3">
          {(title || subtitle) && (
            <div className="mb-3 px-2">
              {title && <h2 className="fw-black mb-0 text-white" style={{ fontSize: '1.25rem' }}>{title}</h2>}
              {subtitle && <p className="text-muted small fw-bold text-uppercase mb-0" style={{ fontSize: '10px' }}>{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
