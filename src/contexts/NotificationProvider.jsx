import React, { useState, useCallback } from "react";
import { X } from "lucide-react";
import { NotificationContext } from "./NotificationContextProvider.jsx";

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]); // Pour la navbar (persistantes)
  const [activePopups, setActivePopups] = useState([]); // Pour les popups (temporaires)

  // Supprimer une notification de la navbar
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Supprimer un popup temporaire
  const removePopup = useCallback((id) => {
    setActivePopups((prev) => prev.filter((n) => n.id !== id));
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
        duration:
          notification.duration !== undefined ? notification.duration : 0, // 0 = persistant par défaut
        timestamp: new Date(),
      };

      // Si la notification a une durée > 0, c'est un popup temporaire
      if (newNotification.duration > 0) {
        setActivePopups((prev) => [...prev, newNotification]);

        // Auto-suppression après la durée pour les popups
        setTimeout(() => {
          removePopup(id);
        }, newNotification.duration);
      } else {
        // Sinon, c'est une notification persistante pour la navbar
        setNotifications((prev) => [...prev, newNotification]);
      }

      return id;
    },
    [removePopup],
  );

  // Notifications prédéfinies
  const notify = {
    // Notifications temporaires par défaut (5 secondes)
    success: (message, title = "Succès", duration = 5000) =>
      addNotification({ type: "success", title, message, duration }),

    error: (message, title = "Erreur", duration = 8000) =>
      addNotification({ type: "error", title, message, duration }),

    warning: (message, title = "Attention", duration = 6000) =>
      addNotification({ type: "warning", title, message, duration }),

    info: (message, title = "Info", duration = 5000) =>
      addNotification({ type: "info", title, message, duration }),

    // Notifications persistantes (doivent être créées avec duration: 0)
    persistent: (message, type = "info", title = "Notification") =>
      addNotification({ type, title, message, duration: 0 }),

    // Popups temporaires (avec durée automatique)
    popup: (message, type = "info", title = "Notification", duration = 5000) =>
      addNotification({ type, title, message, duration }),

    // Notification spéciale pour la sauvegarde automatique (popup temporaire)
    backupSuccess: (parametre) =>
      addNotification({
        type: "success",
        title: " Sauvegarde automatique",
        message: `Le paramètre "${parametre}" a été sauvegardé automatiquement.`,
        duration: 4000, // Popup temporaire
      }),

    // Notification spéciale pour le changement de devise (popup temporaire)
    deviseChanged: (ancienneDevise, nouvelleDevise) =>
      addNotification({
        type: "info",
        title: "💱 Devise mise à jour",
        message: `La devise a été changée de ${ancienneDevise} à ${nouvelleDevise}. Toutes les pages vont être mises à jour.`,
        duration: 6000, // Popup temporaire
      }),
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        activePopups,
        addNotification,
        removeNotification,
        removePopup,
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
