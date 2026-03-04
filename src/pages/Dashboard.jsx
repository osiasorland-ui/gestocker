import { useNavigate } from "react-router-dom";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

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
          Voici un aperçu de votre activité de gestion de stock
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Package className="w-6 h-6 text-gray-700" />
            </div>
            <span className="text-sm text-gray-500">+12%</span>
          </div>
          <div className="stat-title text-gray-600">Produits</div>
          <div className="stat-value text-2xl font-bold text-gray-900">245</div>
          <div className="stat-desc text-sm text-gray-500">Total produits</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
            </div>
            <span className="text-sm text-gray-500">+8%</span>
          </div>
          <div className="stat-title text-gray-600">Commandes</div>
          <div className="stat-value text-2xl font-bold text-gray-900">32</div>
          <div className="stat-desc text-sm text-gray-500">Ce mois-ci</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Users className="w-6 h-6 text-gray-700" />
            </div>
            <span className="text-sm text-gray-500">+15%</span>
          </div>
          <div className="stat-title text-gray-600">Clients</div>
          <div className="stat-value text-2xl font-bold text-gray-900">128</div>
          <div className="stat-desc text-sm text-gray-500">Clients actifs</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-gray-700" />
            </div>
            <span className="text-sm text-gray-500">+12%</span>
          </div>
          <div className="stat-title text-gray-600">Revenus</div>
          <div className="stat-value text-2xl font-bold text-gray-900">
            €2.4M
          </div>
          <div className="stat-desc text-sm text-gray-500">+12% ce mois</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Activités récentes
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Nouvelle commande #1234</p>
                <p className="text-xs text-gray-500">Il y a 2 minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Stock mis à jour pour produit SKU-001
                </p>
                <p className="text-xs text-gray-500">Il y a 15 minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Alerte de stock bas pour SKU-045
                </p>
                <p className="text-xs text-gray-500">Il y a 1 heure</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Produits en stock bas
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Produit A</p>
                <p className="text-xs text-gray-500">SKU-001</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">3 unités</p>
                <p className="text-xs text-gray-500">Seuil: 5</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Produit B</p>
                <p className="text-xs text-gray-500">SKU-045</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">7 unités</p>
                <p className="text-xs text-gray-500">Seuil: 10</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
