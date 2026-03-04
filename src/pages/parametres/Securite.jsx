import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuthHook.js";
import { supabase } from "../../config/supabase.js";
import { 
  Shield, 
  Lock, 
  Key, 
  Save,
  Check,
  X,
  AlertCircle,
  Clock,
  Smartphone,
  Ban
} from "lucide-react";

const Securite = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [securitySettings, setSecuritySettings] = useState({
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_symbols: true,
    password_expiry_days: 90,
    session_timeout_minutes: 480,
    max_login_attempts: 5,
    lockout_duration_minutes: 15,
    two_factor_required: false,
    email_notifications: true,
    force_https: true,
    enable_audit_log: true
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const loadSecuritySettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("parametres_securite")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSecuritySettings(prev => ({ ...prev, ...data }));
      }

      const { data: sessionsData, error: sessionsError } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", profile?.id_user)
        .order("last_activity", { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);
    } catch (error) {
      setError("Erreur lors du chargement des paramètres: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id_user]);

  useEffect(() => {
    if (profile?.id_user) {
      loadSecuritySettings();
    }
  }, [profile?.id_user, loadSecuritySettings]);

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("parametres_securite")
        .upsert([securitySettings], {
          onConflict: 'id'
        });

      if (error) throw error;

      setSuccess("Paramètres de sécurité enregistrés avec succès !");
    } catch (error) {
      setError("Erreur lors de l'enregistrement: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      });

      if (error) throw error;

      setSuccess("Mot de passe changé avec succès !");
      setShowPasswordModal(false);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
    } catch (error) {
      setError("Erreur lors du changement de mot de passe: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      const { error } = await supabase
        .from("user_sessions")
        .update({ active: false })
        .eq("id", sessionId);

      if (error) throw error;

      setSuccess("Session révoquée avec succès !");
      loadSecuritySettings();
    } catch (error) {
      setError("Erreur lors de la révocation: " + error.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sécurité</h1>
              <p className="text-gray-600 mt-2">Gérez les paramètres de sécurité de votre compte</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Key className="w-4 h-4 mr-2" />
              Changer le mot de passe
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
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-blue-600" />
              Politique de mot de passe
            </h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longueur minimale
                  </label>
                  <input
                    type="number"
                    name="password_min_length"
                    value={securitySettings.password_min_length}
                    onChange={handleSettingsChange}
                    min="6"
                    max="20"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration (jours)
                  </label>
                  <input
                    type="number"
                    name="password_expiry_days"
                    value={securitySettings.password_expiry_days}
                    onChange={handleSettingsChange}
                    min="0"
                    max="365"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="password_require_uppercase"
                    checked={securitySettings.password_require_uppercase}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Exiger majuscules
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="password_require_lowercase"
                    checked={securitySettings.password_require_lowercase}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Exiger minuscules
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="password_require_numbers"
                    checked={securitySettings.password_require_numbers}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Exiger chiffres
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="password_require_symbols"
                    checked={securitySettings.password_require_symbols}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Exiger symboles
                  </label>
                </div>
              </div>
            </form>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Sécurité des sessions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout session (minutes)
                </label>
                <input
                  type="number"
                  name="session_timeout_minutes"
                  value={securitySettings.session_timeout_minutes}
                  onChange={handleSettingsChange}
                  min="15"
                  max="1440"
                  step="15"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tentatives max de connexion
                </label>
                <input
                  type="number"
                  name="max_login_attempts"
                  value={securitySettings.max_login_attempts}
                  onChange={handleSettingsChange}
                  min="3"
                  max="10"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée de blocage (minutes)
                </label>
                <input
                  type="number"
                  name="lockout_duration_minutes"
                  value={securitySettings.lockout_duration_minutes}
                  onChange={handleSettingsChange}
                  min="5"
                  max="60"
                  step="5"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-blue-600" />
              Sessions actives
            </h2>
            
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-gray-500">Aucune session active</p>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <Smartphone className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {session.device_info || "Appareil inconnu"}
                          {session.is_current && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Actuelle
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          IP: {session.ip_address} • 
                          Dernière activité: {new Date(session.last_activity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {!session.is_current && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveSettings}
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
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Changer le mot de passe</h2>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  required
                  minLength={securitySettings.password_min_length}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  required
                  minLength={securitySettings.password_min_length}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({
                      current_password: "",
                      new_password: "",
                      confirm_password: ""
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Changement..." : "Changer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Securite;
