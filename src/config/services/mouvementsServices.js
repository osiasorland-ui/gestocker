import { supabase } from '../auth';

// Service pour les entrées de stock
export const entreesStock = {
  // Obtenir toutes les entrées d'une entreprise
  getAll: async (id_entreprise) => {
    const { data, error } = await supabase
      .from('entrees_stock')
      .select(`
        *,
        produits: id_produit (
          designation,
          sku,
          prix_unitaire
        ),
        entrepots: id_entrepot (
          nom_entrepot
        ),
        fournisseurs: id_fournisseur (
          nom_fournisseur
        ),
        utilisateurs: id_user (
          nom,
          prenom
        )
      `)
      .eq('id_entreprise', id_entreprise)
      .order('date_entree', { ascending: false });

    return { data, error };
  },

  // Créer une nouvelle entrée de stock
  create: async (entreeData) => {
    const { data, error } = await supabase
      .from('entrees_stock')
      .insert([entreeData])
      .select()
      .single();

    return { data, error };
  },

  // Obtenir une entrée par son ID
  getById: async (id_entree) => {
    const { data, error } = await supabase
      .from('entrees_stock')
      .select(`
        *,
        produits: id_produit (
          designation,
          sku,
          prix_unitaire
        ),
        entrepots: id_entrepot (
          nom_entrepot
        ),
        fournisseurs: id_fournisseur (
          nom_fournisseur
        ),
        utilisateurs: id_user (
          nom,
          prenom
        )
      `)
      .eq('id_entree', id_entree)
      .single();

    return { data, error };
  },

  // Mettre à jour une entrée
  update: async (id_entree, updates) => {
    const { data, error } = await supabase
      .from('entrees_stock')
      .update({ ...updates, updated_at: new Date() })
      .eq('id_entree', id_entree)
      .select()
      .single();

    return { data, error };
  },

  // Supprimer une entrée
  delete: async (id_entree) => {
    const { error } = await supabase
      .from('entrees_stock')
      .delete()
      .eq('id_entree', id_entree);

    return { error };
  },

  // Obtenir les statistiques des entrées
  getStats: async (id_entreprise, period = 'month') => {
    let startDate;
    const now = new Date();
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const { data, error } = await supabase
      .from('entrees_stock')
      .select('quantite, prix_total')
      .eq('id_entreprise', id_entreprise)
      .gte('date_entree', startDate.toISOString());

    if (error) return { data: null, error };

    const stats = {
      totalQuantite: data?.reduce((sum, item) => sum + item.quantite, 0) || 0,
      totalValeur: data?.reduce((sum, item) => sum + (item.prix_total || 0), 0) || 0,
      nombreEntrees: data?.length || 0
    };

    return { data: stats, error: null };
  }
};

