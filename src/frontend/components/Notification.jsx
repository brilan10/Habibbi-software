import React, { useState, useEffect } from 'react';
import '../styles/Notification.css';

/**
 * Componente de notificación bonita
 * Reemplaza los alerts básicos del navegador
 */
const Notification = ({ 
  message, 
  type = 'success', // success, error, warning, info
  duration = 4000,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '✅';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return '¡Éxito!';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Advertencia';
      case 'info':
        return 'Información';
      default:
        return 'Notificación';
    }
  };

  return (
    <div className={`notification ${type} ${isAnimating ? 'notification-exit' : 'notification-enter'}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {getIcon()}
        </div>
        <div className="notification-text">
          <div className="notification-title">{getTitle()}</div>
          <div className="notification-message">{message}</div>
        </div>
        <button 
          className="notification-close"
          onClick={handleClose}
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      </div>
      <div className="notification-progress">
        <div 
          className="notification-progress-bar"
          style={{ 
            animationDuration: `${duration}ms`,
            animationPlayState: isAnimating ? 'paused' : 'running'
          }}
        ></div>
      </div>
    </div>
  );
};

export default Notification;
