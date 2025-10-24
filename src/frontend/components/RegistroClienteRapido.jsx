import React, { useState } from 'react';
import '../styles/RegistroClienteRapido.css';

/**
 * Componente para registro rápido de clientes
 * Se usa en Punto de Venta para registrar clientes al momento de la venta
 */
const RegistroClienteRapido = ({ onClienteRegistrado, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    rut: ''
  });


  /**
   * Maneja el cambio en los campos del formulario
   */
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Valida los datos del formulario
   */
  const validarFormulario = () => {
    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return false;
    }

    if (!formData.rut.trim()) {
      alert('El RUT es obligatorio');
      return false;
    }

    // Validar formato de RUT chileno (más flexible)
    const rutLimpio = formData.rut.replace(/[^0-9kK]/g, ''); // Solo números y K
    const rutRegex = /^[0-9]{7,8}[0-9kK]{1}$/;
    
    if (!rutRegex.test(rutLimpio)) {
      alert('Por favor, ingresa un RUT válido (ej: 20.993.899-6 o 20993899-6)');
      return false;
    }

    return true;
  };

  /**
   * Maneja el envío del formulario
   */
  const manejarEnvio = (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    const nuevoCliente = {
      id: Date.now(),
      nombre: formData.nombre.trim(),
      rut: formData.rut.trim(),
      fechaRegistro: new Date().toISOString().split('T')[0]
    };

    onClienteRegistrado(nuevoCliente);
  };


  return (
    <div className="registro-cliente-rapido">
      <div className="registro-header">
        <h3>👤 Registrar Cliente</h3>
        <p>Registro rápido para la venta</p>
      </div>

      <form onSubmit={manejarEnvio} className="registro-form">
        <div className="form-group">
          <label htmlFor="nombre">Nombre *</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={manejarCambio}
            placeholder="Ej: Juan Pérez"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="rut">RUT *</label>
          <input
            type="text"
            id="rut"
            name="rut"
            value={formData.rut}
            onChange={manejarCambio}
            placeholder="Ej: 20.993.899-6"
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelar}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-primary"
          >
            ✅ Registrar Cliente
          </button>
        </div>
      </form>

      <div className="registro-info">
        <p><strong>💡 Tip:</strong> Solo se requiere nombre y RUT para registrar un cliente</p>
        <p><strong>📋 RUT:</strong> Formato: 20.993.899-6 (con puntos y guión)</p>
      </div>
    </div>
  );
};

export default RegistroClienteRapido;
