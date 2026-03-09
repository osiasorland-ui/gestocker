import { supabase, createAdminClient } from "./auth.js";

// Fonctions pour la gestion des entrepôts
export const warehouses = {
  // Obtenir tous les entrepôts de l'entreprise avec le nombre de produits, le stock total et les infos du gérant
  getAll: async (entrepriseId) => {
    // D'abord, récupérer les entrepôts
    const { data: warehouses, error } = await supabase
      .from("entrepots")
      .select("*")
      .eq("id_entreprise", entrepriseId)
      .order("created_at", { ascending: false });

    if (error) return { data: warehouses, error };

    // DEBUG: Afficher les données brutes pour vérifier la jointure
    console.log("Données entrepôts brutes:", warehouses);

    // Pour chaque entrepôt, compter les produits ET récupérer les infos du gérant manuellement
    const warehousesWithStats = await Promise.all(
      (warehouses || []).map(async (warehouse) => {
        // Obtenir tous les produits dans cet entrepôt avec leurs quantités
        const { data: productsInWarehouse, error: countError } = await supabase
          .from("produits")
          .select("quantite_stock")
          .eq("id_entrepot", warehouse.id_entrepot);

        // Récupérer manuellement les infos du gérant si id_gerant existe
        let gerantInfo = null;
        if (warehouse.id_gerant) {
          const supabaseAdmin = createAdminClient();
          const { data: gerantData } = await supabaseAdmin
            .from("utilisateurs")
            .select("id_user, nom, prenom, email")
            .eq("id_user", warehouse.id_gerant)
            .eq("statut", "actif")
            .single();

          gerantInfo = gerantData;
          console.log(
            `Gérant trouvé pour ${warehouse.nom_entrepot}:`,
            gerantData,
          );
        } else {
          console.log(`Pas de gérant assigné pour ${warehouse.nom_entrepot}`);
        }

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
          // Ajouter les infos du gérant pour l'affichage
          gerant_nom: gerantInfo?.nom,
          gerant_prenom: gerantInfo?.prenom,
          gerant_email: gerantInfo?.email,
        };
      }),
    );

    // DEBUG: Afficher les données finales avec les infos du gérant
    console.log("Données entrepôts avec gérants:", warehousesWithStats);

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
    } catch {
      // En cas d'erreur, utiliser un timestamp comme fallback
      const timestamp = Date.now().toString().slice(-6);
      return `EN${timestamp}`;
    }
  },
};

export default warehouses;
