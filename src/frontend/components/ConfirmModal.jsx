import React, { useEffect } from 'react';
import '../styles/ConfirmModal.css';

/**
 * Componente de Modal de Confirmación
 * Modal bonito y moderno para reemplazar window.confirm()
 */
const ConfirmModal = ({ 
  isOpen, 
  title = 'Confirmar', 
  message = '¿Estás seguro?',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  icon = '⚠️'
}) => {
  
  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-content">
          {/* Icono */}
          <div className="confirm-modal-icon">
            {icon}
          </div>
          
          {/* Título */}
          <h3 className="confirm-modal-title">{title}</h3>
          
          {/* Mensaje */}
          <p className="confirm-modal-message">{message}</p>
          
          {/* Botones */}
          <div className="confirm-modal-buttons">
            <button
              className="confirm-modal-btn confirm-modal-btn-cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              className="confirm-modal-btn confirm-modal-btn-confirm"
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

export default ConfirmModal;

