import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service d'authentification Supabase
export const supabaseAuthService = {
  // Récupérer la liste des entreprises pour le formulaire d'inscription
  getEntreprises: async () => {
    try {
      const { data, error } = await supabase
        .from("entreprises")
        .select("id_entreprise, nom_commercial");

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Inscription d'un nouvel utilisateur
  signUp: async (email, password, userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nom: userData.nom,
            telephone: userData.telephone,
            id_entreprise: userData.id_entreprise,
          },
        },
      });

      if (error) throw error;

      // Créer l'utilisateur dans la table personnalisée
      if (data.user) {
        const { error: profileError } = await supabase
          .from("utilisateurs")
          .insert({
            id_user: data.user.id,
            nom: userData.nom,
            email: email,
            mot_de_passe: password, // Note: Supabase gère le hashage
            id_role: userData.id_role || 1, // Role par défaut
            id_entreprise: userData.id_entreprise,
          });

        if (profileError) throw profileError;
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Connexion
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Récupérer les informations complètes de l'utilisateur
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from("utilisateurs")
          .select(
            `
            *,
            roles (libelle),
            entreprises (nom_commercial)
          `,
          )
          .eq("email", email)
          .single();

        if (userError) throw userError;

        return {
          success: true,
          data: {
            user: data.user,
            profile: userData,
          },
        };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Déconnexion
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Récupérer l'utilisateur actuel
  getCurrentUser: async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      if (!user)
        return { success: false, message: "Aucun utilisateur connecté" };

      // Récupérer les informations complètes
      const { data: userData, error: userError } = await supabase
        .from("utilisateurs")
        .select(
          `
          *,
          roles (libelle),
          entreprises (nom_commercial)
        `,
        )
        .eq("id_user", user.id)
        .single();

      if (userError) throw userError;

      return {
        success: true,
        data: {
          user: user,
          profile: userData,
        },
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Mettre à jour le profil
  updateProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from("utilisateurs")
        .update(updates)
        .eq("id_user", userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Réinitialiser le mot de passe
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Écouter les changements d'authentification
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default supabaseAuthService;
