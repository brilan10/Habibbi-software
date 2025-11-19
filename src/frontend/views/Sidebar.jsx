import React, { useState } from 'react';
import '../styles/Sidebar.css';
import ConfirmModal from '../components/ConfirmModal';

/**
 * Componente Sidebar - Menú lateral dinámico según rol de usuario
 * Muestra diferentes opciones de navegación dependiendo del rol del usuario
 */
const Sidebar = ({ usuario, vistaActual, onCambiarVista, onCerrarSesion }) => {
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  
  /**
   * Definición de menús según el rol del usuario
   * Cada rol tiene acceso a diferentes funcionalidades
   */
  const menuItems = {
    // Menú para administrador - acceso completo al sistema
    admin: [
      { id: 'dashboard', nombre: 'Dashboard', icono: '📊', descripcion: 'Panel principal' },
      { id: 'productos', nombre: 'Productos', icono: '☕', descripcion: 'Gestión de productos' },
      { id: 'recetas', nombre: 'Recetas', icono: '📝', descripcion: 'Recetas de productos' },
      { id: 'insumos', nombre: 'Insumos', icono: '📦', descripcion: 'Control de inventario' },
      { id: 'usuarios', nombre: 'Usuarios', icono: '👥', descripcion: 'Gestión de usuarios' },
      { id: 'reportes', nombre: 'Reportes', icono: '📈', descripcion: 'Reportes y estadísticas' }
    ],
    // Menú para vendedor - acceso limitado a funciones de venta
    vendedor: [
      { id: 'dashboard', nombre: 'Dashboard', icono: '📊', descripcion: 'Panel de ventas' },
      { id: 'punto-venta', nombre: 'Punto de Venta', icono: '🛒', descripcion: 'Sistema de ventas' },
      { id: 'control-caja', nombre: 'Control de Caja', icono: '💰', descripcion: 'Gestión de efectivo' },
      { id: 'clientes', nombre: 'Clientes', icono: '👤', descripcion: 'Gestión de clientes' },
      { id: 'recetas', nombre: 'Recetas', icono: '📝', descripcion: 'Ver recetas de productos' }
    ]
  };

  /**
   * Obtiene los elementos del menú según el rol del usuario
   * Si el rol no existe, devuelve un array vacío
   */
  const obtenerMenuItems = () => {
    return menuItems[usuario.rol] || [];
  };

  /**
   * Maneja el clic en un elemento del menú
   * Cambia la vista actual y cierra el menú en móviles
   */
  const manejarClicItem = (itemId) => {
    onCambiarVista(itemId); // Llama a la función padre para cambiar la vista
    
    // En dispositivos móviles, cierra el menú después de seleccionar
    if (window.innerWidth <= 768) {
      // Aquí podrías agregar lógica para cerrar el menú en móvil
    }
  };

  /**
   * Maneja el cierre de sesión
   * Muestra el modal de confirmación antes de cerrar sesión
   */
  const manejarCerrarSesion = () => {
    setMostrarModalConfirmacion(true);
  };

  /**
   * Confirma el cierre de sesión
   */
  const confirmarCerrarSesion = () => {
    setMostrarModalConfirmacion(false);
    onCerrarSesion(); // Llama a la función padre para cerrar sesión
  };

  /**
   * Cancela el cierre de sesión
   */
  const cancelarCerrarSesion = () => {
    setMostrarModalConfirmacion(false);
  };

  return (
    <aside className="sidebar">
      {/* Header del sidebar con información del usuario */}
      <div className="sidebar-header">
        <div className="user-info">
          <div className="user-avatar">
            {usuario.rol === 'admin' ? '👨‍💼' : '👨‍💻'}
          </div>
          <div className="user-details">
            <h3 className="user-name">{usuario.nombre}</h3>
            <p className="user-role">
              {usuario.rol === 'admin' ? 'Administrador' : 'Vendedor'}
            </p>
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {/* Renderiza cada elemento del menú según el rol */}
          {obtenerMenuItems().map((item) => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-link ${vistaActual === item.id ? 'active' : ''}`}
                onClick={() => manejarClicItem(item.id)}
                title={item.descripcion} // Tooltip con descripción
              >
                <span className="nav-icon">{item.icono}</span>
                <span className="nav-text">{item.nombre}</span>
                {/* Indicador visual del elemento activo */}
                {vistaActual === item.id && (
                  <span className="nav-indicator">▶</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer del sidebar con botón de cerrar sesión */}
      <div className="sidebar-footer">
        <button
          className="logout-btn"
          onClick={manejarCerrarSesion}
          title="Cerrar sesión"
        >
          <span className="logout-icon">🚪</span>
          <span className="logout-text">Cerrar Sesión</span>
        </button>
      </div>

      {/* Modal de confirmación para cerrar sesión */}
      <ConfirmModal
        isOpen={mostrarModalConfirmacion}
        title="Cerrar Sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        confirmText="Sí, Cerrar Sesión"
        cancelText="Cancelar"
        icon="🚪"
        onConfirm={confirmarCerrarSesion}
        onCancel={cancelarCerrarSesion}
      />
    </aside>
  );
};

export default Sidebar;
