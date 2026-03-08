import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuthHook.js";
import { useDevise } from "../../hooks/useDevise.js";
import { products } from "../../config/products";
import { categories } from "../../config/categories";
import { warehouses } from "../../config/warehouses";
import { sales } from "../../config/sales";
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Warehouse,
  Folder,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Users,
  ShoppingCart,
  Plus,
} from "lucide-react";
import ModernBarChart from "../../components/charts/ModernBarChart";
import ModernPieChart from "../../components/charts/ModernPieChart";
import ModernLineChart from "../../components/charts/ModernLineChart";

// Import des composants UI
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Loader, {
  PageLoader,
  CardLoader,
  InlineLoader,
} from "../../components/ui/Loader";

function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { formatMontant, loading: deviseLoading } = useDevise();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalWarehouses: 0,
    totalStockValue: 0,
    lowStockProducts: [],
    recentProducts: [],
    topCategories: [],
    warehouseStats: [],
  });

  // États pour les données des graphiques
  const [chartData, setChartData] = useState({
    monthlySales: [],
    salesLabels: [],
    categoryData: [],
    growthTrend: [],
    warehousePerformance: [],
  });

  const [entrepriseId, setEntrepriseId] = useState(null);

  // Mettre à jour l'ID d'entreprise quand le profil change
  useEffect(() => {
    if (profile?.id_entreprise && profile.id_entreprise !== entrepriseId) {
      setEntrepriseId(profile.id_entreprise);
    }
  }, [profile?.id_entreprise, entrepriseId]);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!user || !profile) {
      navigate("/auth");
      return;
    }
  }, [user, profile, navigate]);

  const loadDashboardData = useCallback(async () => {
    if (!entrepriseId) return;

    setLoading(true);
    try {
      console.log("=== CHARGEMENT DASHBOARD ===");
      console.log("User:", user);
      console.log("Profile:", profile);

      if (!profile?.id_entreprise) {
        console.log("Pas d'entreprise ID dans le profil");
        return;
      }

      const entId = profile.id_entreprise;

      // Charger toutes les données en parallèle
      const [
        productsResult,
        categoriesResult,
        warehousesResult,
        salesResult,
        categorySalesResult,
        growthResult,
      ] = await Promise.all([
        products.getAll(entId),
        categories.getAll(entId),
        warehouses.getAll(entId),
        sales.getMonthlyStats(entId, 7),
        sales.getSalesByCategory(entId),
        sales.getGrowthTrend(entId, 6),
      ]);

      if (
        productsResult.error ||
        categoriesResult.error ||
        warehousesResult.error
      ) {
        throw new Error("Erreur lors du chargement des données");
      }

      const produits = productsResult.data || [];
      const categoriesList = categoriesResult.data || [];
      const warehousesList = warehousesResult.data || [];

      // Calculer les statistiques
      console.log("Produits pour calcul de la valeur du stock:", produits);
      const totalStockValue = produits.reduce((total, produit) => {
        const productValue =
          (produit.quantite_stock || 0) * (produit.prix_unitaire || 0);
        console.log(
          `Produit: ${produit.designation}, Quantité: ${produit.quantite_stock}, Prix: ${produit.prix_unitaire}, Valeur: ${productValue}`,
        );
        return total + productValue;
      }, 0);
      console.log("Valeur totale du stock calculée:", totalStockValue);

      // Identifier les produits en stock faible
      const lowStockProducts = produits
        .filter((produit) => (produit.quantite_stock || 0) < 10)
        .slice(0, 5);

      // Produits récents (derniers 5)
      const recentProducts = produits.slice(0, 5);

      // Top catégories par nombre de produits
      const topCategories = categoriesList
        .sort((a, b) => (b.nombre_produits || 0) - (a.nombre_produits || 0))
        .slice(0, 5);

      // Statistiques des entrepôts
      const warehouseStats = warehousesList.map((warehouse) => ({
        ...warehouse,
        fillRate:
          warehouse.stock_total > 0
            ? (
                ((warehouse.nombre_produits || 0) / warehouse.stock_total) *
                100
              ).toFixed(1)
            : 0,
      }));

      // Mettre à jour les statistiques
      setStats({
        totalProducts: produits.length,
        totalCategories: categoriesList.length,
        totalWarehouses: warehousesList.length,
        totalStockValue,
        lowStockProducts,
        recentProducts,
        topCategories,
        warehouseStats,
      });

      // Mettre à jour les données des graphiques
      setChartData({
        monthlySales: salesResult.data || [],
        salesLabels: salesResult.labels || [],
        categoryData: categorySalesResult.data || [],
        growthTrend: growthResult.data || [],
        warehousePerformance: warehousesList.map((w) => w.stock_total || 0),
      });

      console.log("Données dashboard chargées avec succès");
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [entrepriseId, user, profile]);

  useEffect(() => {
    if (entrepriseId) {
      loadDashboardData();
    }
  }, [entrepriseId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto p-10">
      {/* Loader */}
      {loading && <PageLoader text="Chargement du tableau de bord..." />}

      {/* Contenu du dashboard */}
      {!loading && (
        <>
          {/* Welcome Section */}
          <div className="mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 text-center">
                Bienvenue,{" "}
                {profile?.nom + " " + profile?.prenom ||
                  user?.nom ||
                  "Utilisateur"}
                !
              </h1>
              <p className="mt-2 text-gray-600 text-center">
                Gérez votre stock et votre entreprise depuis ce tableau de bord
              </p>
            </div>
          </div>

          {/* Cartes de statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card hover>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Produits
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalProducts.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <Folder className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Catégories
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalCategories.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <Warehouse className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Entrepôts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalWarehouses.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Valeur Stock
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading || deviseLoading
                      ? "Chargement..."
                      : formatMontant(stats.totalStockValue)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertes et produits récents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Alertes de stock faible */}
            <Card>
              <CardHeader>
                <CardTitle>Alertes Stock Faible</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.lowStockProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Aucun produit en stock faible
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.lowStockProducts.map((product) => (
                      <div
                        key={product.id_produit}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {product.designation}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.categories?.nom_categorie}
                          </p>
                        </div>
                        <Badge variant="danger" className="text-xs">
                          {product.quantite_stock || 0} unités
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Produits récents */}
            <Card>
              <CardHeader>
                <CardTitle>Produits Récents</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun produit récent</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentProducts.map((product) => (
                      <div
                        key={product.id_produit}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {product.designation}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(product.created_at).toLocaleDateString(
                              "fr-FR",
                            )}
                          </p>
                        </div>
                        <Badge variant="primary" className="text-xs">
                          {product.quantite_stock || 0} unités
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top catégories et entrepôts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top catégories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Catégories</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune catégorie</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.topCategories.map((category) => (
                      <div
                        key={category.id_categorie}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {category.nom_categorie}
                          </p>
                          <p className="text-xs text-gray-500">
                            {category.nombre_produits || 0} produits
                          </p>
                        </div>
                        <Badge variant="success" className="text-xs">
                          {category.nombre_produits || 0} produits
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistiques des entrepôts */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques Entrepôts</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.warehouseStats.length === 0 ? (
                  <div className="text-center py-8">
                    <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun entrepôt</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.warehouseStats.map((warehouse) => (
                      <div
                        key={warehouse.id_entrepot}
                        className="border-l-4 border-purple-500 pl-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900">
                            {warehouse.nom_entrepot}
                          </p>
                          <Badge variant="primary" className="text-xs">
                            {warehouse.fillRate}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-gray-500">Produits</p>
                            <p className="font-bold text-gray-900">
                              {warehouse.nombre_produits || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Stock Total</p>
                            <p className="font-bold text-gray-900">
                              {warehouse.stock_total || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Taux</p>
                            <p className="font-bold text-purple-600">
                              {warehouse.fillRate}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Graphiques Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ModernBarChart
              title="Évolution des ventes"
              data={chartData.monthlySales}
              labels={chartData.salesLabels}
              color="primary"
              height={250}
            />

            <ModernPieChart
              title="Répartition par catégorie"
              data={chartData.categoryData}
              size={200}
            />

            <ModernLineChart
              title="Tendance mensuelle"
              data={chartData.growthTrend}
              labels={chartData.salesLabels}
              color="#8B5CF6"
              height={250}
            />
          </div>

          {/* Graphiques additionnels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <ModernBarChart
              title="Performance des entrepôts"
              data={chartData.warehousePerformance}
              labels={stats.warehouseStats.map(
                (w) => w.nom_entrepot || "Entrepôt",
              )}
              color="success"
              height={200}
            />

            <ModernLineChart
              title="Croissance mensuelle"
              data={chartData.growthTrend}
              labels={chartData.salesLabels}
              color="#F59E0B"
              height={200}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
