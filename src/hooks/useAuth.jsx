import { useState, useEffect } from "react";
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
      console.log("🔍 loadUserProfile appelé avec userId:", userId);

      const { data: profileData, error: profileError } =
        await users.getProfile(userId);

      console.log("📊 Résultat profil:", { profileData, profileError });

      if (profileError) {
        console.error("Error loading profile:", profileError);
        return;
      }

      setProfile(profileData);

      // Charger les permissions
      if (profileData) {
        const { data: permissionsData, error: permissionsError } =
          await users.getUserPermissions(profileData.id_user);

        console.log("🔐 Permissions:", { permissionsData, permissionsError });

        if (!permissionsError && permissionsData) {
          const perms = permissionsData
            .map((p) => p.permission_name)
            .filter(Boolean);
          setPermissions(perms);
        }
      }
    } catch (error) {
      console.error("Error in loadUserProfile:", error);
    }
  };

  // Initialiser l'authentification
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Obtenir la session actuelle
        const { session } = await auth.getCurrentSession();

        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Écouter les changements d'état d'authentification
    const {
      data: { subscription },
    } = auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);

      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setPermissions([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fonctions d'authentification
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signIn(email, password);

      if (error) {
        throw error;
      }

      // Si connexion réussie, charger le profil
      if (data.user) {
        // Utiliser id_user depuis notre table ou id depuis Supabase Auth
        const userId = data.user.id_user || data.user.id;
        console.log("🔍 Chargement profil pour userId:", userId);
        await loadUserProfile(userId);
      }

      return { success: true, data };
    } catch (error) {
      console.error("Sign in error:", error);
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

      return { success: true, data: result.data };
    } catch (error) {
      console.error("Sign up error:", error);
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

      setUser(null);
      setProfile(null);
      setPermissions([]);

      return { success: true };
    } catch (error) {
      console.error("Sign out error:", error);
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
      console.error("Reset password error:", error);
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
      console.error("Update password error:", error);
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
      console.error("Update profile error:", error);
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

export default AuthContext;
