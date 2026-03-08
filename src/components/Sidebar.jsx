import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  Truck,
  BarChart3,
  LayoutDashboard,
} from "lucide-react";

const Sidebar = ({ isOpen, profile, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});

  // IDs des rôles autorisés pour voir le menu Utilisateurs
  const ADMIN_ROLE_ID = "5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3";
  const SUPER_USER_ROLE_ID = "a033e29c-94f6-4eb3-9243-a9424ec20357";

  // Vérifier si l'utilisateur peut voir le menu Utilisateurs
  const canManageUsers = () => {
    if (!profile) return false;
    const userRoleId = profile.id_role || profile.role_id;
    return userRoleId === ADMIN_ROLE_ID || userRoleId === SUPER_USER_ROLE_ID;
  };

  // Menu principal avec sous-menus
  const menuStructure = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/dashboard",
      active: location.pathname === "/dashboard",
    },
    {
      id: "livreurs",
      icon: Truck,
      label: "Livreurs",
      path: "/livreurs",
      active: location.pathname === "/livreurs",
    },
    {
      id: "rapports-analyse",
      icon: BarChart3,
      label: "Analythique",
      active:
        location.pathname.includes("/rapports") ||
        location.pathname === "/analyse",
      children: [
        {
          label: "Analyse",
          path: "/rapports/analyse",
          active: location.pathname === "/rapports/analyse",
        },
        {
          label: "Rapports généraux",
          path: "/rapports/rapports-généraux",
          active: location.pathname === "/rapports/rapports-généraux",
        },
      ],
    },
    {
      id: "stock",
      icon: Package,
      label: "Gestion des stocks",
      active: location.pathname.includes("/stock"),
      children: [
        {
          label: "Produits",
          path: "/stock/produits",
          active: location.pathname === "/stock/produits",
        },
        {
          label: "Catégories",
          path: "/stock/categories",
          active: location.pathname === "/stock/categories",
        },
        {
          label: "Entrepôts",
          path: "/stock/entrepots",
          active: location.pathname === "/stock/entrepots",
        },
        {
          label: "Mouvements",
          path: "/stock/mouvements",
          active: location.pathname === "/stock/mouvements",
        },
      ],
    },
    {
      id: "ventes",
      icon: ShoppingCart,
      label: "Ventes",
      active: location.pathname.includes("/ventes"),
      children: [
        {
          label: "Commandes",
          path: "/ventes/commandes",
          active: location.pathname === "/ventes/commandes",
        },
        {
          label: "Factures",
          path: "/ventes/factures",
          active: location.pathname === "/ventes/factures",
        },
        {
          label: "Clients",
          path: "/ventes/clients",
          active: location.pathname === "/ventes/clients",
        },
      ],
    },
    {
      id: "achats",
      icon: TrendingUp,
      label: "Achats",
      active: location.pathname.includes("/achats"),
      children: [
        {
          label: "Fournisseurs",
          path: "/achats/fournisseurs",
          active: location.pathname === "/achats/fournisseurs",
        },
        {
          label: "Commandes d'achat",
          path: "/achats/commandes",
          active: location.pathname === "/achats/commandes",
        },
        {
          label: "Réceptions",
          path: "/achats/receptions",
          active: location.pathname === "/achats/receptions",
        },
      ],
    },
    {
      id: "settings",
      icon: Settings,
      label: "Paramètres",
      active:
        location.pathname.includes("/settings") ||
        location.pathname.includes("/parametres"),
      children: [
        {
          label: "Vue d'ensemble",
          path: "/settings",
          active: location.pathname === "/settings",
        },
        // Sous-menu Utilisateurs - uniquement si l'utilisateur peut gérer les utilisateurs
        ...(canManageUsers()
          ? [
              {
                label: "Utilisateurs",
                path: "/settings/utilisateurs",
                active: location.pathname === "/settings/utilisateurs",
              },
            ]
          : []),
      ],
    },
  ];

  // Obtenir la source du logo de l'entreprise
  const getCompanyLogoSrc = () => {
    const logoPath = profile?.entreprises?.logo_path;
    console.log("Logo path dans sidebar:", logoPath);
    console.log("Profile complet:", profile);

    if (!logoPath) {
      console.log("Pas de logo path");
      return null;
    }

    // Si c'est une URL complète ou commence par /, retourner direct
    if (logoPath.startsWith("http") || logoPath.startsWith("/")) {
      console.log("Logo URL ou path:", logoPath);
      return logoPath;
    }

    // Si c'est déjà une data URL complète, retourner direct
    if (logoPath.startsWith("data:image")) {
      console.log("Logo base64 direct:", logoPath.substring(0, 50) + "...");
      return logoPath;
    }

    // Sinon, considérer que c'est du base64 sans préfixe
    console.log("Logo base64 simple:", logoPath);
    return `data:image/png;base64,${logoPath}`;
  };

  const companyLogoSrc = getCompanyLogoSrc();

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div
      className={`menu p-6 w-72 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 ${
        isOpen ? "block" : "hidden"
      } lg:block transition-all duration-300`}
    >
      {/* Header avec logo et infos entreprise */}
      <div className="flex flex-col items-center text-center mb-2 pb-4 border-b border-gray-200">
        <div className="relative mb-3">
          {companyLogoSrc ? (
            <img
              src={companyLogoSrc}
              alt="Logo entreprise"
              className="w-12 h-12 rounded-xl object-cover shadow-lg"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextElementSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="w-12 h-12 bg-linear-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg"
            style={{ display: companyLogoSrc ? "none" : "flex" }}
          >
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="w-full">
          <h2 className="font-bold text-lg text-gray-900 mb-1">
            {profile?.entreprises?.nom_commercial || "Gestocker"}
          </h2>
          <p className="text-xs text-gray-500">
            {profile?.entreprises?.raison_sociale || "Gestion de Stock"}
          </p>
        </div>
      </div>

      {/* Menu principal scrollable */}
      <nav className="space-y-2 h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {menuStructure.map((item) => (
          <div key={item.id} className="menu-section">
            {/* Menu principal ou parent */}
            {item.children ? (
              // Menu avec sous-menus
              <div>
                <button
                  onClick={() => toggleSection(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                    item.active
                      ? "bg-gray-900 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {expandedSections[item.id] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {/* Sous-menus */}
                {expandedSections[item.id] && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.children.map((child, index) => (
                      <button
                        key={index}
                        onClick={() => handleNavigation(child.path)}
                        className={`w-full flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                          child.active
                            ? "bg-gray-900 text-white"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full bg-current mr-3 opacity-60"></div>
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Menu simple sans sous-menus
              <button
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  item.active
                    ? "bg-gray-900 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            )}
          </div>
        ))}
      </nav>

      {/* Section déconnexion */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200 font-medium"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>

        {/* Infos utilisateur */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Connecté en tant que{" "}
            {profile?.prenom && profile?.nom
              ? `${profile.prenom} ${profile.nom}`
              : profile?.nom || "Utilisateur"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
