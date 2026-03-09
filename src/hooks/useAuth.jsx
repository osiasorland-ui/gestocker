import { useState, useEffect } from "react";
import { auth, users, supabase } from "../config/supabase";
import { AuthContext } from "./authContext";
import {
  saveSessionToStorage,
  loadSessionFromStorage,
  clearSessionStorage,
  ROLE_NAMES,
  ROLE_GROUPS,
} from "./authUtils.js";

// Utilitaires de nettoyage pour les problèmes de rate limiting
const cleanupAuthIssues = () => {
  try {
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("migration_attempt_") ||
          key.includes("_failed") ||
          key.includes("supabase.auth.token"))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`Nettoyé: ${key}`);
    });

    console.log(`Nettoyage terminé: ${keysToRemove.length} éléments supprimés`);
    return keysToRemove.length;
  } catch (error) {
    console.error("Erreur lors du nettoyage:", error);
    return 0;
  }
};

// Ajouter un helper global dans la console pour les utilisateurs
if (typeof window !== "undefined") {
  window.cleanupAuth = cleanupAuthIssues;
  console.log(
    "Helper disponible: tapez cleanupAuth() dans la console pour nettoyer les problèmes d'auth",
  );
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  // Charger les données utilisateur complètes
  const loadUserProfile = async (userId) => {
    try {
      const { data: profileData, error: profileError } =
        await users.getProfile(userId);

      if (profileError) {
        console.error("Erreur lors du chargement du profil:", profileError);
        // Si l'erreur est "No rows found" (PGRST116), ne pas afficher d'erreur critique
        if (profileError.code !== "PGRST116") {
          return;
        }
      }

      if (profileData) {
        setProfile(profileData);

        // Charger les permissions
        const { data: permissionsData, error: permissionsError } =
          await users.getUserPermissions(profileData.id_user);

        if (!permissionsError && permissionsData) {
          const perms = permissionsData
            .map((p) => p.permission_name)
            .filter(Boolean);
          setPermissions(perms);
        } else if (permissionsError) {
          console.error(
            "Erreur lors du chargement des permissions:",
            permissionsError,
          );
        }
      } else {
        console.log("Aucun profil trouvé pour l'ID:", userId);
        // Ne pas considérer comme une erreur critique
      }
    } catch (error) {
      console.error("Erreur dans loadUserProfile:", error);
    }
  };

  // Autres fonctions d'authentification...

  // Initialiser l'authentification
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);

      try {
        // Vérifier la session Supabase d'abord
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("Session Supabase trouvée:", session);

        if (session?.user) {
          console.log("Utilisateur Supabase authentifié:", session.user);
          setUser(session.user);

          // Récupérer les données complètes depuis notre table
          const customUserId =
            session.user.user_metadata?.custom_user_id || session.user.id;
          console.log("Chargement du profil pour ID:", customUserId);
          await loadUserProfile(customUserId);
        } else {
          console.log(
            "Pas de session Supabase, vérification stockage local...",
          );
          // Essayer de charger la session depuis le stockage local
          const storedSession = loadSessionFromStorage();

          if (storedSession) {
            console.log("Session locale trouvée:", storedSession);

            // Migration complètement désactivée pour éviter les rate limits
            // Utiliser directement le fallback local
            console.log(
              "Utilisation directe de la session locale (migration désactivée)",
            );
            setUser(storedSession.user);
            setProfile(storedSession.profile);
            setPermissions(storedSession.permissions);
          } else {
            console.log("Aucune session trouvée");
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation de l'auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Écouter les changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Changement d'état auth:", event, session);

        if (event === "SIGNED_IN" && session?.user) {
          console.log("Utilisateur connecté:", session.user);
          setUser(session.user);

          const customUserId =
            session.user.user_metadata?.custom_user_id || session.user.id;
          await loadUserProfile(customUserId);
        } else if (event === "SIGNED_OUT") {
          console.log("Utilisateur déconnecté");
          setUser(null);
          setProfile(null);
          setPermissions([]);
          clearSessionStorage();
        } else if (event === "TOKEN_REFRESHED") {
          console.log("Token rafraîchi");
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fonctions d'authentification
  const signIn = async (email, password, rememberMe = false) => {
    setLoading(true);
    console.log("=== DÉBUT CONNEXION ===");
    console.log("Email:", email);
    console.log("Password provided:", !!password);

    try {
      console.log("Appel de auth.signIn...");
      const { data, error } = await auth.signIn(email, password);

      if (error) {
        console.error("Erreur retournée par auth.signIn:", error);
        throw error;
      }

      console.log("Succès auth.signIn, data reçue:", data);

      // Si connexion réussie, charger le profil uniquement
      if (data.user) {
        console.log("Utilisateur trouvé, mise à jour de l'état...");
        // Mettre à jour l'état
        setUser(data.user);

        // Utiliser id_user depuis notre table ou id depuis Supabase Auth
        const userId = data.user.id_user || data.user.id;
        console.log("UserID pour le profil:", userId);

        console.log("Chargement du profil utilisateur...");
        await loadUserProfile(userId);

        console.log("Sauvegarde de la session...");
        // Sauvegarder la session
        const profileData = await users.getProfile(userId);
        console.log("Profil data:", profileData);
        saveSessionToStorage(
          data.user,
          profileData.data || profileData,
          rememberMe,
        );

        console.log("=== CONNEXION RÉUSSIE ===");
        return { success: true, user: data.user, data };
      } else {
        console.log("Aucun utilisateur trouvé dans data.user");
        return { success: false, error: "Aucun utilisateur trouvé" };
      }
    } catch (error) {
      console.error("=== ERREUR CONNEXION ===");
      console.error("Type d'erreur:", typeof error);
      console.error("Message d'erreur:", error.message);
      console.error("Erreur complète:", error);

      // Gérer le cas où l'erreur n'a pas de message
      const errorMessage =
        error.message || error.error || "Erreur de connexion inconnue";

      // Ajout de logging détaillé pour le debug
      console.error("=== DÉTAILS ERREUR COMPLETS ===");
      console.error("Error object:", error);
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error || {}));
      console.error("Error message:", error.message);
      console.error("Error error:", error.error);
      console.error("Error details:", error.details);
      console.error("================================");

      return { success: false, error: errorMessage };
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

      // Nettoyer l'état et le stockage
      setUser(null);
      setProfile(null);
      setPermissions([]);
      clearSessionStorage();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
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
    isAdmin: hasRole(ROLE_NAMES.ADMIN) || hasRole(ROLE_NAMES.SUPER_ADMIN),
    isManager: hasAnyRole(ROLE_GROUPS.MANAGER),
    isStockManager: hasAnyRole(ROLE_GROUPS.STOCK_MANAGER),
    isEmployee: hasAnyRole(ROLE_GROUPS.EMPLOYEE),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