// Service pour les sorties de stock
export const sortiesStock = {
  // Obtenir toutes les sorties d'une entreprise
  getAll: async (id_entreprise) => {
    const { data, error } = await supabase
      .from('sorties_stock')
      .select(`
        *,
        produits: id_produit (
          designation,
          sku,
          prix_unitaire
        ),
        entrepots: id_entrepot (
          nom_entrepot
        ),
        clients: id_client (
          nom,
          prenom
        ),
        utilisateurs: id_user (
          nom,
          prenom
        )
      `)
      .eq('id_entreprise', id_entreprise)
      .order('date_sortie', { ascending: false });

    return { data, error };
  },

  // Créer une nouvelle sortie de stock
  create: async (sortieData) => {
    const { data, error } = await supabase
      .from('sorties_stock')
      .insert([sortieData])
      .select()
      .single();

    return { data, error };
  },

  // Obtenir une sortie par son ID
  getById: async (id_sortie) => {
    const { data, error } = await supabase
      .from('sorties_stock')
      .select(`
        *,
        produits: id_produit (
          designation,
          sku,
          prix_unitaire
        ),
        entrepots: id_entrepot (
          nom_entrepot
        ),
        clients: id_client (
          nom,
          prenom
        ),
        utilisateurs: id_user (
          nom,
          prenom
        )
      `)
      .eq('id_sortie', id_sortie)
      .single();

    return { data, error };
  },

  // Mettre à jour une sortie
  update: async (id_sortie, updates) => {
    const { data, error } = await supabase
      .from('sorties_stock')
      .update({ ...updates, updated_at: new Date() })
      .eq('id_sortie', id_sortie)
      .select()
      .single();

    return { data, error };
  },

  // Supprimer une sortie
  delete: async (id_sortie) => {
    const { error } = await supabase
      .from('sorties_stock')
      .delete()
      .eq('id_sortie', id_sortie);

    return { error };
  },

  // Obtenir les statistiques des sorties
  getStats: async (id_entreprise, period = 'month') => {
    let startDate;
    const now = new Date();
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const { data, error } = await supabase
      .from('sorties_stock')
      .select('quantite, prix_total')
      .eq('id_entreprise', id_entreprise)
      .gte('date_sortie', startDate.toISOString());

    if (error) return { data: null, error };

    const stats = {
      totalQuantite: data?.reduce((sum, item) => sum + item.quantite, 0) || 0,
      totalValeur: data?.reduce((sum, item) => sum + (item.prix_total || 0), 0) || 0,
      nombreSorties: data?.length || 0
    };

    return { data: stats, error: null };
  }
};

// Service pour les ajustements de stock
export const ajustementsStock = {
  // Obtenir tous les ajustements d'une entreprise
  getAll: async (id_entreprise) => {
    const { data, error } = await supabase
      .from('ajustements_stock')
      .select(`
        *,
        produits: id_produit (
          designation,
          sku,
          prix_unitaire
        ),
        entrepots: id_entrepot (
          nom_entrepot
        ),
        utilisateurs: id_user (
          nom,
          prenom
        )
      `)
      .eq('id_entreprise', id_entreprise)
      .order('date_ajustement', { ascending: false });

    return { data, error };
  },

  // Créer un nouvel ajustement de stock
  create: async (ajustementData) => {
    const { data, error } = await supabase
      .from('ajustements_stock')
      .insert([ajustementData])
      .select()
      .single();

    return { data, error };
  },

  // Obtenir un ajustement par son ID
  getById: async (id_ajustement) => {
    const { data, error } = await supabase
      .from('ajustements_stock')
      .select(`
        *,
        produits: id_produit (
          designation,
          sku,
          prix_unitaire
        ),
        entrepots: id_entrepot (
          nom_entrepot
        ),
        utilisateurs: id_user (
          nom,
          prenom
        )
      `)
      .eq('id_ajustement', id_ajustement)
      .single();

    return { data, error };
  },

  // Mettre à jour un ajustement
  update: async (id_ajustement, updates) => {
    const { data, error } = await supabase
      .from('ajustements_stock')
      .update({ ...updates, updated_at: new Date() })
      .eq('id_ajustement', id_ajustement)
      .select()
      .single();

    return { data, error };
  },

  // Supprimer un ajustement
  delete: async (id_ajustement) => {
    const { error } = await supabase
      .from('ajustements_stock')
      .delete()
      .eq('id_ajustement', id_ajustement);

    return { error };
  },

  // Obtenir les statistiques des ajustements
  getStats: async (id_entreprise, period = 'month') => {
    let startDate;
    const now = new Date();
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const { data, error } = await supabase
      .from('ajustements_stock')
      .select('quantite, quantite_absolue, type_ajustement')
      .eq('id_entreprise', id_entreprise)
      .gte('date_ajustement', startDate.toISOString());

    if (error) return { data: null, error };

    const stats = {
      totalAugmentations: data?.filter(item => item.type_ajustement === 'AUGMENTATION')
        .reduce((sum, item) => sum + item.quantite_absolue, 0) || 0,
      totalDiminutions: data?.filter(item => item.type_ajustement === 'DIMINUTION')
        .reduce((sum, item) => sum + item.quantite_absolue, 0) || 0,
      nombreAjustements: data?.length || 0
    };

    return { data: stats, error: null };
  }
};

