import { supabase } from "./auth.js";

// Fonctions pour la gestion des paramètres système
export const parametres = {
  // Obtenir tous les paramètres d'une entreprise
  getAll: async (entrepriseId) => {
    const { data, error } = await supabase
      .from("parametres_systeme")
      .select("*")
      .eq("id_entreprise", entrepriseId)
      .order("nom_parametre", { ascending: true });

    return { data, error };
  },

  // Obtenir un paramètre par son nom
  getByName: async (entrepriseId, nomParametre) => {
    const { data, error } = await supabase
      .from("parametres_systeme")
      .select("*")
      .eq("id_entreprise", entrepriseId)
      .eq("nom_parametre", nomParametre)
      .single();

    return { data, error };
  },

  // Créer ou mettre à jour un paramètre
  upsert: async (parametreData) => {
    const { data, error } = await supabase
      .from("parametres_systeme")
      .upsert(parametreData)
      .select()
      .single();

    return { data, error };
  },

  // Mettre à jour un paramètre
  update: async (parametreId, updates) => {
    const { data, error } = await supabase
      .from("parametres_systeme")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id_parametre", parametreId)
      .select()
      .single();

    return { data, error };
  },

  // Supprimer un paramètre
  delete: async (parametreId) => {
    const { data, error } = await supabase
      .from("parametres_systeme")
      .delete()
      .eq("id_parametre", parametreId);

    return { data, error };
  },

  // Obtenir la valeur d'un paramètre
  getValue: async (entrepriseId, nomParametre) => {
    const { data, error } = await supabase
      .from("parametres_systeme")
      .select("valeur_parametre")
      .eq("id_entreprise", entrepriseId)
      .eq("nom_parametre", nomParametre)
      .single();

    return { 
      value: data?.valeur_parametre || null, 
      error 
    };
  },

  // Définir la valeur d'un paramètre
  setValue: async (entrepriseId, nomParametre, valeur, description = null) => {
    const parametreData = {
      nom_parametre: nomParametre,
      valeur_parametre: valeur,
      description: description,
      id_entreprise: entrepriseId,
      updated_at: new Date().toISOString()
    };

    return await this.upsert(parametreData);
  },

  // Paramètres prédéfinis communs
  defaultSettings: {
    // Paramètres de l'entreprise
    COMPANY_NAME: "nom_entreprise",
    COMPANY_EMAIL: "email_entreprise",
    COMPANY_PHONE: "telephone_entreprise",
    COMPANY_ADDRESS: "adresse_entreprise",
    
    // Paramètres de facturation
    DEFAULT_TVA: "tva_defaut",
    CURRENCY: "devise",
    INVOICE_PREFIX: "prefixe_facture",
    
    // Paramètres de stock
    LOW_STOCK_THRESHOLD: "seuil_alerte_stock",
    AUTO_STOCK_ALERT: "alerte_stock_auto",
    
    // Paramètres système
    BACKUP_FREQUENCY: "frequence_sauvegarde",
    NOTIFICATION_EMAIL: "email_notifications",
    MAINTENANCE_MODE: "mode_maintenance",
    
    // Paramètres de livraison
    DELIVERY_FEE: "frais_livraison",
    DELIVERY_TIME: "temps_livraison",
    DELIVERY_RADIUS: "rayon_livraison",
  },

  // Initialiser les paramètres par défaut pour une entreprise
  initializeDefaults: async (entrepriseId) => {
    const defaults = [
      {
        nom_parametre: this.defaultSettings.DEFAULT_TVA,
        valeur_parametre: "18",
        description: "Taux de TVA par défaut (en %)",
        id_entreprise: entrepriseId
      },
      {
        nom_parametre: this.defaultSettings.CURRENCY,
        valeur_parametre: "XOF",
        description: "Devise utilisée",
        id_entreprise: entrepriseId
      },
      {
        nom_parametre: this.defaultSettings.INVOICE_PREFIX,
        valeur_parametre: "FAC-",
        description: "Préfixe des numéros de facture",
        id_entreprise: entrepriseId
      },
      {
        nom_parametre: this.defaultSettings.LOW_STOCK_THRESHOLD,
        valeur_parametre: "5",
        description: "Seuil d'alerte de stock faible",
        id_entreprise: entrepriseId
      },
      {
        nom_parametre: this.defaultSettings.AUTO_STOCK_ALERT,
        valeur_parametre: "true",
        description: "Activer les alertes de stock automatiques",
        id_entreprise: entrepriseId
      },
      {
        nom_parametre: this.defaultSettings.BACKUP_FREQUENCY,
        valeur_parametre: "daily",
        description: "Fréquence de sauvegarde automatique",
        id_entreprise: entrepriseId
      },
      {
        nom_parametre: this.defaultSettings.NOTIFICATION_EMAIL,
        valeur_parametre: "true",
        description: "Activer les notifications par email",
        id_entreprise: entrepriseId
      },
      {
        nom_parametre: this.defaultSettings.MAINTENANCE_MODE,
        valeur_parametre: "false",
        description: "Mode maintenance du système",
        id_entreprise: entrepriseId
      },
      {
        nom_parametre: this.defaultSettings.DELIVERY_FEE,
        valeur_parametre: "0",
        description: "Frais de livraison par défaut",
        id_entreprise: entrepriseId
      },
      {
        nom_parametre: this.defaultSettings.DELIVERY_TIME,
        valeur_parametre: "48",
        description: "Temps de livraison standard (en heures)",
        id_entreprise: entrepriseId
      }
    ];

    const results = [];
    for (const param of defaults) {
      const { data, error } = await this.upsert(param);
      results.push({ param: param.nom_parametre, data, error });
    }

    return results;
  },

  // Obtenir tous les paramètres formatés pour l'affichage
  getFormattedSettings: async (entrepriseId) => {
    const { data, error } = await this.getAll(entrepriseId);
    
    if (error) return { data: null, error };

    const formatted = {};
    data?.forEach(param => {
      formatted[param.nom_parametre] = {
        value: param.valeur_parametre,
        description: param.description,
        updated_at: param.updated_at
      };
    });

    return { data: formatted, error: null };
  }
};

export default parametres;
