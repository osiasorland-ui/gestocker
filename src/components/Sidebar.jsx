import React from "react";
import {
  Building2,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";

const Sidebar = ({ isOpen, profile, onLogout }) => {
  const menuItems = [
    { icon: TrendingUp, label: "Tableau de bord", active: true },
    { icon: Package, label: "Produits", active: false },
    { icon: ShoppingCart, label: "Commandes", active: false },
    { icon: Users, label: "Clients", active: false },
    { icon: Building2, label: "Fournisseurs", active: false },
    { icon: Settings, label: "Paramètres", active: false },
  ];

  // Obtenir la source du logo de l'entreprise
  const getCompanyLogoSrc = () => {
    const logoPath = profile?.entreprises?.logo_path;

    if (!logoPath) {
      return null;
    }

    if (logoPath.startsWith("http") || logoPath.startsWith("/")) {
      return logoPath;
    }

    if (logoPath.startsWith("data:image")) {
      return logoPath;
    }

    if (logoPath.length > 100) {
      return `data:image/png;base64,${logoPath}`;
    }

    return logoPath;
  };

  const companyLogoSrc = getCompanyLogoSrc();

  return (
    <div
      className={`menu p-4 w-64 min-h-full bg-white border-r border-gray-200 ${
        isOpen ? "block" : "hidden"
      } lg:block`}
    >
      <div className="flex items-center gap-3 mb-8">
        {companyLogoSrc ? (
          <img
            src={companyLogoSrc}
            alt="Logo entreprise"
            className="w-10 h-10 rounded-lg object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="w-10 h-10 bg-black rounded-lg flex items-center justify-center"
          style={{ display: companyLogoSrc ? "none" : "flex" }}
        >
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-gray-900">
            {profile?.entreprises?.nom_commercial || "Gestocker"}
          </h2>
          <p className="text-xs text-gray-500">
            {profile?.entreprises?.raison_sociale || "Gestion de Stock"}
          </p>
        </div>
      </div>

      <ul className="menu menu-vertical gap-2">
        {menuItems.map((item, index) => (
          <li key={index}>
            <a
              className={`flex items-center gap-3 rounded-lg transition-colors ${
                item.active
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={onLogout}
          className="btn btn-outline w-full border-gray-300 text-gray-700 hover:bg-gray-900 hover:border-gray-900 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
