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

// Fonctions pour la gestion des stocks
export const stocks = {
  // Obtenir tous les stocks de l'entreprise
  getAll: async (entrepriseId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("stocks")
        .select(
          `
          *,
          produits (designation, sku),
          entrepots (nom_entrepot)
        `,
        )
        .eq("id_entreprise", entrepriseId);

      if (error) throw error;
      return { data, error };
    });
  },

  // Obtenir le stock d'un produit dans un entrepôt spécifique
  getProductStock: async (productId, warehouseId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("stocks")
        .select("*")
        .eq("id_produit", productId)
        .eq("id_entrepot", warehouseId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return { data: data || { quantite_disponible: 0 }, error: null };
    });
  },

  // Obtenir le stock d'un produit dans un entrepôt spécifique (alias pour consistency)
  getByProductAndWarehouse: async (productId, warehouseId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("stocks")
        .select(
          `
          *,
          produits (designation, sku),
          entrepots (nom_entrepot)
        `,
        )
        .eq("id_produit", productId)
        .eq("id_entrepot", warehouseId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return { data: data || { quantite_disponible: 0 }, error: null };
    });
  },

  // Obtenir tous les stocks d'un produit (dans tous les entrepôts)
  getProductStocks: async (productId, entrepriseId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("stocks")
        .select(
          `
          *,
          entrepots (nom_entrepot)
        `,
        )
        .eq("id_produit", productId)
        .eq("id_entreprise", entrepriseId);

      if (error) throw error;
      return { data, error };
    });
  },

  // Obtenir tous les stocks d'un entrepôt
  getWarehouseStocks: async (warehouseId, entrepriseId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("stocks")
        .select(
          `
          *,
          produits (designation, sku, categories (nom_categorie))
        `,
        )
        .eq("id_entrepot", warehouseId)
        .eq("id_entreprise", entrepriseId)
        .order("quantite_disponible", { ascending: true });

      if (error) throw error;
      return { data, error };
    });
  },

  // Mettre à jour le stock d'un produit
  updateStock: async (stockId, quantity) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("stocks")
        .update({ quantite_disponible: Math.max(0, quantity) })
        .eq("id_stock", stockId)
        .select(
          `
          *,
          produits (designation, sku),
          entrepots (nom_entrepot)
        `,
        )
        .single();

      if (error) throw error;
      return { data, error };
    });
  },

  // Créer ou mettre à jour le stock (upsert)
  upsertStock: async (stockData) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("stocks")
        .upsert(stockData, {
          onConflict: "id_produit,id_entrepot,id_entreprise",
          ignoreDuplicates: false,
        })
        .select(
          `
          *,
          produits (designation, sku),
          entrepots (nom_entrepot)
        `,
        )
        .single();

      if (error) throw error;
      return { data, error };
    });
  },

  // Obtenir les produits en stock faible
  getLowStockProducts: async (entrepriseId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("stocks")
        .select(
          `
          *,
          produits (designation, sku, categories (nom_categorie)),
          entrepots (nom_entrepot)
        `,
        )
        .eq("id_entreprise", entrepriseId)
        .lte("quantite_disponible", "seuil_alerte")
        .order("quantite_disponible", { ascending: true });

      if (error) throw error;
      return { data, error };
    });
  },

  // Obtenir les statistiques des stocks
  getStats: async (entrepriseId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("stocks")
        .select("quantite_disponible, seuil_alerte")
        .eq("id_entreprise", entrepriseId);

      if (error) throw error;

      const stats = {
        totalProducts: data?.length || 0,
        lowStockProducts:
          data?.filter((s) => s.quantite_disponible <= s.seuil_alerte).length ||
          0,
        outOfStockProducts:
          data?.filter((s) => s.quantite_disponible === 0).length || 0,
        totalQuantity:
          data?.reduce((sum, s) => sum + s.quantite_disponible, 0) || 0,
      };

      return { data: stats, error: null };
    });
  },

  // Ajuster le stock (pour les corrections manuelles)
  adjustStock: async (stockId, newQuantity, reason, userId, entrepriseId) => {
    return retryRequest(async () => {
      // D'abord obtenir le stock actuel
      const { data: currentStock, error: fetchError } = await supabase
        .from("stocks")
        .select("quantite_disponible, id_produit, id_entrepot")
        .eq("id_stock", stockId)
        .single();

      if (fetchError) throw fetchError;

      // Calculer la différence
      const difference = newQuantity - currentStock.quantite_disponible;

      // Mettre à jour le stock
      const { data: updatedStock, error: updateError } = await supabase
        .from("stocks")
        .update({ quantite_disponible: newQuantity })
        .eq("id_stock", stockId)
        .single();

      if (updateError) throw updateError;

      // Créer un mouvement d'ajustement
      const movementData = {
        type_mvt: "AJUSTEMENT",
        quantite: Math.abs(difference),
        motif: reason || "Ajustement manuel du stock",
        id_produit: currentStock.id_produit,
        id_entrepot: currentStock.id_entrepot,
        id_user: userId,
        id_entreprise: entrepriseId,
      };

      const { error: movementError } = await supabase
        .from("mouvements_stock")
        .insert(movementData);

      if (movementError) throw movementError;

      return { data: updatedStock, error: null };
    });
  },

  // Transférer du stock entre entrepôts
  transferStock: async (transferData) => {
    return retryRequest(async () => {
      const {
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        userId,
        entrepriseId,
        motif,
      } = transferData;

      // Vérifier le stock disponible dans l'entrepôt source
      const { data: sourceStock, error: sourceError } = await supabase
        .from("stocks")
        .select("quantite_disponible")
        .eq("id_produit", productId)
        .eq("id_entrepot", fromWarehouseId)
        .single();

      if (sourceError) throw sourceError;

      if (sourceStock.quantite_disponible < quantity) {
        throw new Error(
          `Stock insuffisant. Disponible: ${sourceStock.quantite_disponible}, Demandé: ${quantity}`,
        );
      }

      // Créer le transfert
      const { data: transfer, error: transferError } = await supabase
        .from("transferts")
        .insert({
          id_produit: productId,
          id_entrepot_source: fromWarehouseId,
          id_entrepot_dest: toWarehouseId,
          quantite: quantity,
          id_user: userId,
          id_entreprise: entrepriseId,
          motif: motif || "Transfert de stock",
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // Mettre à jour le stock source (sortie)
      await supabase
        .from("stocks")
        .update({
          quantite_disponible: sourceStock.quantite_disponible - quantity,
        })
        .eq("id_produit", productId)
        .eq("id_entrepot", fromWarehouseId);

      // Mettre à jour le stock destination (entrée)
      const { data: destStock, error: destError } = await supabase
        .from("stocks")
        .select("quantite_disponible")
        .eq("id_produit", productId)
        .eq("id_entrepot", toWarehouseId)
        .single();

      if (destError && destError.code === "PGRST116") {
        // Créer un nouveau stock pour l'entrepôt de destination
        await supabase.from("stocks").insert({
          id_produit: productId,
          id_entrepot: toWarehouseId,
          quantite_disponible: quantity,
          id_entreprise: entrepriseId,
        });
      } else if (destError) {
        throw destError;
      } else {
        // Mettre à jour le stock existant
        await supabase
          .from("stocks")
          .update({
            quantite_disponible: destStock.quantite_disponible + quantity,
          })
          .eq("id_produit", productId)
          .eq("id_entrepot", toWarehouseId);
      }

      // Créer les mouvements correspondants
      await supabase.from("mouvements_stock").insert([
        {
          type_mvt: "SORTIE",
          quantite: quantity,
          motif: `Transfert vers ${toWarehouseId}: ${motif || "Transfert de stock"}`,
          id_produit: productId,
          id_entrepot: fromWarehouseId,
          id_user: userId,
          id_entreprise: entrepriseId,
        },
        {
          type_mvt: "ENTREE",
          quantite: quantity,
          motif: `Transfert depuis ${fromWarehouseId}: ${motif || "Transfert de stock"}`,
          id_produit: productId,
          id_entrepot: toWarehouseId,
          id_user: userId,
          id_entreprise: entrepriseId,
        },
      ]);

      return { data: transfer, error: null };
    });
  },
};

export default stocks;
