/**
 * COMPONENTE PRINCIPAL DE LA APLICACIÓN - Habibbi Café
 * 
 * Este es el componente raíz que controla toda la aplicación
 * Maneja la autenticación, navegación y renderizado de vistas
 * 
 * FUNCIONALIDADES:
 * - Controla el estado de autenticación del usuario
 * - Maneja la navegación entre diferentes vistas
 * - Renderiza el componente apropiado según el estado
 * - Gestiona el login y logout
 */

// Importar React y el hook useState
// useState permite crear y manejar estado en componentes funcionales
import React, { useState } from 'react';

// Importar todos los componentes de vista que se pueden mostrar
// Cada componente representa una sección diferente de la aplicación
import Login from './views/Login';                    // Vista de inicio de sesión
import Sidebar from './views/Sidebar';                 // Barra lateral de navegación
import Dashboard from './views/Dashboard';             // Dashboard para administradores
import DashboardVendedor from './views/DashboardVendedor';  // Dashboard para vendedores
import PuntoVenta from './views/PuntoVenta';           // Sistema de punto de venta
import GestionProductos from './views/GestionProductos';   // Gestión de productos
import GestionRecetas from './views/GestionRecetas';   // Gestión de recetas
import GestionInsumos from './views/GestionInsumos';   // Gestión de insumos
import GestionUsuarios from './views/GestionUsuarios'; // Gestión de usuarios
import GestionClientes from './views/GestionClientes'; // Gestión de clientes
import Reportes from './views/Reportes';              // Reportes y estadísticas
import ControlCaja from './views/ControlCaja';        // Control de caja

// Importar estilos CSS globales
// Estos archivos contienen los estilos que se aplican a toda la aplicación
import './styles/App.css';      // Estilos específicos del componente App
import './styles/index.css';    // Estilos globales de la aplicación

/**
 * Componente funcional App
 * 
 * Es un componente funcional (no una clase) que usa hooks de React
 * Se ejecuta cada vez que React necesita renderizar la aplicación
 */
