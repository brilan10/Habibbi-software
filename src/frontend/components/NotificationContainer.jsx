import React from 'react';
import Notification from '../components/Notification';

/**
 * Contenedor de notificaciones
 * Renderiza todas las notificaciones activas
 */
const NotificationContainer = ({ notifications, onRemove, removeNotification }) => {
  // Usar onRemove si está disponible, sino usar removeNotification
  const handleRemove = onRemove || removeNotification;
  
  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => handleRemove(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
