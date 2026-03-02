import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Fonctions utilitaires pour l'authentification avec table utilisateurs personnalisée
export const auth = {
  // Connexion avec email et mot de passe (vérification dans table utilisateurs)
  signIn: async (email, password) => {
    try {
      console.log("🔍 Début signIn avec:", email);

      // Utiliser la RPC pour vérifier les identifiants (bypass RLS)
      console.log("📞 Appel RPC signin_check_credentials...");
      const { data: userData, error: rpcError } = await supabase.rpc(
        "signin_check_credentials",
        {
          p_email: email,
          p_mot_de_passe: password,
        },
      );

      console.log("📊 Réponse RPC:", { userData, rpcError });

      if (rpcError) {
        console.error("❌ Erreur RPC:", rpcError);
        return { data: null, error: rpcError.message };
      }

      if (!userData || userData.error) {
        console.error("❌ Données invalides:", userData);
        return {
          data: null,
          error: userData?.error || "Email ou mot de passe incorrect",
        };
      }

      console.log("✅ Utilisateur trouvé, tentative Supabase Auth...");
      // Essayer la connexion Supabase Auth si l'utilisateur existe là-bas
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      console.log("🔐 Réponse Supabase Auth:", { authData, authError });

      // Si la connexion Supabase Auth échoue, créer une session basique
      if (authError) {
        console.warn(
          "⚠️ Connexion Supabase Auth échouée, utilisation des données locales:",
          authError,
        );

        // Créer une session basique avec les données de notre table
        const result = {
          data: {
            user: userData[0], // Prendre le premier utilisateur du tableau
            session: {
              user: userData[0],
              access_token: "local_token",
              refresh_token: "local_refresh",
              expires_at: Date.now() + 3600000, // 1 heure
            },
          },
          error: null,
        };
        console.log("🎯 Retour session basique:", result);
        return result;
      }

      const finalResult = { data: authData, error: null };
      console.log("🎉 Retour final:", finalResult);
      return finalResult;
    } catch (error) {
      console.error("💥 Erreur générale signIn:", error);
      return { data: null, error: error.message };
    }
  },

  // Inscription
  signUp: async (email, password, metadata = {}) => {
    try {
      // Étape 1: Créer entreprise + utilisateur (tables métier) via RPC SECURITY DEFINER
      // Ceci évite les blocages RLS sur les inserts.
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "signup_create_company_and_user",
        {
          p_nom_commercial: metadata.nom_entreprise,
          p_raison_sociale: metadata.raison_sociale || null,
          p_ifu: metadata.ifu,
          p_registre_commerce: metadata.registre_commerce,
          p_adresse_siege: metadata.adresse_siege || null,
          p_telephone_contact: metadata.telephone_entreprise || null,
          p_email_entreprise: metadata.email_entreprise || null,
          p_nom_user: metadata.nom || "Utilisateur",
          p_email_user: email,
          p_mot_de_passe: password,
          p_id_role: metadata.id_role || null,
        },
      );

      if (rpcError) {
        console.error("Erreur RPC:", rpcError);
        return {
          data: null,
          error: `Erreur de configuration: ${rpcError.message}. Veuillez contacter l'administrateur pour déployer les fonctions RPC.`,
        };
      }

      const entrepriseId = rpcData?.id_entreprise ?? null;
      const userId = rpcData?.id_user ?? null;

      // Étape 3: Créer le compte Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_id: userId,
            entreprise_id: entrepriseId,
            ...metadata,
          },
        },
      });

      return {
        data: {
          user: { id_user: userId, email },
          entreprise: entrepriseId,
          auth: authData,
        },
        error: authError,
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Déconnexion
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Réinitialisation du mot de passe
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },

  // Mettre à jour le mot de passe
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  // Obtenir l'utilisateur actuel
  getCurrentUser: async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return { user: null, error };
      }

      // Récupérer les données complètes depuis notre table
      const { data: userData, error: userError } = await supabase
        .from("utilisateurs")
        .select(
          `
          *,
          roles (*),
          entreprises (*)
        `,
        )
        .eq("email", user.email)
        .single();

      return { user: userData || user, error: userError };
    } catch (error) {
      return { user: null, error };
    }
  },

  // Obtenir la session actuelle
  getCurrentSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  },

  // Écouter les changements d'authentification
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Fonctions pour la gestion des utilisateurs
export const users = {
  // Obtenir le profil complet de l'utilisateur
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from("utilisateurs")
      .select(
        `
        *,
        roles (*),
        entreprises (*)
      `,
      )
      .eq("id_user", userId)
      .single();

    return { data, error };
  },

  // Mettre à jour le profil utilisateur
  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from("utilisateurs")
      .update(updates)
      .eq("id_user", userId)
      .select();

    return { data, error };
  },

  // Vérifier si un utilisateur a une permission spécifique
  hasPermission: async (userId, permission) => {
    const { data, error } = await supabase.rpc("has_permission", {
      user_id_param: userId,
      permission_name: permission,
    });

    return { data, error };
  },

  // Obtenir les permissions de l'utilisateur
  getUserPermissions: async (userId) => {
    const { data, error } = await supabase.rpc("get_user_permissions", {
      user_id_param: userId,
    });

    return { data, error };
  },
};

// Fonctions pour la gestion des entreprises
export const companies = {
  // Créer une nouvelle entreprise
  createCompany: async (companyData) => {
    const { data, error } = await supabase
      .from("entreprises")
      .insert(companyData)
      .select();

    return { data, error };
  },

  // Obtenir les entreprises de l'utilisateur
  getUserCompanies: async (userId) => {
    const { data, error } = await supabase
      .from("entreprises")
      .select(
        `
        *,
        utilisateurs!inner (
          id_user,
          nom,
          email
        )
      `,
      )
      .eq("utilisateurs.id_user", userId);

    return { data, error };
  },
};

export default supabase;
