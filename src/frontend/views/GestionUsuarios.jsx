import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';
import { useNotification } from '../hooks/useNotification';
import NotificationContainer from '../components/NotificationContainer';
import '../styles/GestionUsuarios.css';

/**
 * Componente GestionUsuarios - Administración de usuarios del sistema
 * Permite crear, editar, eliminar y gestionar usuarios con diferentes roles
 */
const GestionUsuarios = () => {
  // Sistema de notificaciones
  const { notifications, showSuccess, showError, showWarning, removeNotification } = useNotification();
  
  // Estado para la lista de usuarios
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para el formulario de nuevo usuario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estado para el usuario que se está editando
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',      // Nombre completo que se dividirá
    apellido: '',    // Apellido separado
    correo: '',      // Email (backend usa 'correo')
    password: '',    // Contraseña
    rol: ''          // Rol
  });

  // Estado para mostrar/ocultar contraseña
  const [mostrarPassword, setMostrarPassword] = useState(false);
  
  // Estado para confirmación de eliminación
  const [confirmacionEliminar, setConfirmacionEliminar] = useState(null);

  // Función para cargar usuarios desde el backend
  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      // Agregar timestamp para evitar caché
      const timestamp = new Date().getTime();
      const response = await axios.get(
        API_CONFIG.BASE_URL + API_CONFIG.USUARIOS.LIST + `?_t=${timestamp}`
      );
      
      if (response.data && response.data.success) {
        // Mapear datos del backend al formato del frontend
        const usuariosMapeados = response.data.data.map(usuario => ({
          id: usuario.id_usuario,
          nombre: `${usuario.nombre} ${usuario.apellido || ''}`.trim(),
          apellido: usuario.apellido || '',
          username: usuario.correo?.split('@')[0] || '', // Username derivado del email
          email: usuario.correo,
          rol: usuario.rol,
          activo: usuario.activo === 1 || usuario.activo === undefined
        }));
        
        setListaUsuarios(usuariosMapeados);
        console.log('✅ Usuarios cargados desde la base de datos:', usuariosMapeados.length);
      } else {
        console.error('❌ Respuesta del servidor sin éxito:', response.data);
        setListaUsuarios([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      showError('Error al cargar usuarios: ' + (error.response?.data?.error || error.message));
      setListaUsuarios([]);
    } finally {
      setCargando(false);
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  /**
   * Función para manejar cambios en el formulario
   * Actualiza el estado con los valores ingresados
   */
  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  /**
   * Función para abrir el formulario de nuevo usuario
   * Resetea el formulario y lo muestra
   */
  const abrirFormularioNuevo = () => {
    setFormData({
      nombre: '',
      apellido: '',
      correo: '',
      password: '',
      rol: ''
    });
    setUsuarioEditando(null);
    setMostrarFormulario(true);
    setMostrarPassword(false);
  };

  /**
   * Función para abrir el formulario de edición
   * Carga los datos del usuario seleccionado
   */
  const abrirFormularioEdicion = async (usuario) => {
    try {
      // Obtener datos completos del usuario desde el backend
      const response = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.USUARIOS.GET + '/' + usuario.id);
      
      if (response.data && response.data.success) {
        const usuarioCompleto = response.data.data;
        setFormData({
          nombre: usuarioCompleto.nombre || '',
          apellido: usuarioCompleto.apellido || '',
          correo: usuarioCompleto.correo || '',
          password: '', // No mostrar la contraseña por seguridad
          rol: usuarioCompleto.rol || ''
        });
        setUsuarioEditando(usuario);
        setMostrarFormulario(true);
        setMostrarPassword(false);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      showError('Error al cargar los datos del usuario');
    }
  };

  /**
   * Función para cerrar el formulario
   * Limpia el estado y oculta el formulario
   */
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setUsuarioEditando(null);
    setFormData({
      nombre: '',
      apellido: '',
      correo: '',
      password: '',
      rol: ''
    });
    setMostrarPassword(false);
  };

  /**
   * Función para validar el formulario
   * Verifica que todos los campos requeridos estén completos
   */
  const validarFormulario = () => {
    if (!formData.nombre || !formData.rol || !formData.correo) {
      showError('Por favor, completa todos los campos obligatorios');
      return false;
    }

    // Si es un usuario nuevo, requiere contraseña
    if (!usuarioEditando && !formData.password) {
      showError('La contraseña es obligatoria para usuarios nuevos');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      showError('Por favor, ingresa un email válido');
      return false;
    }

    return true;
  };

  /**
   * Función para manejar el envío del formulario
   * Agrega un nuevo usuario o actualiza uno existente
   */
  const manejarEnvioFormulario = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      // Preparar datos para el backend
      const datosBackend = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido?.trim() || '',
        correo: formData.correo.trim(),
        rol: formData.rol
      };

      // Solo incluir contraseña si se está creando nuevo o si se cambió
      // IMPORTANTE: NO hacer trim() a la contraseña - el usuario podría querer espacios
      if (!usuarioEditando) {
        // Usuario nuevo - siempre necesita contraseña
        if (!formData.password || formData.password.trim() === '') {
          showError('La contraseña es obligatoria para crear un nuevo usuario');
          return;
        }
        datosBackend.clave = formData.password; // Sin trim para preservar espacios intencionales
        console.log('🔑 Contraseña a enviar (usuario nuevo):', formData.password ? `"${formData.password}" (longitud: ${formData.password.length})` : 'NO HAY CONTRASEÑA');
      } else if (formData.password && formData.password.trim() !== '') {
        // Usuario existente - solo actualizar si se proporciona nueva contraseña
        datosBackend.clave = formData.password; // Sin trim
        console.log('🔑 Nueva contraseña a enviar (edición):', `"${formData.password}" (longitud: ${formData.password.length})`);
      }

      console.log('📦 Datos completos a enviar al backend:', { ...datosBackend, clave: datosBackend.clave ? '***' + datosBackend.clave.length + ' caracteres***' : 'NO HAY' });

      if (usuarioEditando) {
        // Actualizar usuario existente
        const response = await axios.put(
          API_CONFIG.BASE_URL + API_CONFIG.USUARIOS.UPDATE + '/' + usuarioEditando.id,
          datosBackend
        );
        
        if (response.data && response.data.success) {
          showSuccess('✅ Usuario actualizado correctamente');
          cerrarFormulario();
          // Recargar usuarios después de cerrar el modal
          setTimeout(async () => {
            await cargarUsuarios();
          }, 300);
        } else {
          showError(response.data?.error || 'Error al actualizar usuario');
        }
      } else {
        // Crear nuevo usuario
        console.log('📤 Enviando datos al backend:', datosBackend);
        console.log('📤 URL:', API_CONFIG.BASE_URL + API_CONFIG.USUARIOS.CREATE);
        
        const response = await axios.post(
          API_CONFIG.BASE_URL + API_CONFIG.USUARIOS.CREATE,
          datosBackend
        );
        
        console.log('📥 Respuesta del backend:', response.data);
        
        if (response.data && response.data.success) {
          showSuccess('✅ Usuario creado correctamente');
          cerrarFormulario();
          // Recargar usuarios después de cerrar el modal
          setTimeout(async () => {
            await cargarUsuarios();
          }, 300);
        } else {
          showError(response.data?.error || 'Error al crear usuario');
        }
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      showError('Error al guardar usuario: ' + errorMsg);
    }
  };

  /**
   * Función para solicitar eliminación (mostrar modal)
   */
  const solicitarEliminacion = (usuarioId) => {
    const usuario = listaUsuarios.find(u => u.id === usuarioId);
    if (usuario) {
      setConfirmacionEliminar({
        id: usuarioId,
        nombre: usuario.nombre
      });
    }
  };

  /**
   * Función para cancelar eliminación
   */
  const cancelarEliminacion = () => {
    setConfirmacionEliminar(null);
  };

  /**
   * Función para confirmar eliminación
   */
  const confirmarEliminacion = async () => {
    if (!confirmacionEliminar) return;
    
    try {
      const response = await axios.delete(
        API_CONFIG.BASE_URL + API_CONFIG.USUARIOS.DELETE + '/' + confirmacionEliminar.id
      );
      
      if (response.data && response.data.success) {
        showSuccess(`✅ Usuario "${confirmacionEliminar.nombre}" desactivado correctamente`);
        setConfirmacionEliminar(null);
        // Recargar usuarios después de cerrar el modal de confirmación
        setTimeout(async () => {
          await cargarUsuarios();
        }, 300);
      } else {
        showError(response.data?.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      showError('Error al eliminar usuario: ' + errorMsg);
    }
  };

  /**
   * Función para alternar la visibilidad de la contraseña
   */
  const togglePasswordVisibility = () => {
    setMostrarPassword(!mostrarPassword);
  };

  /**
   * Función para obtener estadísticas de usuarios (solo activos)
   */
  const obtenerEstadisticas = () => {
    // Filtrar solo usuarios activos para las estadísticas
    const usuariosActivos = listaUsuarios.filter(u => u.activo !== false);
    const total = usuariosActivos.length;
    const admins = usuariosActivos.filter(u => u.rol === 'admin').length;
    const vendedores = usuariosActivos.filter(u => u.rol === 'vendedor').length;

    return { total, admins, vendedores };
  };

  const estadisticas = obtenerEstadisticas();

  /**
   * Función para obtener el color del badge según el rol
   */
  const obtenerColorRol = (rol) => {
    switch (rol) {
      case 'admin':
        return 'admin';
      case 'vendedor':
        return 'vendedor';
      default:
        return 'default';
    }
  };

  return (
    <div className="gestion-usuarios-container">
      <NotificationContainer 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />
      
      {/* Header de la página */}
      <div className="page-header">
        <h1 className="page-title">👥 Gestión de Usuarios</h1>
        <p className="page-subtitle">Administra los usuarios y permisos del sistema</p>
      </div>

      {/* Estadísticas de usuarios */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Usuarios</h3>
            <p className="stat-value">{estadisticas.total}</p>
          </div>
        </div>
        
        <div className="stat-card admins">
          <div className="stat-icon">👨‍💼</div>
          <div className="stat-content">
            <h3>Administradores</h3>
            <p className="stat-value">{estadisticas.admins}</p>
          </div>
        </div>
        
        <div className="stat-card vendedores">
          <div className="stat-icon">👨‍💻</div>
          <div className="stat-content">
            <h3>Vendedores</h3>
            <p className="stat-value">{estadisticas.vendedores}</p>
          </div>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="actions-bar">
        <button 
          className="btn btn-primary"
          onClick={abrirFormularioNuevo}
          disabled={cargando}
        >
          ➕ Nuevo Usuario
        </button>
        <div className="stats-info">
          {cargando ? (
            <span>Cargando usuarios...</span>
          ) : (
            <span>Total usuarios: <strong>{listaUsuarios.length}</strong></span>
          )}
        </div>
      </div>

      {/* Tabla de usuarios */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Cargando usuarios desde la base de datos...</p>
        </div>
      ) : (
      <div className="table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaUsuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td className="id-cell">{usuario.id}</td>
                <td className="username-cell">
                  <strong>{usuario.username}</strong>
                </td>
                <td className="nombre-cell">{usuario.nombre}</td>
                <td className="email-cell">{usuario.email}</td>
                <td className="rol-cell">
                  <span className={`rol-badge ${obtenerColorRol(usuario.rol)}`}>
                    {usuario.rol === 'admin' ? '👨‍💼 Admin' : '👨‍💻 Vendedor'}
                  </span>
                </td>
                <td className="estado-cell">
                  <span className="estado-badge activo">✅ Activo</span>
                </td>
                <td className="acciones-cell">
                  <button
                    className="btn-accion editar"
                    onClick={() => abrirFormularioEdicion(usuario)}
                    title="Editar usuario"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-accion eliminar"
                    onClick={() => solicitarEliminacion(usuario.id)}
                    title="Eliminar usuario"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
              </tbody>
        </table>
      </div>
      )}

      {/* Modal del formulario */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {usuarioEditando ? '✏️ Editar Usuario' : '👤 Nuevo Usuario'}
            </h3>
            
            <form onSubmit={manejarEnvioFormulario} className="usuario-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="Juan"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="apellido">Apellido</label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="correo">Email *</label>
                  <input
                    type="email"
                    id="correo"
                    name="correo"
                    value={formData.correo}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="usuario@cafeteria.com"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="rol">Rol *</label>
                  <select
                    id="rol"
                    name="rol"
                    value={formData.rol}
                    onChange={manejarCambioInput}
                    className="form-control"
                    required
                  >
                    <option value="">Selecciona un rol</option>
                    <option value="admin">👨‍💼 Administrador</option>
                    <option value="vendedor">👨‍💻 Vendedor</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Contraseña {usuarioEditando ? '(dejar vacío para mantener la actual)' : '*'}
                </label>
                <div className="password-input-container">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder={usuarioEditando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                    required={!usuarioEditando}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle-btn"
                  >
                    {mostrarPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarFormulario}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {usuarioEditando ? 'Actualizar' : 'Crear'} Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación de eliminación elegante */}
      {confirmacionEliminar && (
        <div className="confirmacion-eliminar-overlay">
          <div className="confirmacion-eliminar-modal">
            <div className="confirmacion-header">
              <span className="confirmacion-icon">⚠️</span>
              <h4>Confirmar Eliminación</h4>
            </div>
            <div className="confirmacion-content">
              <p>¿Estás seguro de que quieres eliminar al usuario <strong>"{confirmacionEliminar.nombre}"</strong>?</p>
              <div className="confirmacion-warning">
                <p>⚠️ Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="confirmacion-buttons">
              <button 
                className="btn-cancelar"
                onClick={cancelarEliminacion}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={confirmarEliminacion}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;
