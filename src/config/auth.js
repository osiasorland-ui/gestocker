import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Client principal avec clé anon (utilisé pour la plupart des opérations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage, // Force localStorage au lieu de sessionStorage
    storageKey: "supabase.auth.token", // Clé de stockage personnalisée
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

// Fonction utilitaire pour créer un client admin temporaire
export const createAdminClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
  });
};

// Exporter createClient pour utilisation avec service role
export { createClient };

// Fonctions utilitaires pour l'authentification avec table utilisateurs personnalisée
export const auth = {
  // Connexion avec email et mot de passe (vérification directe)
  signIn: async (email, password) => {
    try {
      console.log("=== AUTH.SIGNIN DÉBUT ===");
      console.log("Email recherché:", email);

      // Étape 1: Vérifier si c'est un email d'entreprise
      console.log("Vérification email entreprise...");
      const { data: entrepriseData, error: entrepriseError } = await supabase
        .from("entreprises")
        .select("email_entreprise")
        .eq("email_entreprise", email)
        .maybeSingle();

      console.log("Résultat recherche entreprise:", {
        entrepriseData,
        entrepriseError,
      });

      let userData, userError;

      if (entrepriseData) {
        console.log("Email d'entreprise détecté, recherche admin...");
        // Si c'est un email d'entreprise, chercher l'admin (id_role = UUID Admin)

        // D'abord récupérer l'UUID du rôle Admin
        const { data: adminRole, error: adminRoleError } = await supabase
          .from("roles")
          .select("id_role")
          .eq("libelle", "Admin")
          .maybeSingle();

        console.log("Rôle Admin trouvé:", { adminRole, adminRoleError });

        if (adminRoleError || !adminRole) {
          console.error("Erreur récupération rôle Admin:", adminRoleError);
          return { data: null, error: "Erreur configuration des rôles" };
        }

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
        console.log("Résultat recherche admin:", { userData, userError });
      } else {
        console.log("Email utilisateur normal, recherche utilisateur...");
        // Sinon, chercher un utilisateur normal (id_role ≠ Admin UUID)

        // Récupérer l'UUID du rôle Admin
        const { data: adminRole, error: adminRoleError } = await supabase
          .from("roles")
          .select("id_role")
          .eq("libelle", "Admin")
          .maybeSingle();

        console.log("Rôle Admin pour exclusion:", {
          adminRole,
          adminRoleError,
        });

        if (adminRoleError || !adminRole) {
          console.error("Erreur récupération rôle Admin:", adminRoleError);
          return { data: null, error: "Erreur configuration des rôles" };
        }

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
        console.log("Résultat recherche utilisateur:", { userData, userError });
      }

      if (userError) {
        console.error("Erreur base de données:", userError);
        return { data: null, error: "Email ou mot de passe incorrect" };
      }

      if (!userData) {
        console.log("Aucun utilisateur trouvé");
        return {
          data: null,
          error: "Email ou mot de passe incorrect",
        };
      }

      console.log("Utilisateur trouvé avec succès:", userData);

      // Étape 2: Créer une vraie session Supabase
      // Utiliser signIn avec un mot de passe universel pour créer une session Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: `${userData.id_user}@supabase.local`, // Email unique basé sur l'ID
          password: `${userData.id_user}_${password}`, // Mot de passe unique
        });

      // Si la session n'existe pas, la créer avec signUp
      if (
        authError &&
        authError.message.includes("Invalid login credentials")
      ) {
        console.log("Création de la session Supabase...");
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: `${userData.id_user}@supabase.local`,
            password: `${userData.id_user}_${password}`,
            options: {
              data: {
                custom_user_id: userData.id_user,
                original_email: email,
              },
            },
          });

        if (signUpError) {
          console.error("Erreur création session:", signUpError);
          // Continuer quand même avec les données locales
        } else {
          console.log("Session Supabase créée:", signUpData);
          return {
            data: {
              user: { ...userData, ...signUpData.user },
              session: signUpData.session,
            },
            error: null,
          };
        }
      }

      if (authError) {
        console.error("Erreur auth Supabase:", authError);
        // Continuer avec les données locales si l'auth Supabase échoue
      }

      // Créer une session basique avec les données de notre table
      const result = {
        data: {
          user: userData,
          session: authData?.session || {
            user: userData,
            access_token: "local_token",
            refresh_token: "local_refresh",
            expires_at: Date.now() + 3600000, // 1 heure
          },
        },
        error: null,
      };

      console.log("Session créée:", result);
      console.log("=== AUTH.SIGNIN FIN ===");
      return result;
    } catch (error) {
      console.error("=== ERREUR AUTH.SIGNIN ===");
      console.error("Erreur complète:", error);
      return { data: null, error: error.message };
    }
  },

  // Inscription
  signUp: async (email, password, metadata = {}) => {
    try {
      console.log("=== AUTH.SIGNUP DÉBUT ===");
      console.log("Email:", email);
      console.log("Metadata:", metadata);

      // Créer un client admin temporaire pour cette opération
      const supabaseAdmin = createAdminClient();

      // Étape 1: Créer l'entreprise directement avec supabaseAdmin
      console.log("Création de l'entreprise...");
      const { data: entrepriseData, error: entrepriseError } =
        await supabaseAdmin
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
          .maybeSingle();

      console.log("Résultat création entreprise:", {
        entrepriseData,
        entrepriseError,
      });

      if (entrepriseError) {
        console.error("Erreur création entreprise:", entrepriseError);
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
      console.log("Récupération du rôle Admin...");
      const { data: adminRole } = await supabaseAdmin
        .from("roles")
        .select("id_role")
        .eq("libelle", "Admin")
        .maybeSingle();

      console.log("Rôle Admin trouvé:", adminRole);

      if (!adminRole) {
        console.error("Rôle Admin non trouvé");
        return { data: null, error: "Erreur configuration des rôles" };
      }

      console.log("Création de l'utilisateur...");
      const { data: userData, error: userError } = await supabaseAdmin
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
        .maybeSingle();

      console.log("Résultat création utilisateur:", { userData, userError });

      if (userError) {
        return {
          data: null,
          error: `Erreur création utilisateur: ${userError.message}`,
        };
      }

      // Étape 3: Donner les permissions à l'utilisateur
      console.log("Attribution des permissions...");
      const { data: permissionsData } = await supabaseAdmin
        .from("permissions")
        .select("id_permission");

      if (permissionsData && userData.id_role) {
        console.log("Permissions trouvées:", permissionsData.length);
        // Vérifier d'abord si les permissions existent déjà
        const { data: existingPermissions } = await supabaseAdmin
          .from("role_permission")
          .select("id_permission")
          .eq("id_role", userData.id_role);

        const existingPermissionIds =
          existingPermissions?.map((p) => p.id_permission) || [];

        // Insérer seulement les permissions qui n'existent pas déjà
        for (const permission of permissionsData) {
          if (!existingPermissionIds.includes(permission.id_permission)) {
            await supabaseAdmin.from("role_permission").insert({
              id_role: userData.id_role,
              id_permission: permission.id_permission,
            });
          }
        }
      }

      // Étape 4: Créer une session locale
      console.log("Création de la session locale...");
      const sessionData = {
        user: userData,
        session: {
          user: userData,
          access_token: "local_token",
          refresh_token: "local_refresh",
          expires_at: Date.now() + 3600000,
        },
      };

      console.log("=== INSCRIPTION RÉUSSIE ===");
      return {
        data: sessionData,
        error: null,
      };
    } catch (error) {
      console.error("=== ERREUR INSCRIPTION ===");
      console.error("Type d'erreur:", typeof error);
      console.error("Message d'erreur:", error.message);
      console.error("Erreur complète:", error);
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
        .maybeSingle();

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
