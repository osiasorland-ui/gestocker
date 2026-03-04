import { supabase } from "./auth.js";

// Fonctions pour la gestion des catégories
export const categories = {
  // Obtenir toutes les catégories de l'entreprise avec le nombre de produits
  getAll: async (entrepriseId) => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id_entreprise", entrepriseId)
      .order("nom_categorie", { ascending: true });

    if (error) return { data, error };

    // Pour chaque catégorie, compter le nombre de produits
    const categoriesWithCount = await Promise.all(
      (data || []).map(async (category) => {
        const { data: productsCount, error: countError } = await supabase
          .from("produits")
          .select("id_produit", { count: "exact" })
          .eq("id_categorie", category.id_categorie);

        return {
          ...category,
          nombre_produits: countError ? 0 : (productsCount || []).length,
        };
      }),
    );

    return { data: categoriesWithCount, error: null };
  },

  // Créer une nouvelle catégorie
  create: async (categoryData) => {
    const { data, error } = await supabase
      .from("categories")
      .insert(categoryData)
      .select()
      .single();

    return { data, error };
  },

  // Mettre à jour une catégorie
  update: async (categoryId, categoryData) => {
    const { data, error } = await supabase
      .from("categories")
      .update(categoryData)
      .eq("id_categorie", categoryId)
      .select()
      .single();

    return { data, error };
  },

  // Supprimer une catégorie
  delete: async (categoryId) => {
    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id_categorie", categoryId);

    return { data, error };
  },

  // Générer une référence de catégorie au format CAT000001
  generateReference: async (entrepriseId) => {
    try {
      // Obtenir toutes les catégories existantes pour trouver le plus grand numéro
      const { data: existingCategories, error } = await supabase
        .from("categories")
        .select("id_categorie")
        .eq("id_entreprise", entrepriseId);

      if (error) throw error;

      // Compter le nombre de catégories existantes
      const existingCount = existingCategories?.length || 0;
      const nextNumber = existingCount + 1;

      // Formatter avec 6 chiffres, complété par des zéros
      const paddedNumber = nextNumber.toString().padStart(6, "0");
      return `CAT${paddedNumber}`;
    } catch (error) {
      // En cas d'erreur, utiliser un timestamp comme fallback
      const timestamp = Date.now().toString().slice(-6);
      return `CAT${timestamp}`;
    }
  },

  // Incrémenter le compteur de produits pour une catégorie
  incrementProductCount: async (categoryId) => {
    // Ne plus stocker en base, le compteur est calculé dynamiquement dans getAll()
    // Cette fonction ne fait rien pour l'instant, mais garde la compatibilité
    return { data: null, error: null };
  },

  // Décrémenter le compteur de produits pour une catégorie
  decrementProductCount: async (categoryId) => {
    // Ne plus stocker en base, le compteur est calculé dynamiquement dans getAll()
    // Cette fonction ne fait rien pour l'instant, mais garde la compatibilité
    return { data: null, error: null };
  },
};

export default categories;
