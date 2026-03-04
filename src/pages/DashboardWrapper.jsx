import React from "react";
import Layout from "../components/Layout";
import Dashboard from "./Dashboard";
import { useAuth } from "../hooks/useAuth";

const DashboardWrapper = () => {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Layout profile={profile} onLogout={handleLogout}>
      <Dashboard />
    </Layout>
  );
};

export default DashboardWrapper;
