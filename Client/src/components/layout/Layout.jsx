import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar toggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="flex flex-1">
        {user && (
          <Sidebar
            isOpen={sidebarOpen}
            closeSidebar={() => setSidebarOpen(false)}
          />
        )}
        <main
          className={`flex-1 transition-all duration-200 ease-in-out p-4 sm:p-6 lg:p-8 ${
            user ? 'lg:ml-64' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
