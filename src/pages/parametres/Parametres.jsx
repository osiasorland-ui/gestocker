import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuthHook.js";
import { supabase } from "../../config/supabase.js";
import { PageLoader } from "../../components/ui/Loader.jsx";
import { backupService } from "../../utils/backupService.js";
import { useNotification } from "../../hooks/useNotification.js";
import {
  Server,
  Settings,
  Users,
  ChevronRight,
  Shield,
  UserCheck,
  UserX,
  Activity,
  UserPlus,
  CheckCircle,
  Info,
  HardDrive,
  Bell,
  AlertCircle,
  Globe,
  Moon,
  Sun,
  Calendar,
  Clock,
  Mail,
  Smartphone,
  Lock,
  Key,
  Eye,
  EyeOff,
  Database,
  RefreshCw,
  Download,
  Upload,
} from "lucide-react";

const Parametres = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [setError] = useState(null);
  const [parametres, setParametres] = useState([]);
  const [stats, setStats] = useState(
    {
      totalUsers: 0,
      activeUsers: 0,
      systemStatus: "online",
    },
    [],
  );

  // Configuration des catégories avec les vrais paramètres de la BDD
  // IDs des rôles autorisés pour voir la section utilisateurs
  const ADMIN_ROLE_ID = "5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3";
  const SUPER_USER_ROLE_ID = "a033e29c-94f6-4eb3-9243-a9424ec20357";

  // Vérifier si l'utilisateur peut voir la section utilisateurs
  const canManageUsers =
    profile?.id_role === ADMIN_ROLE_ID ||
    profile?.id_role === SUPER_USER_ROLE_ID;

  // DEBUG : Afficher les infos de l'utilisateur connecté
  console.log("=== DEBUG PARAMÈTRES ===");
  console.log("Profile utilisateur:", profile);
  console.log("ID rôle:", profile?.id_role);
  console.log("ADMIN_ROLE_ID:", ADMIN_ROLE_ID);
  console.log("SUPER_USER_ROLE_ID:", SUPER_USER_ROLE_ID);
  console.log("Peut gérer utilisateurs:", canManageUsers);

  const categoriesConfig = useMemo(
    () => ({
      notification: {
        title: "Notifications",
        description: "Configuration des alertes et notifications système",
        icon: Bell,
        color: "yellow",
        path: "/settings/notifications",
        parametresAttendus: [
          "email_enabled",
          "push_enabled",
          "alertes_stock",
          "alertes_commandes",
          "alertes_factures",
          "alertes_clients",
          "alertes_fournisseurs",
          "alertes_systeme",
          "alertes_securite",
          "alertes_sauvegarde",
        ],
      },
      securite: {
        title: "Sécurité",
        description: "Paramètres de sécurité essentiels",
        icon: Shield,
        color: "red",
        path: "/settings/securite",
        parametresAttendus: [
          "password_min_length",
          "max_attempts",
          "lockout_duration",
          "encryption_enabled",
          "auto_logout",
          "session_secure",
        ],
      },
    }),
    [],
  );

  const loadData = useCallback(async () => {
    try {
      console.log("=== DÉBUG CHARGEMENT PARAMÈTRES ===");
      console.log("Profile utilisateur:", profile);
      console.log("ID Entreprise depuis profile:", profile?.id_entreprise);

      // Charger les paramètres unifiés
      const { data: parametresData, error: parametresError } = await supabase
        .from("parametres_unifies")
        .select("*")
        .eq("id_entreprise", profile?.id_entreprise)
        .eq("est_actif", true)
        .order("categorie, nom_parametre");

      console.log("Requête SQL - ID entreprise:", profile?.id_entreprise);
      console.log("Données paramètres reçues:", parametresData);
      console.log("Erreur paramètres:", parametresError);

      if (!parametresError && parametresData && parametresData.length > 0) {
        console.log(
          "✅ Paramètres trouvés:",
          parametresData.length,
          "paramètres",
        );
        setParametres(parametresData);
      } else {
        console.log(
          "❌ Aucun paramètre trouvé ou erreur, utilisation des paramètres par défaut",
        );
        console.log(
          "Table parametres_unifies non trouvée, utilisation des paramètres par défaut:",
          parametresError?.message,
        );
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
        console.log(
          "Paramètres par défaut créés:",
          parametresParDefaut.length,
          "paramètres",
        );
        setParametres(parametresParDefaut);
      }

      // Charger les statistiques des utilisateurs
      console.log("=== CHARGEMENT STATS UTILISATEURS ===");
      console.log("ID Entreprise:", profile?.id_entreprise);

      const { data: usersData, error: usersError } = await supabase
        .from("utilisateurs")
        .select("id_user, statut, id_role")
        .eq("id_entreprise", profile?.id_entreprise);

      console.log("Données utilisateurs brutes:", usersData);
      console.log("Erreur utilisateurs:", usersError);

      // Toujours mettre à jour les stats, même en cas d'erreur
      let userStats = {
        totalUsers: 0,
        activeUsers: 0,
      };

      if (!usersError && usersData && usersData.length > 0) {
        console.log("Traitement des données utilisateurs...");

        // Exclure les utilisateurs avec le rôle Admin du comptage
        const nonAdminUsers = usersData.filter(
          (user) => user.id_role !== "5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3",
        );

        const activeUsers = nonAdminUsers.filter(
          (user) => user.statut === "actif",
        ).length;

        userStats = {
          totalUsers: nonAdminUsers.length,
          activeUsers: activeUsers,
        };

        console.log("Statistiques utilisateurs calculées:", userStats);
      } else {
        console.log(
          "Erreur ou aucune donnée utilisateur:",
          usersError?.message,
        );
      }

      setStats((prev) => ({
        ...prev,
        ...userStats,
      }));

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
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [profile, categoriesConfig, setError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fonctions utilitaires pour les valeurs par défaut
  const getValeurParDefaut = (nomParametre) => {
    const defaults = {
      // Paramètres de notification
      email_enabled: "true",
      alertes_stock: "true",
      alertes_factures: "true",
      alertes_clients: "true",
      alertes_fournisseurs: "true",
      alertes_systeme: "true",
      alertes_securite: "true",
      alertes_sauvegarde: "true",
      encryption_enabled: "true",
      auto_logout: "true",
      session_secure: "true",
    };
    return defaults[nomParametre] || "";
  };

  const getTypeParametre = (nomParametre) => {
    if (
      nomParametre.includes("enabled") ||
      nomParametre.includes("mode") ||
      nomParametre.startsWith("alertes_") ||
      nomParametre === "email_enabled" ||
      nomParametre === "push_enabled"
    )
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
      // Paramètres de notification
      email_enabled: "Notifications par email",
      push_enabled: "Notifications push",
      alertes_stock: "Alertes de stock",
      alertes_commandes: "Alertes de commandes",
      alertes_factures: "Alertes de factures",
      alertes_clients: "Alertes clients",
      alertes_fournisseurs: "Alertes fournisseurs",
      alertes_systeme: "Alertes système",
      alertes_securite: "Alertes sécurité",
      alertes_sauvegarde: "Alertes sauvegarde",

      // Paramètres de sécurité
      password_min_length: "Longueur minimale mot de passe",
      max_attempts: "Max tentatives connexion",
      lockout_duration: "Durée blocage",
      encryption_enabled: "Chiffrement données",
      auto_logout: "Déconnexion automatique",
      session_secure: "Session sécurisée",
    };
    return descriptions[nomParametre] || "Paramètre système";
  };

  const updateParametre = async (idParametre, nouvelleValeur) => {
    try {
      // Trouver le paramètre pour obtenir son nom et sa valeur actuelle
      const parametre = parametres.find((p) => p.id_parametre === idParametre);
      const nomParametre = parametre?.nom_parametre;

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
        if (nomParametre === "maintenance_mode") {
          setStats((prev) => ({
            ...prev,
            systemStatus: nouvelleValeur === "true" ? "maintenance" : "online",
          }));
        }
        return;
      }

      // Utiliser le service de sauvegarde pour la mise à jour
      const result = await backupService.updateParametreWithBackup(
        profile?.id_entreprise,
        idParametre,
        nomParametre,
        nouvelleValeur,
      );

      if (result.success) {
        // Mettre à jour l'état local
        setParametres((prev) =>
          prev.map((p) =>
            p.id_parametre === idParametre
              ? { ...p, valeur_parametre: nouvelleValeur }
              : p,
          ),
        );

        // Notification de sauvegarde automatique réussie
        if (result.backup && result.backup.success) {
          notify.backupSuccess(nomParametre);
        }

        // Plus de notification spéciale pour le changement de devise

        // Mettre à jour le statut système si c'est le mode maintenance
        if (nomParametre === "maintenance_mode") {
          setStats((prev) => ({
            ...prev,
            systemStatus: nouvelleValeur === "true" ? "maintenance" : "online",
          }));
        }
      } else {
        notify.error(
          `Erreur lors de la mise à jour de ${nomParametre}: ${result.error}`,
        );
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du paramètre:", error);
      notify.error(
        "Une erreur est survenue lors de la mise à jour du paramètre",
      );
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
  // Fonction pour formater les noms de paramètres en français
  const formatNomParametre = (nomParametre) => {
    const noms = {
      // Paramètres de notification
      email_enabled: "Notifications email",
      push_enabled: "Notifications push",
      alertes_stock: "Alertes de stock",
      alertes_commandes: "Alertes de commandes",
      alertes_factures: "Alertes de factures",
      alertes_clients: "Alertes clients",
      alertes_fournisseurs: "Alertes fournisseurs",
      alertes_systeme: "Alertes système",
      alertes_securite: "Alertes sécurité",
      alertes_sauvegarde: "Alertes sauvegarde",

      // Paramètres de sécurité
      password_min_length: "Longueur minimale mot de passe",
      max_attempts: "Max tentatives connexion",
      lockout_duration: "Durée blocage",
      encryption_enabled: "Chiffrement données",
      auto_logout: "Déconnexion automatique",
      session_secure: "Session sécurisée",
    };
    return noms[nomParametre] || nomParametre;
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

    // Cas spéciaux pour les sélections
    if (parametre.nom_parametre === "backup_frequency") {
      return (
        <select
          value={parametre.valeur_parametre}
          onChange={(e) =>
            updateParametre(parametre.id_parametre, e.target.value)
          }
          className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="daily">Journalière</option>
          <option value="weekly">Hebdomadaire</option>
          <option value="monthly">Mensuelle</option>
          <option value="yearly">Annuelle</option>
        </select>
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

  return (
    <div className="p-10 mx-auto">
      {/* Loader */}
      {loading && <PageLoader text="Chargement des paramètres..." />}
      {!loading && (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Paramètres
            </h1>
            <p className="text-gray-600">
              Gérez tous les aspects de votre configuration système et sécurité
            </p>
          </div>
          {/* Statistiques rapide */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <Server className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Statut système</p>
                  <div className="flex items-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${getStatusColor(
                        stats.systemStatus,
                      )}`}
                    >
                      {stats.systemStatus === "online"
                        ? "En ligne"
                        : stats.systemStatus === "maintenance"
                          ? "Maintenance"
                          : "Hors ligne"}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
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
                  <p className="text-xs text-gray-400">
                    {Object.keys(parametresParCategorie).length} catégories
                  </p>
                </div>
              </div>
            </div>

            {canManageUsers && (
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Shield className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Taux d'activation</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.totalUsers > 0
                        ? Math.round(
                            (stats.activeUsers / stats.totalUsers) * 100,
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Sécurité</p>
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-green-600 mr-2">
                      Activée
                    </span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-xs text-gray-400">Protection active</p>
                </div>
              </div>
            </div>
          </div>
          {/* Grille des catégories de paramètres */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {Object.entries(categoriesConfig).map(([categorie, config]) => {
              const parametresCategorie =
                parametresParCategorie[categorie] || [];
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
                                {formatNomParametre(parametre.nom_parametre)}
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

          {/* Actions rapides */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Actions rapides
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {canManageUsers && (
                <button
                  onClick={() => navigate("/settings/utilisateurs")}
                  className="flex items-center p-3 bg-white rounded-lg hover:shadow transition-shadow"
                >
                  <UserPlus className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium">
                    Ajouter un utilisateur
                  </span>
                </button>
              )}

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
        </>
      )}
    </div>
  );
};

export default Parametres;
