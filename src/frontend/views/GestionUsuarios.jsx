import React, { useState } from 'react';
import { usuarios } from '../data/mockData';
import '../styles/GestionUsuarios.css';

/**
 * Componente GestionUsuarios - Administración de usuarios del sistema
 * Permite crear, editar, eliminar y gestionar usuarios con diferentes roles
 */
const GestionUsuarios = () => {
  // Estado para la lista de usuarios
  const [listaUsuarios, setListaUsuarios] = useState(usuarios);
  
  // Estado para el formulario de nuevo usuario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estado para el usuario que se está editando
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rol: '',
    nombre: '',
    email: ''
  });

  // Estado para mostrar/ocultar contraseña
  const [mostrarPassword, setMostrarPassword] = useState(false);

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
      username: '',
      password: '',
      rol: '',
      nombre: '',
      email: ''
    });
    setUsuarioEditando(null);
    setMostrarFormulario(true);
    setMostrarPassword(false);
  };

  /**
   * Función para abrir el formulario de edición
   * Carga los datos del usuario seleccionado
   */
  const abrirFormularioEdicion = (usuario) => {
    setFormData({
      username: usuario.username,
      password: '', // No mostrar la contraseña por seguridad
      rol: usuario.rol,
      nombre: usuario.nombre,
      email: usuario.email
    });
    setUsuarioEditando(usuario);
    setMostrarFormulario(true);
    setMostrarPassword(false);
  };

  /**
   * Función para cerrar el formulario
   * Limpia el estado y oculta el formulario
   */
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setUsuarioEditando(null);
    setFormData({
      username: '',
      password: '',
      rol: '',
      nombre: '',
      email: ''
    });
    setMostrarPassword(false);
  };

  /**
   * Función para validar el formulario
   * Verifica que todos los campos requeridos estén completos
   */
  const validarFormulario = () => {
    if (!formData.username || !formData.rol || !formData.nombre || !formData.email) {
      alert('Por favor, completa todos los campos obligatorios');
      return false;
    }

    // Si es un usuario nuevo, requiere contraseña
    if (!usuarioEditando && !formData.password) {
      alert('La contraseña es obligatoria para usuarios nuevos');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Por favor, ingresa un email válido');
      return false;
    }

    // Validar que el username no esté duplicado
    const usernameExistente = listaUsuarios.find(u => 
      u.username === formData.username && u.id !== usuarioEditando?.id
    );
    if (usernameExistente) {
      alert('El nombre de usuario ya existe');
      return false;
    }

    return true;
  };

  /**
   * Función para manejar el envío del formulario
   * Agrega un nuevo usuario o actualiza uno existente
   */
  const manejarEnvioFormulario = (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    const nuevoUsuario = {
      id: usuarioEditando ? usuarioEditando.id : Date.now(),
      username: formData.username,
      password: formData.password || usuarioEditando?.password, // Mantiene la contraseña anterior si no se cambia
      rol: formData.rol,
      nombre: formData.nombre,
      email: formData.email
    };

    if (usuarioEditando) {
      // Actualiza usuario existente
      setListaUsuarios(listaUsuarios.map(u => 
        u.id === usuarioEditando.id ? nuevoUsuario : u
      ));
      alert('Usuario actualizado correctamente');
    } else {
      // Agrega nuevo usuario
      setListaUsuarios([...listaUsuarios, nuevoUsuario]);
      alert('Usuario creado correctamente');
    }

    cerrarFormulario();
  };

  /**
   * Función para eliminar un usuario
   * Pide confirmación antes de eliminar
   */
  const eliminarUsuario = (usuarioId) => {
    const usuario = listaUsuarios.find(u => u.id === usuarioId);
    
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${usuario.nombre}"?`)) {
      setListaUsuarios(listaUsuarios.filter(u => u.id !== usuarioId));
      alert('Usuario eliminado correctamente');
    }
  };

  /**
   * Función para alternar la visibilidad de la contraseña
   */
  const togglePasswordVisibility = () => {
    setMostrarPassword(!mostrarPassword);
  };

  /**
   * Función para obtener estadísticas de usuarios
   */
  const obtenerEstadisticas = () => {
    const total = listaUsuarios.length;
    const admins = listaUsuarios.filter(u => u.rol === 'admin').length;
    const vendedores = listaUsuarios.filter(u => u.rol === 'vendedor').length;

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
        >
          ➕ Nuevo Usuario
        </button>
        <div className="stats-info">
          <span>Total usuarios: <strong>{listaUsuarios.length}</strong></span>
        </div>
      </div>

      {/* Tabla de usuarios */}
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
                    onClick={() => eliminarUsuario(usuario.id)}
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
                  <label htmlFor="username">Nombre de Usuario *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="usuario123"
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre Completo *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="usuario@cafeteria.com"
                    required
                  />
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
    </div>
  );
};

export default GestionUsuarios;
