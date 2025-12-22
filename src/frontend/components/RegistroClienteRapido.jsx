import React, { useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';
import AlertModal from './AlertModal';
import '../styles/RegistroClienteRapido.css';

/**
 * Componente para registro rápido de clientes
 * Se usa en Punto de Venta para registrar clientes al momento de la venta
 */
const RegistroClienteRapido = ({ onClienteRegistrado, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    telefono: ''
  });
  const [alerta, setAlerta] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [cargando, setCargando] = useState(false);


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
      setAlerta({
        isOpen: true,
        type: 'warning',
        title: 'Nombre Requerido',
        message: 'El nombre es obligatorio'
      });
      return false;
    }

    // RUT y teléfono son opcionales para registro rápido
    // Pero si se proporciona RUT, validar formato
    if (formData.rut.trim()) {
      const rutLimpio = formData.rut.replace(/[^0-9kK]/g, '');
      const rutRegex = /^[0-9]{7,8}[0-9kK]{1}$/;
      
      if (!rutRegex.test(rutLimpio)) {
        setAlerta({
          isOpen: true,
          type: 'warning',
          title: 'RUT Inválido',
          message: 'Por favor, ingresa un RUT válido (ej: 20.993.899-6 o 20993899-6)'
        });
        return false;
      }
    }

    return true;
  };

  /**
   * Maneja el envío del formulario
   */
  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      // Preparar datos para el backend (el backend requiere nombre, telefono, rut y correo opcionales)
      const datosCliente = {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim() || '', // Teléfono opcional pero se envía
        rut: formData.rut.trim() || '', // RUT opcional
        correo: '' // Correo vacío para registro rápido
      };

      // Enviar al backend usando axios directo (igual que GestionUsuarios)
      console.log('🔵 RegistroClienteRapido - Enviando datos:', datosCliente);
      console.log('🔵 RegistroClienteRapido - URL completa:', API_CONFIG.BASE_URL + API_CONFIG.CLIENTES.CREATE);
      
      const response = await axios.post(
        API_CONFIG.BASE_URL + API_CONFIG.CLIENTES.CREATE,
        datosCliente,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ RegistroClienteRapido - Respuesta:', response.data);

      if (response.data && response.data.success) {
        // Preparar el objeto cliente para el callback (con datos adicionales)
        const nuevoCliente = {
          id_cliente: response.data.id,
          nombre: formData.nombre.trim(),
          telefono: formData.telefono.trim() || null,
          correo: '',
          rut: formData.rut.trim() || null,
          fechaRegistro: new Date().toISOString().split('T')[0]
        };

        console.log('✅ RegistroClienteRapido - Cliente registrado exitosamente, llamando callback');
        
        // Llamar al callback con el cliente registrado (esto recargará desde BD)
        await onClienteRegistrado(nuevoCliente);
        
        // Cerrar el modal de registro
        setFormData({ nombre: '', rut: '', telefono: '' });
      } else {
        throw new Error(response.data?.error || 'Error al registrar cliente');
      }
    } catch (error) {
      console.error('Error al registrar cliente:', error);
      setAlerta({
        isOpen: true,
        type: 'error',
        title: 'Error al Registrar',
        message: error.response?.data?.error || error.message || 'Error al registrar el cliente. Intenta nuevamente.'
      });
    } finally {
      setCargando(false);
    }
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
          <label htmlFor="rut">RUT (Opcional)</label>
          <input
            type="text"
            id="rut"
            name="rut"
            value={formData.rut}
            onChange={manejarCambio}
            placeholder="Ej: 20.993.899-6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="telefono">Teléfono (Opcional)</label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={manejarCambio}
            placeholder="Ej: +56912345678"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelar}
            disabled={cargando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={cargando}
          >
            {cargando ? '⏳ Registrando...' : '✅ Registrar Cliente'}
          </button>
        </div>
      </form>

      <div className="registro-info">
        <p><strong>💡 Tip:</strong> Solo se requiere el nombre para registrar un cliente</p>
        <p><strong>📋 Opcional:</strong> Puedes agregar RUT y teléfono si lo deseas</p>
      </div>

      {/* Modal de alerta */}
      <AlertModal
        isOpen={alerta.isOpen}
        type={alerta.type}
        title={alerta.title}
        message={alerta.message}
        onConfirm={() => setAlerta({ ...alerta, isOpen: false })}
      />
    </div>
  );
};

export default RegistroClienteRapido;
