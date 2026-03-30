import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, activeTab, onTabChange, title, subtitle, role }) => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 992);
  const [isSidebarMobileVisible, setIsSidebarMobileVisible] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggleTheme = (newTheme) => {
    setTheme(newTheme);
  };

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
        onLogout={logout}
        role={role || user?.role}
        userEmail={user?.email}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onToggleSidebar={handleToggleSidebar}
        onToggleTheme={handleToggleTheme}
        className={!isSidebarOpen ? 'sidebar-closed' : ''}
      />

      <main className={`main-content ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
         <div className="container-fluid animate-fade-in py-4">
            {(title || subtitle) && (
              <div className="mb-4 px-2">
                {title && <h2 className="fw-black mb-0 text-white tracking-tight">{title}</h2>}
                {subtitle && <p className="text-muted small fw-bold text-uppercase tracking-widest opacity-50 mb-0" style={{ fontSize: '10px' }}>{subtitle}</p>}
              </div>
            )}
            {children}
         </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
