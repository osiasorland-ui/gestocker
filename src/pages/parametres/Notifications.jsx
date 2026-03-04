import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuthHook.js";
import { supabase } from "../../config/supabase.js";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Save,
  Check,
  X,
  AlertCircle,
  Settings,
  Volume2,
  Eye,
  MessageSquare,
  Calendar,
  User,
  Package,
  ShoppingCart,
  DollarSign
} from "lucide-react";

const Notifications = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    sound_enabled: true,
    desktop_notifications: true,
    
    // Notifications par catégorie
    stock_alerts: true,
    low_stock_alerts: true,
    order_notifications: true,
    payment_notifications: true,
    customer_notifications: true,
    supplier_notifications: true,
    system_notifications: true,
    
    // Fréquence des notifications
    daily_summary: true,
    weekly_report: false,
    monthly_report: false,
    
    // Paramètres email
    email_on_order: true,
    email_on_payment: true,
    email_on_low_stock: true,
    email_on_new_customer: false,
    email_on_system_update: true,
    
    // Paramètres push
    push_on_order: true,
    push_on_payment: true,
    push_on_low_stock: true,
    push_on_new_customer: false,
    
    // Heures de notification
    notification_start_time: "08:00",
    notification_end_time: "18:00",
    weekend_notifications: false,
    
    // Préférences utilisateur
    language: "fr",
    timezone: "Africa/Porto-Novo"
  });

  const loadNotificationSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", profile?.id_user)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setNotificationSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      setError("Erreur lors du chargement des paramètres: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id_user]);

  useEffect(() => {
    if (profile?.id_user) {
      loadNotificationSettings();
    }
  }, [profile?.id_user, loadNotificationSettings]);

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
      const settingsToSave = {
        ...notificationSettings,
        user_id: profile?.id_user
      };

      const { error } = await supabase
        .from("notification_settings")
        .upsert([settingsToSave], {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSuccess("Paramètres de notification enregistrés avec succès !");
    } catch (error) {
      setError("Erreur lors de l'enregistrement: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async (type) => {
    try {
      const { error } = await supabase.rpc('send_test_notification', {
        user_id: profile?.id_user,
        notification_type: type
      });

      if (error) throw error;

      setSuccess(`Notification test ${type} envoyée avec succès !`);
    } catch (error) {
      setError("Erreur lors de l'envoi de la notification test: " + error.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-2">Gérez vos préférences de notification</p>
            </div>
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

        <form onSubmit={handleSaveSettings} className="p-6 space-y-8">
          {/* Canaux de notification */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-blue-600" />
              Canaux de notification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Email</div>
                    <div className="text-sm text-gray-500">Notifications par email</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="email_notifications"
                  checked={notificationSettings.email_notifications}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Smartphone className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Push</div>
                    <div className="text-sm text-gray-500">Notifications mobiles</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="push_notifications"
                  checked={notificationSettings.push_notifications}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">SMS</div>
                    <div className="text-sm text-gray-500">Notifications SMS</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="sms_notifications"
                  checked={notificationSettings.sms_notifications}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Volume2 className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Son</div>
                    <div className="text-sm text-gray-500">Alertes sonores</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="sound_enabled"
                  checked={notificationSettings.sound_enabled}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Eye className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Bureau</div>
                    <div className="text-sm text-gray-500">Notifications desktop</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="desktop_notifications"
                  checked={notificationSettings.desktop_notifications}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Notifications par catégorie */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              Notifications par catégorie
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Stock</div>
                    <div className="text-sm text-gray-500">Alertes de stock</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="stock_alerts"
                  checked={notificationSettings.stock_alerts}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <ShoppingCart className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Commandes</div>
                    <div className="text-sm text-gray-500">Nouvelles commandes</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="order_notifications"
                  checked={notificationSettings.order_notifications}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Paiements</div>
                    <div className="text-sm text-gray-500">Notifications de paiement</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="payment_notifications"
                  checked={notificationSettings.payment_notifications}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Clients</div>
                    <div className="text-sm text-gray-500">Nouveaux clients</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="customer_notifications"
                  checked={notificationSettings.customer_notifications}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Système</div>
                    <div className="text-sm text-gray-500">Alertes système</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="system_notifications"
                  checked={notificationSettings.system_notifications}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Fréquence et horaires */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Fréquence et horaires
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="daily_summary"
                  checked={notificationSettings.daily_summary}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Résumé quotidien
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="weekly_report"
                  checked={notificationSettings.weekly_report}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Rapport hebdomadaire
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="monthly_report"
                  checked={notificationSettings.monthly_report}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Rapport mensuel
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de début
                </label>
                <input
                  type="time"
                  name="notification_start_time"
                  value={notificationSettings.notification_start_time}
                  onChange={handleSettingsChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de fin
                </label>
                <input
                  type="time"
                  name="notification_end_time"
                  value={notificationSettings.notification_end_time}
                  onChange={handleSettingsChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="weekend_notifications"
                  checked={notificationSettings.weekend_notifications}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Notifications le week-end
                </label>
              </div>
            </div>
          </div>

          {/* Préférences utilisateur */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Préférences utilisateur
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue
                </label>
                <select
                  name="language"
                  value={notificationSettings.language}
                  onChange={handleSettingsChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuseau horaire
                </label>
                <select
                  name="timezone"
                  value={notificationSettings.timezone}
                  onChange={handleSettingsChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Africa/Porto-Novo">Africa/Porto-Novo</option>
                  <option value="Africa/Abidjan">Africa/Abidjan</option>
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tests de notification */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-blue-600" />
              Tester les notifications
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => testNotification('email')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Tester email
              </button>
              <button
                type="button"
                onClick={() => testNotification('push')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Tester push
              </button>
              <button
                type="button"
                onClick={() => testNotification('sms')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Tester SMS
              </button>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
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
                  Enregistrer les préférences
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Notifications;
