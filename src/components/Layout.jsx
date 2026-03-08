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
      {/* Sidebar fixe */}
      <Sidebar isOpen={sidebarOpen} profile={profile} onLogout={onLogout} />

      {/* Contenu principal avec margin pour la sidebar */}
      <div
        className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-72" : "lg:ml-72"}`}
      >
        {/* Navbar simplifiée */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
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

          {/* Navbar simplifiée sans doublons */}
          <Navbar />
        </div>

        {/* Page Content */}
        <main className="">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
