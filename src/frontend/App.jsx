// Línea 1-12: Comentario de bloque JSDoc que describe el archivo
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

// Línea 14-16: Comentario explicativo sobre la importación
// Importar React y el hook useState
// useState permite crear y manejar estado en componentes funcionales
// Línea 16: import es una declaración de importación de módulos ES6
// React es el objeto principal de la biblioteca React
// { useState } es una importación nombrada - extrae solo useState del módulo 'react'
// 'react' es el nombre del paquete npm instalado
// useState es un hook de React que permite crear y actualizar estado en componentes funcionales
import React, { useState } from 'react';

// Línea 18-19: Comentario explicativo sobre las importaciones de componentes
// Importar todos los componentes de vista que se pueden mostrar
// Cada componente representa una sección diferente de la aplicación
// Línea 20: import Login importa el componente Login como exportación por defecto
// from './views/Login' es la ruta relativa al archivo Login.jsx
// ./ significa el directorio actual (src/frontend)
// /views/Login busca el archivo en src/frontend/views/Login.jsx
// El comentario al final describe qué hace este componente
import Login from './views/Login';                    // Vista de inicio de sesión
// Línea 21: import Sidebar importa el componente Sidebar (barra lateral de navegación)
import Sidebar from './views/Sidebar';                 // Barra lateral de navegación
// Línea 22: import Dashboard importa el dashboard para administradores
import Dashboard from './views/Dashboard';             // Dashboard para administradores
// Línea 23: import DashboardVendedor importa el dashboard para vendedores
import DashboardVendedor from './views/DashboardVendedor';  // Dashboard para vendedores
// Línea 24: import PuntoVenta importa el sistema de punto de venta
import PuntoVenta from './views/PuntoVenta';           // Sistema de punto de venta
// Línea 25: import GestionProductos importa la vista de gestión de productos
import GestionProductos from './views/GestionProductos';   // Gestión de productos
// Línea 26: import GestionRecetas importa la vista de gestión de recetas
import GestionRecetas from './views/GestionRecetas';   // Gestión de recetas
// Línea 27: import GestionInsumos importa la vista de gestión de insumos
import GestionInsumos from './views/GestionInsumos';   // Gestión de insumos
// Línea 28: import GestionUsuarios importa la vista de gestión de usuarios
import GestionUsuarios from './views/GestionUsuarios'; // Gestión de usuarios
// Línea 29: import GestionClientes importa la vista de gestión de clientes
import GestionClientes from './views/GestionClientes'; // Gestión de clientes
// Línea 30: import GestionProveedores importa la vista de gestión de proveedores
import GestionProveedores from './views/GestionProveedores'; // Gestión de proveedores
// Línea 31: import Reportes importa la vista de reportes y estadísticas
import Reportes from './views/Reportes';              // Reportes y estadísticas
// Línea 32: import ControlCaja importa la vista de control de caja
import ControlCaja from './views/ControlCaja';        // Control de caja

// Línea 34-35: Comentario explicativo sobre las importaciones de estilos
// Importar estilos CSS globales
// Estos archivos contienen los estilos que se aplican a toda la aplicación
// Línea 36: import './styles/App.css' importa el archivo CSS específico del componente App
// Los archivos CSS se importan directamente en JavaScript/JSX
// Webpack procesará estos imports y los incluirá en el bundle final
import './styles/App.css';      // Estilos específicos del componente App
// Línea 37: import './styles/index.css' importa los estilos globales de la aplicación
// index.css contiene estilos que se aplican a toda la aplicación
import './styles/index.css';    // Estilos globales de la aplicación

// Línea 39-44: Comentario JSDoc que describe el componente
/**
 * Componente funcional App
 * 
 * Es un componente funcional (no una clase) que usa hooks de React
 * Se ejecuta cada vez que React necesita renderizar la aplicación
 */
