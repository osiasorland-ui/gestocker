import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { products } from "../config/products";
import { categories } from "../config/categories";
import { warehouses } from "../config/warehouses";
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
import BarChartComponent from "../components/charts/BarChartComponent";
import PieChartComponent from "../components/charts/PieChartComponent";
import LineChartComponent from "../components/charts/LineChartComponent";

function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
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

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!user || !profile) {
      navigate("/auth");
      return;
    }
  }, [user, profile, navigate]);

  // Charger les données du dashboard
  useEffect(() => {
    if (profile?.id_entreprise) {
      loadDashboardData();
    }
  }, [profile]);

  const loadDashboardData = useCallback(async () => {
    try {
      // Charger toutes les données en parallèle
      const [productsResult, categoriesResult, warehousesResult] =
        await Promise.all([
          products.getAll(profile.id_entreprise),
          categories.getAll(profile.id_entreprise),
          warehouses.getAll(profile.id_entreprise),
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
      const totalStockValue = produits.reduce((total, produit) => {
        return (
          total + (produit.quantite_stock || 0) * (produit.prix_unitaire || 0)
        );
      }, 0);

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
    } catch (error) {
      console.error("Erreur dashboard:", error);
    }
  });

  // Formatter le montant en FCFA
  const formatFCFA = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenue, {profile?.nom || user?.nom || "Utilisateur"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez votre stock et votre entreprise depuis ce tableau de bord
        </p>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center">
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
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center">
            <div className="shrink-0">
              <Folder className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Catégories</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalCategories.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center">
            <div className="shrink-0">
              <Warehouse className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entrepôts</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalWarehouses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center">
            <div className="shrink-0">
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valeur Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatFCFA(stats.totalStockValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes et produits récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertes de stock faible */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Alertes Stock Faible
              </h3>
            </div>
          </div>
          <div className="p-6">
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Aucun produit en stock faible
              </p>
            ) : (
              <div className="space-y-3">
                {stats.lowStockProducts.map((product) => (
                  <div
                    key={product.id_produit}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.designation}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.categories?.nom_categorie}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {product.quantite_stock || 0} unités
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Produits récents */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Produits Récents
              </h3>
            </div>
          </div>
          <div className="p-6">
            {stats.recentProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Aucun produit récent
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentProducts.map((product) => (
                  <div
                    key={product.id_produit}
                    className="flex items-center justify-between"
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
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">
                        {product.quantite_stock || 0} unités
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top catégories et entrepôts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top catégories */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <PieChart className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Top Catégories
              </h3>
            </div>
          </div>
          <div className="p-6">
            {stats.topCategories.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune catégorie</p>
            ) : (
              <div className="space-y-3">
                {stats.topCategories.map((category) => (
                  <div
                    key={category.id_categorie}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {category.nom_categorie}
                      </p>
                      <p className="text-xs text-gray-500">
                        {category.nombre_produits || 0} produits
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        {category.nombre_produits || 0} produits
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Statistiques des entrepôts */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Statistiques Entrepôts
              </h3>
            </div>
          </div>
          <div className="p-6">
            {stats.warehouseStats.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun entrepôt</p>
            ) : (
              <div className="space-y-3">
                {stats.warehouseStats.map((warehouse) => (
                  <div
                    key={warehouse.id_entrepot}
                    className="border-l-4 border-purple-500 pl-4"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {warehouse.nom_entrepot}
                      </p>
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
          </div>
        </div>
      </div>

      {/* Graphiques Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BarChartComponent data={[120, 80, 150, 90, 200, 175, 110]} />
        <PieChartComponent
          data={[
            { name: "Électronique", value: 45, color: "#3B82F6", rotation: 0 },
            {
              name: "Alimentation",
              value: 30,
              color: "#10B981",
              rotation: 120,
            },
            { name: "Vêtements", value: 25, color: "#F59E0B", rotation: 240 },
          ]}
        />
        <LineChartComponent data={[45, 52, 48, 65, 72, 68]} />
      </div>
    </div>
  );
}

export default Dashboard;
