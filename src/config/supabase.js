import { createClient } from "@supabase/supabase-js";

// Configuration Supabase avec valeurs par défaut
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://cwozvlmxjmsxskxdycqm.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3b3p2bG14am1zeHNreGR5Y3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDk5MDEsImV4cCI6MjA4Nzc4NTkwMX0.P-qFb7THuKvbHgvbQ1HiCbEgcW4oKPvoiVi3facm_5w";

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
      console.error("Erreur getEntreprises:", error);
      return { success: false, message: error.message };
    }
  },

  // Inscription d'un nouvel utilisateur avec création d'entreprise
  signUp: async (email, password, userData) => {
    try {
      // Étape 1: Créer l'entreprise d'abord
      const { data: entrepriseData, error: entrepriseError } = await supabase
        .from("entreprises")
        .insert({
          nom_commercial: userData.nom_entreprise,
          raison_sociale: userData.raison_sociale || userData.nom_entreprise,
          ifu: userData.ifu,
          registre_commerce: userData.registre_commerce,
          adresse_siege: userData.adresse_siege,
          telephone_contact: userData.telephone_entreprise,
          email_entreprise: userData.email_entreprise || email,
        })
        .select()
        .single();

      if (entrepriseError) throw entrepriseError;

      // Étape 2: Créer l'utilisateur Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nom: userData.nom,
            telephone: userData.telephone, // Stocké dans les métadonnées Supabase
            id_entreprise: entrepriseData.id_entreprise,
          },
        },
      });

      if (error) throw error;

      // Étape 3: Créer le rôle par défaut pour cette entreprise
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .insert({
          libelle: "Administrateur",
          id_entreprise: entrepriseData.id_entreprise,
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Étape 4: Créer l'utilisateur dans la table personnalisée
      if (data.user) {
        const { error: profileError } = await supabase
          .from("utilisateurs")
          .insert({
            id_user: data.user.id,
            nom: userData.nom,
            email: email,
            mot_de_passe: "HASHED_BY_SUPABASE", // Indicateur que le hash est géré par Supabase
            id_role: roleData.id_role,
            id_entreprise: entrepriseData.id_entreprise,
          });

        if (profileError) throw profileError;
      }

      return { success: true, data: { ...data, entreprise: entrepriseData } };
    } catch (error) {
      console.error("Erreur signUp:", error);
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
      console.error("Erreur signIn:", error);
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
      console.error("Erreur signOut:", error);
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

      if (error) {
        // Si l'erreur est "Auth session missing!", c'est normal (utilisateur non connecté)
        if (error.message.includes("Auth session missing")) {
          return { success: false, message: "Aucun utilisateur connecté" };
        }
        throw error;
      }

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

      if (userError) {
        console.warn(
          "Profil utilisateur non trouvé dans la table utilisateurs:",
          userError,
        );
        // Retourner l'utilisateur Supabase même si le profil n'existe pas
        return {
          success: true,
          data: {
            user: user,
            profile: null,
          },
        };
      }

      return {
        success: true,
        data: {
          user: user,
          profile: userData,
        },
      };
    } catch (error) {
      console.error("Erreur getCurrentUser:", error);
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
      console.error("Erreur updateProfile:", error);
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
      console.error("Erreur resetPassword:", error);
      return { success: false, message: error.message };
    }
  },

  // Écouter les changements d'authentification
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default supabaseAuthService;