// Service unifié pour les mouvements (utilise les tables spécifiques)
export const mouvementsUnifie = {
  // Obtenir tous les mouvements d'une entreprise
  getAll: async (id_entreprise) => {
    const [entrees, sorties, ajustements, transferts] = await Promise.all([
      entreesStock.getAll(id_entreprise),
      sortiesStock.getAll(id_entreprise),
      ajustementsStock.getAll(id_entreprise),
      supabase
        .from('transferts')
        .select('*')
        .eq('id_entreprise', id_entreprise)
        .order('date_transfert', { ascending: false })
    ]);

    // Récupérer les informations liées pour les transferts
    const transfertsWithRelations = await Promise.all(
      (transferts.data || []).map(async (transfert) => {
        const [produit, entrepotSource, entrepotDest, utilisateur] = await Promise.all([
          supabase.from('produits').select('designation, sku, prix_unitaire').eq('id_produit', transfert.id_produit).single(),
          supabase.from('entrepots').select('nom_entrepot').eq('id_entrepot', transfert.id_entrepot_source).single(),
          supabase.from('entrepots').select('nom_entrepot').eq('id_entrepot', transfert.id_entrepot_dest).single(),
          supabase.from('utilisateurs').select('nom, prenom').eq('id_user', transfert.id_user).maybeSingle()
        ]);

        return {
          ...transfert,
          produits: produit.data || null,
          entrepot_source: { nom_entrepot: entrepotSource.data?.nom_entrepot || '-' },
          entrepot_dest: { nom_entrepot: entrepotDest.data?.nom_entrepot || '-' },
          utilisateurs: utilisateur.data || null
        };
      })
    );

    const allMovements = [
      ...(entrees.data || []).map(item => ({ ...item, type_mvt: 'ENTREE' })),
      ...(sorties.data || []).map(item => ({ ...item, type_mvt: 'SORTIE' })),
      ...(ajustements.data || []).map(item => ({ ...item, type_mvt: 'AJUSTEMENT' })),
      ...transfertsWithRelations.map(item => ({ ...item, type_mvt: 'TRANSFERT' }))
    ].sort((a, b) => {
      const dateA = new Date(a.date_entree || a.date_sortie || a.date_ajustement || a.date_transfert);
      const dateB = new Date(b.date_entree || b.date_sortie || b.date_ajustement || b.date_transfert);
      return dateB - dateA;
    });

    return { data: allMovements, error: null };
  },

  // Obtenir les statistiques globales
  getStats: async (id_entreprise, period = 'month') => {
    const [entreesStats, sortiesStats, ajustementsStats, transfertsData] = await Promise.all([
      entreesStock.getStats(id_entreprise, period),
      sortiesStock.getStats(id_entreprise, period),
      ajustementsStock.getStats(id_entreprise, period),
      supabase
        .from('transferts')
        .select('quantite')
        .eq('id_entreprise', id_entreprise)
        .gte('date_transfert', period === 'month' ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString() : new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    const stats = {
      totalEntrees: entreesStats.data?.totalQuantite || 0,
      totalSorties: sortiesStats.data?.totalQuantite || 0,
      totalAjustements: ajustementsStats.data?.nombreAjustements || 0,
      totalTransferts: transfertsData.data?.reduce((sum, item) => sum + item.quantite, 0) || 0,
      nombreMouvements: (entreesStats.data?.nombreEntrees || 0) + 
                       (sortiesStats.data?.nombreSorties || 0) + 
                       (ajustementsStats.data?.nombreAjustements || 0) + 
                       (transfertsData.data?.length || 0)
    };

    return { data: stats, error: null };
  }
};
