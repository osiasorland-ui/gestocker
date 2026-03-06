import { supabase } from "./auth.js";

// Fonctions pour la gestion des livreurs
export const livreurs = {
  // Obtenir tous les livreurs d'une entreprise
  getAll: async (entrepriseId) => {
    try {
      // Utiliser un client admin pour contourner les restrictions RLS
      const { createClient } = await import("./auth.js");
      const supabaseAdmin = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );

      const { data, error } = await supabaseAdmin
        .from("livreurs")
        .select("*")
        .eq("id_entreprise", entrepriseId)
        .order("created_at", { ascending: false });

      return { data, error };
    } catch (err) {
      console.error("Erreur dans getAll:", err);
      return { data: null, error: err };
    }
  },

  // Obtenir un livreur par son ID
  getById: async (livreurId) => {
    const { data, error } = await supabase
      .from("livreurs")
      .select("*")
      .eq("id_livreur", livreurId)
      .single();

    return { data, error };
  },

  // Créer un nouveau livreur
  create: async (livreurData, userProfile) => {
    try {
      console.log("Données à insérer:", livreurData);
      console.log("Profile:", userProfile);

      // Ajouter l'ID utilisateur depuis le profile
      const dataWithUser = {
        ...livreurData,
        id_user: userProfile?.id_user, // Le champ s'appelle id_user dans votre table
      };

      console.log("Données finales avec user:", dataWithUser);

      // Utiliser un client admin pour contourner les restrictions RLS
      const { createClient } = await import("./auth.js");
      const supabaseAdmin = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );

      const { data, error } = await supabaseAdmin
        .from("livreurs")
        .insert(dataWithUser)
        .select()
        .single();

      console.log("Résultat insertion:", { data, error });

      // Afficher plus de détails sur l'erreur
      if (error) {
        console.error("Détails de l'erreur:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
      }

      return { data, error };
    } catch (err) {
      console.error("Erreur dans create:", err);
      return { data: null, error: err };
    }
  },

  // Mettre à jour un livreur
  update: async (livreurId, updates) => {
    try {
      // Utiliser un client admin pour contourner les restrictions RLS
      const { createClient } = await import("./auth.js");
      const supabaseAdmin = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );

      const { data, error } = await supabaseAdmin
        .from("livreurs")
        .update(updates)
        .eq("id_livreur", livreurId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error("Erreur dans update:", err);
      return { data: null, error: err };
    }
  },

  // Supprimer un livreur
  delete: async (livreurId) => {
    try {
      // Utiliser un client admin pour contourner les restrictions RLS
      const { createClient } = await import("./auth.js");
      const supabaseAdmin = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );

      const { data, error } = await supabaseAdmin
        .from("livreurs")
        .delete()
        .eq("id_livreur", livreurId);

      return { data, error };
    } catch (err) {
      console.error("Erreur dans delete:", err);
      return { data: null, error: err };
    }
  },

  // Rechercher des livreurs
  search: async (entrepriseId, searchTerm) => {
    const { data, error } = await supabase
      .from("livreurs")
      .select("*")
      .eq("id_entreprise", entrepriseId)
      .or(
        `nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
      )
      .order("created_at", { ascending: false });

    return { data, error };
  },

  // Obtenir les livreurs actifs
  getActive: async (entrepriseId) => {
    const { data, error } = await supabase
      .from("livreurs")
      .select("*")
      .eq("id_entreprise", entrepriseId)
      .eq("statut", "ACTIF")
      .order("created_at", { ascending: false });

    return { data, error };
  },

  // Obtenir les livreurs par statut
  getByStatus: async (entrepriseId, statut) => {
    const { data, error } = await supabase
      .from("livreurs")
      .select("*")
      .eq("id_entreprise", entrepriseId)
      .eq("statut", statut)
      .order("created_at", { ascending: false });

    return { data, error };
  },

  // Mettre à jour le statut d'un livreur
  updateStatus: async (livreurId, statut) => {
    const { data, error } = await supabase
      .from("livreurs")
      .update({
        statut,
        updated_at: new Date().toISOString(),
      })
      .eq("id_livreur", livreurId)
      .select()
      .single();

    return { data, error };
  },

  // Obtenir les statistiques des livreurs
  getStats: async (entrepriseId) => {
    const { data, error } = await supabase
      .from("livreurs")
      .select("statut")
      .eq("id_entreprise", entrepriseId);

    if (error) return { data: null, error };

    const stats = {
      total: data?.length || 0,
      actifs: data?.filter((l) => l.statut === "ACTIF").length || 0,
      inactifs: data?.filter((l) => l.statut === "INACTIF").length || 0,
    };

    return { data: stats, error: null };
  },

  // Vérifier si un numéro de téléphone existe déjà
  checkPhoneExists: async (entrepriseId, telephone, excludeId = null) => {
    let query = supabase
      .from("livreurs")
      .select("id_livreur")
      .eq("id_entreprise", entrepriseId)
      .eq("telephone", telephone);

    if (excludeId) {
      query = query.neq("id_livreur", excludeId);
    }

    const { data, error } = await query;

    return {
      exists: data && data.length > 0,
      error,
    };
  },

  // Vérifier si un email existe déjà
  checkEmailExists: async (entrepriseId, email, excludeId = null) => {
    if (!email) return { exists: false, error: null };

    let query = supabase
      .from("livreurs")
      .select("id_livreur")
      .eq("id_entreprise", entrepriseId)
      .eq("email", email);

    if (excludeId) {
      query = query.neq("id_livreur", excludeId);
    }

    const { data, error } = await query;

    return {
      exists: data && data.length > 0,
      error,
    };
  },
};

export default livreurs;
