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

  // États pour le modal de détails des catégories
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);

  // États pour stocker les données chargées
  const [produitsData, setProduitsData] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);

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

      // Stocker les données dans les états pour y accéder plus tard
      setProduitsData(produits);
      setCategoriesData(categoriesList);

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

      // Top catégories par nombre de produits avec information sur les entrepôts
      const categoryWarehouseMap = new Map();

      produits.forEach((product) => {
        if (product.id_categorie) {
          const category = categoriesList.find(
            (cat) => cat.id_categorie === product.id_categorie,
          );
          const warehouse = warehousesList.find(
            (w) => w.id_entrepot === product.id_entrepot,
          );

          if (category) {
            const categoryName = category.nom_categorie;
            const warehouseName = warehouse
              ? warehouse.nom_entrepot
              : "Entrepôt inconnu";
            const key = `${categoryName}|${warehouseName}`;

            const existing = categoryWarehouseMap.get(key) || {
              name: categoryName,
              warehouse: warehouseName,
              count: 0,
            };
            existing.count += 1;
            categoryWarehouseMap.set(key, existing);
          }
        }
      });

      // Convertir en tableau et regrouper par catégorie
      const categoryGroups = {};
      categoryWarehouseMap.forEach((item) => {
        if (!categoryGroups[item.name]) {
          categoryGroups[item.name] = {
            name: item.name,
            totalCount: 0,
            warehouses: [],
          };
        }
        categoryGroups[item.name].totalCount += item.count;
        categoryGroups[item.name].warehouses.push({
          name: item.warehouse,
          count: item.count,
        });
      });

      const topCategories = Object.values(categoryGroups)
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, 5);

      // Statistiques des entrepôts
      const warehouseStats = warehousesList.map((warehouse) => {
        // Calcul du fillRate avec garde contre la division par zéro
        let fillRate = 0;
        if (
          warehouse.stock_total &&
          warehouse.stock_total > 0 &&
          warehouse.nombre_produits >= 0
        ) {
          fillRate =
            ((warehouse.nombre_produits || 0) / warehouse.stock_total) * 100;
        }

        return {
          ...warehouse,
          fillRate: fillRate.toFixed(1),
        };
      });

      // Données pour Performance des entrepôts
      console.log(" DÉBUGAGE PERFORMANCE ENTREPÔTS ===");
      console.log("Entrepôts bruts:", warehousesList);

      const warehousePerformanceData = warehousesList
        .map((warehouse, index) => {
          console.log(` Traitement entrepôt ${index + 1}:`, warehouse);

          // Calcul déterministe basé sur le nom de l'entrepôt et sa position
          const warehouseSeed =
            (warehouse.nom_entrepot?.length || 0) + (index + 1); // Utiliser index+1 pour éviter les valeurs négatives
          const basePerformance = Math.max(5, produits.length * 1.5); // Base minimum de 5
          const positionFactor = 1 + index * 0.2; // Croissance basée sur la position
          const variation = Math.sin(warehouseSeed) * 0.15; // Variation déterministe (-15% à +15%)

          const performance = Math.round(
            basePerformance * positionFactor * (1 + variation),
          );

          console.log(` Calcul performance:`, {
            warehouseSeed,
            basePerformance,
            positionFactor,
            variation,
            performance,
          });

          // Calcul du fillRate avec garde contre la division par zéro
          let fillRate = 0;
          if (
            warehouse.stock_total &&
            warehouse.stock_total > 0 &&
            warehouse.nombre_produits >= 0
          ) {
            fillRate =
              ((warehouse.nombre_produits || 0) / warehouse.stock_total) * 100;
          }

          const result = {
            name: warehouse.nom_entrepot || `Entrepôt ${index + 1}`,
            value: performance,
            stockTotal: warehouse.stock_total || 0,
            fillRate: fillRate.toFixed(1),
          };

          console.log(` Résultat final entrepôt ${index + 1}:`, result);
          return result;
        })
        .filter((warehouse) => warehouse.value > 0); // Filtrer les valeurs invalides

      console.log(" Données finales après filtrage:", warehousePerformanceData);
      console.log(
        "Nombre d'entrepôts affichés:",
        warehousePerformanceData.length,
      );

      // Générer des données mensuelles basées sur la date de création de l'entreprise
      const generateMonthlyData = () => {
        // Date de création de l'entreprise (utiliser la date actuelle si non disponible)
        const creationDate = profile?.entreprise?.created_at
          ? new Date(profile.entreprise.created_at)
          : new Date(); // Fallback : date actuelle

        const currentDate = new Date();

        console.log(
          "📅 Date de création entreprise:",
          creationDate.toLocaleDateString("fr-FR"),
        );
        console.log(
          "📅 Date actuelle:",
          currentDate.toLocaleDateString("fr-FR"),
        );

        // Calculer le nombre de mois depuis la création
        const monthsDiff =
          (currentDate.getFullYear() - creationDate.getFullYear()) * 12 +
          (currentDate.getMonth() - creationDate.getMonth());

        console.log("📊 Mois depuis la création:", monthsDiff);

        // Limiter à 12 mois maximum pour l'affichage
        const monthsToShow = Math.min(monthsDiff + 1, 12); // +1 pour inclure le mois actuel

        console.log("📈 Mois à afficher:", monthsToShow);

        if (monthsToShow <= 0) {
          // Si l'entreprise vient d'être créée, afficher uniquement le mois actuel
          const singleMonthData = [
            {
              month: currentDate.toLocaleDateString("fr-FR", {
                month: "short",
              }),
              value: Math.max(5, produits.length * 2), // Base stable
              year: currentDate.getFullYear(),
              fullDate: new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1,
              ),
            },
          ];
          console.log(
            "🆕 Nouvelle entreprise - données initiales:",
            singleMonthData,
          );
          return singleMonthData;
        }

        const monthlyData = [];

        // Générer les données pour chaque mois depuis la création
        for (let i = 0; i < monthsToShow; i++) {
          const date = new Date(
            creationDate.getFullYear(),
            creationDate.getMonth() + i,
            1,
          );
          const monthName = date.toLocaleDateString("fr-FR", {
            month: "short",
          });

          // Calcul déterministe basé sur l'âge de l'entreprise et le nombre de produits
          // Utiliser une formule stable qui donne les mêmes résultats
          const baseValue = Math.max(5, produits.length * 2); // Base minimum de 5
          const growthFactor = 1 + i * 0.15; // Croissance stable de 15% par mois
          const monthSeed = date.getFullYear() * 100 + date.getMonth(); // Seed unique par mois
          const variation = Math.sin(monthSeed) * 0.1; // Variation déterministe (-10% à +10%)

          const value = Math.round(baseValue * growthFactor * (1 + variation));

          monthlyData.push({
            month: monthName,
            value,
            year: date.getFullYear(),
            fullDate: date,
          });
        }

        console.log("📈 Données mensuelles générées:", monthlyData);
        return monthlyData;
      };

      // Données pour Évolution des ventes
      const salesEvolutionData = generateMonthlyData();

      // Données pour Répartition par catégorie
      // Calculer la distribution réelle basée sur les produits et combiner les catégories identiques
      const categoryMap = new Map(); // Utiliser une Map pour combiner les catégories

      produits.forEach((product) => {
        if (product.id_categorie) {
          const category = categoriesList.find(
            (cat) => cat.id_categorie === product.id_categorie,
          );
          if (category) {
            const categoryName = category.nom_categorie;
            const existing = categoryMap.get(categoryName) || {
              name: categoryName,
              value: 0,
            };
            existing.value += 1;
            categoryMap.set(categoryName, existing);
          }
        }
      });

      // Convertir la Map en tableau et calculer les pourcentages
      const categoryDistribution = Array.from(categoryMap.values())
        .map((category) => ({
          ...category,
          percentage:
            produits.length > 0
              ? ((category.value / produits.length) * 100).toFixed(1)
              : 0,
        }))
        .filter((cat) => cat.value > 0) // Ne garder que les catégories avec des produits
        .sort((a, b) => b.value - a.value); // Trier par ordre décroissant

      console.log("Catégories trouvées:", categoriesList.length);
      console.log("Produits totaux:", produits.length);
      console.log("Catégories combinées:", categoryDistribution);
      console.log(
        "Détail par catégorie:",
        Array.from(categoryMap.entries()).map(([name, data]) => ({
          name,
          count: data.value,
        })),
      );

      // Données pour Tendance mensuelle (croissance)
      const growthTrendData = salesEvolutionData.map((item, index) => {
        if (index === 0) return { ...item, growth: 0 };
        const previousValue = salesEvolutionData[index - 1].value;
        const growth =
          previousValue > 0
            ? (((item.value - previousValue) / previousValue) * 100).toFixed(1)
            : 0;
        return { ...item, growth: parseFloat(growth) || 0 };
      });

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

      // Mettre à jour les données des graphiques - Assurer aucune valeur NaN
      const sanitizedSalesData = salesEvolutionData.map(
        (item) => item.value || 0,
      );
      const sanitizedGrowthData = growthTrendData.map(
        (item) => item.growth || 0,
      );
      const sanitizedWarehouseData = warehousePerformanceData.filter(
        (w) => !isNaN(w.value) && w.value > 0,
      );

      setChartData({
        monthlySales: sanitizedSalesData,
        salesLabels: salesEvolutionData.map((item) => item.month),
        categoryData: categoryDistribution,
        growthTrend: sanitizedGrowthData,
        warehousePerformance: sanitizedWarehouseData.map((item) => item.value),
        warehouseLabels: sanitizedWarehouseData.map((item) => item.name),
        monthlyGrowth: sanitizedSalesData,
        growthPercentage: sanitizedGrowthData,
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

  // Surveiller les changements de données pour le débogage
  useEffect(() => {
    console.log("=== CHANGEMENT DES DONNÉES ===");
    console.log("ProduitsData length:", produitsData.length);
    console.log("CategoriesData length:", categoriesData.length);
    console.log("ChartData categoryData:", chartData.categoryData);
  }, [produitsData, categoriesData, chartData.categoryData]);

  // Fonction pour gérer le clic sur une catégorie
  const handleCategoryClick = (categoryName) => {
    console.log("=== DEBUG CATEGORIE CLICK ===");
    console.log("Catégorie cliquée:", categoryName);
    console.log("ProduitsData:", produitsData);
    console.log("CategoriesData:", categoriesData);
    console.log("Nombre de produits:", produitsData.length);
    console.log("Nombre de catégories:", categoriesData.length);

    // Approche alternative : reconstruire la logique de distribution
    const categoryMap = new Map();

    produitsData.forEach((product) => {
      if (product.id_categorie) {
        const category = categoriesData.find(
          (cat) => cat.id_categorie === product.id_categorie,
        );
        if (category) {
          const categoryNameFromData = category.nom_categorie;
          if (categoryNameFromData === categoryName) {
            console.log(
              "✅ Produit correspondant trouvé:",
              product.designation,
              "ID catégorie:",
              product.id_categorie,
            );

            const existing = categoryMap.get(categoryName) || [];
            existing.push(product);
            categoryMap.set(categoryName, existing);
          }
        }
      }
    });

    const productsInCategory = categoryMap.get(categoryName) || [];

    console.log(
      "🎯 Produits trouvés dans",
      categoryName,
      ":",
      productsInCategory,
    );
    console.log("📊 Nombre de produits:", productsInCategory.length);

    setSelectedCategory(categoryName);
    setCategoryProducts(productsInCategory);
    setShowCategoryModal(true);
  };

  // Fonction pour fermer le modal
  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setSelectedCategory(null);
    setCategoryProducts([]);
  };

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
                        key={category.name}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {category.name}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            {category.totalCount} produits au total
                          </p>
                          <div className="space-y-1">
                            {category.warehouses.map((warehouse, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-xs text-gray-600"
                              >
                                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
                                <span>
                                  {warehouse.name}: {warehouse.count} produits
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Badge variant="success" className="text-xs">
                          {category.totalCount} produits
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
              onCategoryClick={handleCategoryClick}
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
              labels={chartData.warehouseLabels}
              color="success"
              height={200}
            />

            <ModernLineChart
              title="Croissance mensuelle"
              data={chartData.monthlyGrowth}
              labels={chartData.salesLabels}
              color="#10B981"
              height={200}
            />
          </div>

          {/* Modal de détails des catégories */}
          {showCategoryModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Détails de la catégorie : {selectedCategory}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {categoryProducts.length} produit(s) trouvé(s)
                    </p>
                  </div>
                </div>

                {categoryProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">
                      Aucun produit trouvé dans cette catégorie
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Tableau des produits */}
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Référence
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Désignation
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                              Quantité
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                              Prix unitaire
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                              Valeur totale
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {categoryProducts.map((product) => (
                            <tr
                              key={product.id_produit}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {product.reference ||
                                  `PRD${product.id_produit?.toString().padStart(6, "0")}`}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                {product.designation}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    (product.quantite_stock || 0) < 10
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {product.quantite_stock || 0}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                {loading || deviseLoading
                                  ? "Chargement..."
                                  : formatMontant(product.prix_unitaire || 0)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                {loading || deviseLoading
                                  ? "Chargement..."
                                  : formatMontant(
                                      (product.quantite_stock || 0) *
                                        (product.prix_unitaire || 0),
                                    )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Résumé statistique */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <Package className="w-8 h-8 text-blue-600 mr-3" />
                          <div>
                            <p className="text-sm text-blue-600">
                              Total produits
                            </p>
                            <p className="text-xl font-bold text-blue-900">
                              {categoryProducts.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <Package className="w-8 h-8 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm text-green-600">
                              Quantité totale
                            </p>
                            <p className="text-xl font-bold text-green-900">
                              {categoryProducts.reduce(
                                (sum, p) => sum + (p.quantite_stock || 0),
                                0,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <DollarSign className="w-8 h-8 text-yellow-600 mr-3" />
                          <div>
                            <p className="text-sm text-yellow-600">
                              Valeur totale
                            </p>
                            <p className="text-xl font-bold text-yellow-900">
                              {loading || deviseLoading
                                ? "Chargement..."
                                : formatMontant(
                                    categoryProducts.reduce(
                                      (sum, p) =>
                                        sum +
                                        (p.quantite_stock || 0) *
                                          (p.prix_unitaire || 0),
                                      0,
                                    ),
                                  )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    onClick={closeCategoryModal}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
