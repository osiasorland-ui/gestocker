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

// Fonctions pour la gestion des produits
export const products = {
  // Obtenir tous les produits de l'entreprise
  getAll: async (entrepriseId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("produits")
        .select(
          `
          *,
          categories (nom_categorie),
          entrepots (nom_entrepot)
        `,
        )
        .eq("id_entreprise", entrepriseId)
        .order("created_at", { ascending: true }); // true = plus ancien en premier

      if (error) throw error;
      return { data, error };
    });
  },

  // Créer un nouveau produit
  create: async (productData) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("produits")
        .insert(productData)
        .select(
          `
          *,
          categories (nom_categorie),
          entrepots (nom_entrepot)
        `,
        )
        .single();

      if (error) throw error;
      return { data, error };
    });
  },

  // Mettre à jour un produit
  update: async (productId, productData) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("produits")
        .update(productData)
        .eq("id_produit", productId)
        .select(
          `
          *,
          categories (nom_categorie),
          entrepots (nom_entrepot)
        `,
        )
        .single();

      if (error) throw error;
      return { data, error };
    });
  },

  // Supprimer un produit
  delete: async (productId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("produits")
        .delete()
        .eq("id_produit", productId);

      if (error) throw error;
      return { data, error };
    });
  },

  // Obtenir un produit par son ID
  getById: async (productId) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("produits")
        .select(
          `
          *,
          categories (nom_categorie),
          entrepots (nom_entrepot)
        `,
        )
        .eq("id_produit", productId)
        .single();

      if (error) throw error;
      return { data, error };
    });
  },

  // Rechercher des produits
  search: async (entrepriseId, searchTerm) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("produits")
        .select(
          `
          *,
          categories (nom_categorie),
          entrepots (nom_entrepot)
        `,
        )
        .eq("id_entreprise", entrepriseId)
        .or(`designation.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error };
    });
  },

  // Générer une référence de produit au format PR000001
  generateReference: async (entrepriseId) => {
    try {
      // Obtenir tous les produits existants pour trouver le plus grand numéro
      const { data: existingProducts, error } = await supabase
        .from("produits")
        .select("sku")
        .eq("id_entreprise", entrepriseId);

      if (error) throw error;

      // Extraire les numéros des références existantes (format PR000001)
      const existingNumbers =
        existingProducts
          ?.map((p) => p.sku)
          .filter((sku) => sku && sku.startsWith("PR"))
          .map((sku) => parseInt(sku.replace("PR", ""), 10))
          .filter((num) => !isNaN(num)) || [];

      // Trouver le prochain numéro disponible
      const maxNumber =
        existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
      const nextNumber = maxNumber + 1;

      // Formatter avec 6 chiffres, complété par des zéros
      const paddedNumber = nextNumber.toString().padStart(6, "0");
      return `PR${paddedNumber}`;
    } catch {
      // En cas d'erreur, utiliser un timestamp comme fallback
      const timestamp = Date.now().toString().slice(-6);
      return `PR${timestamp}`;
    }
  },

  // Insérer plusieurs produits en masse
  bulkInsert: async (productsData) => {
    return retryRequest(async () => {
      const { data, error } = await supabase
        .from("produits")
        .insert(productsData)
        .select();

      if (error) throw error;
      return { data, error };
    });
  },
};

export default products;
