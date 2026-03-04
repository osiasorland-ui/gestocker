import { supabase } from "./auth.js";

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

export default companies;
