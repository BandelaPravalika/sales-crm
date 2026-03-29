import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, activeTab, onTabChange, title, subtitle, role }) => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggleTheme = (newTheme) => setTheme(newTheme);
  const handleToggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <div className="dashboard-wrapper min-vh-100 flex-column d-flex overflow-hidden">
      <Navbar 
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLogout={logout}
        role={role || user?.role}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="d-flex flex-grow-1 position-relative overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={onTabChange}
          role={role || user?.role}
          userEmail={user?.email}
        />

        <main 
          className="main-content-layout flex-grow-1 overflow-auto custom-scroll content-shifted position-relative"
          style={{ 
            marginTop: 'var(--navbar-height)',
            minHeight: 'calc(100vh - var(--navbar-height))'
          }}
        >
           <div className="container-fluid py-4 px-3 px-md-4 px-xl-5 animate-fade-in h-100">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
