import { useNavigate } from "react-router-dom";
import { Package, ShoppingCart, Users, TrendingUp, Plus } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import BarChartComponent from "../components/charts/BarChartComponent";
import PieChartComponent from "../components/charts/PieChartComponent";
import LineChartComponent from "../components/charts/LineChartComponent";
import RecentActivities from "../components/dashboard/RecentActivities";
import LowStockProducts from "../components/dashboard/LowStockProducts";

function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté uniquement après le chargement
    if (!loading && (!user || !profile)) {
      navigate("/auth");
      return;
    }
  }, [user, profile, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  // Afficher un état de chargement pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

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

      {/* Stats Cards - Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Package className="w-6 h-6 text-gray-700" />
            </div>
          </div>
          <div className="stat-title text-gray-600">Produits</div>
          <div className="stat-value text-2xl font-bold text-gray-900">0</div>
          <div className="stat-desc text-sm text-gray-500">Total produits</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
            </div>
          </div>
          <div className="stat-title text-gray-600">Commandes</div>
          <div className="stat-value text-2xl font-bold text-gray-900">0</div>
          <div className="stat-desc text-sm text-gray-500">Ce mois-ci</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Users className="w-6 h-6 text-gray-700" />
            </div>
          </div>
          <div className="stat-title text-gray-600">Clients</div>
          <div className="stat-value text-2xl font-bold text-gray-900">0</div>
          <div className="stat-desc text-sm text-gray-500">Clients actifs</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-gray-700" />
            </div>
          </div>
          <div className="stat-title text-gray-600">Revenus</div>
          <div className="stat-value text-2xl font-bold text-gray-900">€0</div>
          <div className="stat-desc text-sm text-gray-500">Ce mois</div>
        </div>
      </div>

      {/* Empty State Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivities />
        <LowStockProducts />
      </div>

      {/* Graphiques Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BarChartComponent />
        <PieChartComponent />
        <LineChartComponent />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Actions rapides
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/stock/produits")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un produit
          </button>
          <button
            onClick={() => navigate("/ventes/commandes")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Nouvelle commande
          </button>
          <button
            onClick={() => navigate("/ventes/clients")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Users className="w-4 h-4" />
            Ajouter un client
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
