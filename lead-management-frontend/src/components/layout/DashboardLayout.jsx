import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, activeTab, onTabChange, title, subtitle, role }) => {
  const { user, logout } = useAuth();
  const [theme] = useState(localStorage.getItem('theme') || 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <div className="dashboard-wrapper">
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={onTabChange}
        role={role || user?.role}
        userEmail={user?.email}
      />

      <Navbar 
        theme={theme}
        onLogout={logout}
        role={role || user?.role}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onToggleSidebar={handleToggleSidebar}
      />

      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
         <div className="container-fluid animate-fade-in">
            {children}
         </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
