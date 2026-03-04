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
    let rpcFunction = "has_permission";
    let param = { user_id_param: userId, permission_name: permission };

    // Si l'ID est un nombre, utiliser la fonction pour INT
    if (typeof userId === "number" || /^\d+$/.test(userId.toString())) {
      rpcFunction = "has_permission_int";
      param = { user_id_param: parseInt(userId), permission_name: permission };
    }

    const { data, error } = await supabase.rpc(rpcFunction, param);

    return { data, error };
  },

  // Obtenir les permissions de l'utilisateur
  getUserPermissions: async (userId) => {
    let rpcFunction = "get_user_permissions";
    let param = { user_id_param: userId };

    // Si l'ID est un nombre, utiliser la fonction pour INT
    if (typeof userId === "number" || /^\d+$/.test(userId.toString())) {
      rpcFunction = "get_user_permissions_int";
      param = { user_id_param: parseInt(userId) };
    }

    const { data, error } = await supabase.rpc(rpcFunction, param);

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

  // Mettre à jour les informations de l'entreprise
  updateCompanyInfo: async (entrepriseId, companyData) => {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "update_entreprise_info",
        {
          p_entreprise_id: entrepriseId,
          p_nom_commercial: companyData.nom_commercial,
          p_raison_sociale: companyData.raison_sociale || null,
          p_ifu: companyData.ifu,
          p_registre_commerce: companyData.registre_commerce,
          p_adresse_siege: companyData.adresse_siege || null,
          p_telephone_contact: companyData.telephone_contact || null,
          p_email_entreprise: companyData.email_entreprise || null,
          p_logo_path: companyData.logo_path || null,
        },
      );

      if (rpcError) {
        console.error("Erreur RPC update_entreprise_info:", rpcError);
        return { data: null, error: rpcError.message };
      }

      if (!rpcData || rpcData.length === 0) {
        return { data: null, error: "Aucune donnée retournée" };
      }

      const result = rpcData[0];
      if (!result.success) {
        return { data: null, error: result.message };
      }

      return { data: result.entreprise_data, error: null };
    } catch (error) {
      console.error("Erreur updateCompanyInfo:", error);
      return { data: null, error: error.message };
    }
  },

  // Obtenir les informations complètes de l'entreprise
  getCompanyCompleteInfo: async (entrepriseId) => {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_entreprise_complete_info",
        {
          p_entreprise_id: entrepriseId,
        },
      );

      if (rpcError) {
        console.error("Erreur RPC get_entreprise_complete_info:", rpcError);
        return { data: null, error: rpcError.message };
      }

      return { data: rpcData, error: null };
    } catch (error) {
      console.error("Erreur getCompanyCompleteInfo:", error);
      return { data: null, error: error.message };
    }
  },
};

export default supabase;

// Fonctions pour la gestion OTP
export const otp = {
  // Générer et envoyer un code OTP par email
  generateOTP: async (email) => {
    try {
      const { data, error } = await supabase.rpc("create_otp_code", {
        p_email: email,
      });

      if (error) {
        console.error("Erreur génération OTP:", error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: "Aucune donnée retournée" };
      }

      const result = data[0];

      if (!result.success) {
        return { success: false, error: result.message };
      }

      // Simuler l'envoi d'email (à remplacer par un vrai service d'email)
      // Pour le développement, on retourne le code directement
      console.log(`Code OTP pour ${email}: ${result.otp_code}`);

      // Dans un environnement de production, vous utiliseriez un service d'email comme:
      // - Supabase Auth emails
      // - SendGrid
      // - Resend
      // - Autre service SMTP

      return {
        success: true,
        message: result.message,
        expiresAt: result.expires_at,
        // En développement seulement, retourner le code
        ...(import.meta.env.DEV && { otpCode: result.otp_code }),
      };
    } catch (error) {
      console.error("Erreur generateOTP:", error);
      return { success: false, error: error.message };
    }
  },

  // Valider un code OTP
  validateOTP: async (email, code) => {
    try {
      const { data, error } = await supabase.rpc("validate_otp_code", {
        p_email: email,
        p_code: code,
      });

      if (error) {
        console.error("Erreur validation OTP:", error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: "Aucune donnée retournée" };
      }

      const result = data[0];

      return {
        success: result.success,
        message: result.message,
        attemptsRemaining: result.attempts_remaining,
        blockedUntil: result.blocked_until,
      };
    } catch (error) {
      console.error("Erreur validateOTP:", error);
      return { success: false, error: error.message };
    }
  },

  // Vérifier si on peut demander un nouveau code OTP
  canRequestOTP: async (email) => {
    try {
      const { data, error } = await supabase.rpc("can_request_otp", {
        p_email: email,
      });

      if (error) {
        console.error("Erreur vérification OTP:", error);
        return { canRequest: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { canRequest: false, error: "Aucune donnée retournée" };
      }

      const result = data[0];

      return {
        canRequest: result.can_request,
        waitTime: result.wait_time,
        message: result.message,
      };
    } catch (error) {
      console.error("Erreur canRequestOTP:", error);
      return { canRequest: false, error: error.message };
    }
  },

  // Envoyer un email avec le code OTP (méthode Supabase intégrée)
  sendEmailOTP: async (email, otpCode) => {
    try {
      // Template HTML pour l'email
      const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Code de vérification Gestocker</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #000;
              margin-bottom: 10px;
            }
            .code-container {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
              border-radius: 8px;
              border: 2px solid #e9ecef;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #000;
              margin: 10px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .security-note {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">GESTOCKER</div>
              <h1 style="color: #000; margin: 0;">Code de vérification</h1>
            </div>
            
            <p>Bonjour,</p>
            <p>Vous avez demandé un code de vérification pour votre inscription sur Gestocker.</p>
            
            <div class="code-container">
              <p style="margin: 0 0 10px 0; font-weight: bold;">Votre code de vérification est :</p>
              <div class="code">${otpCode}</div>
            </div>
            
            <div class="security-note">
              <strong>⚠️ Important :</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Ce code expire dans 5 minutes</li>
                <li>Ne partagez jamais ce code avec qui que ce soit</li>
                <li>Notre équipe ne vous demandera jamais ce code</li>
              </ul>
            </div>
            
            <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.</p>
            
            <div class="footer">
              <p>Cet email a été envoyé automatiquement par Gestocker</p>
              <p>© 2024 Gestocker - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Appeler l'Edge Function simplifiée pour envoyer l'email via Supabase
      const { data, error } = await supabase.functions.invoke(
        "send-email-simple",
        {
          body: {
            to: email,
            subject: "🔐 Votre code de vérification Gestocker",
            html: emailHTML,
          },
        },
      );

      if (error) {
        console.error("Erreur envoi email Supabase:", error);
        // Fallback sur la console pour le développement
        console.log(`[FALLBACK] Code OTP pour ${email}: ${otpCode}`);
        return { success: true, fallback: true, method: "console" };
      }

      console.log(`✅ Email envoyé avec succès via Supabase à ${email}`);
      return { success: true, data, method: "supabase" };
    } catch (error) {
      console.error("Erreur dans sendEmailOTP:", error);
      // Fallback en cas d'erreur
      console.log(`[FALLBACK] Code OTP pour ${email}: ${otpCode}`);
      return { success: true, fallback: true, method: "console" };
    }
  },
};
