import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../config/supabase.js";
import {
  HardDrive,
  Download,
  Upload,
  Save,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  Trash2,
  Play,
  Settings,
} from "lucide-react";

const Sauvegarde = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [backups, setBackups] = useState([]);
  const [backupSettings, setBackupSettings] = useState({
    auto_backup: true,
    backup_frequency: "daily",
    backup_time: "02:00",
    retention_days: 30,
    backup_location: "cloud",
    compression_enabled: true,
    encryption_enabled: true,
    email_notifications: true,
    include_attachments: true,
  });

  const loadBackups = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("backups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setBackups(data || []);
    } catch (error) {
      setError("Erreur lors du chargement des sauvegardes: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBackupSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("backup_settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setBackupSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      setError("Erreur lors du chargement des paramètres: " + error.message);
    }
  }, []);

  useEffect(() => {
    loadBackups();
    loadBackupSettings();
  }, [loadBackups, loadBackupSettings]);

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBackupSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("backup_settings")
        .upsert([backupSettings], {
          onConflict: "id",
        });

      if (error) throw error;

      setSuccess("Paramètres de sauvegarde enregistrés avec succès !");
    } catch (error) {
      setError("Erreur lors de l'enregistrement: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.rpc("create_backup");

      if (error) throw error;

      setSuccess("Sauvegarde créée avec succès !");
      loadBackups();
    } catch (error) {
      setError("Erreur lors de la création de la sauvegarde: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Cette action remplacera toutes les données actuelles.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.rpc("restore_backup", {
        backup_id: backupId,
      });

      if (error) throw error;

      setSuccess("Sauvegarde restaurée avec succès !");
    } catch (error) {
      setError("Erreur lors de la restauration: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette sauvegarde ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("backups")
        .delete()
        .eq("id", backupId);

      if (error) throw error;

      setSuccess("Sauvegarde supprimée avec succès !");
      loadBackups();
    } catch (error) {
      setError("Erreur lors de la suppression: " + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sauvegarde et restauration
              </h1>
              <p className="text-gray-600 mt-2">
                Gérez les sauvegardes de vos données
              </p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 mr-2" />
                  Créer une sauvegarde
                </>
              )}
            </button>
          </div>
        </div>

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

        <div className="p-6 space-y-8">
          {/* Paramètres de sauvegarde */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              Paramètres de sauvegarde
            </h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="auto_backup"
                    checked={backupSettings.auto_backup}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Sauvegarde automatique
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fréquence
                  </label>
                  <select
                    name="backup_frequency"
                    value={backupSettings.backup_frequency}
                    onChange={handleSettingsChange}
                    disabled={!backupSettings.auto_backup}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="hourly">Toutes les heures</option>
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuelle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de sauvegarde
                  </label>
                  <input
                    type="time"
                    name="backup_time"
                    value={backupSettings.backup_time}
                    onChange={handleSettingsChange}
                    disabled={!backupSettings.auto_backup}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rétention (jours)
                  </label>
                  <input
                    type="number"
                    name="retention_days"
                    value={backupSettings.retention_days}
                    onChange={handleSettingsChange}
                    min="1"
                    max="365"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emplacement
                  </label>
                  <select
                    name="backup_location"
                    value={backupSettings.backup_location}
                    onChange={handleSettingsChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cloud">Cloud</option>
                    <option value="local">Local</option>
                    <option value="both">Les deux</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="compression_enabled"
                    checked={backupSettings.compression_enabled}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Compression activée
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="encryption_enabled"
                    checked={backupSettings.encryption_enabled}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Chiffrement activé
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="email_notifications"
                    checked={backupSettings.email_notifications}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Notifications par email
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="include_attachments"
                    checked={backupSettings.include_attachments}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Inclure les pièces jointes
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer les paramètres
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Liste des sauvegardes */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Sauvegardes disponibles
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Chargement...</p>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12">
                <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune sauvegarde disponible</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date de création
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taille
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backups.map((backup) => (
                      <tr key={backup.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(
                                  backup.created_at,
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(
                                  backup.created_at,
                                ).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatFileSize(backup.file_size)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              backup.backup_type === "automatic"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {backup.backup_type === "automatic"
                              ? "Automatique"
                              : "Manuelle"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              backup.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : backup.status === "in_progress"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {backup.status === "completed"
                              ? "Terminée"
                              : backup.status === "in_progress"
                                ? "En cours"
                                : "Échouée"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRestoreBackup(backup.id)}
                              disabled={backup.status !== "completed"}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Restaurer"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBackup(backup.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sauvegarde;
