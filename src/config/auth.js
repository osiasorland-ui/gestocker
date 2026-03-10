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
  // Connexion avec email et mot de passe (vérification sécurisée)
  signIn: async (email, password) => {
    try {
      console.log("=== AUTH.SIGNIN DÉBUT ===");
      console.log("Email recherché:", email);

      // Utiliser le client admin pour éviter les problèmes de permissions
      const supabaseAdmin = createAdminClient();

      // Récupérer l'utilisateur avec son mot de passe hashé
      const { data: userData, error: userError } = await supabaseAdmin
        .from("utilisateurs")
        .select(
          `
          *,
          roles (libelle),
          entreprises (nom_commercial)
        `,
        )
        .eq("email", email.toLowerCase())
        .eq("statut", "actif")
        .maybeSingle();

      console.log("Résultat recherche utilisateur:", { userData, userError });

      if (userError) {
        console.error("Erreur base de données:", userError);
        const errorMessage =
          userError.message ||
          userError.details ||
          "Email ou mot de passe incorrect";
        return { data: null, error: errorMessage };
      }

      if (!userData) {
        console.log("Aucun utilisateur trouvé ou compte inactif");
        return {
          data: null,
          error: "Email ou mot de passe incorrect",
        };
      }

      // Importer bcryptjs pour la vérification
      const bcrypt = await import("bcryptjs");

      let passwordValid = false;

      console.log("=== DEBUG PASSWORD ===");
      console.log("Password provided:", !!password);
      console.log("Stored password hash:", userData.mot_de_passe);
      console.log("Is bcrypt hash:", userData.mot_de_passe.startsWith("$2"));

      // Vérifier le mot de passe selon le format
      if (userData.mot_de_passe.startsWith("$2")) {
        // Hash bcrypt - vérification sécurisée
        try {
          passwordValid = await bcrypt.compare(password, userData.mot_de_passe);
          console.log("Bcrypt comparison result:", passwordValid);
        } catch (bcryptError) {
          console.error("Erreur bcrypt:", bcryptError);
          return {
            data: null,
            error: "Erreur de vérification du mot de passe",
          };
        }
      } else {
        // Ancien format non hashé - comparaison directe mais avertir
        console.warn(
          "⚠️ Mot de passe en clair détecté - migration recommandée",
        );
        passwordValid = userData.mot_de_passe === password;
        console.log("Plain text comparison result:", passwordValid);
      }

      if (!passwordValid) {
        console.log("Mot de passe incorrect");
        return {
          data: null,
          error: "Email ou mot de passe incorrect",
        };
      }

      console.log("✅ Utilisateur authentifié avec succès");

      // Créer l'objet utilisateur complet
      const userDataComplete = {
        id_user: userData.id_user,
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        id_role: userData.id_role,
        id_entreprise: userData.id_entreprise,
        statut: userData.statut,
        first_time_login: userData.first_time_login || false,
        roles: { libelle: userData.roles?.libelle },
        entreprises: { nom_commercial: userData.entreprises?.nom_commercial },
      };

      // Créer une session locale sans passer par Supabase Auth
      const sessionData = {
        user: userDataComplete,
        session: {
          user: userDataComplete,
          access_token: `local_${userDataComplete.id_user}_${Date.now()}`,
          refresh_token: `refresh_${userDataComplete.id_user}_${Date.now()}`,
          expires_at: Date.now() + 3600000, // 1 heure
        },
      };

      console.log("Session locale créée avec succès");
      console.log("=== AUTH.SIGNIN FIN ===");

      return {
        data: sessionData,
        error: null,
      };
    } catch (error) {
      console.error("=== ERREUR AUTH.SIGNIN ===");
      console.error("Erreur complète:", error);
      return {
        data: null,
        error: error.message || "Erreur de connexion inconnue",
      };
    }
  },

  // Inscription
  signUp: async (email, password, metadata = {}) => {
    try {
      console.log("=== AUTH.SIGNUP DÉBUT ===");
      console.log("Email:", email);
      console.log("Password type:", typeof password);
      console.log("Metadata:", metadata);
      console.log("Metadata type:", typeof metadata);
      console.log("Metadata keys:", Object.keys(metadata));

      // Vérifier les valeurs spécifiques
      console.log("metadata.nom:", metadata.nom, typeof metadata.nom);
      console.log("metadata.prenom:", metadata.prenom, typeof metadata.prenom);
      console.log(
        "metadata.role_id:",
        metadata.role_id,
        typeof metadata.role_id,
      );
      console.log(
        "metadata.email_entreprise:",
        metadata.email_entreprise,
        typeof metadata.email_entreprise,
      );

      // Créer un client admin temporaire pour cette opération
      const supabaseAdmin = createAdminClient();
      // Vérifier si l'utilisateur connecté est Admin ou Super User
      // Utiliser getCurrentSession pour obtenir la session actuelle
      const { session: currentSession } = await supabase.auth.getSession();
      console.log("Session Supabase actuelle:", currentSession);

      let currentUser = currentSession?.user;
      console.log("Utilisateur Supabase Auth:", currentUser);

      // Si pas de session Supabase, essayer de récupérer depuis les métadonnées
      if (!currentUser && metadata.id_entreprise) {
        console.log(
          "Pas de session Supabase mais une entreprise est fournie dans les métadonnées",
        );
        console.log(
          "Utilisation de l'entreprise ID depuis les métadonnées:",
          metadata.id_entreprise,
        );
        currentUser = { email: metadata.current_user_email }; // Pour référence
      } else {
        console.log("Aucune session trouvée, création d'un nouvel utilisateur");
      }

      // Récupérer les données complètes de l'utilisateur depuis notre table
      let fullUser = null;
      if (currentUser) {
        const { data: userData } = await supabaseAdmin
          .from("utilisateurs")
          .select("*, roles(*)")
          .eq("email", currentUser.email || "")
          .maybeSingle();
        fullUser = userData;
      }

      console.log("Utilisateur complet avec rôle:", fullUser);

      const userRoleId = fullUser?.role_id || fullUser?.id_role;
      console.log("Rôle ID de l'utilisateur:", userRoleId);

      const isAdminOrSuperUser =
        userRoleId === "5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3" ||
        userRoleId === "a033e29c-94f6-4eb3-9243-a9424ec20357";

      console.log("Est Admin ou Super User:", isAdminOrSuperUser);

      let entrepriseId;

      // Si un utilisateur est connecté, utiliser son entreprise existante
      if (currentUser) {
        console.log(
          "Utilisateur connecté détecté, utilisation de l'entreprise existante",
        );

        // Récupérer les données complètes de l'utilisateur depuis notre table
        const { data: userData } = await supabaseAdmin
          .from("utilisateurs")
          .select("*, roles(*)")
          .eq("email", currentUser.email || "")
          .maybeSingle();

        console.log("Utilisateur complet:", userData);

        entrepriseId = userData?.id_entreprise;

        if (!entrepriseId) {
          return {
            data: null,
            error: "Aucune entreprise associée à votre compte",
          };
        }

        console.log("Utilisation de l'entreprise ID:", entrepriseId);
      } else {
        // Si aucun utilisateur connecté, créer une nouvelle entreprise
        console.log(
          "Aucun utilisateur connecté, création d'une nouvelle entreprise...",
        );

        // Préparer les données de l'entreprise avec des limites de longueur
        const entrepriseData = {
          nom_commercial: String(metadata.nom_entreprise || "").substring(
            0,
            100,
          ),
          raison_sociale: String(
            metadata.raison_sociale || metadata.nom_entreprise || "",
          ).substring(0, 100),
          ifu: String(metadata.ifu || "").substring(0, 50),
          registre_commerce: String(metadata.registre_commerce || "").substring(
            0,
            50,
          ),
          adresse_siege: metadata.adresse_siege
            ? String(metadata.adresse_siege).substring(0, 500)
            : null,
          telephone_contact: metadata.telephone_entreprise
            ? String(metadata.telephone_entreprise).substring(0, 20)
            : null,
          email_entreprise: String(
            metadata.email_entreprise || email || "",
          ).substring(0, 100),
          logo_path: metadata.logo_base64
            ? String(metadata.logo_base64).substring(0, 1000)
            : null,
        };

        console.log("Données entreprise (tronquées):", entrepriseData);

        const { data: entrepriseDataResult, error: entrepriseError } =
          await supabaseAdmin
            .from("entreprises")
            .insert(entrepriseData)
            .select()
            .maybeSingle();

        console.log("Résultat création entreprise:", {
          entrepriseData: entrepriseDataResult,
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

        entrepriseId = entrepriseDataResult?.id_entreprise;
      }

      // Étape 2: Créer l'utilisateur directement

      // Récupérer l'UUID du rôle demandé
      console.log("Récupération du rôle demandé...");
      const { data: roleData } = await supabaseAdmin
        .from("roles")
        .select("id_role, libelle")
        .eq("id_role", metadata.role_id)
        .maybeSingle();

      console.log("Rôle trouvé:", roleData);

      if (!roleData) {
        console.error("Rôle non trouvé");
        return { data: null, error: "Rôle spécifié non trouvé" };
      }

      console.log("Création de l'utilisateur...");
      const userDataToInsert = {
        nom: metadata.nom || "",
        prenom: metadata.prenom || "",
        email: email,
        telephone: metadata.telephone || null, // Ajouter le téléphone de l'utilisateur
        mot_de_passe: password, // TODO: hasher ce mot de passe avec bcrypt
        id_role: roleData.id_role, // Utiliser id_role au lieu de role_id
        id_entreprise: entrepriseId,
        statut: "actif",
      };

      console.log("Données utilisateur à insérer:", userDataToInsert);

      const { data: userData, error: userCreateError } = await supabaseAdmin
        .from("utilisateurs")
        .insert(userDataToInsert)
        .select()
        .maybeSingle();

      console.log("Résultat création utilisateur:", {
        userData,
        userCreateError,
      });

      if (userCreateError) {
        return {
          data: null,
          error: `Erreur création utilisateur: ${userCreateError.message}`,
        };
      }

      // Étape 4: Vérifier que l'utilisateur est bien créé et lié à l'entreprise
      console.log("Vérification de la création de l'utilisateur...");
      const { data: verificationData, error: verificationError } =
        await supabaseAdmin
          .from("utilisateurs")
          .select(
            `
          *,
          roles (*),
          entreprises (*)
        `,
          )
          .eq("email", email)
          .maybeSingle();

      if (verificationError) {
        console.error("Erreur vérification utilisateur:", verificationError);
        return {
          data: null,
          error: `Erreur vérification: ${verificationError.message}`,
        };
      }

      if (!verificationData) {
        console.error("L'utilisateur n'a pas été créé correctement");
        return {
          data: null,
          error: "Erreur: l'utilisateur n'a pas pu être créé correctement",
        };
      }

      console.log("✅ Utilisateur vérifié avec succès:", {
        id_user: verificationData.id_user,
        email: verificationData.email,
        role: verificationData.roles?.libelle,
        entreprise: verificationData.entreprises?.nom_commercial,
        statut: verificationData.statut,
      });

      // Étape 5: Donner les permissions à l'utilisateur
      console.log("Attribution des permissions...");
      const { data: permissionsData } = await supabaseAdmin
        .from("permissions")
        .select("id_permission");

      if (permissionsData && verificationData.id_role) {
        console.log("Permissions trouvées:", permissionsData.length);
        // Vérifier d'abord si les permissions existent déjà
        const { data: existingPermissions } = await supabaseAdmin
          .from("role_permission")
          .select("id_permission")
          .eq("id_role", verificationData.id_role);

        const existingPermissionIds =
          existingPermissions?.map((p) => p.id_permission) || [];

        // Insérer seulement les permissions qui n'existent pas déjà
        for (const permission of permissionsData) {
          if (!existingPermissionIds.includes(permission.id_permission)) {
            await supabaseAdmin.from("role_permission").insert({
              id_role: verificationData.id_role,
              id_permission: permission.id_permission,
            });
          }
        }
      }

      // Étape 6: Créer une session locale
      console.log("Création de la session locale...");
      const sessionData = {
        user: verificationData,
        session: {
          user: verificationData,
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
