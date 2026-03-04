import { supabase } from "./auth.js";

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

export default users;
