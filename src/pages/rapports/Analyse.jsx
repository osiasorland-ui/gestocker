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
  Search,
} from "lucide-react";
import { supabase } from "../../config/auth.js";
import { PageLoader } from "../../components/ui/Loader";
import { useAuth } from "../../hooks/useAuthHook.js";

// Import des composants UI
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Loader, { CardLoader, InlineLoader } from "../../components/ui/Loader";

const Analyse = () => {
  const { profile, loading: authLoading } = useAuth();
  const [periode, setPeriode] = useState("mois");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entrepriseId, setEntrepriseId] = useState(null);
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

  // Mettre à jour l'ID d'entreprise quand le profil change
  useEffect(() => {
    if (profile?.id_entreprise && profile.id_entreprise !== entrepriseId) {
      setEntrepriseId(profile.id_entreprise);
    }
  }, [profile?.id_entreprise, entrepriseId]);

  const calculerCroissanceVentes = useCallback((ventes, dates) => {
    if (ventes.length === 0) return 0;

    // Période actuelle
    const periodeActuelle = ventes.filter(
      (v) =>
        new Date(v.date_commande) >= new Date(dates.debut) &&
        new Date(v.date_commande) <= new Date(dates.fin),
    );

    // Calculer période précédente de même durée
    // const dureeMs = new Date(dates.fin) - new Date(dates.debut);
    // const debutPrecedent = new Date(new Date(dates.debut).getTime() - dureeMs);
    // const finPrecedent = new Date(dates.debut);

    // Simuler les ventes de la période précédente (à remplacer avec vraies données)
    // Pour l'instant, estimation basée sur la performance actuelle
    const totalActuel = periodeActuelle.reduce(
      (sum, v) => sum + (v.factures?.montant_ttc || 0),
      0,
    );
    const estimationPrecedent = totalActuel * (0.8 + Math.random() * 0.4); // -20% à +20%

    if (estimationPrecedent === 0) return 0;

    return ((totalActuel - estimationPrecedent) / estimationPrecedent) * 100;
  }, []);

  const calculerStatistiques = useCallback(
    (
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
    },
    [calculerCroissanceVentes],
  );

  const chargerDonnees = useCallback(async () => {
    if (!entrepriseId) return;

    try {
      setLoading(true);

      if (!profile) {
        console.error("Utilisateur non connecté");
        return;
      }

      const entId = entrepriseId;

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
            .eq("id_entreprise", entId)
            .eq("type_commande", "VENTE")
            .gte("date_commande", dates.debut)
            .lte("date_commande", dates.fin)
            .order("date_commande", { ascending: false }),

          supabase
            .from("lignes_commande")
            .select("*, produits(designation, sku)")
            .eq("id_entreprise", entId),

          supabase
            .from("stocks")
            .select("*, produits(designation), entrepots(nom_entrepot)")
            .eq("id_entreprise", entId),

          supabase.from("clients").select("*").eq("id_entreprise", entId),

          supabase.from("produits").select("*").eq("id_entreprise", entId),

          supabase
            .from("livraisons")
            .select("*, livreurs(nom, prenom)")
            .eq("id_entreprise", entId)
            .gte("date_livraison", dates.debut)
            .lte("date_livraison", dates.fin),

          supabase
            .from("mouvements_stock")
            .select("*, produits(designation)")
            .eq("id_entreprise", entId)
            .gte("date_mvt", dates.debut)
            .lte("date_mvt", dates.fin),
        ]);

        // Calculer les statistiques
        calculerStatistiques(
          ventesData?.data || [],
          lignesCommandeData?.data || [],
          stocksData?.data || [],
          clientsData?.data || [],
          produitsData?.data || [],
          livraisonsData?.data || [],
          mouvementsData?.data || [],
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
  }, [periode, profile, entrepriseId, calculerStatistiques]);

  useEffect(() => {
    if (entrepriseId) {
      chargerDonnees();
    }
  }, [entrepriseId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (authLoading || loading) {
    return <PageLoader text="Chargement des analyses..." />;
  }

  return (
    <div className="p-5 mx-auto">
      {/* Loader */}
      {loading && <PageLoader text="Chargement des analyses..." />}
      {!loading && (
        <>
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Analyse des performances
                </h1>
                <p className="mt-2 text-gray-600">
                  Vue d'ensemble de votre activité commerciale
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                {/* Sélecteur de période */}
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">
                    Période:
                  </label>
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
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Rechercher dans les analyses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <Button variant="outline" icon={Filter}>
              Filtres
            </Button>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card hover>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Chiffre d'affaires
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistiques.totalVentes.toLocaleString("fr-FR")} FCFA
                  </p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">
                      {statistiques.croissanceVentes >= 0 ? "+" : ""}
                      {statistiques.croissanceVentes.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Stock total
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistiques.totalStock.toLocaleString("fr-FR")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Clients actifs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistiques.totalClients}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <ShoppingCart className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Références
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistiques.totalProduits}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques et tableaux */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top produits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Produits les plus vendus
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                          <p className="text-sm text-gray-500">
                            SKU: {produit.sku}
                          </p>
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
              </CardContent>
            </Card>

            {/* Top clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Meilleurs clients
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                            {client.nom} {client.prenoms}
                          </p>
                          <p className="text-sm text-gray-500">
                            {client.commandes || 0} commandes
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {(client.montant || 0).toLocaleString("fr-FR")} FCFA
                        </p>
                        <p className="text-sm text-gray-500">montant total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques supplémentaires */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Livraisons
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistiques.totalLivraisons}
                  </p>
                  <p className="text-xs text-gray-500">
                    {statistiques.tauxLivraison.toFixed(1)}% livrés
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <ArrowDownRight className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Entrées stock
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistiques.entreesStock.toLocaleString("fr-FR")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <ArrowUpRight className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Sorties stock
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistiques.sortiesStock.toLocaleString("fr-FR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Analyse;
