import React, { useState, useEffect } from 'react';
import '../styles/InputModal.css';

/**
 * Componente de Modal de Input
 * Modal bonito y moderno para reemplazar window.prompt()
 */
const InputModal = ({ 
  isOpen,
  title = 'Ingresar Datos',
  message = '',
  fields = [{ name: 'input', label: 'Valor', type: 'text', placeholder: '' }],
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  icon = '📝',
  defaultValue = {}
}) => {
  const [formData, setFormData] = useState({});

  // Inicializar formData con valores por defecto o vacíos
  useEffect(() => {
    if (isOpen) {
      const initialData = {};
      fields.forEach(field => {
        // Siempre inicializar como string vacío para permitir escribir libremente
        initialData[field.name] = '';
      });
      setFormData(initialData);
    }
  }, [isOpen, fields]);

  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para obtener el valor del campo (maneja números correctamente)
  const getFieldValue = (field) => {
    const value = formData[field.name];
    // Siempre devolver string, permitir edición libre
    if (value === undefined || value === null || value === '') {
      return '';
    }
    // Convertir a string para permitir edición
    return String(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validar campos requeridos
    const allFilled = fields.every(field => {
      if (field.required !== false) {
        return formData[field.name] !== undefined && formData[field.name] !== '';
      }
      return true;
    });

    if (!allFilled) {
      return;
    }

    // Si solo hay un campo, devolver su valor directamente, sino devolver el objeto completo
    if (fields.length === 1) {
      onConfirm(formData[fields[0].name]);
    } else {
      onConfirm(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="input-modal-overlay" onClick={onCancel}>
      <div className="input-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="input-modal-content">
          {/* Header */}
          <div className="input-modal-header">
            <div className="input-modal-icon">{icon}</div>
            <h3 className="input-modal-title">{title}</h3>
          </div>

          {/* Mensaje */}
          {message && (
            <p className="input-modal-message">{message}</p>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="input-modal-form">
            {fields.map((field, index) => (
              <div key={field.name || index} className="input-modal-field">
                <label className="input-modal-label">
                  {field.label}
                  {field.required !== false && <span className="required">*</span>}
                </label>
                <input
                  type={field.type || 'text'}
                  value={getFieldValue(field)}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Siempre actualizar el estado, permitir cualquier entrada
                    handleInputChange(field.name, value);
                  }}
                  onBlur={(e) => {
                    // Al perder el foco, validar y formatear si es necesario
                    if (field.type === 'number' && e.target.value !== '') {
                      const numValue = parseFloat(e.target.value);
                      if (isNaN(numValue) || (field.min !== undefined && numValue < field.min)) {
                        // Si es inválido o menor al mínimo, limpiar o ajustar
                        if (field.min !== undefined && numValue < field.min) {
                          handleInputChange(field.name, String(field.min));
                        } else {
                          handleInputChange(field.name, '');
                        }
                      } else {
                        // Asegurar que el valor se mantenga como string para permitir edición
                        handleInputChange(field.name, String(numValue));
                      }
                    }
                  }}
                  placeholder={field.placeholder || `Ingrese ${field.label.toLowerCase()}`}
                  className="input-modal-input"
                  autoFocus={index === 0}
                  required={field.required !== false}
                  min={field.min !== undefined ? field.min : undefined}
                  max={field.max !== undefined ? field.max : undefined}
                  step={field.step !== undefined ? field.step : undefined}
                />
              </div>
            ))}

            {/* Botones */}
            <div className="input-modal-buttons">
              <button
                type="button"
                className="input-modal-btn input-modal-btn-cancel"
                onClick={onCancel}
              >
                {cancelText}
              </button>
              <button
                type="submit"
                className="input-modal-btn input-modal-btn-confirm"
              >
                {confirmText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InputModal;
