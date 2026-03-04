import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../config/supabase.js";
import {
  Settings,
  Database,
  Server,
  Globe,
  Monitor,
  Save,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Info,
  Zap,
  HardDrive,
  Wifi,
  Bell,
} from "lucide-react";

const Systeme = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [systemInfo, setSystemInfo] = useState({
    nom_application: "Gestocker",
    version: "1.0.0",
    environnement: "production",
    fuseau_horaire: "Africa/Porto-Novo",
    langue: "fr",
    devise: "XOF",
    format_date: "DD/MM/YYYY",
    separateur_decimal: ",",
    nombre_decimales: 2,
    auto_sauvegarde: true,
    frequence_sauvegarde: "quotidienne",
    retention_sauvegarde: 30,
    notifications_email: true,
    notifications_systeme: true,
    niveau_log: "info",
    api_rate_limit: 1000,
    session_timeout: 480,
    maintenance_mode: false,
    debug_mode: false,
  });

  // Charger les paramètres système
  const loadSystemSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("parametres_systeme")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSystemInfo((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      setError("Erreur lors du chargement des paramètres: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSystemSettings();
  }, [loadSystemSettings]);

  // Gérer le changement des champs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemInfo((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  // Sauvegarder les paramètres
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("parametres_systeme")
        .upsert([systemInfo], {
          onConflict: "id",
        });

      if (error) throw error;

      setSuccess("Paramètres système enregistrés avec succès !");
    } catch (error) {
      setError("Erreur lors de l'enregistrement: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser aux valeurs par défaut
  const handleReset = () => {
    setSystemInfo({
      nom_application: "Gestocker",
      version: "1.0.0",
      environnement: "production",
      fuseau_horaire: "Africa/Porto-Novo",
      langue: "fr",
      devise: "XOF",
      format_date: "DD/MM/YYYY",
      separateur_decimal: ",",
      nombre_decimales: 2,
      auto_sauvegarde: true,
      frequence_sauvegarde: "quotidienne",
      retention_sauvegarde: 30,
      notifications_email: true,
      notifications_systeme: true,
      niveau_log: "info",
      api_rate_limit: 1000,
      session_timeout: 480,
      maintenance_mode: false,
      debug_mode: false,
    });
    setSuccess("Paramètres réinitialisés aux valeurs par défaut");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Configuration système
              </h1>
              <p className="text-gray-600 mt-2">
                Gérez les paramètres généraux du système
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réinitialiser
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-6 mt-6">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mx-6 mt-6">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 space-y-8">
          {/* Informations générales */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-600" />
              Informations générales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'application
                </label>
                <input
                  type="text"
                  name="nom_application"
                  value={systemInfo.nom_application}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  name="version"
                  value={systemInfo.version}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environnement
                </label>
                <select
                  name="environnement"
                  value={systemInfo.environnement}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="development">Développement</option>
                  <option value="staging">Test</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>
          </div>

          {/* Paramètres régionaux */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-600" />
              Paramètres régionaux
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuseau horaire
                </label>
                <select
                  name="fuseau_horaire"
                  value={systemInfo.fuseau_horaire}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Africa/Porto-Novo">Africa/Porto-Novo</option>
                  <option value="Africa/Abidjan">Africa/Abidjan</option>
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue
                </label>
                <select
                  name="langue"
                  value={systemInfo.langue}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devise
                </label>
                <select
                  name="devise"
                  value={systemInfo.devise}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format de date
                </label>
                <select
                  name="format_date"
                  value={systemInfo.format_date}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Séparateur décimal
                </label>
                <select
                  name="separateur_decimal"
                  value={systemInfo.separateur_decimal}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value=",">Virgule (,)</option>
                  <option value=".">Point (.)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de décimales
                </label>
                <input
                  type="number"
                  name="nombre_decimales"
                  value={systemInfo.nombre_decimales}
                  onChange={handleChange}
                  min="0"
                  max="4"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Sauvegarde et maintenance */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <HardDrive className="w-5 h-5 mr-2 text-blue-600" />
              Sauvegarde et maintenance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="auto_sauvegarde"
                  checked={systemInfo.auto_sauvegarde}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Sauvegarde automatique
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence de sauvegarde
                </label>
                <select
                  name="frequence_sauvegarde"
                  value={systemInfo.frequence_sauvegarde}
                  onChange={handleChange}
                  disabled={!systemInfo.auto_sauvegarde}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="horaire">Toutes les heures</option>
                  <option value="quotidienne">Quotidienne</option>
                  <option value="hebdomadaire">Hebdomadaire</option>
                  <option value="mensuelle">Mensuelle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rétention des sauvegardes (jours)
                </label>
                <input
                  type="number"
                  name="retention_sauvegarde"
                  value={systemInfo.retention_sauvegarde}
                  onChange={handleChange}
                  min="1"
                  max="365"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="maintenance_mode"
                  checked={systemInfo.maintenance_mode}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Mode maintenance
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="debug_mode"
                  checked={systemInfo.debug_mode}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Mode debug</label>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-blue-600" />
              Notifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notifications_email"
                  checked={systemInfo.notifications_email}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Notifications par email
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notifications_systeme"
                  checked={systemInfo.notifications_systeme}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Notifications système
                </label>
              </div>
            </div>
          </div>

          {/* Performance et sécurité */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              Performance et sécurité
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau de log
                </label>
                <select
                  name="niveau_log"
                  value={systemInfo.niveau_log}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="error">Erreur</option>
                  <option value="warn">Avertissement</option>
                  <option value="info">Information</option>
                  <option value="debug">Debug</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite API (requêtes/heure)
                </label>
                <input
                  type="number"
                  name="api_rate_limit"
                  value={systemInfo.api_rate_limit}
                  onChange={handleChange}
                  min="100"
                  max="10000"
                  step="100"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout session (minutes)
                </label>
                <input
                  type="number"
                  name="session_timeout"
                  value={systemInfo.session_timeout}
                  onChange={handleChange}
                  min="15"
                  max="1440"
                  step="15"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Systeme;
