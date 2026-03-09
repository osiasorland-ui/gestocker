import { supabase } from "./auth.js";

// Fonction utilitaire pour retry des requêtes avec backoff exponentiel
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await requestFn();
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Attendre avec backoff exponentiel
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, attempt - 1)),
      );
    }
  }
};

// Fonctions pour la gestion des transferts entre entrepôts
export const transfers = {
  // Obtenir tous les transferts de l'entreprise
  getAll: async (entrepriseId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("transferts")
        .select("*")
        .eq("id_entreprise", entrepriseId)
        .order("date_transfert", { ascending: false });

      if (error) throw error;
      return { data, error };
    });
  },

  // Créer un nouveau transfert
  create: async (transferData) => {
    return retryRequest(async () => {
      // D'abord créer le transfert
      const { data: transfer, error: transferError } = await supabase
        .from("transferts")
        .insert(transferData)
        .select("*")
        .single();

      if (transferError) throw transferError;

      // Mise à jour des stocks désactivée - les stocks sont gérés dans la table produits
      // await transfers.updateStockAfterTransfer(...);

      return { data: transfer, error: null };
    });
  },

  // Mettre à jour les stocks après un transfert
  updateStockAfterTransfer: async (
    productId,
    sourceWarehouseId,
    destWarehouseId,
    quantity,
    entrepriseId,
  ) => {
    return retryRequest(async () => {
      // 1. Retirer du stock source
      const { data: sourceStock, error: sourceError } = await supabase
        .from("stocks")
        .select("*")
        .eq("id_produit", productId)
        .eq("id_entrepot", sourceWarehouseId)
        .single();

      if (sourceError && sourceError.code !== "PGRST116") {
        throw sourceError;
      }

      if (sourceStock) {
        const newSourceQuantity = Math.max(
          0,
          sourceStock.quantite_disponible - quantity,
        );

        const { error: updateSourceError } = await supabase
          .from("stocks")
          .update({ quantite_disponible: newSourceQuantity })
          .eq("id_stock", sourceStock.id_stock);

        if (updateSourceError) throw updateSourceError;
      }

      // 2. Ajouter au stock destination
      const { data: destStock, error: destError } = await supabase
        .from("stocks")
        .select("*")
        .eq("id_produit", productId)
        .eq("id_entrepot", destWarehouseId)
        .single();

      if (destError && destError.code !== "PGRST116") {
        throw destError;
      }

      if (destStock) {
        const newDestQuantity = destStock.quantite_disponible + quantity;

        const { error: updateDestError } = await supabase
          .from("stocks")
          .update({ quantite_disponible: newDestQuantity })
          .eq("id_stock", destStock.id_stock);

        if (updateDestError) throw updateDestError;
      } else {
        // Créer un nouvel enregistrement de stock si inexistant
        const { error: createDestError } = await supabase
          .from("stocks")
          .insert({
            id_produit: productId,
            id_entrepot: destWarehouseId,
            quantite_disponible: quantity,
            id_entreprise: entrepriseId,
          });

        if (createDestError) throw createDestError;
      }

      return { data: null, error: null };
    });
  },

  // Obtenir un transfert par son ID
  getById: async (transferId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("transferts")
        .select("*")
        .eq("id_transfert", transferId)
        .single();

      if (error) throw error;
      return { data, error };
    });
  },

  // Filtrer les transferts par différents critères
  filter: async (entrepriseId, filters = {}) => {
    return retryRequest(async () => {
      let query = supabase
        .from("transferts")
        .select("*")
        .eq("id_entreprise", entrepriseId);

      // Filtrer par produit
      if (filters.productId) {
        query = query.eq("id_produit", filters.productId);
      }

      // Filtrer par entrepôt source
      if (filters.sourceWarehouseId) {
        query = query.eq("id_entrepot_source", filters.sourceWarehouseId);
      }

      // Filtrer par entrepôt destination
      if (filters.destWarehouseId) {
        query = query.eq("id_entrepot_dest", filters.destWarehouseId);
      }

      // Filtrer par plage de dates
      if (filters.startDate) {
        query = query.gte("date_transfert", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("date_transfert", filters.endDate);
      }

      const { data, error } = await query.order("date_transfert", {
        ascending: false,
      });

      if (error) throw error;
      return { data, error };
    });
  },

  // Obtenir les statistiques des transferts
  getStats: async (entrepriseId, period = "month") => {
    return retryRequest(async () => {
      const now = new Date();
      let startDate;

      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabase
        .from("transferts")
        .select("quantite, date_transfert")
        .eq("id_entreprise", entrepriseId)
        .gte("date_transfert", startDate.toISOString());

      if (error) throw error;

      const stats = {
        totalTransferts: data?.length || 0,
        totalQuantite: data?.reduce((sum, t) => sum + t.quantite, 0) || 0,
      };

      return { data: stats, error: null };
    });
  },

  // Valider un transfert (vérifier le stock disponible)
  validateTransfer: async (productId, sourceWarehouseId, quantity) => {
    return retryRequest(async () => {
      const { data: stock, error } = await supabase
        .from("stocks")
        .select("quantite_disponible")
        .eq("id_produit", productId)
        .eq("id_entrepot", sourceWarehouseId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      const currentStock = stock?.quantite_disponible || 0;

      if (currentStock < quantity) {
        return {
          valid: false,
          message: `Stock insuffisant. Stock actuel: ${currentStock}, Quantité demandée: ${quantity}`,
        };
      }

      return { valid: true, message: "" };
    });
  },

  // Générer une référence de transfert
  generateReference: async (entrepriseId) => {
    try {
      const { data: existingTransfers, error } = await supabase
        .from("transferts")
        .select("id_transfert")
        .eq("id_entreprise", entrepriseId);

      if (error) throw error;

      const nextNumber = (existingTransfers?.length || 0) + 1;
      const paddedNumber = nextNumber.toString().padStart(6, "0");
      return `TRF${paddedNumber}`;
    } catch {
      // En cas d'erreur, utiliser un timestamp comme fallback
      const timestamp = Date.now().toString().slice(-6);
      return `TRF${timestamp}`;
    }
  },
};

export default transfers;
