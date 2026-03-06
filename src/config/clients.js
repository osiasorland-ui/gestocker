import { supabase } from "./auth.js";

// Fonctions pour la gestion des clients
export const clients = {
  // Obtenir tous les clients d'une entreprise
  getAll: async (entrepriseId) => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id_entreprise", entrepriseId)
      .order("nom", { ascending: true });

    return { data, error };
  },

  // Obtenir un client par son ID
  getById: async (clientId) => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id_client", clientId)
      .single();

    return { data, error };
  },

  // Créer un nouveau client
  create: async (clientData) => {
    const { data, error } = await supabase
      .from("clients")
      .insert(clientData)
      .select()
      .single();

    return { data, error };
  },

  // Mettre à jour un client
  update: async (clientId, updates) => {
    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id_client", clientId)
      .select()
      .single();

    return { data, error };
  },

  // Supprimer un client
  delete: async (clientId) => {
    const { data, error } = await supabase
      .from("clients")
      .delete()
      .eq("id_client", clientId);

    return { data, error };
  },

  // Rechercher des clients
  search: async (entrepriseId, searchTerm) => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id_entreprise", entrepriseId)
      .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order("nom", { ascending: true });

    return { data, error };
  },

  // Obtenir les clients avec leurs commandes
  getWithOrders: async (entrepriseId) => {
    const { data, error } = await supabase
      .from("clients")
      .select(`
        *,
        commandes (
          id_commande,
          reference,
          date_commande,
          statut,
          montant_total
        )
      `)
      .eq("id_entreprise", entrepriseId)
      .order("nom", { ascending: true });

    return { data, error };
  },

  // Vérifier si un téléphone existe déjà
  checkPhoneExists: async (entrepriseId, telephone, excludeId = null) => {
    let query = supabase
      .from("clients")
      .select("id_client")
      .eq("id_entreprise", entrepriseId)
      .eq("telephone", telephone);

    if (excludeId) {
      query = query.neq("id_client", excludeId);
    }

    const { data, error } = await query;

    return { 
      exists: data && data.length > 0, 
      error 
    };
  },

  // Vérifier si un email existe déjà
  checkEmailExists: async (entrepriseId, email, excludeId = null) => {
    if (!email) return { exists: false, error: null };

    let query = supabase
      .from("clients")
      .select("id_client")
      .eq("id_entreprise", entrepriseId)
      .eq("email", email);

    if (excludeId) {
      query = query.neq("id_client", excludeId);
    }

    const { data, error } = await query;

    return { 
      exists: data && data.length > 0, 
      error 
    };
  },

  // Obtenir les statistiques des clients
  getStats: async (entrepriseId) => {
    const { data, error } = await supabase
      .from("clients")
      .select("id_client")
      .eq("id_entreprise", entrepriseId);

    return { 
      total: data?.length || 0, 
      error 
    };
  }
};

export default clients;
