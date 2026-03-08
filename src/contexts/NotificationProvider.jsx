import React, { useState, useCallback } from "react";
import { NotificationContext } from "./NotificationContextProvider.jsx";

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback(
    (notification) => {
      const id = Date.now() + Math.random();
      const newNotification = {
        id,
        type: notification.type || "info", // success, error, warning, info
        title: notification.title || "Notification",
        message: notification.message || "",
        duration: notification.duration || 5000, // ms
        timestamp: new Date(),
      };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto-suppression après la durée
      if (newNotification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
      }

      return id;
    },
    [removeNotification],
  );

  // Notifications prédéfinies
  const notify = {
    success: (message, title = "Succès") =>
      addNotification({ type: "success", title, message }),

    error: (message, title = "Erreur") =>
      addNotification({ type: "error", title, message, duration: 8000 }),

    warning: (message, title = "Attention") =>
      addNotification({ type: "warning", title, message }),

    info: (message, title = "Information") =>
      addNotification({ type: "info", title, message }),

    // Notification spéciale pour la sauvegarde automatique
    backupSuccess: (parametre) =>
      addNotification({
        type: "success",
        title: "🔄 Sauvegarde automatique",
        message: `Le paramètre "${parametre}" a été sauvegardé automatiquement.`,
        duration: 4000,
      }),

    // Notification spéciale pour le changement de devise
    deviseChanged: (ancienneDevise, nouvelleDevise) =>
      addNotification({
        type: "info",
        title: "💱 Devise mise à jour",
        message: `La devise a été changée de ${ancienneDevise} à ${nouvelleDevise}. Toutes les pages vont être mises à jour.`,
        duration: 6000,
      }),
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        notify,
        // Ajout des alias pour compatibilité avec le code existant
        showSuccess: notify.success,
        showError: notify.error,
        showWarning: notify.warning,
        showInfo: notify.info,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
