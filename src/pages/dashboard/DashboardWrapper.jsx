import React from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import Dashboard from "./Dashboard";
import { useAuth } from "../../hooks/useAuthHook.js";

const DashboardWrapper = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const accessDeniedMessage = location.state?.accessDenied || "";

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Layout profile={profile} onLogout={handleLogout}>
      {accessDeniedMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{accessDeniedMessage}</p>
            </div>
          </div>
        </div>
      )}
      <Dashboard />
    </Layout>
  );
};

export default DashboardWrapper;
