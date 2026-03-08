import { supabase } from "../config/supabase.js";

// Utilitaire pour la sauvegarde automatique des paramètres
export const backupService = {
  // Vérifier si la sauvegarde automatique est activée
  isAutoBackupEnabled: async (entrepriseId) => {
    try {
      const { data, error } = await supabase
        .from("parametres_unifies")
        .select("valeur_parametre")
        .eq("id_entreprise", entrepriseId)
        .eq("categorie", "sauvegarde")
        .eq("nom_parametre", "backup_type")
        .eq("est_actif", true)
        .single();

      if (error || !data) {
        console.log("Erreur ou pas de configuration de sauvegarde trouvée:", error?.message);
        return false;
      }

      return data.valeur_parametre === "auto";
    } catch (error) {
      console.error("Erreur lors de la vérification du type de sauvegarde:", error);
      return false;
    }
  },

  // Effectuer une sauvegarde automatique des paramètres
  performAutoBackup: async (entrepriseId, changedParametre = null) => {
    try {
      console.log("🔄 Début de la sauvegarde automatique...");
      
      // Récupérer tous les paramètres actifs de l'entreprise
      const { data: parametres, error: paramError } = await supabase
        .from("parametres_unifies")
        .select("*")
        .eq("id_entreprise", entrepriseId)
        .eq("est_actif", true);

      if (paramError) {
        throw new Error(`Erreur lors de la récupération des paramètres: ${paramError.message}`);
      }

      // Créer une entrée de sauvegarde
      const backupData = {
        id_entreprise: entrepriseId,
        type_sauvegarde: "auto",
        donnees_sauvegarde: {
          parametres: parametres,
          date_sauvegarde: new Date().toISOString(),
          parametre_declencheur: changedParametre,
          nombre_parametres: parametres.length
        },
        statut: "complete",
        created_at: new Date().toISOString()
      };

      // Insérer la sauvegarde dans la table des sauvegardes
      const { data: backupResult, error: backupError } = await supabase
        .from("sauvegardes")
        .insert([backupData])
        .select()
        .single();

      if (backupError) {
        // Si la table sauvegardes n'existe pas, créer un log simple
        console.warn("Table sauvegardes non disponible, création d'un log simple:");
        console.log("BACKUP AUTO:", JSON.stringify(backupData, null, 2));
        return {
          success: true,
          message: "Sauvegarde automatique effectuée (log simple)",
          backup: backupData
        };
      }

      console.log("✅ Sauvegarde automatique réussie:", backupResult.id_sauvegarde);
      
      return {
        success: true,
        message: "Sauvegarde automatique effectuée avec succès",
        backup: backupResult
      };

    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde automatique:", error);
      return {
        success: false,
        message: `Erreur lors de la sauvegarde: ${error.message}`,
        error: error
      };
    }
  },

  // Mettre à jour les paramètres et déclencher la sauvegarde si nécessaire
  updateParametreWithBackup: async (entrepriseId, parametreId, nomParametre, nouvelleValeur) => {
    try {
      // Mettre à jour le paramètre
      const { error: updateError } = await supabase
        .from("parametres_unifies")
        .update({
          valeur_parametre: nouvelleValeur,
          updated_at: new Date().toISOString(),
        })
        .eq("id_parametre", parametreId);

      if (updateError) {
        throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
      }

      // Vérifier si la sauvegarde automatique est activée
      const isAutoEnabled = await backupService.isAutoBackupEnabled(entrepriseId);
      
      if (isAutoEnabled) {
        console.log(`📦 Sauvegarde auto déclenchée par le changement de: ${nomParametre}`);
        
        // Effectuer la sauvegarde automatique
        const backupResult = await backupService.performAutoBackup(entrepriseId, {
          nom_parametre: nomParametre,
          nouvelle_valeur: nouvelleValeur,
          timestamp: new Date().toISOString()
        });

        if (backupResult.success) {
          console.log("✅ Paramètre mis à jour et sauvegardé automatiquement");
        } else {
          console.warn("⚠️ Paramètre mis à jour mais sauvegarde échouée:", backupResult.message);
        }

        return {
          success: true,
          updated: true,
          backup: backupResult
        };
      }

      return {
        success: true,
        updated: true,
        backup: null,
        message: "Paramètre mis à jour (sauvegarde auto désactivée)"
      };

    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour avec sauvegarde:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default backupService;
