import { supabase } from "../config/supabase";

// Services pour interagir avec les tables Supabase basées sur votre schéma de base de données

export const entrepriseService = {
  getAll: async () => {
    const { data, error } = await supabase.from("entreprises").select("*");
    return { data, error };
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from("entreprises")
      .select("*")
      .eq("id_entreprise", id)
      .single();
    return { data, error };
  },

  create: async (entrepriseData) => {
    const { data, error } = await supabase
      .from("entreprises")
      .insert(entrepriseData)
      .select()
      .single();
    return { data, error };
  },
};

export const roleService = {
  getAll: async (idEntreprise) => {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .eq("id_entreprise", idEntreprise);
    return { data, error };
  },

  create: async (roleData) => {
    const { data, error } = await supabase
      .from("roles")
      .insert(roleData)
      .select()
      .single();
    return { data, error };
  },
};

export const categorieService = {
  getAll: async (idEntreprise) => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id_entreprise", idEntreprise);
    return { data, error };
  },

  create: async (categorieData) => {
    const { data, error } = await supabase
      .from("categories")
      .insert(categorieData)
      .select()
      .single();
    return { data, error };
  },

  update: async (id, categorieData) => {
    const { data, error } = await supabase
      .from("categories")
      .update(categorieData)
      .eq("id_categorie", id)
      .select()
      .single();
    return { data, error };
  },

  delete: async (id) => {
    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id_categorie", id);
    return { data, error };
  },
};

export const produitService = {
  getAll: async (idEntreprise) => {
    const { data, error } = await supabase
      .from("produits")
      .select(
        `
        *,
        categories (nom_categorie)
      `,
      )
      .eq("id_entreprise", idEntreprise);
    return { data, error };
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from("produits")
      .select(
        `
        *,
        categories (nom_categorie)
      `,
      )
      .eq("id_produit", id)
      .single();
    return { data, error };
  },

  create: async (produitData) => {
    const { data, error } = await supabase
      .from("produits")
      .insert(produitData)
      .select()
      .single();
    return { data, error };
  },

  update: async (id, produitData) => {
    const { data, error } = await supabase
      .from("produits")
      .update(produitData)
      .eq("id_produit", id)
      .select()
      .single();
    return { data, error };
  },

  delete: async (id) => {
    const { data, error } = await supabase
      .from("produits")
      .delete()
      .eq("id_produit", id);
    return { data, error };
  },

  getStock: async (idProduit, idEntreprise) => {
    const { data, error } = await supabase
      .from("stocks")
      .select(
        `
        *,
        entrepots (nom_entrepot)
      `,
      )
      .eq("id_produit", idProduit)
      .eq("id_entreprise", idEntreprise);
    return { data, error };
  },
};

export const entrepotService = {
  getAll: async (idEntreprise) => {
    const { data, error } = await supabase
      .from("entrepots")
      .select("*")
      .eq("id_entreprise", idEntreprise);
    return { data, error };
  },

  create: async (entrepotData) => {
    const { data, error } = await supabase
      .from("entrepots")
      .insert(entrepotData)
      .select()
      .single();
    return { data, error };
  },
};

export const stockService = {
  getAll: async (idEntreprise) => {
    const { data, error } = await supabase
      .from("stocks")
      .select(
        `
        *,
        produits (designation, sku),
        entrepots (nom_entrepot)
      `,
      )
      .eq("id_entreprise", idEntreprise);
    return { data, error };
  },

  updateStock: async (id, stockData) => {
    const { data, error } = await supabase
      .from("stocks")
      .update(stockData)
      .eq("id_stock", id)
      .select()
      .single();
    return { data, error };
  },

  getLowStock: async (idEntreprise) => {
    const { data, error } = await supabase
      .from("stocks")
      .select(
        `
        *,
        produits (designation, sku),
        entrepots (nom_entrepot)
      `,
      )
      .eq("id_entreprise", idEntreprise)
      .lt("quantite_disponible", "seuil_alerte");
    return { data, error };
  },
};

