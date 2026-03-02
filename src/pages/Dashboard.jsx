import { useNavigate } from "react-router-dom";
import {
  Building2,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  LogOut,
  Bell,
  Settings,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setTimeout(() => setUser(parsedUser), 0);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/auth");
  };

  const menuItems = [
    { icon: TrendingUp, label: "Tableau de bord", active: true },
    { icon: Package, label: "Produits", active: false },
    { icon: ShoppingCart, label: "Commandes", active: false },
    { icon: Users, label: "Clients", active: false },
    { icon: Building2, label: "Fournisseurs", active: false },
    { icon: Settings, label: "Paramètres", active: false },
  ];

  return (
    <div className="min-h-screen bg-base-200">
      {/* Sidebar */}
      <div className={`drawer ${sidebarOpen ? "drawer-open" : ""}`}>
        <input id="sidebar-toggle" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          {/* Header */}
          <div className="navbar bg-base-100 shadow-lg">
            <div className="flex-none">
              <label
                htmlFor="sidebar-toggle"
                className="btn btn-square btn-ghost drawer-button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-6 w-6" />
              </label>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Gestocker</h2>
            </div>
            <div className="flex-none gap-2">
              <button className="btn btn-ghost btn-circle">
                <Bell className="h-5 w-5" />
              </button>
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-circle avatar"
                >
                  <div className="w-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user?.nom?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                </div>
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content mt-3 z-1 p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li>
                    <a>Profil</a>
                  </li>
                  <li>
                    <a>Paramètres</a>
                  </li>
                  <li>
                    <a onClick={handleLogout}>Déconnexion</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Bienvenue, {user?.nom || "Utilisateur"}!
              </h1>
              <p className="text-gray-600 mt-2">
                Voici un aperçu de votre activité de gestion de stock
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="stat bg-base-100 rounded-lg shadow">
                <div className="stat-figure text-primary">
                  <Package className="w-8 h-8" />
                </div>
                <div className="stat-title">Produits</div>
                <div className="stat-value text-primary">245</div>
                <div className="stat-desc">Total produits</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow">
                <div className="stat-figure text-secondary">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div className="stat-title">Commandes</div>
                <div className="stat-value text-secondary">32</div>
                <div className="stat-desc">Ce mois-ci</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow">
                <div className="stat-figure text-accent">
                  <Users className="w-8 h-8" />
                </div>
                <div className="stat-title">Clients</div>
                <div className="stat-value text-accent">128</div>
                <div className="stat-desc">Clients actifs</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow">
                <div className="stat-figure text-warning">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div className="stat-title">Revenus</div>
                <div className="stat-value text-warning">€2.4M</div>
                <div className="stat-desc">+12% ce mois</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-base-100 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Activités récentes
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">Nouvelle commande #1234</p>
                      <p className="text-xs text-gray-500">Il y a 2 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">
                        Stock mis à jour pour produit SKU-001
                      </p>
                      <p className="text-xs text-gray-500">Il y a 15 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">
                        Alerte de stock bas pour SKU-045
                      </p>
                      <p className="text-xs text-gray-500">Il y a 1 heure</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-base-100 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Produits en stock bas
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Produit A</p>
                      <p className="text-xs text-gray-500">SKU-001</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-error font-semibold">
                        3 unités
                      </p>
                      <p className="text-xs text-gray-500">Seuil: 5</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Produit B</p>
                      <p className="text-xs text-gray-500">SKU-045</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-warning font-semibold">
                        7 unités
                      </p>
                      <p className="text-xs text-gray-500">Seuil: 10</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="drawer-side">
          <label htmlFor="sidebar-toggle" className="drawer-overlay"></label>
          <div className="menu p-4 w-64 min-h-full bg-base-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Gestocker</h2>
                <p className="text-xs text-gray-500">Gestion de Stock</p>
              </div>
            </div>

            <ul className="menu menu-vertical gap-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <a
                    className={`flex items-center gap-3 ${item.active ? "active" : ""}`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="absolute bottom-4 left-4 right-4">
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-error w-full"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
