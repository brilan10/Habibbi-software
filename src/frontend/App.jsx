import React, { useState } from 'react';
import Login from './views/Login';
import Sidebar from './views/Sidebar';
import Dashboard from './views/Dashboard';
import DashboardVendedor from './views/DashboardVendedor';
import PuntoVenta from './views/PuntoVenta';
import GestionProductos from './views/GestionProductos';
import GestionRecetas from './views/GestionRecetas';
import GestionInsumos from './views/GestionInsumos';
import GestionUsuarios from './views/GestionUsuarios';
import GestionClientes from './views/GestionClientes';
import Reportes from './views/Reportes';
import ControlCaja from './views/ControlCaja';
import './styles/App.css';
import './styles/index.css';

/**
 * Componente principal de la aplicación
 * Maneja la autenticación y navegación entre vistas
 */
const App = () => {
  console.log('🔄 Componente App renderizado');
  
  // Estado para el usuario autenticado
  const [usuario, setUsuario] = useState(null);
  
  // Estado para la vista actual
  const [vistaActual, setVistaActual] = useState('dashboard');

  /**
   * Función para manejar el login del usuario
   * Recibe los datos del usuario y lo autentica
   */
  const manejarLogin = (usuarioData) => {
    // Guardar usuario en localStorage y sessionStorage para persistencia
    try {
      localStorage.setItem('usuario', JSON.stringify(usuarioData));
      sessionStorage.setItem('usuario', JSON.stringify(usuarioData));
      console.log('✅ Usuario guardado en localStorage:', usuarioData);
    } catch (error) {
      console.error('⚠️ Error al guardar usuario en localStorage:', error);
    }
    
    setUsuario(usuarioData);
    
    // Redirige según el rol del usuario
    if (usuarioData.rol === 'admin') {
      setVistaActual('dashboard');
    } else if (usuarioData.rol === 'vendedor') {
      setVistaActual('punto-venta');
    }
  };

  /**
   * Función para manejar el cierre de sesión
   * Limpia los datos del usuario y regresa al login
   */
  const manejarCerrarSesion = () => {
    setUsuario(null);
    setVistaActual('dashboard');
  };

  /**
   * Función para cambiar la vista actual
   * Permite navegar entre diferentes secciones
   */
  const cambiarVista = (nuevaVista) => {
    setVistaActual(nuevaVista);
  };

  // Escuchar eventos personalizados para cambiar de vista desde otros componentes
  React.useEffect(() => {
    const manejarCambioVista = (event) => {
      const nuevaVista = event.detail?.vista;
      if (nuevaVista) {
        console.log('🔄 Cambiando vista desde evento:', nuevaVista);
        cambiarVista(nuevaVista);
      }
    };

    window.addEventListener('cambiarVista', manejarCambioVista);
    
    return () => {
      window.removeEventListener('cambiarVista', manejarCambioVista);
    };
  }, []);

  /**
   * Función para renderizar la vista actual
   * Retorna el componente correspondiente según la vista seleccionada
   */
  const renderizarVista = () => {
    switch (vistaActual) {
      case 'dashboard':
        // Mostrar dashboard según el rol del usuario
        return usuario.rol === 'admin' ? <Dashboard /> : <DashboardVendedor />;
      case 'punto-venta':
        return <PuntoVenta />;
      case 'productos':
        return <GestionProductos />;
      case 'recetas':
        return <GestionRecetas usuario={usuario} />;
      case 'insumos':
        return <GestionInsumos />;
      case 'usuarios':
        return <GestionUsuarios />;
      case 'reportes':
        return <Reportes />;
      case 'clientes':
        return <GestionClientes />;
      case 'control-caja':
        return <ControlCaja />;
      default:
        return <Dashboard />;
    }
  };

  // Si no hay usuario autenticado, muestra el login
  if (!usuario) {
    console.log('👤 No hay usuario, mostrando Login');
    return <Login onLogin={manejarLogin} />;
  }

  // Si hay usuario autenticado, muestra la aplicación principal
  return (
    <div className="app">
      {/* Sidebar con navegación */}
      <Sidebar 
        usuario={usuario}
        vistaActual={vistaActual}
        onCambiarVista={cambiarVista}
        onCerrarSesion={manejarCerrarSesion}
      />
      
      {/* Contenido principal */}
      <main className="main-content">
        {renderizarVista()}
      </main>
    </div>
  );
};

export default App;
