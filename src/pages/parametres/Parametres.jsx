import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuthHook.js";
import { supabase } from "../../config/supabase.js";
import {
  Settings,
  Users,
  Shield,
  Bell,
  Server,
  ChevronRight,
  Activity,
  HardDrive,
  CheckCircle,
  Info,
  UserPlus,
} from "lucide-react";

const Parametres = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [parametres, setParametres] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    systemStatus: "online",
  });

  // Configuration des catégories avec les vrais paramètres de la BDD
  const categoriesConfig = {
    systeme: {
      title: "Paramètres système",
      description: "Configuration générale du système",
      icon: Server,
      color: "green",
      path: "/settings/systeme",
      parametresAttendus: [
        "maintenance_mode",
        "session_timeout_minutes",
        "max_sessions_per_user",
        "fuseau_horaire",
        "devise",
        "langue",
      ],
    },
    sauvegarde: {
      title: "Sauvegarde",
      description: "Gestion des sauvegardes automatiques",
      icon: HardDrive,
      color: "purple",
      path: "/settings/sauvegarde",
      parametresAttendus: [
        "backup_frequency",
        "backup_retention_days",
        "auto_backup_enabled",
        "backup_location",
        "last_backup_at",
        "backup_type",
      ],
    },
    notification: {
      title: "Notifications",
      description: "Configuration des alertes et notifications",
      icon: Bell,
      color: "yellow",
      path: "/settings/notifications",
      parametresAttendus: [
        "email_enabled",
        "push_enabled",
        "alertes_stock",
        "alertes_commandes",
        "rapports_hebdo",
        "alertes_systeme",
      ],
    },
    securite: {
      title: "Sécurité",
      description: "Paramètres de sécurité et accès",
      icon: Shield,
      color: "red",
      path: "/settings/securite",
      parametresAttendus: [
        "password_min_length",
        "password_complexity",
        "session_timeout",
        "max_attempts",
        "lockout_duration",
        "2fa_enabled",
      ],
    },
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les paramètres unifiés
      const { data: parametresData, error: parametresError } = await supabase
        .from("parametres_unifies")
        .select("*")
        .eq("id_entreprise", profile?.id_entreprise)
        .eq("est_actif", true)
        .order("categorie, nom_parametre");

      if (!parametresError && parametresData) {
        setParametres(parametresData);
      } else if (parametresError) {
        console.log("Erreur paramètres:", parametresError);
        // Si la table n'existe pas, créer des paramètres par défaut en mémoire
        const parametresParDefaut = [];
        Object.entries(categoriesConfig).forEach(([categorie, config]) => {
          config.parametresAttendus.forEach((nomParametre) => {
            parametresParDefaut.push({
              id_parametre: `temp-${categorie}-${nomParametre}`,
              categorie,
              nom_parametre: nomParametre,
              valeur_parametre: getValeurParDefaut(nomParametre),
              type_parametre: getTypeParametre(nomParametre),
              description: getDescription(nomParametre),
              est_actif: true,
            });
          });
        });
        setParametres(parametresParDefaut);
      }

      // Charger les statistiques des utilisateurs
      const { data: usersData, error: usersError } = await supabase
        .from("utilisateurs")
        .select("id_user, statut")
        .eq("id_entreprise", profile?.id_entreprise);

      if (!usersError && usersData) {
        const activeUsers = usersData.filter(
          (user) => user.statut === "actif",
        ).length;
        setStats((prev) => ({
          ...prev,
          totalUsers: usersData.length,
          activeUsers: activeUsers,
        }));
      }

      // Vérifier le mode maintenance
      const maintenanceMode = parametresData?.find(
        (p) =>
          p.categorie === "systeme" && p.nom_parametre === "maintenance_mode",
      );

      if (maintenanceMode) {
        setStats((prev) => ({
          ...prev,
          systemStatus:
            maintenanceMode.valeur_parametre === "true"
              ? "maintenance"
              : "online",
        }));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires pour les valeurs par défaut
  const getValeurParDefaut = (nomParametre) => {
    const defaults = {
      maintenance_mode: "false",
      session_timeout_minutes: "60",
      max_sessions_per_user: "5",
      fuseau_horaire: "UTC",
      devise: "XOF",
      langue: "fr",
      backup_frequency: "daily",
      backup_retention_days: "30",
      auto_backup_enabled: "true",
      backup_location: "/backups",
      backup_type: "full",
      email_enabled: "true",
      push_enabled: "false",
      alertes_stock: "true",
      alertes_commandes: "true",
      rapports_hebdo: "false",
      alertes_systeme: "true",
      password_min_length: "8",
      password_complexity: "medium",
      session_timeout: "60",
      max_attempts: "3",
      lockout_duration: "15",
      "2fa_enabled": "false",
    };
    return defaults[nomParametre] || "";
  };

  const getTypeParametre = (nomParametre) => {
    if (nomParametre.includes("enabled") || nomParametre.includes("mode"))
      return "boolean";
    if (
      nomParametre.includes("minutes") ||
      nomParametre.includes("days") ||
      nomParametre.includes("length") ||
      nomParametre.includes("attempts") ||
      nomParametre.includes("duration")
    )
      return "number";
    return "text";
  };

  const getDescription = (nomParametre) => {
    const descriptions = {
      maintenance_mode: "Activer/désactiver le mode maintenance",
      session_timeout_minutes: "Durée de la session en minutes",
      max_sessions_per_user: "Nombre maximum de sessions par utilisateur",
      fuseau_horaire: "Fuseau horaire du système",
      devise: "Devise par défaut",
      langue: "Langue de l'interface",
      backup_frequency: "Fréquence des sauvegardes automatiques",
      backup_retention_days: "Nombre de jours de conservation des sauvegardes",
      auto_backup_enabled: "Activer les sauvegardes automatiques",
      backup_location: "Emplacement des sauvegardes",
      backup_type: "Type de sauvegarde",
      email_enabled: "Activer les notifications par email",
      push_enabled: "Activer les notifications push",
      alertes_stock: "Alertes de seuil de stock",
      alertes_commandes: "Alertes de commandes",
      rapports_hebdo: "Rapports hebdomadaires automatiques",
      alertes_systeme: "Alertes système",
      password_min_length: "Longueur minimale du mot de passe",
      password_complexity: "Niveau de complexité du mot de passe",
      session_timeout: "Timeout de session en minutes",
      max_attempts: "Nombre maximum de tentatives de connexion",
      lockout_duration: "Durée de blocage en minutes",
      "2fa_enabled": "Authentification à deux facteurs",
    };
    return descriptions[nomParametre] || "Paramètre système";
  };

  const updateParametre = async (idParametre, nouvelleValeur) => {
    try {
      // Si c'est un paramètre temporaire (table n'existe pas), juste mettre à jour l'état
      if (idParametre.startsWith("temp-")) {
        setParametres((prev) =>
          prev.map((p) =>
            p.id_parametre === idParametre
              ? { ...p, valeur_parametre: nouvelleValeur }
              : p,
          ),
        );

        // Mettre à jour le statut système si c'est le mode maintenance
        const parametre = parametres.find(
          (p) => p.id_parametre === idParametre,
        );
        if (parametre?.nom_parametre === "maintenance_mode") {
          setStats((prev) => ({
            ...prev,
            systemStatus: nouvelleValeur === "true" ? "maintenance" : "online",
          }));
        }
        return;
      }

      // Sinon, mettre à jour dans la base de données
      const { error } = await supabase
        .from("parametres_unifies")
        .update({
          valeur_parametre: nouvelleValeur,
          updated_at: new Date().toISOString(),
        })
        .eq("id_parametre", idParametre);

      if (error) throw error;

      // Mettre à jour l'état local
      setParametres((prev) =>
        prev.map((p) =>
          p.id_parametre === idParametre
            ? { ...p, valeur_parametre: nouvelleValeur }
            : p,
        ),
      );

      // Mettre à jour le statut système si c'est le mode maintenance
      const parametre = parametres.find((p) => p.id_parametre === idParametre);
      if (parametre?.nom_parametre === "maintenance_mode") {
        setStats((prev) => ({
          ...prev,
          systemStatus: nouvelleValeur === "true" ? "maintenance" : "online",
        }));
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du paramètre:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "text-green-600 bg-green-100";
      case "maintenance":
        return "text-yellow-600 bg-yellow-100";
      case "offline":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getIconColor = (color) => {
    const colors = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100",
      red: "text-red-600 bg-red-100",
      purple: "text-purple-600 bg-purple-100",
      yellow: "text-yellow-600 bg-yellow-100",
    };
    return colors[color] || "text-gray-600 bg-gray-100";
  };

  const renderParametreValue = (parametre) => {
    if (parametre.type_parametre === "boolean") {
      return (
        <button
          onClick={() =>
            updateParametre(
              parametre.id_parametre,
              parametre.valeur_parametre === "true" ? "false" : "true",
            )
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            parametre.valeur_parametre === "true"
              ? "bg-blue-600"
              : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              parametre.valeur_parametre === "true"
                ? "translate-x-6"
                : "translate-x-1"
            }`}
          />
        </button>
      );
    }

    if (parametre.type_parametre === "number") {
      return (
        <input
          type="number"
          value={parametre.valeur_parametre}
          onChange={(e) =>
            updateParametre(parametre.id_parametre, e.target.value)
          }
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      );
    }

    return (
      <input
        type="text"
        value={parametre.valeur_parametre}
        onChange={(e) =>
          updateParametre(parametre.id_parametre, e.target.value)
        }
        className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    );
  };

  // Grouper les paramètres par catégorie
  const parametresParCategorie = parametres.reduce((acc, parametre) => {
    if (!acc[parametre.categorie]) {
      acc[parametre.categorie] = [];
    }
    acc[parametre.categorie].push(parametre);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres</h1>
        <p className="text-gray-600">
          Gérez tous les aspects de votre configuration système et sécurité
        </p>
      </div>

      {/* Statistiques rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Utilisateurs actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.activeUsers} / {stats.totalUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Server className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Statut système</p>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                  stats.systemStatus,
                )}`}
              >
                {stats.systemStatus === "online"
                  ? "En ligne"
                  : stats.systemStatus === "maintenance"
                    ? "Maintenance"
                    : "Hors ligne"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Paramètres configurés</p>
              <p className="text-2xl font-bold text-gray-900">
                {parametres.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des catégories de paramètres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {Object.entries(categoriesConfig).map(([categorie, config]) => {
          const parametresCategorie = parametresParCategorie[categorie] || [];
          const Icon = config.icon;

          return (
            <div
              key={categorie}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* Header de catégorie */}
                <div className="flex items-center mb-6">
                  <div
                    className={`p-3 rounded-lg ${getIconColor(config.color)} mr-4`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {config.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {config.description}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">
                      {parametresCategorie.length} paramètres
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Liste des paramètres */}
                <div className="space-y-4">
                  {parametresCategorie.map((parametre) => (
                    <div
                      key={parametre.id_parametre}
                      className="flex items-center justify-between py-3 border-t border-gray-100"
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-gray-900">
                            {parametre.nom_parametre
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </h4>
                          {parametre.est_actif && (
                            <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {parametre.description}
                        </p>
                      </div>
                      <div className="ml-4">
                        {renderParametreValue(parametre)}
                      </div>
                    </div>
                  ))}

                  {parametresCategorie.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Aucun paramètre configuré</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Exécutez le script SQL pour créer la table
                        parametres_unifies
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Utilisateurs */}
      <div
        className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer group"
        onClick={() => navigate("/settings/utilisateurs")}
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg text-blue-600 bg-blue-100 mr-4">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                Gestion des utilisateurs
              </h3>
              <p className="text-sm text-gray-500">
                Ajoutez, modifiez et gérez les comptes utilisateurs et leurs
                permissions
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-sm">
                <span className="text-gray-500">Total:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {stats.totalUsers}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Actifs:</span>
                <span className="ml-2 font-medium text-green-600">
                  {stats.activeUsers}
                </span>
              </div>
            </div>
            <span className="text-sm text-blue-600 font-medium group-hover:text-blue-700">
              Accéder
            </span>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Actions rapides
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/settings/utilisateurs")}
            className="flex items-center p-3 bg-white rounded-lg hover:shadow transition-shadow"
          >
            <UserPlus className="w-5 h-5 text-blue-600 mr-3" />
            <span className="text-sm font-medium">Ajouter un utilisateur</span>
          </button>

          <button
            onClick={() => loadData()}
            className="flex items-center p-3 bg-white rounded-lg hover:shadow transition-shadow"
          >
            <Activity className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-sm font-medium">
              Actualiser les paramètres
            </span>
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
        <p className="text-xs text-yellow-800">
          💡 Pour activer tous les paramètres, exécutez le script SQL{" "}
          "create_unified_settings.sql" dans votre base de données Supabase
        </p>
      </div>
    </div>
  );
};

export default Parametres;
