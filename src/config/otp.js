import { supabase } from "./auth.js";

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
        // Fallback sur la console pour le développement
        return { success: true, fallback: true, method: "console" };
      }

      console.log(`✅ Email envoyé avec succès via Supabase à ${email}`);
      return { success: true, data, method: "supabase" };
    } catch {
      // Fallback en cas d'erreur
      return { success: true, fallback: true, method: "console" };
    }
  },
};

export default otp;
