import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuthHook.js";
import { Menu, X, Bell, Calendar, Clock } from "lucide-react";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Section gauche - Actions et date/heure */}
          <div className="flex items-center space-x-4">
            {/* Bouton menu mobile */}
            <div className="lg:hidden">
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

            {/* Date et heure réelle */}
            <div className="hidden md:flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {formatDate(currentDateTime)}
              </span>
              <Clock className="w-4 h-4 text-gray-600 ml-3" />
              <span className="text-sm font-medium text-gray-700">
                {formatTime(currentDateTime)}
              </span>
            </div>
          </div>

          {/* Section droite - Notifications et utilisateur */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Infos utilisateur */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.prenom && user?.nom
                    ? `${user.prenom} ${user.nom}`
                    : user?.nom || "Utilisateur"}
                </p>
                <p className="text-xs text-gray-500">
                  {profile?.entreprises?.nom_commercial || "Administrateur"}
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {user?.prenom && user?.nom
                    ? `${user.prenom.charAt(0)}${user.nom.charAt(0)}`
                    : user?.nom?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu mobile dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-3">
            <div className="px-2 space-y-1">
              {/* Date et heure pour mobile */}
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {formatDate(currentDateTime)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {formatTime(currentDateTime)}
                  </span>
                </div>
              </div>
              <div className="px-3 py-2 text-sm text-gray-600">
                {user?.prenom && user?.nom
                  ? `${user.prenom} ${user.nom}`
                  : user?.nom || "Utilisateur"}
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-base font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
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
