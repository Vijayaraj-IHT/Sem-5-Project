import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

/**
 * DashboardLayout for authenticated views with fixed top navbar and left sidebar.
 * 
 * @param {React.ReactNode} [children] - Content to render. Falls back to <Outlet /> if omitted.
 */
const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main
          className="flex-1 ml-64 mt-16 p-6 min-h-[calc(100vh-4rem)] bg-slate-50 overflow-x-hidden text-slate-900"
          role="main"
        >
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
