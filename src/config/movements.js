import { supabase, createAdminClient } from "./auth.js";

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

// Fonctions pour la gestion des mouvements de stock
export const movements = {
  // Obtenir tous les mouvements de l'entreprise
  getAll: async (entrepriseId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("mouvements_stock")
        .select(
          `
          *,
          produits (designation, sku),
          entrepots (nom_entrepot)
        `,
        )
        .eq("id_entreprise", entrepriseId)
        .order("date_mvt", { ascending: false });

      if (error) throw error;
      return { data, error };
    });
  },

  // Créer un nouveau mouvement de stock
  create: async (movementData) => {
    return retryRequest(async () => {
      // D'abord créer le mouvement
      const { data: movement, error: movementError } = await supabase
        .from("mouvements_stock")
        .insert(movementData)
        .select(
          `
          *,
          produits (designation, sku),
          entrepots (nom_entrepot)
        `,
        )
        .single();

      if (movementError) throw movementError;

      // Ensuite mettre à jour le stock automatiquement
      await movements.updateStock(
        movementData.id_produit,
        movementData.id_entrepot,
        movementData.quantite,
        movementData.type_mvt,
        movementData.id_entreprise,
      );

      return { data: movement, error: null };
    });
  },

  // Mettre à jour le stock après un mouvement
  updateStock: async (
    productId,
    warehouseId,
    quantity,
    movementType,
    entrepriseId,
  ) => {
    return retryRequest(async () => {
      const supabaseAdmin = createAdminClient();
      // Vérifier si un enregistrement de stock existe déjà
      const { data: existingStock, error: stockError } = await supabaseAdmin
        .from("stocks")
        .select("*")
        .eq("id_produit", productId)
        .eq("id_entrepot", warehouseId)
        .single();

      if (stockError && stockError.code !== "PGRST116") {
        throw stockError;
      }

      let newQuantity;

      if (existingStock) {
        // Mettre à jour le stock existant
        if (movementType === "ENTREE") {
          newQuantity = existingStock.quantite_disponible + quantity;
        } else if (movementType === "SORTIE") {
          newQuantity = Math.max(
            0,
            existingStock.quantite_disponible - quantity,
          );
        } else if (movementType === "AJUSTEMENT") {
          newQuantity = quantity; // Pour les ajustements, la quantité est la nouvelle valeur
        }

        const { data, error } = await supabaseAdmin
          .from("stocks")
          .update({ quantite_disponible: newQuantity })
          .eq("id_stock", existingStock.id_stock);

        if (error) throw error;
        return { data, error: null };
      } else {
        // Créer un nouvel enregistrement de stock
        newQuantity = movementType === "SORTIE" ? 0 : quantity;

        const { data, error } = await supabaseAdmin.from("stocks").insert({
          id_produit: productId,
          id_entrepot: warehouseId,
          quantite_disponible: newQuantity,
          id_entreprise: entrepriseId,
        });

        if (error) throw error;
        return { data, error: null };
      }
    });
  },

  // Obtenir un mouvement par son ID
  getById: async (movementId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("mouvements_stock")
        .select(
          `
          *,
          produits (designation, sku),
          entrepots (nom_entrepot)
        `,
        )
        .eq("id_mvt", movementId)
        .single();

      if (error) throw error;
      return { data, error };
    });
  },

  // Filtrer les mouvements par différents critères
  filter: async (entrepriseId, filters = {}) => {
    return retryRequest(async () => {
      let query = supabase
        .from("mouvements_stock")
        .select(
          `
          *,
          produits (designation, sku),
          entrepots (nom_entrepot)
        `,
        )
        .eq("id_entreprise", entrepriseId);

      // Filtrer par type de mouvement
      if (filters.type && filters.type !== "tous") {
        query = query.eq("type_mvt", filters.type.toUpperCase());
      }

      // Filtrer par produit
      if (filters.productId) {
        query = query.eq("id_produit", filters.productId);
      }

      // Filtrer par entrepôt
      if (filters.warehouseId) {
        query = query.eq("id_entrepot", filters.warehouseId);
      }

      // Filtrer par plage de dates
      if (filters.startDate) {
        query = query.gte("date_mvt", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("date_mvt", filters.endDate);
      }

      // Filtrer par recherche textuelle
      if (filters.search) {
        query = query.or(`
          produits.designation.ilike.%${filters.search}%,
          motif.ilike.%${filters.search}%
        `);
      }

      const { data, error } = await query.order("date_mvt", {
        ascending: false,
      });

      if (error) throw error;
      return { data, error };
    });
  },

  // Obtenir les statistiques des mouvements
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
        .from("mouvements_stock")
        .select("type_mvt, quantite")
        .eq("id_entreprise", entrepriseId)
        .gte("date_mvt", startDate.toISOString());

      if (error) throw error;

      const stats = {
        totalEntrees:
          data
            ?.filter((m) => m.type_mvt === "ENTREE")
            .reduce((sum, m) => sum + m.quantite, 0) || 0,
        totalSorties:
          data
            ?.filter((m) => m.type_mvt === "SORTIE")
            .reduce((sum, m) => sum + m.quantite, 0) || 0,
        totalAjustements:
          data
            ?.filter((m) => m.type_mvt === "AJUSTEMENT")
            .reduce((sum, m) => sum + m.quantite, 0) || 0,
        nombreMouvements: data?.length || 0,
      };

      return { data: stats, error: null };
    });
  },

  // Vérifier si un mouvement est possible (stock suffisant pour les sorties)
  validateMovement: async (productId, warehouseId, quantity, movementType) => {
    if (movementType !== "SORTIE") {
      return { valid: true, message: "" };
    }

    return retryRequest(async () => {
      const { data: stock, error } = await supabase
        .from("stocks")
        .select("quantite_disponible")
        .eq("id_produit", productId)
        .eq("id_entrepot", warehouseId)
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

  // Générer une référence de mouvement
  generateReference: async (entrepriseId) => {
    try {
      const { data: existingMovements, error } = await supabase
        .from("mouvements_stock")
        .select("id_mvt")
        .eq("id_entreprise", entrepriseId);

      if (error) throw error;

      const nextNumber = (existingMovements?.length || 0) + 1;
      const paddedNumber = nextNumber.toString().padStart(6, "0");
      return `MVT${paddedNumber}`;
    } catch {
      // En cas d'erreur, utiliser un timestamp comme fallback
      const timestamp = Date.now().toString().slice(-6);
      return `MVT${timestamp}`;
    }
  },
};

export default movements;
