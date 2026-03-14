import { supabase } from "./auth.js";

// Fonctions pour la gestion des commandes
export const orders = {
  // Obtenir toutes les commandes d'une entreprise
  getAll: async (entrepriseId) => {
    const { data, error } = await supabase
      .from("commandes")
      .select(`
        *,
        clients (
          id_client,
          nom,
          prenom,
          telephone,
          email
        )
      `)
      .eq("id_entreprise", entrepriseId)
      .order("date_commande", { ascending: false });

    return { data, error };
  },

  // Obtenir une commande par son ID
  getById: async (orderId) => {
    const { data, error } = await supabase
      .from("commandes")
      .select(`
        *,
        clients (
          id_client,
          nom,
          prenom,
          telephone,
          email
        )
      `)
      .eq("id_commande", orderId)
      .single();

    return { data, error };
  },

  // Créer une nouvelle commande
  create: async (orderData) => {
    const { data, error } = await supabase
      .from("commandes")
      .insert(orderData)
      .select(`
        *,
        clients (
          id_client,
          nom,
          prenom,
          telephone,
          email
        )
      `)
      .single();

    return { data, error };
  },

  // Mettre à jour une commande
  update: async (orderId, updates) => {
    const { data, error } = await supabase
      .from("commandes")
      .update(updates)
      .eq("id_commande", orderId)
      .select(`
        *,
        clients (
          id_client,
          nom,
          prenom,
          telephone,
          email
        )
      `)
      .single();

    return { data, error };
  },

  // Supprimer une commande
  delete: async (orderId) => {
    const { data, error } = await supabase
      .from("commandes")
      .delete()
      .eq("id_commande", orderId);

    return { data, error };
  },

  // Rechercher des commandes
  search: async (entrepriseId, searchTerm) => {
    const { data, error } = await supabase
      .from("commandes")
      .select(`
        *,
        clients (
          id_client,
          nom,
          prenom,
          telephone,
          email
        )
      `)
      .eq("id_entreprise", entrepriseId)
      .or(`reference.ilike.%${searchTerm}%,clients.nom.ilike.%${searchTerm}%,clients.prenom.ilike.%${searchTerm}%`)
      .order("date_commande", { ascending: false });

    return { data, error };
  },

  // Obtenir les commandes avec leurs produits
  getWithProducts: async (entrepriseId) => {
    const { data, error } = await supabase
      .from("commandes")
      .select(`
        *,
        clients (
          id_client,
          nom,
          prenom,
          telephone,
          email
        ),
        commande_produits (
          id_commande_produit,
          quantite,
          prix_unitaire,
          total,
          produits (
            id_produit,
            designation,
            sku,
            prix_unitaire
          )
        )
      `)
      .eq("id_entreprise", entrepriseId)
      .order("date_commande", { ascending: false });

    return { data, error };
  },

  // Obtenir les statistiques des commandes
  getStats: async (entrepriseId) => {
    try {
      const { data, error } = await supabase
        .from("commandes")
        .select("statut, montant_total")
        .eq("id_entreprise", entrepriseId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        en_attente: data?.filter(c => c.statut === "EN_ATTENTE").length || 0,
        valide: data?.filter(c => c.statut === "VALIDE").length || 0,
        annule: data?.filter(c => c.statut === "ANNULE").length || 0,
        montant_total: data?.reduce((sum, c) => sum + (c.montant_total || 0), 0) || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Mettre à jour le statut d'une commande
  updateStatus: async (orderId, status) => {
    const { data, error } = await supabase
      .from("commandes")
      .update({ 
        statut: status,
        date_mise_a_jour: new Date().toISOString()
      })
      .eq("id_commande", orderId)
      .select()
      .single();

    return { data, error };
  },

  // Générer une référence unique
  generateReference: async (entrepriseId) => {
    try {
      // Compter les commandes existantes
      const { data: existingOrders, error: countError } = await supabase
        .from("commandes")
        .select("id_commande")
        .eq("id_entreprise", entrepriseId);

      if (countError) throw countError;

      const count = existingOrders?.length || 0;
      return `CMD${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      console.error('Erreur génération référence:', error);
      return `CMD000001`;
    }
  }
};

export default orders;
