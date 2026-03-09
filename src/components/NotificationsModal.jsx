import React, { useState } from "react";
import { useNotification } from "../hooks/useNotification.js";
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Trash2,
} from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

const NotificationsModal = ({ isOpen, onClose }) => {
  const { notifications, clearAllNotifications, removeNotification } =
    useNotification();
  const [filter, setFilter] = useState("all"); // all, success, error, warning, info

  // Filtrer les notifications par type
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    return notification.type === filter;
  });

  // Compter les notifications par type
  const notificationCounts = {
    all: notifications.length,
    success: notifications.filter((n) => n.type === "success").length,
    error: notifications.filter((n) => n.type === "error").length,
    warning: notifications.filter((n) => n.type === "warning").length,
    info: notifications.filter((n) => n.type === "info").length,
  };

  // Obtenir l'icône et le style selon le type
  const getNotificationStyle = (type) => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          bgColor: "bg-green-50",
          borderColor: "border-green-500",
          textColor: "text-green-800",
          iconColor: "text-green-600",
        };
      case "error":
        return {
          icon: AlertCircle,
          bgColor: "bg-red-50",
          borderColor: "border-red-500",
          textColor: "text-red-800",
          iconColor: "text-red-600",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-500",
          textColor: "text-yellow-800",
          iconColor: "text-yellow-600",
        };
      default:
        return {
          icon: Info,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-500",
          textColor: "text-blue-800",
          iconColor: "text-blue-600",
        };
    }
  };

  // Formater la date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-gray-600" />
          <span>Notifications</span>
          {notificationCounts.all > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {notificationCounts.all}
            </span>
          )}
        </div>
      }
      size="large"
    >
      <div className="space-y-4">
        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Tout ({notificationCounts.all})
          </button>
          <button
            onClick={() => setFilter("success")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "success"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            ✅ ({notificationCounts.success})
          </button>
          <button
            onClick={() => setFilter("error")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "error"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            ❌ ({notificationCounts.error})
          </button>
          <button
            onClick={() => setFilter("warning")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "warning"
                ? "bg-yellow-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            ⚠️ ({notificationCounts.warning})
          </button>
          <button
            onClick={() => setFilter("info")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "info"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            ℹ️ ({notificationCounts.info})
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={clearAllNotifications}
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Tout effacer</span>
            </Button>
          </div>
        )}

        {/* Liste des notifications */}
        <div className="max-h-96 overflow-y-auto space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === "all" ? "Aucune notification" : `Aucune ${filter}`}
              </h3>
              <p className="text-gray-500 text-sm">
                {filter === "all"
                  ? "Vous n'avez pas encore de notifications."
                  : `Pas de notifications de type ${filter}.`}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const style = getNotificationStyle(notification.type);
              const Icon = style.icon;

              return (
                <div
                  key={notification.id}
                  className={`flex items-start p-4 border-l-4 rounded-lg ${style.bgColor} ${style.borderColor} hover:shadow-md transition-shadow`}
                >
                  <div className={`shrink-0 ${style.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4
                          className={`text-sm font-semibold ${style.textColor}`}
                        >
                          {notification.title}
                        </h4>
                        <p
                          className={`text-sm ${style.textColor} mt-1 wrap-break-word`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(notification.timestamp)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="ml-4 shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NotificationsModal;
