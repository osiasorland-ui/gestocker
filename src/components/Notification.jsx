import React, { useEffect, useRef } from "react";

const Notification = ({ notification, onClose }) => {
  if (!notification) return null;

  const timerRef = useRef(null);

  // Fermer automatiquement la notification après 3 secondes
  useEffect(() => {
    // Nettoyer le timer précédent s'il existe
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Créer un nouveau timer
    timerRef.current = setTimeout(() => {
      onClose();
    }, 3000);

    // Nettoyer le timer lors du démontage
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification, onClose]);

  const getAlertClass = () => {
    switch (notification.type) {
      case "success":
        return "alert-success";
      case "error":
        return "alert-error";
      case "warning":
        return "alert-warning";
      case "info":
      default:
        return "alert-info";
    }
  };

  const getAlertIcon = () => {
    switch (notification.type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
      default:
        return "ℹ";
    }
  };

  return (
    <div className={`toast toast-top toast-end z-50`}>
      <div className={`alert ${getAlertClass()} shadow-lg max-w-md`}>
        <span className="text-white">{notification.message}</span>
        <button
          onClick={onClose}
          className="btn hover:bg-white/20 btn-outline btn-circle text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Notification;
