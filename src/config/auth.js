import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  // Ajout de configuration pour gérer les connexions instables
  global: {
    headers: {
      Connection: "keep-alive",
    },
  },
  db: {
    schema: "public",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Fonctions utilitaires pour l'authentification avec table utilisateurs personnalisée
export const auth = {
  // Connexion avec email et mot de passe (vérification directe)
  signIn: async (email, password) => {
    try {
      // Étape 1: Vérifier si c'est un email d'entreprise
      const { data: entrepriseData } = await supabase
        .from("entreprises")
        .select("email_entreprise")
        .eq("email_entreprise", email)
        .maybeSingle();

      let userData, userError;

      if (entrepriseData) {
        // Si c'est un email d'entreprise, chercher l'admin (id_role = UUID Admin)

        // D'abord récupérer l'UUID du rôle Admin
        const { data: adminRole } = await supabase
          .from("roles")
          .select("id_role")
          .eq("libelle", "Admin")
          .single();

        const result = await supabase
          .from("utilisateurs")
          .select(
            `
            id_user,
            nom,
            email,
            id_role,
            id_entreprise,
            roles(libelle)
          `,
          )
          .eq("email", email)
          .eq("mot_de_passe", password)
          .eq("id_role", adminRole.id_role) // Admin UUID
          .maybeSingle();

        userData = result.data;
        userError = result.error;
      } else {
        // Sinon, chercher un utilisateur normal (id_role ≠ Admin UUID)

        // Récupérer l'UUID du rôle Admin
        const { data: adminRole } = await supabase
          .from("roles")
          .select("id_role")
          .eq("libelle", "Admin")
          .single();

        const result = await supabase
          .from("utilisateurs")
          .select(
            `
            id_user,
            nom,
            email,
            id_role,
            id_entreprise,
            roles(libelle)
          `,
          )
          .eq("email", email)
          .eq("mot_de_passe", password)
          .neq("id_role", adminRole.id_role) // Non-admin UUID
          .maybeSingle();

        userData = result.data;
        userError = result.error;
      }

      if (userError) {
        return { data: null, error: "Email ou mot de passe incorrect" };
      }

      if (!userData) {
        return {
          data: null,
          error: "Email ou mot de passe incorrect",
        };
      }

      // Créer une session basique avec les données de notre table
      const result = {
        data: {
          user: userData,
          session: {
            user: userData,
            access_token: "local_token",
            refresh_token: "local_refresh",
            expires_at: Date.now() + 3600000, // 1 heure
          },
        },
        error: null,
      };
      return result;
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Inscription
  signUp: async (email, password, metadata = {}) => {
    try {
      // Étape 1: Créer l'entreprise directement
      const { data: entrepriseData, error: entrepriseError } = await supabase
        .from("entreprises")
        .insert({
          nom_commercial: metadata.nom_entreprise,
          raison_sociale: metadata.raison_sociale || metadata.nom_entreprise,
          ifu: metadata.ifu,
          registre_commerce: metadata.registre_commerce,
          adresse_siege: metadata.adresse_siege || null,
          telephone_contact: metadata.telephone_entreprise || null,
          email_entreprise: metadata.email_entreprise || email,
          logo_path: metadata.logo_base64 || null, // Utiliser logo_path qui existe en base
        })
        .select()
        .single();

      if (entrepriseError) {
        // Gérer les erreurs spécifiques
        if (
          entrepriseError.message.includes(
            "duplicate key value violates unique constraint",
          )
        ) {
          if (
            entrepriseError.message.includes("ifu") ||
            entrepriseError.message.includes("entreprises_new_ifu_key")
          ) {
            return {
              data: null,
              error: "IFU_EXISTS",
            };
          }
          if (
            entrepriseError.message.includes("registre_commerce") ||
            entrepriseError.message.includes(
              "entreprises_new_registre_commerce_key",
            )
          ) {
            return {
              data: null,
              error: "REGISTRE_EXISTS",
            };
          }
          if (entrepriseError.message.includes("email_entreprise")) {
            return {
              data: null,
              error: "EMAIL_EXISTS",
            };
          }
        }

        return {
          data: null,
          error: entrepriseError.message,
        };
      }

      // Étape 2: Créer l'utilisateur directement

      // Récupérer l'UUID du rôle Admin
      const { data: adminRole } = await supabase
        .from("roles")
        .select("id_role")
        .eq("libelle", "Admin")
        .single();

      const { data: userData, error: userError } = await supabase
        .from("utilisateurs")
        .insert({
          nom: metadata.nom,
          email: metadata.email_entreprise, // Toujours utiliser l'email entreprise
          mot_de_passe: password, // Stocker temporairement en clair
          id_role: adminRole.id_role, // UUID du rôle Admin
          id_entreprise: entrepriseData.id_entreprise,
        })
        .select(
          `
          *,
          roles (*),
          entreprises (*)
        `,
        )
        .single();

      if (userError) {
        return {
          data: null,
          error: `Erreur création utilisateur: ${userError.message}`,
        };
      }

      // Étape 3: Donner les permissions à l'utilisateur
      const { data: permissionsData } = await supabase
        .from("permissions")
        .select("id_permission");

      if (permissionsData && userData.id_role) {
        // Vérifier d'abord si les permissions existent déjà
        const { data: existingPermissions } = await supabase
          .from("role_permission")
          .select("id_permission")
          .eq("id_role", userData.id_role);

        const existingPermissionIds =
          existingPermissions?.map((p) => p.id_permission) || [];

        // Insérer seulement les permissions qui n'existent pas déjà
        for (const permission of permissionsData) {
          if (!existingPermissionIds.includes(permission.id_permission)) {
            await supabase.from("role_permission").insert({
              id_role: userData.id_role,
              id_permission: permission.id_permission,
            });
          }
        }
      }

      // Étape 4: Créer une session locale
      const sessionData = {
        user: userData,
        session: {
          user: userData,
          access_token: "local_token",
          refresh_token: "local_refresh",
          expires_at: Date.now() + 3600000,
        },
      };

      return {
        data: sessionData,
        error: null,
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

export default auth;
