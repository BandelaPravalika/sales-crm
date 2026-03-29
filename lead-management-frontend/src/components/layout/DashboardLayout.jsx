import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ children, activeTab, onTabChange, title, subtitle, role }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggleTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div className={`dashboard-wrapper min-vh-100 ${theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}`}>
      {/* Sidebar - Fixed on desktop, Overlay on mobile */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        activeTab={activeTab}
        onTabChange={onTabChange}
        role={role || user?.role}
        userEmail={user?.email}
      />

      {/* Main Content Area */}
      <div className="content-shifted transition-smooth flex-grow-1 d-flex flex-column min-vh-100">
        {/* Navbar - Fixed at the top within the shifted area */}
        <Navbar 
          onOpenSidebar={() => setIsSidebarOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onLogout={logout}
          title={title}
          subtitle={subtitle}
        />

        {/* Dynamic Page Content */}
        <main className="main-content-layout container-fluid px-3 px-md-4 px-lg-5 flex-grow-1">
           <div className="animate-fade-in py-4">
              {children}
           </div>
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
