import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuthHook.js";
import { supabase } from "../config/supabase.js";
import { AlertCircle, X, RefreshCw } from "lucide-react";

const RoleChangeNotification = () => {
  const { profile, signOut } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les notifications de l'utilisateur connecté
  const loadNotifications = useCallback(async () => {
    if (!profile?.id_user) return;

    try {
      const { data, error } = await supabase
        .from("role_change_notifications")
        .select("*")
        .eq("id_user", profile.id_user)
        .eq("est_lu", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur lors du chargement des notifications:", error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error("Erreur dans loadNotifications:", error);
    }
  }, [profile?.id_user]);

  // Marquer une notification comme lue et se déconnecter
  const handleNotificationClick = async (notificationId) => {
    setLoading(true);

    try {
      // Marquer la notification comme lue
      const { error } = await supabase
        .from("role_change_notifications")
        .update({ est_lu: true })
        .eq("id_notification", notificationId);

      if (error) {
        console.error("Erreur lors du marquage de la notification:", error);
      }

      // Retirer la notification de la liste
      setNotifications((prev) =>
        prev.filter((n) => n.id_notification !== notificationId),
      );

      // Déconnecter l'utilisateur
      await signOut();
    } catch (error) {
      console.error("Erreur lors du traitement de la notification:", error);
    } finally {
      setLoading(false);
    }
  };

  // Ignorer une notification (la marquer comme lue sans se déconnecter)
  const dismissNotification = async (notificationId, e) => {
    e.stopPropagation();

    try {
      const { error } = await supabase
        .from("role_change_notifications")
        .update({ est_lu: true })
        .eq("id_notification", notificationId);

      if (error) {
        console.error("Erreur lors du marquage de la notification:", error);
      }

      setNotifications((prev) =>
        prev.filter((n) => n.id_notification !== notificationId),
      );
    } catch (error) {
      console.error("Erreur lors du rejet de la notification:", error);
    }
  };

  // Charger les notifications au montage et quand le profil change
  useEffect(() => {
    if (profile?.id_user) {
      loadNotifications();
    }
  }, [profile?.id_user, loadNotifications]);

  // Rafraîchir les notifications toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (profile?.id_user) {
        loadNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [profile?.id_user, loadNotifications]);

  // S'il n'y a pas de notifications, ne rien afficher
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-amber-600 mr-3" />
            <h3 className="text-lg font-semibold text-amber-800">
              Changement de rôle détecté
            </h3>
          </div>
          <button
            onClick={() => loadNotifications()}
            className="text-amber-600 hover:text-amber-700 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Vos permissions ont été modifiées. Vous devez obligatoirement vous
            reconnecter pour appliquer les changements.
          </p>

          {notifications.map((notification) => (
            <div
              key={notification.id_notification}
              className="bg-amber-50 rounded-md p-4 border border-amber-200 mb-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-800 mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={(e) =>
                    dismissNotification(notification.id_notification, e)
                  }
                  className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Ignorer cette notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() =>
              notifications.length > 0 &&
              handleNotificationClick(notifications[0].id_notification)
            }
            disabled={loading}
            className="px-6 py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 transition-colors w-full"
          >
            {loading ? (
              <div className="inline-flex items-center justify-center">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Déconnexion en cours...
              </div>
            ) : (
              "Se reconnecter maintenant"
            )}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-red-600 font-medium">
            La déconnexion est obligatoire pour appliquer vos nouvelles
            permissions
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleChangeNotification;
