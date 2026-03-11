import { createAdminClient } from "./auth.js";

// Créer un client admin pour éviter les problèmes d'autorisation
const supabaseAdmin = createAdminClient();

// Fonctions pour la gestion des fournisseurs
export const fournisseurs = {
  // Obtenir tous les fournisseurs d'une entreprise
  getAll: async (entrepriseId) => {
    const { data, error } = await supabaseAdmin
      .from("fournisseurs")
      .select("*")
      .eq("id_entreprise", entrepriseId)
      .order("nom_fournisseur", { ascending: true });

    return { data, error };
  },

  // Obtenir un fournisseur par son ID
  getById: async (fournisseurId) => {
    const { data, error } = await supabaseAdmin
      .from("fournisseurs")
      .select("*")
      .eq("id_fournisseur", fournisseurId)
      .single();

    return { data, error };
  },

  // Créer un nouveau fournisseur
  create: async (fournisseurData) => {
    const { data, error } = await supabaseAdmin
      .from("fournisseurs")
      .insert(fournisseurData)
      .select()
      .single();

    return { data, error };
  },

  // Mettre à jour un fournisseur
  update: async (fournisseurId, updates) => {
    const { data, error } = await supabaseAdmin
      .from("fournisseurs")
      .update(updates)
      .eq("id_fournisseur", fournisseurId)
      .select()
      .single();

    return { data, error };
  },

  // Supprimer un fournisseur
  delete: async (fournisseurId) => {
    const { data, error } = await supabaseAdmin
      .from("fournisseurs")
      .delete()
      .eq("id_fournisseur", fournisseurId);

    return { data, error };
  },

  // Rechercher des fournisseurs
  search: async (entrepriseId, searchTerm) => {
    const { data, error } = await supabaseAdmin
      .from("fournisseurs")
      .select("*")
      .eq("id_entreprise", entrepriseId)
      .or(
        `nom_fournisseur.ilike.%${searchTerm}%,contact_telephone.ilike.%${searchTerm}%,adresse.ilike.%${searchTerm}%`,
      )
      .order("nom_fournisseur", { ascending: true });

    return { data, error };
  },

  // Obtenir les fournisseurs avec leurs commandes
  getWithOrders: async (entrepriseId) => {
    const { data, error } = await supabaseAdmin
      .from("fournisseurs")
      .select(
        `
        *,
        commandes (
          id_commande,
          reference,
          date_commande,
          statut,
          montant_total
        )
      `,
      )
      .eq("id_entreprise", entrepriseId)
      .order("nom_fournisseur", { ascending: true });

    return { data, error };
  },

  // Vérifier si un téléphone existe déjà
  checkPhoneExists: async (entrepriseId, telephone, excludeId = null) => {
    if (!telephone) return { exists: false, error: null };

    let query = supabaseAdmin
      .from("fournisseurs")
      .select("id_fournisseur")
      .eq("id_entreprise", entrepriseId)
      .eq("contact_telephone", telephone);

    if (excludeId) {
      query = query.neq("id_fournisseur", excludeId);
    }

    const { data, error } = await query;

    return {
      exists: data && data.length > 0,
      error,
    };
  },

  // Obtenir les statistiques des fournisseurs
  getStats: async (entrepriseId) => {
    const { data, error } = await supabaseAdmin
      .from("fournisseurs")
      .select("id_fournisseur")
      .eq("id_entreprise", entrepriseId);

    return {
      total: data?.length || 0,
      error,
    };
  },
};

export default fournisseurs;
