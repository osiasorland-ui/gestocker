import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children, profile, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="drawer lg:drawer-open">
        <input
          id="sidebar-toggle"
          type="checkbox"
          className="drawer-toggle"
          checked={sidebarOpen}
          onChange={(e) => setSidebarOpen(e.target.checked)}
        />

        {/* Sidebar */}
        <div className="drawer-side">
          <label htmlFor="sidebar-toggle" className="drawer-overlay"></label>
          <Sidebar isOpen={sidebarOpen} profile={profile} onLogout={onLogout} />
        </div>

        {/* Main Content */}
        <div className="drawer-content">
          {/* Toggle button pour mobile */}
          <div className="lg:hidden bg-white border-b border-gray-200 p-4">
            <button
              className="btn btn-square btn-ghost drawer-button hover:bg-gray-100 transition-colors"
              onClick={handleToggleSidebar}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Navbar existant */}
          <Navbar />

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
