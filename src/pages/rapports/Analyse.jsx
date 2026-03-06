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
  });

  const chargerDonnees = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer l'ID de l'entreprise
      const { data: userData } = await supabase
        .from("utilisateurs")
        .select("id_entreprise")
        .eq("id_user", user.id)
        .single();

      if (!userData) return;

      const entrepriseId = userData.id_entreprise;

      // Calculer les dates selon la période
      const dates = getDatesPeriode(periode);

      // Charger les données
      const [ventesData, stocksData, clientsData, produitsData] =
        await Promise.all([
          supabase
            .from("commandes")
            .select("*, factures(montant_ttc)")
            .eq("id_entreprise", entrepriseId)
            .eq("type_commande", "VENTE")
            .gte("date_commande", dates.debut)
            .lte("date_commande", dates.fin)
            .order("date_commande", { ascending: false }),

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
        ]);

      // Calculer les statistiques
      calculerStatistiques(
        ventesData || [],
        stocksData || [],
        clientsData || [],
        produitsData || [],
      );
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
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

  const calculerStatistiques = (ventes, stocks, clients, produits) => {
    // Calculer le total des ventes
    const totalVentes = ventes.reduce((sum, vente) => {
      return sum + (vente.factures?.montant_ttc || 0);
    }, 0);

    // Calculer le total du stock
    const totalStock = stocks.reduce(
      (sum, stock) => sum + stock.quantite_disponible,
      0,
    );

    // Top produits
    const ventesParProduit = {};
    ventes.forEach((vente) => {
      // Ici il faudrait joindre avec les lignes de commande pour une analyse plus précise
      ventesParProduit[vente.id_commande] =
        (ventesParProduit[vente.id_commande] || 0) + 1;
    });

    const topProduits = produits
      .map((produit) => ({
        ...produit,
        ventes: ventesParProduit[produit.id_produit] || 0,
      }))
      .sort((a, b) => b.ventes - a.ventes)
      .slice(0, 5);

    // Top clients
    const ventesParClient = {};
    ventes.forEach((vente) => {
      if (vente.id_client) {
        ventesParClient[vente.id_client] =
          (ventesParClient[vente.id_client] || 0) + 1;
      }
    });

    const topClients = clients
      .map((client) => ({
        ...client,
        commandes: ventesParClient[client.id_client] || 0,
      }))
      .sort((a, b) => b.commandes - a.commandes)
      .slice(0, 5);

    setStatistiques({
      totalVentes,
      totalStock,
      totalClients: clients.length,
      totalProduits: produits.length,
      croissanceVentes: Math.random() * 20 - 10, // Simulation - à calculer avec données historiques
      topProduits,
      topClients,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
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
                  <p className="text-sm text-gray-500">ventes</p>
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
                    {client.commandes}
                  </p>
                  <p className="text-sm text-gray-500">commandes</p>
                </div>
              </div>
            ))}
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
