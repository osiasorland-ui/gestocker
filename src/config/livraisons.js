import { supabase } from "./auth.js";

// Fonctions pour la gestion des livraisons
export const livraisons = {
  // Obtenir toutes les livraisons d'une entreprise
  getAll: async (entrepriseId) => {
    const { data, error } = await supabase
      .from("livraisons")
      .select(`
        *,
        clients (*),
        livreurs (*),
        commandes (*),
        details_livraison (*, produits (*))
      `)
      .eq("id_entreprise", entrepriseId)
      .order("date_livraison", { ascending: false });

    return { data, error };
  },

  // Obtenir une livraison par son ID
  getById: async (livraisonId) => {
    const { data, error } = await supabase
      .from("livraisons")
      .select(`
        *,
        clients (*),
        livreurs (*),
        commandes (*),
        details_livraison (*, produits (*))
      `)
      .eq("id_livraison", livraisonId)
      .single();

    return { data, error };
  },

  // Créer une nouvelle livraison
  create: async (livraisonData) => {
    // Générer une référence automatique
    const reference = `LIV-${Date.now()}`;
    
    const { data, error } = await supabase
      .from("livraisons")
      .insert({
        ...livraisonData,
        reference,
        statut: "EN_ATTENTE"
      })
      .select()
      .single();

    return { data, error };
  },

  // Mettre à jour une livraison
  update: async (livraisonId, updates) => {
    const { data, error } = await supabase
      .from("livraisons")
      .update(updates)
      .eq("id_livraison", livraisonId)
      .select()
      .single();

    return { data, error };
  },

  // Supprimer une livraison
  delete: async (livraisonId) => {
    // D'abord supprimer les détails de livraison
    await supabase
      .from("details_livraison")
      .delete()
      .eq("id_livraison", livraisonId);

    // Puis supprimer la livraison
    const { data, error } = await supabase
      .from("livraisons")
      .delete()
      .eq("id_livraison", livraisonId);

    return { data, error };
  },

  // Mettre à jour le statut d'une livraison
  updateStatus: async (livraisonId, statut) => {
    const { data, error } = await supabase
      .from("livraisons")
      .update({ statut })
      .eq("id_livraison", livraisonId)
      .select()
      .single();

    return { data, error };
  },

  // Obtenir les livraisons par statut
  getByStatus: async (entrepriseId, statut) => {
    const { data, error } = await supabase
      .from("livraisons")
      .select(`
        *,
        clients (*),
        livreurs (*),
        commandes (*)
      `)
      .eq("id_entreprise", entrepriseId)
      .eq("statut", statut)
      .order("date_livraison", { ascending: false });

    return { data, error };
  },

  // Obtenir les livraisons d'un livreur
  getByLivreur: async (entrepriseId, livreurId) => {
    const { data, error } = await supabase
      .from("livraisons")
      .select(`
        *,
        clients (*),
        commandes (*)
      `)
      .eq("id_entreprise", entrepriseId)
      .eq("id_livreur", livreurId)
      .order("date_livraison", { ascending: false });

    return { data, error };
  },

  // Obtenir les livraisons par période
  getByDateRange: async (entrepriseId, startDate, endDate) => {
    const { data, error } = await supabase
      .from("livraisons")
      .select(`
        *,
        clients (*),
        livreurs (*),
        commandes (*)
      `)
      .eq("id_entreprise", entrepriseId)
      .gte("date_livraison", startDate)
      .lte("date_livraison", endDate)
      .order("date_livraison", { ascending: false });

    return { data, error };
  },

  // Ajouter des détails à une livraison
  addDetails: async (detailData) => {
    const { data, error } = await supabase
      .from("details_livraison")
      .insert(detailData)
      .select()
      .single();

    return { data, error };
  },

  // Mettre à jour les détails d'une livraison
  updateDetails: async (detailId, updates) => {
    const { data, error } = await supabase
      .from("details_livraison")
      .update(updates)
      .eq("id_detail", detailId)
      .select()
      .single();

    return { data, error };
  },

  // Obtenir les détails d'une livraison
  getDetails: async (livraisonId) => {
    const { data, error } = await supabase
      .from("details_livraison")
      .select(`
        *,
        produits (*)
      `)
      .eq("id_livraison", livraisonId);

    return { data, error };
  },

  // Obtenir les statistiques des livraisons
  getStats: async (entrepriseId, period = 'month') => {
    let dateFilter;
    const now = new Date();
    
    switch(period) {
      case 'day':
        dateFilter = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        dateFilter = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
    }

    const { data, error } = await supabase
      .from("livraisons")
      .select("statut, date_livraison")
      .eq("id_entreprise", entrepriseId)
      .gte("date_livraison", dateFilter.toISOString());

    if (error) return { data: null, error };

    const stats = {
      total: data?.length || 0,
      en_attente: data?.filter(l => l.statut === "EN_ATTENTE").length || 0,
      en_cours: data?.filter(l => l.statut === "EN_COURS").length || 0,
      livre: data?.filter(l => l.statut === "LIVRE").length || 0,
      annule: data?.filter(l => l.statut === "ANNULE").length || 0,
    };

    return { data: stats, error: null };
  },

  // Assigner un livreur à une livraison
  assignLivreur: async (livraisonId, livreurId) => {
    const { data, error } = await supabase
      .from("livraisons")
      .update({ 
        id_livreur: livreurId,
        statut: "EN_COURS"
      })
      .eq("id_livraison", livraisonId)
      .select()
      .single();

    return { data, error };
  },

  // Marquer une livraison comme terminée
  completeDelivery: async (livraisonId, detailsUpdates = []) => {
    // Mettre à jour les détails si fournis
    if (detailsUpdates.length > 0) {
      for (const detail of detailsUpdates) {
        await this.updateDetails(detail.id_detail, {
          quantite_livree: detail.quantite_livree,
          quantite_retournee: detail.quantite_retournee || 0
        });
      }
    }

    // Mettre à jour le statut de la livraison
    const { data, error } = await supabase
      .from("livraisons")
      .update({ 
        statut: "LIVRE"
      })
      .eq("id_livraison", livraisonId)
      .select()
      .single();

    return { data, error };
  }
};

export default livraisons;
