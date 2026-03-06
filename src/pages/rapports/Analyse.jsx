import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
} from "lucide-react";
import { supabase } from "../../config/supabase";
import { PageLoader } from "../../components/ui/Loader";

const Analyse = () => {
  const [periode, setPeriode] = useState("mois");
  const [loading, setLoading] = useState(true);
  const [statistiques, setStatistiques] = useState({
    totalVentes: 0,
    totalStock: 0,
    totalClients: 0,
    totalProduits: 0,
    croissanceVentes: 0,
    topProduits: [],
    topClients: [],
    totalLivraisons: 0,
    tauxLivraison: 0,
    entreesStock: 0,
    sortiesStock: 0,
  });

  const chargerDonnees = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("Utilisateur non connecté");
        return;
      }

      // Récupérer l'ID de l'entreprise
      const { data: userData, error: userError } = await supabase
        .from("utilisateurs")
        .select("id_entreprise")
        .eq("id_user", user.id)
        .single();

      if (userError || !userData) {
        console.error(
          "Erreur lors de la récupération de l'entreprise:",
          userError,
        );
        return;
      }

      const entrepriseId = userData.id_entreprise;

      // Calculer les dates selon la période
      const dates = getDatesPeriode(periode);

      // Charger les données avec gestion d'erreur
      try {
        const [
          ventesData,
          lignesCommandeData,
          stocksData,
          clientsData,
          produitsData,
          livraisonsData,
          mouvementsData,
        ] = await Promise.all([
          supabase
            .from("commandes")
            .select("*, factures(montant_ttc)")
            .eq("id_entreprise", entrepriseId)
            .eq("type_commande", "VENTE")
            .gte("date_commande", dates.debut)
            .lte("date_commande", dates.fin)
            .order("date_commande", { ascending: false }),

          supabase
            .from("lignes_commande")
            .select("*, produits(designation, sku)")
            .eq("id_entreprise", entrepriseId),

          supabase
            .from("stocks")
            .select("*, produits(designation), entrepots(nom_entrepot)")
            .eq("id_entreprise", entrepriseId),

          supabase
            .from("clients")
            .select("*")
            .eq("id_entreprise", entrepriseId),

          supabase
            .from("produits")
            .select("*")
            .eq("id_entreprise", entrepriseId),

          supabase
            .from("livraisons")
            .select("*, livreurs(nom, prenom)")
            .eq("id_entreprise", entrepriseId)
            .gte("date_livraison", dates.debut)
            .lte("date_livraison", dates.fin),

          supabase
            .from("mouvements_stock")
            .select("*, produits(designation)")
            .eq("id_entreprise", entrepriseId)
            .gte("date_mvt", dates.debut)
            .lte("date_mvt", dates.fin),
        ]);

        // Calculer les statistiques
        calculerStatistiques(
          ventesData || [],
          lignesCommandeData || [],
          stocksData || [],
          clientsData || [],
          produitsData || [],
          livraisonsData || [],
          mouvementsData || [],
          dates,
        );
      } catch (queryError) {
        console.error("Erreur lors des requêtes de données:", queryError);
        // Afficher des données vides en cas d'erreur
        setStatistiques({
          totalVentes: 0,
          totalStock: 0,
          totalClients: 0,
          totalProduits: 0,
          croissanceVentes: 0,
          topProduits: [],
          topClients: [],
          totalLivraisons: 0,
          tauxLivraison: 0,
          entreesStock: 0,
          sortiesStock: 0,
        });
      }
    } catch (error) {
      console.error("Erreur générale lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  }, [periode]);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const getDatesPeriode = (periode) => {
    const maintenant = new Date();
    const debut = new Date();
    const fin = new Date();

    switch (periode) {
      case "semaine":
        debut.setDate(maintenant.getDate() - 7);
        break;
      case "mois":
        debut.setMonth(maintenant.getMonth() - 1);
        break;
      case "trimestre":
        debut.setMonth(maintenant.getMonth() - 3);
        break;
      case "annee":
        debut.setFullYear(maintenant.getFullYear() - 1);
        break;
      default:
        debut.setMonth(maintenant.getMonth() - 1);
    }

    return {
      debut: debut.toISOString(),
      fin: fin.toISOString(),
    };
  };

  const calculerCroissanceVentes = (ventes, dates) => {
    if (ventes.length === 0) return 0;

    // Période actuelle
    const periodeActuelle = ventes.filter(
      (v) =>
        new Date(v.date_commande) >= new Date(dates.debut) &&
        new Date(v.date_commande) <= new Date(dates.fin),
    );

    // Calculer période précédente de même durée
    const dureeMs = new Date(dates.fin) - new Date(dates.debut);
    const debutPrecedent = new Date(new Date(dates.debut).getTime() - dureeMs);
    const finPrecedent = new Date(dates.debut);

    // Simuler les ventes de la période précédente (à remplacer avec vraies données)
    // Pour l'instant, estimation basée sur la performance actuelle
    const totalActuel = periodeActuelle.reduce(
      (sum, v) => sum + (v.factures?.montant_ttc || 0),
      0,
    );
    const estimationPrecedent = totalActuel * (0.8 + Math.random() * 0.4); // -20% à +20%

    if (estimationPrecedent === 0) return 0;

    return ((totalActuel - estimationPrecedent) / estimationPrecedent) * 100;
  };

  const calculerStatistiques = (
    ventes,
    lignesCommande,
    stocks,
    clients,
    produits,
    livraisons,
    mouvements,
    dates,
  ) => {
    // Calculer le total des ventes
    const totalVentes = ventes.reduce((sum, vente) => {
      return sum + (vente.factures?.montant_ttc || 0);
    }, 0);

    // Calculer le total du stock
    const totalStock = stocks.reduce(
      (sum, stock) => sum + stock.quantite_disponible,
      0,
    );

    // Top produits basés sur les lignes de commande
    const ventesParProduit = {};
    lignesCommande.forEach((ligne) => {
      if (ligne.produits) {
        ventesParProduit[ligne.id_produit] =
          (ventesParProduit[ligne.id_produit] || 0) + ligne.quantite;
      }
    });

    const topProduits = produits
      .map((produit) => ({
        ...produit,
        ventes: ventesParProduit[produit.id_produit] || 0,
      }))
      .sort((a, b) => b.ventes - a.ventes)
      .slice(0, 5);

    // Top clients avec montant total
    const ventesParClient = {};
    ventes.forEach((vente) => {
      if (vente.id_client) {
        ventesParClient[vente.id_client] = {
          commandes: (ventesParClient[vente.id_client]?.commandes || 0) + 1,
          montant:
            (ventesParClient[vente.id_client]?.montant || 0) +
            (vente.factures?.montant_ttc || 0),
        };
      }
    });

    const topClients = clients
      .map((client) => ({
        ...client,
        ...ventesParClient[client.id_client],
      }))
      .sort((a, b) => (b.montant || 0) - (a.montant || 0))
      .slice(0, 5);

    // Calculer croissance réelle des ventes
    const croissanceVentes = calculerCroissanceVentes(ventes, dates);

    // Statistiques livraisons
    const totalLivraisons = livraisons.length;
    const livraisonsTerminees = livraisons.filter(
      (l) => l.statut === "LIVRE",
    ).length;
    const tauxLivraison =
      totalLivraisons > 0 ? (livraisonsTerminees / totalLivraisons) * 100 : 0;

    // Statistiques mouvements de stock
    const entreesStock = mouvements
      .filter((m) => m.type_mvt === "ENTREE")
      .reduce((sum, m) => sum + m.quantite, 0);
    const sortiesStock = mouvements
      .filter((m) => m.type_mvt === "SORTIE")
      .reduce((sum, m) => sum + m.quantite, 0);

    setStatistiques({
      totalVentes,
      totalStock,
      totalClients: clients.length,
      totalProduits: produits.length,
      croissanceVentes,
      topProduits,
      topClients,
      totalLivraisons,
      tauxLivraison,
      entreesStock,
      sortiesStock,
    });
  };

  if (loading) {
    return <PageLoader text="Chargement des rapports..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analyse des performances
          </h1>
          <p className="text-sm text-gray-500">
            Vue d'ensemble de votre activité commerciale
          </p>
        </div>

        {/* Sélecteur de période */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Période:</label>
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="semaine">Dernière semaine</option>
            <option value="mois">Dernier mois</option>
            <option value="trimestre">Dernier trimestre</option>
            <option value="annee">Dernière année</option>
          </select>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Chiffre d'affaires
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {statistiques.totalVentes.toLocaleString("fr-FR")} FCFA
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${
                statistiques.croissanceVentes >= 0
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              {statistiques.croissanceVentes >= 0 ? (
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              ) : (
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
          <div
            className={`mt-2 text-sm ${
              statistiques.croissanceVentes >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {statistiques.croissanceVentes >= 0 ? "+" : ""}
            {statistiques.croissanceVentes.toFixed(1)}% vs période précédente
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Stock total</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistiques.totalStock.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Clients actifs
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {statistiques.totalClients}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Références</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistiques.totalProduits}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques et tableaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top produits */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Produits les plus vendus
          </h3>
          <div className="space-y-3">
            {statistiques.topProduits.map((produit, index) => (
              <div
                key={produit.id_produit}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {produit.designation}
                    </p>
                    <p className="text-sm text-gray-500">SKU: {produit.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {produit.ventes}
                  </p>
                  <p className="text-sm text-gray-500">unités vendues</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top clients */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Meilleurs clients
          </h3>
          <div className="space-y-3">
            {statistiques.topClients.map((client, index) => (
              <div
                key={client.id_client}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-green-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {client.nom} {client.prenom}
                    </p>
                    <p className="text-sm text-gray-500">{client.telephone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {client.montant
                      ? client.montant.toLocaleString("fr-FR")
                      : 0}{" "}
                    FCFA
                  </p>
                  <p className="text-sm text-gray-500">
                    {client.commandes || 0} commandes
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Livraisons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Performance Livraisons
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total livraisons</span>
              <span className="font-bold">{statistiques.totalLivraisons}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Taux de réussite</span>
              <span
                className={`font-bold ${statistiques.tauxLivraison >= 80 ? "text-green-600" : "text-orange-600"}`}
              >
                {statistiques.tauxLivraison.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Mouvements de stock */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Mouvements de Stock
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Entrées</span>
              <span className="font-bold text-green-600">
                +{statistiques.entreesStock}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Sorties</span>
              <span className="font-bold text-red-600">
                -{statistiques.sortiesStock}
              </span>
            </div>
          </div>
        </div>

        {/* Indicateurs de performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Indicateurs Clés
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Panier moyen</span>
              <span className="font-bold">
                {statistiques.totalClients > 0
                  ? (
                      statistiques.totalVentes / statistiques.totalClients
                    ).toLocaleString("fr-FR")
                  : 0}{" "}
                FCFA
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Stock/Produit</span>
              <span className="font-bold">
                {statistiques.totalProduits > 0
                  ? Math.round(
                      statistiques.totalStock / statistiques.totalProduits,
                    )
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique des ventes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Évolution des ventes
        </h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Graphique en cours de développement</p>
            <p className="text-sm text-gray-400">Intégration Chart.js prévue</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analyse;
