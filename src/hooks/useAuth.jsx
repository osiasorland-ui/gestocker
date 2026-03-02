import { useState, useEffect } from "react";
import React from "react";
import { auth, users } from "../config/supabase";
import { AuthContext } from "./authContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);

  // Charger les données utilisateur complètes
  const loadUserProfile = async (userId) => {
    try {
      const { data: profileData, error: profileError } =
        await users.getProfile(userId);

      if (profileError) {
        return;
      }

      setProfile(profileData);

      // Charger les permissions
      if (profileData) {
        const { data: permissionsData, error: permissionsError } =
          await users.getUserPermissions(profileData.id_user);

        if (!permissionsError && permissionsData) {
          const perms = permissionsData
            .map((p) => p.permission_name)
            .filter(Boolean);
          setPermissions(perms);
        }
      }
    } catch (error) {}
  };

  // Initialiser l'authentification
  useEffect(() => {
    const initializeAuth = async () => {
      // Plus de vérification localStorage - démarrage frais
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Fonctions d'authentification
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signIn(email, password);

      if (error) {
        throw error;
      }

      // Si connexion réussie, charger le profil uniquement
      if (data.user) {
        // Mettre à jour l'état
        setUser(data.user);

        // Utiliser id_user depuis notre table ou id depuis Supabase Auth
        const userId = data.user.id_user || data.user.id;
        await loadUserProfile(userId);
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    setLoading(true);
    try {
      // Utiliser notre fonction personnalisée depuis supabase.js
      const result = await auth.signUp(email, password, metadata);

      if (result.error) {
        throw new Error(result.error);
      }

      // Si inscription réussie, charger le profil uniquement
      if (result.data?.user) {
        // Mettre à jour l'état
        setUser(result.data.user);

        // Utiliser id_user depuis notre table ou id depuis Supabase Auth
        const userId = result.data.user.id_user || result.data.user.id;
        await loadUserProfile(userId);
      }

      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await auth.signOut();

      if (error) {
        throw error;
      }

      // Nettoyer l'état uniquement
      setUser(null);
      setProfile(null);
      setPermissions([]);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data, error } = await auth.resetPassword(email);

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updatePassword = async (newPassword) => {
    setLoading(true);
    try {
      const { data, error } = await auth.updatePassword(newPassword);

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: "User not authenticated" };

    setLoading(true);
    try {
      const { data, error } = await users.updateProfile(
        profile?.id_user || user.id,
        updates,
      );

      if (error) {
        throw error;
      }

      // Recharger le profil
      await loadUserProfile(profile?.id_user || user.id);

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Vérifier les permissions
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const hasRole = (roleName) => {
    return profile?.roles?.libelle === roleName;
  };

  const hasAnyRole = (roleNames) => {
    return roleNames.includes(profile?.roles?.libelle);
  };

  const hasAnyPermission = (permissionNames) => {
    return permissionNames.some((permission) =>
      permissions.includes(permission),
    );
  };

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = () => {
    return !!user && !!profile;
  };

  // Obtenir l'entreprise actuelle
  const getCurrentCompany = () => {
    return profile?.entreprises || null;
  };

  const value = {
    // État
    user,
    profile,
    loading,
    permissions,

    // Fonctions d'authentification
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,

    // Utilitaires
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAnyPermission,
    isAuthenticated,
    getCurrentCompany,

    // États dérivés
    isAdmin: hasRole("ADMIN") || hasRole("SUPER_ADMIN"),
    isManager: hasAnyRole(["ADMIN", "SUPER_ADMIN", "MANAGER"]),
    isStockManager: hasAnyRole([
      "ADMIN",
      "SUPER_ADMIN",
      "MANAGER",
      "STOCK_MANAGER",
    ]),
    isEmployee: hasAnyRole([
      "ADMIN",
      "SUPER_ADMIN",
      "MANAGER",
      "STOCK_MANAGER",
      "EMPLOYEE",
    ]),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
