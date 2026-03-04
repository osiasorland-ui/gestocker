import React from 'react';

const Notification = ({ notification, onClose }) => {
  if (!notification) return null;

  const getAlertClass = () => {
    switch (notification.type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-error';
      case 'warning':
        return 'alert-warning';
      case 'info':
      default:
        return 'alert-info';
    }
  };

  const getAlertIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`toast toast-top toast-end z-50`}>
      <div className={`alert ${getAlertClass()} shadow-lg`}>
        <span className="text-lg">{getAlertIcon()}</span>
        <span>{notification.message}</span>
        <button 
          onClick={onClose}
          className="btn btn-sm btn-ghost btn-circle"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Notification;