// Línea 45: const App declara una constante llamada App
// = () => { es una arrow function (función flecha) que define el componente
// () significa que no recibe parámetros (props)
// => es el operador de función flecha
// { inicia el cuerpo de la función
// Este es un componente funcional de React (no una clase)
const App = () => {
  // Línea 46-47: console.log() imprime un mensaje en la consola del navegador
  // '🔄 Componente App renderizado' es el mensaje que se muestra
  // Esto ayuda a debugging: ver cuándo se renderiza el componente
  console.log('🔄 Componente App renderizado');
  
  // Línea 49-51: Comentario de separación visual
  // =====================================================
  // ESTADOS DE LA APLICACIÓN
  // =====================================================
  
  // Línea 53-58: Comentario explicativo sobre el estado del usuario
  // Estado para el usuario autenticado
  // useState(null) crea un estado inicializado en null (sin usuario)
  // usuario: contiene los datos del usuario cuando está autenticado (null si no hay sesión)
  // setUsuario: función para actualizar el estado del usuario
  // Cuando el usuario hace login, se guarda aquí; cuando hace logout, se pone en null
  // Línea 58: const [usuario, setUsuario] es destructuring de array
  // useState(null) es una llamada al hook useState con valor inicial null
  // useState retorna un array con dos elementos: [valor, función_actualizar]
  // [usuario, setUsuario] extrae el primer elemento a 'usuario' y el segundo a 'setUsuario'
  // usuario es la variable que contiene el valor actual del estado (inicialmente null)
  // setUsuario es la función que se usa para cambiar el valor de usuario
  // Cuando se llama setUsuario(nuevoValor), React actualiza usuario y re-renderiza el componente
  const [usuario, setUsuario] = useState(null);
  
  // Línea 60-64: Comentario explicativo sobre el estado de la vista
  // Estado para la vista actual que se está mostrando
  // useState('dashboard') inicializa la vista en 'dashboard'
  // vistaActual: string que indica qué vista mostrar ('dashboard', 'productos', etc.)
  // setVistaActual: función para cambiar la vista actual
  // Línea 64: Similar a la anterior, pero con valor inicial 'dashboard' (string)
  // vistaActual contiene el nombre de la vista actual ('dashboard', 'productos', etc.)
  // setVistaActual es la función para cambiar la vista
  const [vistaActual, setVistaActual] = useState('dashboard');

  // Línea 66-68: Comentario de separación visual
  // =====================================================
  // FUNCIONES DE MANEJO DE EVENTOS
  // =====================================================
  
  // Línea 70-78: Comentario JSDoc que describe la función manejarLogin
  /**
   * Función para manejar el login del usuario
   * 
   * Se ejecuta cuando el usuario inicia sesión exitosamente
   * Guarda los datos del usuario y redirige según su rol
   * 
   * @param {Object} usuarioData - Objeto con los datos del usuario autenticado
   *                              Ejemplo: { id: 1, nombre: 'Juan', rol: 'admin', ... }
   */
  // Línea 79: const manejarLogin declara una constante con una función
  // = (usuarioData) => { define una arrow function que recibe un parámetro usuarioData
  // usuarioData es el objeto con los datos del usuario autenticado
  // => { inicia el cuerpo de la función
  const manejarLogin = (usuarioData) => {
    // Línea 80-83: Comentario explicativo sobre localStorage y sessionStorage
    // Guardar usuario en localStorage y sessionStorage para persistencia
    // localStorage: persiste incluso después de cerrar el navegador
    // sessionStorage: persiste solo durante la sesión del navegador
    // Ambos se usan para que el usuario no tenga que hacer login cada vez
    // Línea 84: try inicia un bloque que captura errores
    // Si algo falla dentro del try, se ejecuta el catch
    try {
      // Línea 85-87: Comentario explicativo sobre JSON.stringify
      // JSON.stringify convierte el objeto JavaScript a string JSON
      // Necesario porque localStorage solo guarda strings
      // Línea 87: localStorage.setItem() guarda un valor en el almacenamiento local del navegador
      // 'usuario' es la clave (nombre) con la que se guarda
      // JSON.stringify(usuarioData) convierte el objeto usuarioData a string JSON
      // Ejemplo: {id: 1, nombre: 'Juan'} se convierte en '{"id":1,"nombre":"Juan"}'
      localStorage.setItem('usuario', JSON.stringify(usuarioData));
      // Línea 88: sessionStorage.setItem() guarda un valor en el almacenamiento de sesión
      // Similar a localStorage pero se borra al cerrar la pestaña del navegador
      sessionStorage.setItem('usuario', JSON.stringify(usuarioData));
      // Línea 89: console.log() imprime un mensaje de éxito en la consola
      // usuarioData se muestra en la consola para debugging
      console.log('✅ Usuario guardado en localStorage:', usuarioData);
    // Línea 90: catch captura cualquier error que ocurra en el try
    // (error) es el objeto de error capturado
    } catch (error) {
      // Línea 91-93: Comentario explicativo
      // Si hay error al guardar (ej: navegador en modo privado), solo lo registramos
      // No bloqueamos el login porque el usuario ya está autenticado
      // Línea 93: console.error() imprime un error en la consola
      // '⚠️ Error al guardar usuario en localStorage:' es el mensaje
      // error es el objeto de error que se muestra
      console.error('⚠️ Error al guardar usuario en localStorage:', error);
    }
    // Línea 94: Cierra el bloque try-catch
    
    // Línea 96-98: Comentario explicativo sobre setUsuario
    // Actualizar el estado del usuario en React
    // Esto hace que React re-renderice el componente con el nuevo usuario
    // Línea 98: setUsuario() es la función para actualizar el estado 'usuario'
    // usuarioData es el nuevo valor que se asigna a usuario
    // Cuando se llama setUsuario(), React actualiza usuario y re-renderiza el componente App
    // Esto hace que la aplicación muestre la interfaz principal en lugar del Login
    setUsuario(usuarioData);
    
    // Línea 100-102: Comentario explicativo sobre la redirección
    // Redirigir según el rol del usuario
    // Los administradores van al dashboard general
    // Los vendedores van directamente al punto de venta
    // Línea 103: if verifica si usuarioData.rol es igual a 'admin'
    // usuarioData.rol accede a la propiedad 'rol' del objeto usuarioData
    // === es comparación estricta (tipo y valor deben coincidir)
    // 'admin' es el string con el que se compara
    if (usuarioData.rol === 'admin') {
      // Línea 104: setVistaActual() actualiza el estado vistaActual a 'dashboard'
      // Esto hace que React muestre el componente Dashboard
      setVistaActual('dashboard');        // Dashboard con estadísticas completas
    // Línea 105: else if se ejecuta si la condición anterior es false
    // Verifica si usuarioData.rol es igual a 'vendedor'
    } else if (usuarioData.rol === 'vendedor') {
      // Línea 106: setVistaActual() actualiza el estado vistaActual a 'punto-venta'
      // Esto hace que React muestre el componente PuntoVenta
      setVistaActual('punto-venta');      // Punto de venta para realizar ventas
    }
    // Línea 107: Cierra el if-else if
  };
  // Línea 108: Cierra la función manejarLogin

  // Línea 110-115: Comentario JSDoc que describe la función manejarCerrarSesion
  /**
   * Función para manejar el cierre de sesión
   * 
   * Se ejecuta cuando el usuario hace clic en "Cerrar Sesión"
   * Limpia todos los datos del usuario y regresa a la pantalla de login
   */
  // Línea 116: const manejarCerrarSesion declara una constante con una arrow function
  // = () => { define una función que no recibe parámetros
  // => { inicia el cuerpo de la función
  const manejarCerrarSesion = () => {
    // Línea 117-119: Comentario explicativo sobre setUsuario(null)
    // Poner el usuario en null elimina la sesión
    // Esto hace que React re-renderice y muestre el componente Login
    // Línea 119: setUsuario(null) actualiza el estado usuario a null
    // null significa que no hay usuario autenticado
    // Cuando usuario es null, React re-renderiza App y muestra el componente Login
    setUsuario(null);
    
    // Línea 121-123: Comentario explicativo sobre resetear la vista
    // Resetear la vista al dashboard (aunque no se verá porque se mostrará el login)
    // Esto asegura que cuando vuelva a hacer login, empiece en el dashboard
    // Línea 123: setVistaActual('dashboard') resetea la vista al dashboard
    // Aunque no se verá porque se mostrará el Login, esto asegura que al hacer login de nuevo
    // empiece en el dashboard en lugar de la última vista que estaba viendo
    setVistaActual('dashboard');
    
    // Línea 125-127: Comentario explicativo (nota)
    // Nota: También se podría limpiar localStorage y sessionStorage aquí
    // pero no es estrictamente necesario porque se verifica al iniciar
    // No se limpian aquí porque se verificarán al iniciar la aplicación
  };
  // Línea 127: Cierra la función manejarCerrarSesion

  // Línea 129-137: Comentario JSDoc que describe la función cambiarVista
  /**
   * Función para cambiar la vista actual
   * 
   * Permite navegar entre diferentes secciones de la aplicación
   * Se llama desde el Sidebar cuando el usuario hace clic en un menú
   * 
   * @param {string} nuevaVista - Nombre de la vista a mostrar
   *                            Ejemplos: 'dashboard', 'productos', 'ventas', etc.
   */
  // Línea 138: const cambiarVista declara una constante con una arrow function
  // = (nuevaVista) => { define una función que recibe un parámetro nuevaVista
  // nuevaVista es un string con el nombre de la vista a mostrar
  const cambiarVista = (nuevaVista) => {
    // Línea 139-141: Comentario explicativo sobre setVistaActual
    // Actualizar el estado de la vista actual
    // Esto hace que React re-renderice y muestre el componente correspondiente
    // Línea 141: setVistaActual(nuevaVista) actualiza el estado vistaActual
    // nuevaVista es el nuevo valor (ej: 'productos', 'ventas', etc.)
    // Cuando se actualiza vistaActual, React re-renderiza App y muestra el componente correspondiente
    setVistaActual(nuevaVista);
  };
  // Línea 142: Cierra la función cambiarVista

  // Línea 144-146: Comentario de separación visual
  // =====================================================
  // EFECTOS (HOOKS DE REACT)
  // =====================================================
  
  // Línea 148-160: Comentario JSDoc que describe el useEffect
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
  // Línea 161: React.useEffect() es un hook de React que ejecuta efectos secundarios
  // () => { es una arrow function que contiene el código del efecto
  // useEffect se ejecuta después de que React renderiza el componente
  React.useEffect(() => {
    // Línea 162-163: Comentario explicativo sobre la función manejarCambioVista
    // Función que maneja el evento personalizado 'cambiarVista'
    // Línea 163: const manejarCambioVista declara una función local
    // = (event) => { define una arrow function que recibe el objeto event
    // event es el objeto del evento personalizado que se disparó
    const manejarCambioVista = (event) => {
      // Línea 164-166: Comentario explicativo sobre event.detail
      // event.detail contiene los datos pasados en el evento
      // El operador ?. (optional chaining) evita errores si detail o vista no existen
      // Línea 166: const nuevaVista declara una constante
      // event.detail accede a la propiedad 'detail' del objeto event
      // ?. es optional chaining: si detail es null/undefined, retorna undefined en lugar de error
      // .vista accede a la propiedad 'vista' dentro de detail
      // Si detail o vista no existen, nuevaVista será undefined
      const nuevaVista = event.detail?.vista;
      
      // Línea 168-172: Comentario y código para cambiar la vista
      // Si hay una nueva vista en el evento, cambiar a esa vista
      // Línea 169: if verifica si nuevaVista tiene un valor (no es undefined, null, false, 0, o '')
      // Si nuevaVista tiene un valor truthy, entra al bloque
      if (nuevaVista) {
        // Línea 170: console.log() imprime un mensaje en la consola
        // '🔄 Cambiando vista desde evento:' es el mensaje
        // nuevaVista es el valor que se muestra
        console.log('🔄 Cambiando vista desde evento:', nuevaVista);
        // Línea 171: cambiarVista(nuevaVista) llama a la función cambiarVista
        // nuevaVista es el parámetro que se pasa
        // Esto actualiza el estado vistaActual y React re-renderiza con el nuevo componente
        cambiarVista(nuevaVista);
      }
      // Línea 172: Cierra el if
    };
    // Línea 173: Cierra la función manejarCambioVista

    // Línea 175-177: Comentario explicativo sobre addEventListener
    // Registrar el listener en el objeto window
    // 'cambiarVista' es el nombre del evento personalizado
    // Línea 177: window.addEventListener() registra un listener de eventos en el objeto window
    // 'cambiarVista' es el nombre del evento personalizado que se escuchará
    // manejarCambioVista es la función que se ejecutará cuando se dispare el evento
    // Cuando otro componente emite el evento 'cambiarVista', esta función se ejecutará
    window.addEventListener('cambiarVista', manejarCambioVista);
    
    // Línea 179-183: Comentario y función de limpieza
    // Función de limpieza que se ejecuta cuando el componente se desmonta
    // Es importante remover el listener para evitar memory leaks
    // Línea 181: return () => { retorna una función de limpieza
    // Esta función se ejecuta cuando el componente App se desmonta (se elimina del DOM)
    // Es importante para evitar memory leaks (fugas de memoria)
    return () => {
      // Línea 182: window.removeEventListener() remueve el listener del evento
      // 'cambiarVista' es el nombre del evento
      // manejarCambioVista es la función que se removió (debe ser la misma que se agregó)
      // Esto previene que el listener siga activo después de que el componente se desmonte
      window.removeEventListener('cambiarVista', manejarCambioVista);
    };
    // Línea 183: Cierra la función de limpieza
  // Línea 184: }, []); cierra el useEffect
  // [] es el array de dependencias - array vacío significa que solo se ejecuta una vez
  // Se ejecuta al montar el componente (cuando se renderiza por primera vez)
  // Y la función de limpieza se ejecuta al desmontar el componente
  }, []); // Array vacío = solo se ejecuta al montar y desmontar

  // Línea 186-188: Comentario de separación visual
  // =====================================================
  // FUNCIÓN DE RENDERIZADO DE VISTAS
  // =====================================================
  
  // Línea 190-197: Comentario JSDoc que describe la función renderizarVista
  /**
   * Función para renderizar la vista actual
   * 
   * Retorna el componente correspondiente según el valor de vistaActual
   * Es como un router simple que decide qué componente mostrar
   * 
   * @returns {JSX.Element} - Componente React correspondiente a la vista actual
   */
  // Línea 198: const renderizarVista declara una constante con una arrow function
  // = () => { define una función que no recibe parámetros
  // Esta función retorna un componente React según el valor de vistaActual
  const renderizarVista = () => {
    // Línea 199-200: Comentario explicativo sobre switch
    // switch es como múltiples if-else, pero más eficiente y legible
    // Línea 200: switch (vistaActual) evalúa el valor de vistaActual
    // Compara vistaActual con cada case y ejecuta el código del case que coincida
    switch (vistaActual) {
      // Línea 201: case 'dashboard': se ejecuta si vistaActual === 'dashboard'
      case 'dashboard':
        // Línea 202-205: Comentario explicativo sobre el operador ternario
        // Mostrar dashboard según el rol del usuario
        // Operador ternario: condición ? valor_si_verdadero : valor_si_falso
        // Si es admin muestra Dashboard completo, si es vendedor muestra DashboardVendedor
        // Línea 205: return retorna un componente React
        // usuario.rol === 'admin' es la condición que se evalúa
        // ? <Dashboard /> es el valor si la condición es true (si es admin)
        // : <DashboardVendedor /> es el valor si la condición es false (si es vendedor)
        // <Dashboard /> es JSX que crea una instancia del componente Dashboard
        // <DashboardVendedor /> es JSX que crea una instancia del componente DashboardVendedor
        return usuario.rol === 'admin' ? <Dashboard /> : <DashboardVendedor />;
        
      // Línea 207: case 'punto-venta': se ejecuta si vistaActual === 'punto-venta'
      case 'punto-venta':
        // Línea 208: Comentario explicativo
        // Vista del sistema de punto de venta para realizar ventas
        // Línea 209: return retorna el componente PuntoVenta
        // <PuntoVenta /> crea una instancia del componente PuntoVenta
        return <PuntoVenta />;
        
      // Línea 211: case 'productos': se ejecuta si vistaActual === 'productos'
      case 'productos':
        // Línea 212: Comentario explicativo
        // Vista de gestión de productos (crear, editar, eliminar productos)
        // Línea 213: return retorna el componente GestionProductos
        return <GestionProductos />;
        
      // Línea 215: case 'recetas': se ejecuta si vistaActual === 'recetas'
      case 'recetas':
        // Línea 216-218: Comentario explicativo
        // Vista de gestión de recetas
        // Se pasa el usuario como prop porque algunas acciones requieren verificar permisos
        // Línea 218: return retorna el componente GestionRecetas
        // usuario={usuario} pasa el objeto usuario como prop al componente
        // {usuario} es JSX que interpola el valor de la variable usuario
        return <GestionRecetas usuario={usuario} />;
        
      // Línea 220: case 'insumos': se ejecuta si vistaActual === 'insumos'
      case 'insumos':
        // Línea 221: Comentario explicativo
        // Vista de gestión de insumos (materias primas)
        // Línea 222: return retorna el componente GestionInsumos
        return <GestionInsumos />;
        
      // Línea 224: case 'usuarios': se ejecuta si vistaActual === 'usuarios'
      case 'usuarios':
        // Línea 225: Comentario explicativo
        // Vista de gestión de usuarios del sistema
        // Línea 226: return retorna el componente GestionUsuarios
        return <GestionUsuarios />;
        
      // Línea 228: case 'proveedores': se ejecuta si vistaActual === 'proveedores'
      case 'proveedores':
        // Línea 229: Comentario explicativo
        // Vista de gestión de proveedores de insumos
        // Línea 230: return retorna el componente GestionProveedores
        return <GestionProveedores />;
        
      // Línea 232: case 'reportes': se ejecuta si vistaActual === 'reportes'
      case 'reportes':
        // Línea 233: Comentario explicativo
        // Vista de reportes y estadísticas
        // Línea 234: return retorna el componente Reportes
        return <Reportes />;
        
      // Línea 236: case 'clientes': se ejecuta si vistaActual === 'clientes'
      case 'clientes':
        // Línea 237: Comentario explicativo
        // Vista de gestión de clientes
        // Línea 238: return retorna el componente GestionClientes
        return <GestionClientes />;
        
      // Línea 240: case 'control-caja': se ejecuta si vistaActual === 'control-caja'
      case 'control-caja':
        // Línea 241: Comentario explicativo
        // Vista de control de caja (apertura, cierre, movimientos)
        // Línea 242: return retorna el componente ControlCaja
        return <ControlCaja />;
        
      // Línea 244: default se ejecuta si ningún case coincide con vistaActual
      default:
        // Línea 245-247: Comentario explicativo
        // Si la vista no coincide con ninguna, mostrar dashboard por defecto
        // Esto previene errores si hay un valor inesperado en vistaActual
        // Línea 247: return retorna el componente Dashboard por defecto
        return <Dashboard />;
    }
    // Línea 248: Cierra el switch
  };
  // Línea 249: Cierra la función renderizarVista

  // Línea 251-253: Comentario de separación visual
  // =====================================================
  // RENDERIZADO CONDICIONAL
  // =====================================================
  
  // Línea 255-258: Comentario explicativo sobre el renderizado condicional
  // Si no hay usuario autenticado, mostrar la pantalla de login
  // El operador ! convierte el valor a booleano y lo niega
  // Si usuario es null o undefined, !usuario es true
  // Línea 258: if (!usuario) verifica si usuario es falsy (null, undefined, false, 0, '', etc.)
  // ! es el operador NOT lógico que niega el valor
  // Si usuario es null, !usuario es true y entra al bloque
  if (!usuario) {
    // Línea 259: console.log() imprime un mensaje en la consola
    console.log('👤 No hay usuario, mostrando Login');
    // Línea 260-262: Comentario explicativo sobre el return
    // Retornar el componente Login y pasarle la función manejarLogin como prop
    // Cuando el usuario hace login, Login llamará a onLogin con los datos del usuario
    // Línea 262: return termina la ejecución de la función App y retorna JSX
    // <Login onLogin={manejarLogin} /> crea una instancia del componente Login
    // onLogin={manejarLogin} pasa la función manejarLogin como prop llamada 'onLogin'
    // {manejarLogin} interpola el valor de la función manejarLogin
    // Cuando el usuario hace login en el componente Login, este llamará a onLogin (que es manejarLogin)
    return <Login onLogin={manejarLogin} />;
  }
  // Línea 263: Cierra el if

  // Línea 265-266: Comentario explicativo
  // Si hay usuario autenticado, mostrar la aplicación principal
  // Esta es la estructura principal de la aplicación cuando el usuario está logueado
  // Línea 267: return retorna JSX con la estructura principal de la aplicación
  // ( inicia el JSX que se retorna (paréntesis para múltiples líneas)
  return (
    // Línea 268-269: Comentario explicativo sobre el div principal
    // div con clase "app" que contiene toda la aplicación
    // Línea 269: <div className="app"> crea un elemento div HTML
    // className="app" establece la clase CSS del div (className en lugar de class porque class es palabra reservada en JS)
    // "app" es el nombre de la clase CSS que se aplicará al div
    <div className="app">
      {/* Línea 270-274: Comentarios JSX sobre el Sidebar */}
      {/* Sidebar con navegación lateral */}
      {/* Se pasa el usuario para mostrar información del usuario logueado */}
      {/* Se pasa vistaActual para resaltar la vista activa en el menú */}
      {/* onCambiarVista permite que el Sidebar cambie la vista cuando se hace clic en un menú */}
      {/* onCerrarSesion permite que el Sidebar cierre la sesión cuando se hace clic en logout */}
      {/* Línea 275-280: Componente Sidebar con props */}
      {/* Línea 275: <Sidebar crea una instancia del componente Sidebar */}
      {/* usuario={usuario} pasa el objeto usuario como prop 'usuario' */}
      {/* vistaActual={vistaActual} pasa el string vistaActual como prop 'vistaActual' */}
      {/* onCambiarVista={cambiarVista} pasa la función cambiarVista como prop 'onCambiarVista' */}
      {/* onCerrarSesion={manejarCerrarSesion} pasa la función manejarCerrarSesion como prop 'onCerrarSesion' */}
      {/* /> cierra el componente (es un componente auto-cerrado) */}
      <Sidebar 
        usuario={usuario}
        vistaActual={vistaActual}
        onCambiarVista={cambiarVista}
        onCerrarSesion={manejarCerrarSesion}
      />
      
      {/* Línea 282-287: Comentarios JSX sobre el contenido principal */}
      {/* Contenido principal de la aplicación */}
      {/* main es un elemento semántico HTML5 para el contenido principal */}
      {/* Llamar a renderizarVista() para mostrar el componente correspondiente */}
      {/* Los corchetes {} permiten ejecutar código JavaScript dentro de JSX */}
      {/* Línea 284: <main className="main-content"> crea un elemento main HTML5 */}
      {/* main es un elemento semántico que representa el contenido principal de la página */}
      {/* className="main-content" establece la clase CSS */}
      <main className="main-content">
        {/* Línea 287: {renderizarVista()} ejecuta la función renderizarVista() */}
        {/* Los corchetes {} permiten ejecutar código JavaScript dentro de JSX */}
        {/* renderizarVista() es una llamada a función que retorna un componente React */}
        {/* El componente retornado se renderiza dentro del <main> */}
        {renderizarVista()}
      </main>
    </div>
  );
};

// Línea 293-295: Comentario explicativo sobre la exportación
// Exportar el componente App como exportación por defecto
// Esto permite importarlo en otros archivos como: import App from './App'
// Línea 295: export default App exporta el componente App como exportación por defecto
// default significa que cuando otro archivo hace import App from './App', obtendrá este componente
// App es el nombre del componente que se exporta
export default App;
