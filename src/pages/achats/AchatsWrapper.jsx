import React from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../hooks/useAuthHook.js";

const AchatsWrapper = ({ children }) => {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Layout profile={profile} onLogout={handleLogout}>
      {children}
    </Layout>
  );
};

export default AchatsWrapper;
