import React from "react";
import Layout from "../../components/Layout";
import Livreurs from "./Livreurs";
import { useAuth } from "../../hooks/useAuthHook.js";

const LivreursWrapper = () => {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Layout profile={profile} onLogout={handleLogout}>
      <Livreurs />
    </Layout>
  );
};

export default LivreursWrapper;