export const clientService = {
  getAll: async (idEntreprise) => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id_entreprise", idEntreprise);
    return { data, error };
  },

  create: async (clientData) => {
    const { data, error } = await supabase
      .from("clients")
      .insert(clientData)
      .select()
      .single();
    return { data, error };
  },

  update: async (id, clientData) => {
    const { data, error } = await supabase
      .from("clients")
      .update(clientData)
      .eq("id_client", id)
      .select()
      .single();
    return { data, error };
  },

  delete: async (id) => {
    const { data, error } = await supabase
      .from("clients")
      .delete()
      .eq("id_client", id);
    return { data, error };
  },
};

export const fournisseurService = {
  getAll: async (idEntreprise) => {
    const { data, error } = await supabase
      .from("fournisseurs")
      .select("*")
      .eq("id_entreprise", idEntreprise);
    return { data, error };
  },

  create: async (fournisseurData) => {
    const { data, error } = await supabase
      .from("fournisseurs")
      .insert(fournisseurData)
      .select()
      .single();
    return { data, error };
  },

  update: async (id, fournisseurData) => {
    const { data, error } = await supabase
      .from("fournisseurs")
      .update(fournisseurData)
      .eq("id_fournisseur", id)
      .select()
      .single();
    return { data, error };
  },

  delete: async (id) => {
    const { data, error } = await supabase
      .from("fournisseurs")
      .delete()
      .eq("id_fournisseur", id);
    return { data, error };
  },
};

export const commandeService = {
  getAll: async (idEntreprise) => {
    const { data, error } = await supabase
      .from("commandes")
      .select(
        `
        *,
        clients (nom, prenom),
        fournisseurs (nom_societe)
      `,
      )
      .eq("id_entreprise", idEntreprise);
    return { data, error };
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from("commandes")
      .select(
        `
        *,
        clients (nom, prenom),
        fournisseurs (nom_societe),
        lignes_commande (
          *,
          produits (designation, sku)
        )
      `,
      )
      .eq("id_commande", id)
      .single();
    return { data, error };
  },

  create: async (commandeData) => {
    const { data, error } = await supabase
      .from("commandes")
      .insert(commandeData)
      .select()
      .single();
    return { data, error };
  },

  update: async (id, commandeData) => {
    const { data, error } = await supabase
      .from("commandes")
      .update(commandeData)
      .eq("id_commande", id)
      .select()
      .single();
    return { data, error };
  },
};

export const mouvementStockService = {
  getAll: async (idEntreprise) => {
    const { data, error } = await supabase
      .from("mouvements_stock")
      .select(
        `
        *,
        produits (designation, sku),
        entrepots (nom_entrepot),
        utilisateurs (nom)
      `,
      )
      .eq("id_entreprise", idEntreprise)
      .order("date_mvt", { ascending: false });
    return { data, error };
  },

  create: async (mouvementData) => {
    const { data, error } = await supabase
      .from("mouvements_stock")
      .insert(mouvementData)
      .select()
      .single();
    return { data, error };
  },

  getByProduct: async (idProduit, idEntreprise) => {
    const { data, error } = await supabase
      .from("mouvements_stock")
      .select(
        `
        *,
        entrepots (nom_entrepot),
        utilisateurs (nom)
      `,
      )
      .eq("id_produit", idProduit)
      .eq("id_entreprise", idEntreprise)
      .order("date_mvt", { ascending: false });
    return { data, error };
  },
};

export const notificationService = {
  getAll: async (idUser) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id_user", idUser)
      .order("date_envoi", { ascending: false });
    return { data, error };
  },

  markAsRead: async (id) => {
    const { data, error } = await supabase
      .from("notifications")
      .update({ est_lu: true })
      .eq("id_notif", id);
    return { data, error };
  },

  create: async (notificationData) => {
    const { data, error } = await supabase
      .from("notifications")
      .insert(notificationData)
      .select()
      .single();
    return { data, error };
  },
};

export default {
  entrepriseService,
  roleService,
  categorieService,
  produitService,
  entrepotService,
  stockService,
  clientService,
  fournisseurService,
  commandeService,
  mouvementStockService,
  notificationService,
};
