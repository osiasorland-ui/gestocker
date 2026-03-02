import React from "react";
import Navbar from "./Navbar";
import { useAuth } from "../hooks/useAuthHook.js";

const Layout = ({ children }) => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;
