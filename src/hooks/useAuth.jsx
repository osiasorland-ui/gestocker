import { useState, useEffect } from "react";
import React from "react";
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
        return;
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
      }
    } catch (error) {
      console.error("Erreur dans loadUserProfile:", error);
    }
  };

  // Migrer la session locale vers Supabase
  const migrateLocalSessionToSupabase = async (localSession) => {
    try {
      console.log("Migration de la session locale vers Supabase...");

      if (!localSession?.profile?.id_user) {
        console.log("Pas de profil local à migrer");
        return false;
      }

      // DÉSACTIVÉ: La migration cause des problèmes de rate limiting
      // En développement, on utilise toujours le fallback local
      console.log(
        "Migration désactivée en développement, utilisation du fallback local",
      );
      return false;

      /*
      // Code de migration désactivé pour éviter les rate limits
      // Gardé comme référence pour une future implémentation plus robuste

      // Vérifier si nous avons déjà tenté la migration récemment pour éviter les boucles
      const migrationKey = `migration_attempt_${localSession.profile.id_user}`;
      const lastAttempt = localStorage.getItem(migrationKey);
      if (lastAttempt) {
        const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
        // Attendre au moins 5 minutes entre les tentatives
        if (timeSinceLastAttempt < 5 * 60 * 1000) {
          console.log("Migration récemment tentée, utilisation du fallback local");
          return false;
        }
      }

      // Marquer cette tentative
      localStorage.setItem(migrationKey, Date.now().toString());

      // Créer une session Supabase avec l'ID utilisateur
      const { error } = await supabase.auth.setSession({
        access_token: "migrated_token_" + localSession.profile.id_user,
        refresh_token: "migrated_refresh_" + localSession.profile.id_user,
      });

      if (error) {
        console.log("Erreur migration, tentative avec signUp...");

        // Alternative: créer un utilisateur Supabase temporaire
        const tempEmail = `${localSession.profile.id_user}@migrated.local`;
        const tempPassword = `temp_${localSession.profile.id_user}`;

        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: tempEmail,
            password: tempPassword,
            options: {
              data: {
                custom_user_id: localSession.profile.id_user,
                original_email: localSession.profile.email,
                migrated: true,
              },
            },
          });

        // Si rate limit ou autre erreur, ne pas retenter
        if (signUpError) {
          console.error("Échec migration permanent:", signUpError.message);
          // Marquer comme échec permanent pour cette session
          localStorage.setItem(`${migrationKey}_failed`, 'true');
          return false;
        }

        if (!signUpError && signUpData.user) {
          console.log("Session migrée avec succès via signUp");
          // Nettoyer les marqueurs d'échec
          localStorage.removeItem(`${migrationKey}_failed`);
          return true;
        }

        console.error("Échec migration inattendu");
        return false;
      }

      console.log("Session migrée avec succès");
      // Nettoyer les marqueurs d'échec
      localStorage.removeItem(`${migrationKey}_failed`);
      return true;
      */
    } catch (error) {
      console.error("Erreur migration session:", error);
      return false;
    }
  };

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
      } else {
        console.log("Aucun utilisateur trouvé dans data.user");
      }

      return { success: true, data };
    } catch (error) {
      console.error("=== ERREUR CONNEXION ===");
      console.error("Type d'erreur:", typeof error);
      console.error("Message d'erreur:", error.message);
      console.error("Erreur complète:", error);
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
