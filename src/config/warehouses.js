import { supabase } from "./auth.js";

// Fonctions pour la gestion des entrepôts
export const warehouses = {
  // Obtenir tous les entrepôts de l'entreprise avec le nombre de produits et le stock total
  getAll: async (entrepriseId) => {
    const { data, error } = await supabase
      .from("entrepots")
      .select("*")
      .eq("id_entreprise", entrepriseId)
      .order("created_at", { ascending: false });

    if (error) return { data, error };

    // Pour chaque entrepôt, compter le nombre de produits et calculer le stock total
    const warehousesWithStats = await Promise.all(
      (data || []).map(async (warehouse) => {
        // Obtenir tous les produits dans cet entrepôt avec leurs quantités
        const { data: productsInWarehouse, error: countError } = await supabase
          .from("produits")
          .select("quantite_stock")
          .eq("id_entrepot", warehouse.id_entrepot);

        // Calculer le stock total (somme des quantités)
        const stockTotal = countError
          ? 0
          : (productsInWarehouse || []).reduce(
              (total, product) => total + (product.quantite_stock || 0),
              0,
            );

        return {
          ...warehouse,
          nombre_produits: countError ? 0 : (productsInWarehouse || []).length,
          stock_total: stockTotal,
        };
      }),
    );

    return { data: warehousesWithStats, error: null };
  },

  // Créer un nouvel entrepôt
  create: async (warehouseData) => {
    const { data, error } = await supabase
      .from("entrepots")
      .insert(warehouseData)
      .select()
      .single();

    return { data, error };
  },

  // Mettre à jour un entrepôt
  update: async (warehouseId, warehouseData) => {
    const { data, error } = await supabase
      .from("entrepots")
      .update(warehouseData)
      .eq("id_entrepot", warehouseId)
      .select()
      .single();

    return { data, error };
  },

  // Supprimer un entrepôt
  delete: async (warehouseId) => {
    const { data, error } = await supabase
      .from("entrepots")
      .delete()
      .eq("id_entrepot", warehouseId);

    return { data, error };
  },

  // Générer une référence d'entrepôt au format EN000001
  generateReference: async (entrepriseId) => {
    try {
      // Obtenir tous les entrepôts existants pour trouver le plus grand numéro
      const { data: existingWarehouses, error } = await supabase
        .from("entrepots")
        .select("nom_entrepot")
        .eq("id_entreprise", entrepriseId);

      if (error) throw error;

      // Extraire les numéros des références existantes (format EN000001)
      const existingNumbers =
        existingWarehouses
          ?.map((w) => w.nom_entrepot)
          .filter((name) => name && name.startsWith("EN"))
          .map((name) => parseInt(name.replace("EN", ""), 10))
          .filter((num) => !isNaN(num)) || [];

      // Trouver le prochain numéro disponible
      const maxNumber =
        existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
      const nextNumber = maxNumber + 1;

      // Formatter avec 6 chiffres, complété par des zéros
      const paddedNumber = nextNumber.toString().padStart(6, "0");
      return `EN${paddedNumber}`;
    } catch (error) {
      // En cas d'erreur, utiliser un timestamp comme fallback
      const timestamp = Date.now().toString().slice(-6);
      return `EN${timestamp}`;
    }
  },
};

export default warehouses;
