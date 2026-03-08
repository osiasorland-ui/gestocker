import React from "react";
import { useNotification } from "../../hooks/useNotification.js";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            flex items-start p-4 rounded-lg border shadow-lg
            transition-all duration-300 ease-in-out
            transform translate-x-0 opacity-100
            ${getStyles(notification.type)}
          `}
        >
          <div className="shrink-0 mr-3">{getIcon(notification.type)}</div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{notification.title}</p>
            <p className="text-sm mt-1 opacity-90">{notification.message}</p>
          </div>

          <button
            onClick={() => removeNotification(notification.id)}
            className="shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
