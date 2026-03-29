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

  const handleToggleTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className={`dashboard-wrapper min-vh-100 flex-column d-flex`} style={{ background: '#0f172a', color: '#fff' }}>
      <Navbar 
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLogout={logout}
        role={role || user?.role}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="d-flex flex-grow-1 h-100 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={onTabChange}
          role={role || user?.role}
          userEmail={user?.email}
        />

        {/* Main Content Area */}
        <main 
          className={`main-content-layout container-fluid p-0 flex-grow-1 overflow-auto custom-scroll content-shifted`} 
          style={{ 
            background: '#0f172a',
            transition: 'margin-left 0.3s ease'
          }}
        >
           <div className="animate-fade-in d-flex flex-column gap-3 p-4 p-md-5 pt-3" style={{ marginTop: '60px' }}>
              {children}
           </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