const App = () => {
  // Log para debugging - muestra cuando el componente se renderiza
  console.log('🔄 Componente App renderizado');
  
  // =====================================================
  // ESTADOS DE LA APLICACIÓN
  // =====================================================
  
  // Estado para el usuario autenticado
  // useState(null) crea un estado inicializado en null (sin usuario)
  // usuario: contiene los datos del usuario cuando está autenticado (null si no hay sesión)
  // setUsuario: función para actualizar el estado del usuario
  // Cuando el usuario hace login, se guarda aquí; cuando hace logout, se pone en null
  const [usuario, setUsuario] = useState(null);
  
  // Estado para la vista actual que se está mostrando
  // useState('dashboard') inicializa la vista en 'dashboard'
  // vistaActual: string que indica qué vista mostrar ('dashboard', 'productos', etc.)
  // setVistaActual: función para cambiar la vista actual
  const [vistaActual, setVistaActual] = useState('dashboard');

  // =====================================================
  // FUNCIONES DE MANEJO DE EVENTOS
  // =====================================================
  
  /**
   * Función para manejar el login del usuario
   * 
   * Se ejecuta cuando el usuario inicia sesión exitosamente
   * Guarda los datos del usuario y redirige según su rol
   * 
   * @param {Object} usuarioData - Objeto con los datos del usuario autenticado
   *                              Ejemplo: { id: 1, nombre: 'Juan', rol: 'admin', ... }
   */
  const manejarLogin = (usuarioData) => {
    // Guardar usuario en localStorage y sessionStorage para persistencia
    // localStorage: persiste incluso después de cerrar el navegador
    // sessionStorage: persiste solo durante la sesión del navegador
    // Ambos se usan para que el usuario no tenga que hacer login cada vez
    try {
      // JSON.stringify convierte el objeto JavaScript a string JSON
      // Necesario porque localStorage solo guarda strings
      localStorage.setItem('usuario', JSON.stringify(usuarioData));
      sessionStorage.setItem('usuario', JSON.stringify(usuarioData));
      console.log('✅ Usuario guardado en localStorage:', usuarioData);
    } catch (error) {
      // Si hay error al guardar (ej: navegador en modo privado), solo lo registramos
      // No bloqueamos el login porque el usuario ya está autenticado
      console.error('⚠️ Error al guardar usuario en localStorage:', error);
    }
    
    // Actualizar el estado del usuario en React
    // Esto hace que React re-renderice el componente con el nuevo usuario
    setUsuario(usuarioData);
    
    // Redirigir según el rol del usuario
    // Los administradores van al dashboard general
    // Los vendedores van directamente al punto de venta
    if (usuarioData.rol === 'admin') {
      setVistaActual('dashboard');        // Dashboard con estadísticas completas
    } else if (usuarioData.rol === 'vendedor') {
      setVistaActual('punto-venta');      // Punto de venta para realizar ventas
    }
  };

  /**
   * Función para manejar el cierre de sesión
   * 
   * Se ejecuta cuando el usuario hace clic en "Cerrar Sesión"
   * Limpia todos los datos del usuario y regresa a la pantalla de login
   */
  const manejarCerrarSesion = () => {
    // Poner el usuario en null elimina la sesión
    // Esto hace que React re-renderice y muestre el componente Login
    setUsuario(null);
    
    // Resetear la vista al dashboard (aunque no se verá porque se mostrará el login)
    // Esto asegura que cuando vuelva a hacer login, empiece en el dashboard
    setVistaActual('dashboard');
    
    // Nota: También se podría limpiar localStorage y sessionStorage aquí
    // pero no es estrictamente necesario porque se verifica al iniciar
  };

  /**
   * Función para cambiar la vista actual
   * 
   * Permite navegar entre diferentes secciones de la aplicación
   * Se llama desde el Sidebar cuando el usuario hace clic en un menú
   * 
   * @param {string} nuevaVista - Nombre de la vista a mostrar
   *                            Ejemplos: 'dashboard', 'productos', 'ventas', etc.
   */
  const cambiarVista = (nuevaVista) => {
    // Actualizar el estado de la vista actual
    // Esto hace que React re-renderice y muestre el componente correspondiente
    setVistaActual(nuevaVista);
  };

  // =====================================================
  // EFECTOS (HOOKS DE REACT)
  // =====================================================
  
  /**
   * useEffect: Escuchar eventos personalizados para cambiar de vista
   * 
   * Este hook permite que otros componentes cambien la vista
   * emitiendo un evento personalizado llamado 'cambiarVista'
   * 
   * FLUJO:
   * 1. Otro componente emite: window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'productos' } }))
   * 2. Este listener captura el evento
   * 3. Llama a cambiarVista() con la nueva vista
   * 
   * El array vacío [] significa que solo se ejecuta una vez al montar el componente
   */
  React.useEffect(() => {
    // Función que maneja el evento personalizado 'cambiarVista'
    const manejarCambioVista = (event) => {
      // event.detail contiene los datos pasados en el evento
      // El operador ?. (optional chaining) evita errores si detail o vista no existen
      const nuevaVista = event.detail?.vista;
      
      // Si hay una nueva vista en el evento, cambiar a esa vista
      if (nuevaVista) {
        console.log('🔄 Cambiando vista desde evento:', nuevaVista);
        cambiarVista(nuevaVista);
      }
    };

    // Registrar el listener en el objeto window
    // 'cambiarVista' es el nombre del evento personalizado
    window.addEventListener('cambiarVista', manejarCambioVista);
    
    // Función de limpieza que se ejecuta cuando el componente se desmonta
    // Es importante remover el listener para evitar memory leaks
    return () => {
      window.removeEventListener('cambiarVista', manejarCambioVista);
    };
  }, []); // Array vacío = solo se ejecuta al montar y desmontar

  // =====================================================
  // FUNCIÓN DE RENDERIZADO DE VISTAS
  // =====================================================
  
  /**
   * Función para renderizar la vista actual
   * 
   * Retorna el componente correspondiente según el valor de vistaActual
   * Es como un router simple que decide qué componente mostrar
   * 
   * @returns {JSX.Element} - Componente React correspondiente a la vista actual
   */
  const renderizarVista = () => {
    // switch es como múltiples if-else, pero más eficiente y legible
    switch (vistaActual) {
      case 'dashboard':
        // Mostrar dashboard según el rol del usuario
        // Operador ternario: condición ? valor_si_verdadero : valor_si_falso
        // Si es admin muestra Dashboard completo, si es vendedor muestra DashboardVendedor
        return usuario.rol === 'admin' ? <Dashboard /> : <DashboardVendedor />;
        
      case 'punto-venta':
        // Vista del sistema de punto de venta para realizar ventas
        return <PuntoVenta />;
        
      case 'productos':
        // Vista de gestión de productos (crear, editar, eliminar productos)
        return <GestionProductos />;
        
      case 'recetas':
        // Vista de gestión de recetas
        // Se pasa el usuario como prop porque algunas acciones requieren verificar permisos
        return <GestionRecetas usuario={usuario} />;
        
      case 'insumos':
        // Vista de gestión de insumos (materias primas)
        return <GestionInsumos />;
        
      case 'usuarios':
        // Vista de gestión de usuarios del sistema
        return <GestionUsuarios />;
        
      case 'reportes':
        // Vista de reportes y estadísticas
        return <Reportes />;
        
      case 'clientes':
        // Vista de gestión de clientes
        return <GestionClientes />;
        
      case 'control-caja':
        // Vista de control de caja (apertura, cierre, movimientos)
        return <ControlCaja />;
        
      default:
        // Si la vista no coincide con ninguna, mostrar dashboard por defecto
        // Esto previene errores si hay un valor inesperado en vistaActual
        return <Dashboard />;
    }
  };

  // =====================================================
  // RENDERIZADO CONDICIONAL
  // =====================================================
  
  // Si no hay usuario autenticado, mostrar la pantalla de login
  // El operador ! convierte el valor a booleano y lo niega
  // Si usuario es null o undefined, !usuario es true
  if (!usuario) {
    console.log('👤 No hay usuario, mostrando Login');
    // Retornar el componente Login y pasarle la función manejarLogin como prop
    // Cuando el usuario hace login, Login llamará a onLogin con los datos del usuario
    return <Login onLogin={manejarLogin} />;
  }

  // Si hay usuario autenticado, mostrar la aplicación principal
  // Esta es la estructura principal de la aplicación cuando el usuario está logueado
  return (
    // div con clase "app" que contiene toda la aplicación
    <div className="app">
      {/* Sidebar con navegación lateral */}
      {/* Se pasa el usuario para mostrar información del usuario logueado */}
      {/* Se pasa vistaActual para resaltar la vista activa en el menú */}
      {/* onCambiarVista permite que el Sidebar cambie la vista cuando se hace clic en un menú */}
      {/* onCerrarSesion permite que el Sidebar cierre la sesión cuando se hace clic en logout */}
      <Sidebar 
        usuario={usuario}
        vistaActual={vistaActual}
        onCambiarVista={cambiarVista}
        onCerrarSesion={manejarCerrarSesion}
      />
      
      {/* Contenido principal de la aplicación */}
      {/* main es un elemento semántico HTML5 para el contenido principal */}
      <main className="main-content">
        {/* Llamar a renderizarVista() para mostrar el componente correspondiente */}
        {/* Los corchetes {} permiten ejecutar código JavaScript dentro de JSX */}
        {renderizarVista()}
      </main>
    </div>
  );
};

// Exportar el componente App como exportación por defecto
// Esto permite importarlo en otros archivos como: import App from './App'
export default App;
