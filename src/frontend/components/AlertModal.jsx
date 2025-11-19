import React, { useEffect } from 'react';
import '../styles/AlertModal.css';

/**
 * Componente de Modal de Alerta
 * Modal bonito y moderno para reemplazar window.alert()
 */
const AlertModal = ({ 
  isOpen, 
  title = 'Información', 
  message = '',
  type = 'info', // 'info', 'warning', 'success', 'error'
  confirmText = 'Aceptar',
  onConfirm,
  icon = 'ℹ️'
}) => {
  
  // Determinar icono según el tipo
  const getIcon = () => {
    if (type === 'warning') return '⚠️';
    if (type === 'success') return '✅';
    if (type === 'error') return '❌';
    return icon || 'ℹ️';
  };

  // Cerrar con tecla ESC o Enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          onConfirm();
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="alert-modal-overlay" onClick={onConfirm}>
      <div className="alert-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className={`alert-modal-content alert-modal-${type}`}>
          {/* Icono */}
          <div className="alert-modal-icon">
            {getIcon()}
          </div>
          
          {/* Título */}
          {title && <h3 className="alert-modal-title">{title}</h3>}
          
          {/* Mensaje */}
          <div className="alert-modal-message">
            {typeof message === 'string' ? (
              <p>{message.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < message.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}</p>
            ) : (
              <p>{message}</p>
            )}
          </div>
          
          {/* Botón */}
          <div className="alert-modal-buttons">
            <button
              className={`alert-modal-btn alert-modal-btn-${type}`}
              onClick={onConfirm}
              autoFocus
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
