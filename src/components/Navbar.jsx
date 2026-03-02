import React from "react";
import { useAuth } from "../hooks/useAuthHook.js";
import { Building2, LogOut, Menu, X } from "lucide-react";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  // Obtenir la première lettre du nom de l'entreprise ou du nom de l'utilisateur
  const getInitial = () => {
    if (profile?.entreprises?.logo_path) {
      return null; // Afficher le logo si disponible
    }
    if (profile?.entreprises?.nom_commercial) {
      return profile.entreprises.nom_commercial.charAt(0).toUpperCase();
    }
    if (user?.nom) {
      return user.nom.charAt(0).toUpperCase();
    }
    return "U"; // Default pour User
  };

  const logoPath = profile?.entreprises?.logo_path;
  const initial = getInitial();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo ou initiale */}
          <div className="flex items-center">
            {logoPath ? (
              <img
                src={logoPath}
                alt="Logo entreprise"
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="h-8 w-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {initial}
                </span>
              </div>
            )}
            <span className="ml-3 text-xl font-bold text-gray-900">
              {profile?.entreprises?.nom_commercial || "Gestocker"}
            </span>
          </div>

          {/* Menu desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {user?.nom || "Utilisateur"}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </button>
            </div>
          </div>

          {/* Menu mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Menu mobile dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-3">
            <div className="px-2 space-y-1">
              <div className="px-3 py-2 text-sm text-gray-600">
                {user?.nom || "Utilisateur"}
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-base font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2 inline" />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
