import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';
import { useNotification } from '../hooks/useNotification';
import NotificationContainer from '../components/NotificationContainer';
import '../styles/GestionProveedores.css';

/**
 * Componente GestionProveedores - Administración de proveedores
 * Permite crear, editar, eliminar y gestionar proveedores de insumos
 */
const GestionProveedores = () => {
  // Sistema de notificaciones
  const { notifications, showSuccess, showError, showWarning, removeNotification } = useNotification();
  
  // Estado para la lista de proveedores
  const [listaProveedores, setListaProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para el formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  
  // Estado para confirmación de eliminación
  const [confirmacionEliminar, setConfirmacionEliminar] = useState(null);

  // Función para cargar proveedores desde el backend
  const cargarProveedores = async () => {
    try {
      setCargando(true);
      const timestamp = new Date().getTime();
      const url = API_CONFIG.BASE_URL + '/api/proveedores' + `?_t=${timestamp}`;
      
      console.log('🔄 Cargando proveedores desde:', url);
      
      const response = await axios.get(url);
      
      console.log('📥 Respuesta completa:', response);
      console.log('📥 response.data:', response.data);
      console.log('📥 response.status:', response.status);
      
      if (response.data && response.data.success) {
        const proveedores = response.data.data || [];
        console.log('✅ Proveedores cargados:', proveedores.length);
        console.log('✅ Datos de proveedores:', proveedores);
        setListaProveedores(proveedores);
        
        if (proveedores.length === 0) {
          console.warn('⚠️ No hay proveedores en la respuesta');
        }
      } else {
        console.error('❌ Respuesta del servidor sin éxito:', response.data);
        console.error('❌ response.data.success:', response.data?.success);
        setListaProveedores([]);
        if (response.data && response.data.error) {
          showError('Error: ' + response.data.error);
        }
      }
    } catch (error) {
      console.error('❌ Error completo al cargar proveedores:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response.data:', error.response?.data);
      console.error('❌ Error message:', error.message);
      
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      showError('Error al cargar proveedores: ' + errorMessage);
      setListaProveedores([]);
    } finally {
      setCargando(false);
    }
  };

  // Cargar proveedores al montar el componente
  useEffect(() => {
    cargarProveedores();
  }, []);

  /**
   * Función para manejar cambios en el formulario
   */
  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  /**
   * Función para abrir el formulario de nuevo proveedor
   */
  const abrirFormularioNuevo = () => {
    setFormData({
      nombre: '',
      telefono: '',
      email: '',
      direccion: ''
    });
    setProveedorEditando(null);
    setMostrarFormulario(true);
  };

  /**
   * Función para abrir el formulario de edición
   */
  const abrirFormularioEdicion = (proveedor) => {
    setFormData({
      nombre: proveedor.nombre || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || ''
    });
    setProveedorEditando(proveedor);
    setMostrarFormulario(true);
  };

  /**
   * Función para cerrar el formulario
   */
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setProveedorEditando(null);
    setFormData({
      nombre: '',
      telefono: '',
      email: '',
      direccion: ''
    });
  };

  /**
   * Función para guardar proveedor (crear o actualizar)
   */
  const guardarProveedor = async () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      showError('El nombre es requerido');
      return;
    }

    try {
      if (proveedorEditando) {
        // Actualizar proveedor existente
        const response = await axios.put(
          API_CONFIG.BASE_URL + '/api/proveedores/' + proveedorEditando.id_proveedor,
          formData
        );
        
        if (response.data && response.data.success) {
          showSuccess('Proveedor actualizado exitosamente');
          cerrarFormulario();
          cargarProveedores();
        } else {
          showError(response.data?.error || 'Error al actualizar proveedor');
        }
      } else {
        // Crear nuevo proveedor
        const response = await axios.post(
          API_CONFIG.BASE_URL + '/api/proveedores',
          formData
        );
        
        if (response.data && response.data.success) {
          showSuccess('Proveedor creado exitosamente');
          cerrarFormulario();
          cargarProveedores();
        } else {
          showError(response.data?.error || 'Error al crear proveedor');
        }
      }
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al guardar proveedor';
      showError(errorMessage);
    }
  };

  /**
   * Función para confirmar eliminación
   */
  const confirmarEliminar = (proveedor) => {
    setConfirmacionEliminar(proveedor);
  };

  /**
   * Función para cancelar eliminación
   */
  const cancelarEliminar = () => {
    setConfirmacionEliminar(null);
  };

  /**
   * Función para eliminar proveedor
   */
  const eliminarProveedor = async () => {
    if (!confirmacionEliminar) return;

    try {
      const response = await axios.delete(
        API_CONFIG.BASE_URL + '/api/proveedores/' + confirmacionEliminar.id_proveedor
      );
      
      if (response.data && response.data.success) {
        showSuccess('Proveedor eliminado exitosamente');
        setConfirmacionEliminar(null);
        cargarProveedores();
      } else {
        showError(response.data?.error || 'Error al eliminar proveedor');
        setConfirmacionEliminar(null);
      }
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al eliminar proveedor';
      showError(errorMessage);
      setConfirmacionEliminar(null);
    }
  };

  return (
    <div className="gestion-proveedores-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">🏢 Gestión de Proveedores</h1>
        <p className="page-subtitle">Administra los proveedores de insumos</p>
      </div>

      {/* Botón para agregar nuevo proveedor */}
      <div className="action-bar">
        <button 
          className="btn btn-primary"
          onClick={abrirFormularioNuevo}
        >
          ➕ Agregar Proveedor
        </button>
      </div>

      {/* Tabla de proveedores */}
      {cargando ? (
        <div className="loading-container">
          <p>Cargando proveedores...</p>
        </div>
      ) : listaProveedores.length === 0 ? (
        <div className="empty-state">
          <p>No hay proveedores registrados</p>
          <button className="btn btn-primary" onClick={abrirFormularioNuevo}>
            Agregar primer proveedor
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaProveedores.map((proveedor) => (
                <tr key={proveedor.id_proveedor}>
                  <td>{proveedor.id_proveedor}</td>
                  <td>{proveedor.nombre}</td>
                  <td>{proveedor.telefono || '-'}</td>
                  <td>{proveedor.email || '-'}</td>
                  <td>{proveedor.direccion || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-edit"
                        onClick={() => abrirFormularioEdicion(proveedor)}
                        title="Editar proveedor"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => confirmarEliminar(proveedor)}
                        title="Eliminar proveedor"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de formulario */}
      {mostrarFormulario && (
        <div className="modal-overlay" onClick={cerrarFormulario}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{proveedorEditando ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button className="btn-close" onClick={cerrarFormulario}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={manejarCambioInput}
                  placeholder="Nombre del proveedor"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={manejarCambioInput}
                  placeholder="Teléfono de contacto"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={manejarCambioInput}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="direccion">Dirección</label>
                <textarea
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={manejarCambioInput}
                  placeholder="Dirección del proveedor"
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cerrarFormulario}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={guardarProveedor}>
                {proveedorEditando ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmacionEliminar && (
        <div className="modal-overlay" onClick={cancelarEliminar}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
            </div>
            <div className="modal-body">
              <p>
                ¿Estás seguro de que deseas eliminar el proveedor{' '}
                <strong>{confirmacionEliminar.nombre}</strong>?
              </p>
              {confirmacionEliminar.insumos_asociados > 0 && (
                <p className="warning-text">
                  ⚠️ Este proveedor tiene {confirmacionEliminar.insumos_asociados} insumo(s) asociado(s).
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cancelarEliminar}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={eliminarProveedor}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de notificaciones */}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </div>
  );
};

export default GestionProveedores;

