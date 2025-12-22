// Línea 1: import React importa el objeto React principal
// { useState, useEffect } son importaciones nombradas - extrae solo estos hooks del módulo 'react'
// useState es un hook para crear y manejar estado
// useEffect es un hook para ejecutar efectos secundarios (como limpiar al montar/desmontar)
// 'react' es el nombre del paquete npm
import React, { useState, useEffect } from 'react';
// Línea 2: import apiClient importa la instancia configurada de Axios
// from '../config/axiosConfig' es la ruta relativa al archivo
// ../ sube un nivel desde views/ hasta frontend/
// apiClient es la instancia de Axios con configuración personalizada (URLs base, interceptores, etc.)
import apiClient from '../config/axiosConfig';
// Línea 3: import API_CONFIG importa el objeto con todas las URLs del backend
// from '../config/apiConfig' es la ruta relativa
// API_CONFIG contiene las URLs base y endpoints del API
import API_CONFIG from '../config/apiConfig';
// Línea 4: import '../styles/Login.css' importa el archivo CSS específico del componente Login
// Los archivos CSS se importan directamente en JavaScript
// Webpack procesará este import y aplicará los estilos
import '../styles/Login.css';

// Línea 6-9: Comentario JSDoc que describe el componente Login
/**
 * Componente Login - Maneja la autenticación de usuarios
 * Incluye validación de credenciales y redirección según rol
 */
// Línea 10: const Login declara una constante con el componente Login
// = ({ onLogin }) => { define una arrow function que recibe props como parámetro
// { onLogin } es destructuring de props - extrae solo la prop 'onLogin'
// onLogin es una función que se pasa desde el componente padre (App.jsx)
// Cuando el login es exitoso, se llamará a onLogin con los datos del usuario
const Login = ({ onLogin }) => {
  // Línea 11: console.log() imprime un mensaje en la consola cuando el componente se renderiza
  // Esto ayuda a debugging: ver cuándo se renderiza el componente Login
  console.log('🔐 Componente Login renderizado');
  
  // Línea 13-17: Comentario y estado para los datos del formulario
  // Estados para manejar los datos del formulario
  // Línea 14: const [formData, setFormData] es destructuring del array retornado por useState
  // useState({ username: '', password: '' }) crea un estado inicializado con un objeto
  // El objeto tiene dos propiedades: username (string vacío) y password (string vacío)
  // formData contiene el valor actual del estado (el objeto con username y password)
  // setFormData es la función para actualizar el estado
  // Cuando el usuario escribe en los inputs, se actualiza formData usando setFormData
  const [formData, setFormData] = useState({
    username: '', // Campo para el nombre de usuario
    password: ''  // Campo para la contraseña
  });
  
  // Línea 19-20: Comentario y estado para errores
  // Estado para manejar errores de validación
  // Línea 20: const [error, setError] crea un estado para mensajes de error
  // useState('') inicializa el estado con string vacío (sin errores inicialmente)
  // error contiene el mensaje de error actual (string vacío si no hay error)
  // setError es la función para actualizar el mensaje de error
  const [error, setError] = useState('');
  
  // Línea 22-23: Comentario y estado para mostrar/ocultar contraseña
  // Estado para mostrar/ocultar la contraseña
  // Línea 23: const [showPassword, setShowPassword] crea un estado booleano
  // useState(false) inicializa en false (contraseña oculta por defecto)
  // showPassword es true si se debe mostrar la contraseña, false si está oculta
  // setShowPassword es la función para cambiar la visibilidad
  const [showPassword, setShowPassword] = useState(false);
  
  // Línea 25-26: Comentario y estado para el estado de carga
  // Estado para indicar si está procesando el login
  // Línea 26: const [loading, setLoading] crea un estado booleano para el estado de carga
  // useState(false) inicializa en false (no está cargando inicialmente)
  // loading es true cuando se está procesando el login (mostrar spinner, deshabilitar botones)
  // setLoading es la función para cambiar el estado de carga
  const [loading, setLoading] = useState(false);

  // Línea 28-30: Comentario de separación visual
  // =====================================================
  // LIMPIAR ERRORES AL CARGAR
  // =====================================================
  // Línea 31: useEffect() es un hook que ejecuta efectos secundarios
  // () => { es una arrow function que contiene el código del efecto
  // useEffect se ejecuta después de que React renderiza el componente
  useEffect(() => {
    // Línea 32-33: Comentario explicativo
    // Limpiar cualquier error al cargar el componente
    // Línea 33: setError('') actualiza el estado error a string vacío
    // Esto limpia cualquier mensaje de error que pueda haber quedado de un renderizado anterior
    setError('');
  // Línea 34: }, []); cierra el useEffect
  // [] es el array de dependencias - array vacío significa que solo se ejecuta una vez
  // Se ejecuta cuando el componente se monta (se renderiza por primera vez)
  // No se ejecuta en renderizados posteriores porque el array de dependencias está vacío
  }, []); // Solo se ejecuta una vez al cargar

  // Línea 36-39: Comentario JSDoc que describe la función handleInputChange
  /**
   * Función para manejar cambios en los inputs del formulario
   * Se ejecuta cada vez que el usuario escribe en los campos
   */
  // Línea 40: const handleInputChange declara una constante con una arrow function
  // = (e) => { define una función que recibe el evento del input
  // e es el objeto de evento que contiene información sobre el cambio en el input
  // e.target es el elemento HTML del input que cambió
  const handleInputChange = (e) => {
    // Línea 41: const { name, value } es destructuring del objeto e.target
    // e.target es el elemento HTML del input (ej: <input name="username" value="admin" />)
    // name es el valor del atributo 'name' del input (ej: 'username' o 'password')
    // value es el valor actual del input (lo que el usuario escribió)
    // Esto extrae name y value del objeto e.target en una sola línea
    const { name, value } = e.target; // Extrae el nombre y valor del input
    
    // Línea 43-47: Comentario y código para actualizar el estado
    // Actualiza el estado del formulario con el nuevo valor
    // Línea 44: setFormData() actualiza el estado formData
    // prevState => ({ ... }) usa una función que recibe el estado anterior
    // prevState es el valor actual de formData antes de la actualización
    setFormData(prevState => ({
      // Línea 45: ...prevState es el spread operator que copia todas las propiedades del estado anterior
      // Esto mantiene los valores de los otros campos (si cambia username, mantiene password)
      ...prevState, // Mantiene los valores anteriores
      // Línea 46: [name]: value es computed property name
      // [name] usa el valor de la variable name como nombre de la propiedad
      // Si name = 'username', actualiza formData.username
      // Si name = 'password', actualiza formData.password
      // value es el nuevo valor que se asigna a esa propiedad
      [name]: value  // Actualiza solo el campo que cambió
    }));
    // Línea 47: }); cierra el objeto y la función de setFormData
    
    // Línea 49-52: Comentario y código para limpiar errores
    // Limpia errores cuando el usuario empieza a escribir
    // Línea 50: if (error) verifica si hay un mensaje de error
    // Si error tiene un valor (no es string vacío), entra al bloque
    if (error) {
      // Línea 51: setError('') limpia el mensaje de error
      // Esto oculta el mensaje de error cuando el usuario empieza a escribir de nuevo
      setError('');
    }
    // Línea 52: Cierra el if
  };
  // Línea 53: Cierra la función handleInputChange

  // Línea 55-58: Comentario JSDoc que describe la función handleSubmit
  /**
   * Función para manejar el envío del formulario
   * Hace petición real al backend PHP usando Axios
   */
  // Línea 59: const handleSubmit declara una constante con una arrow function asíncrona
  // async (e) => { define una función asíncrona que recibe el evento del formulario
  // async permite usar await dentro de la función para esperar promesas
  // e es el objeto de evento del formulario (cuando se presiona submit)
  const handleSubmit = async (e) => {
    // Línea 60: e.preventDefault() previene el comportamiento por defecto del formulario
    // Por defecto, un formulario HTML recarga la página al enviarse
    // preventDefault() cancela ese comportamiento para manejar el envío con JavaScript
    e.preventDefault(); // Previene el comportamiento por defecto del formulario
    
    // Línea 62-66: Comentario y validación de campos
    // Valida que ambos campos estén llenos
    // Línea 63: if verifica si alguno de los campos está vacío
    // !formData.username es true si username es falsy (null, undefined, '', 0, false)
    // || es el operador OR: si cualquiera es true, entra al bloque
    // !formData.password es true si password está vacío
    if (!formData.username || !formData.password) {
      // Línea 64: setError() actualiza el estado error con un mensaje
      // 'Por favor, completa todos los campos' es el mensaje que se mostrará al usuario
      setError('Por favor, completa todos los campos');
      // Línea 65: return termina la ejecución de la función aquí
      // No se hace la petición al backend si los campos están vacíos
      return;
    }
    // Línea 66: Cierra el if
    
    // Línea 68: setLoading(true) activa el estado de carga
    // true significa que se está procesando el login
    // Esto deshabilita botones y muestra un spinner o mensaje de "cargando..."
    setLoading(true); // Activa el estado de carga
    // Línea 69: setError('') limpia cualquier mensaje de error anterior
    // Esto oculta errores previos antes de intentar el login de nuevo
    setError(''); // Limpia errores anteriores
    
    // Línea 71: try inicia un bloque que captura errores
    // Si algo falla dentro del try, se ejecuta el catch
    try {
      // Línea 72-77: Comentario y construcción de datos para la petición
      // Construir la URL del endpoint (sin BASE_URL porque apiClient ya lo tiene)
      // Línea 73: const loginUrl declara una constante con la URL del endpoint de login
      // API_CONFIG.AUTH.LOGIN accede a la propiedad LOGIN del objeto AUTH dentro de API_CONFIG
      // Ejemplo: '/api/auth/login'
      const loginUrl = API_CONFIG.AUTH.LOGIN;
      // Línea 74-77: const datosEnviados declara un objeto con los datos a enviar al backend
      // correo: formData.username mapea el campo username del formulario a 'correo' (lo que espera el backend)
      // clave: formData.password mapea el campo password a 'clave' (lo que espera el backend)
      const datosEnviados = {
        correo: formData.username, // El backend espera 'correo'
        clave: formData.password   // El backend espera 'clave'
      };
      
      // Línea 79: const urlCompleta construye la URL completa concatenando BASE_URL + loginUrl
      // API_CONFIG.BASE_URL es la URL base (ej: 'http://localhost/habibbi-api')
      // + es el operador de concatenación de strings
      // loginUrl es el endpoint (ej: '/api/auth/login')
      // Resultado: 'http://localhost/habibbi-api/api/auth/login'
      const urlCompleta = API_CONFIG.BASE_URL + loginUrl;
      // Línea 80-83: console.log() imprime mensajes en la consola para debugging
      // Muestra la URL completa, los datos enviados (con la contraseña oculta), etc.
      console.log('🚀 Intentando login en:', urlCompleta);
      // Línea 81: { ...datosEnviados, clave: '***' } crea un objeto copiando datosEnviados pero ocultando la contraseña
      // ...datosEnviados copia todas las propiedades
      // clave: '***' sobrescribe la contraseña con asteriscos para no mostrarla en los logs
      console.log('📤 Datos enviados:', { ...datosEnviados, clave: '***' });
      console.log('🌐 BASE_URL configurado:', API_CONFIG.BASE_URL);
      console.log('🔗 Endpoint completo:', urlCompleta);
      
      // Línea 85-87: Comentario y petición HTTP al backend
      // Usar apiClient que tiene mejor manejo de errores y configuración
      // Intentar el login directamente - el health check puede fallar por CORS pero el login puede funcionar
      // Línea 87: const response declara una constante que esperará la respuesta
      // await espera a que la promesa se resuelva antes de continuar
      // apiClient.post() hace una petición HTTP POST al backend
      // loginUrl es el endpoint (ej: '/api/auth/login')
      // datosEnviados es el objeto con los datos que se envían en el body de la petición
      // apiClient.post() retorna una Promise que se resuelve con la respuesta del servidor
      // await espera a que la Promise se resuelva y guarda el resultado en response
      const response = await apiClient.post(loginUrl, datosEnviados);
      
      // Línea 89: console.log() imprime la respuesta del servidor en la consola
      // response.data contiene los datos JSON retornados por el backend
      console.log('Respuesta del servidor:', response.data);
      
      // Línea 91-92: Comentario y verificación de respuesta exitosa
      // Si la respuesta es exitosa
      // Línea 92: if verifica si la respuesta indica éxito
      // response.data verifica que exista la propiedad data
      // && es AND: ambas condiciones deben ser true
      // response.data.success verifica que success sea true
      if (response.data && response.data.success) {
        // Línea 93-95: Comentario y extracción de datos del backend
        // Transformar los datos del backend al formato esperado por el frontend
        // El backend devuelve id_usuario, pero también puede devolver id
        // Línea 95: const usuarioBackend extrae el objeto usuario de la respuesta
        // response.data.usuario accede a la propiedad 'usuario' dentro de response.data
        const usuarioBackend = response.data.usuario;
        // Línea 96-105: const usuarioData crea un objeto transformado para el frontend
        // Este objeto adapta los datos del backend al formato que espera el frontend
        const usuarioData = {
          // Línea 97: id usa id_usuario si existe, sino usa id (operador ||)
          // || es OR lógico: si id_usuario es falsy, usa id
          id: usuarioBackend.id_usuario || usuarioBackend.id,
          // Línea 98: id_usuario asegura que ambos campos existan (compatibilidad)
          id_usuario: usuarioBackend.id_usuario || usuarioBackend.id, // Asegurar ambos campos
          // Línea 99: username mapea correo del backend a username del frontend
          username: usuarioBackend.correo || usuarioBackend.username,
          // Línea 100: password mantiene la contraseña del formulario (para compatibilidad)
          password: formData.password, // Mantener para compatibilidad
          // Línea 101-104: Extrae rol, nombre, apellido y email del backend
          rol: usuarioBackend.rol,
          nombre: usuarioBackend.nombre,
          apellido: usuarioBackend.apellido || '',  // Usa string vacío si no existe
          email: usuarioBackend.correo || usuarioBackend.email
        };
        
        // Línea 107: console.log() imprime el usuario transformado
        console.log('✅ Usuario transformado para frontend:', usuarioData);
        
        // Línea 109-111: Comentario y llamada a onLogin
        // Llamar a la función onLogin con los datos del backend
        // Línea 110: onLogin(usuarioData) llama a la función onLogin pasada como prop
        // usuarioData es el objeto con los datos del usuario transformados
        // Esta función viene de App.jsx (manejarLogin) y actualiza el estado del usuario
        onLogin(usuarioData);
        // Línea 111: setError('') limpia cualquier mensaje de error
        setError(''); // Limpia cualquier error
      // Línea 112: else se ejecuta si la respuesta no indica éxito
      } else {
        // Línea 113: Comentario explicativo
        // Si el backend devuelve error
        // Línea 114: setError() actualiza el mensaje de error
        // response.data?.message usa optional chaining para acceder a message si existe
        // || es OR: si message no existe, intenta response.data?.error
        // || 'Credenciales incorrectas...' es el mensaje por defecto si no hay mensaje de error
        setError(response.data?.message || response.data?.error || 'Credenciales incorrectas. Intenta nuevamente.');
      }
      // Línea 115: Cierra el if-else
    // Línea 116: catch captura cualquier error que ocurra en el try
    // (error) es el objeto de error capturado
    } catch (error) {
      // Línea 117-118: Comentario y log de error
      // Maneja errores de red o del servidor
      // Línea 118: console.error() imprime el error en la consola
      console.error('Error en login:', error);
      
      // Línea 120: if verifica si el servidor respondió con un error
      // error.response existe cuando el servidor respondió pero con código de error (400, 401, 500, etc.)
      if (error.response) {
        // Línea 121: Comentario explicativo
        // El servidor respondió con un código de error
        // Línea 122: const errorMessage extrae el mensaje de error
        // error.response.data?.error usa optional chaining para acceder al error
        // || intenta otras propiedades si error no existe
        const errorMessage = error.response.data?.error || error.response.data?.message || 'Error del servidor';
        // Línea 123: setError() muestra el mensaje de error al usuario
        setError(errorMessage);
      // Línea 124: else if verifica si la petición se hizo pero no hubo respuesta
      // error.request existe cuando la petición se envió pero el servidor no respondió
      } else if (error.request) {
        // Línea 125: Comentario explicativo
        // La petición se hizo pero no hubo respuesta
        // Línea 126-130: console.error() imprime información detallada del error
        console.error('❌ No se recibió respuesta del servidor');
        console.error('URL intentada:', API_CONFIG.BASE_URL + API_CONFIG.AUTH.LOGIN);
        console.error('Error completo:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje:', error.message);
        
        // Línea 132-152: Comentario y manejo de diferentes tipos de errores de red
        // Mensaje más específico según el tipo de error
        // Línea 133: if verifica si es error de red o conexión rechazada
        // error.code === 'ERR_NETWORK' es error de red (no se pudo conectar)
        // || es OR: también verifica 'ECONNREFUSED' (conexión rechazada)
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
          // Línea 134-140: setError() muestra un mensaje detallado con instrucciones
          // Template literal (backticks) permite strings multilínea y interpolación con ${}
          setError(`No se pudo conectar al servidor. Verifica que:
          
1. XAMPP esté corriendo (Apache y MySQL)
2. El backend esté en la carpeta htdocs de tu XAMPP (ej: D:\\XamppNuevo\\htdocs\\habibbi-backend\\)
3. La URL sea correcta: ${API_CONFIG.BASE_URL}

Prueba abrir en el navegador: ${API_CONFIG.BASE_URL}/api/health`);
        // Línea 141: else if verifica si es error de CORS
        // error.message.includes('CORS') busca si el mensaje contiene 'CORS'
        // || también verifica 'cors' en minúsculas
        } else if (error.message && (error.message.includes('CORS') || error.message.includes('cors'))) {
          // Línea 142: setError() muestra mensaje sobre error de CORS
          setError('Error de CORS. Verifica que el backend permita solicitudes desde el frontend.');
        // Línea 143: else if verifica si es error de timeout
        // error.code === 'ECONNABORTED' significa que la petición tardó demasiado
        } else if (error.code === 'ECONNABORTED') {
          // Línea 144: setError() muestra mensaje sobre timeout
          setError('La petición tardó demasiado. Verifica que el backend esté ejecutándose.');
        // Línea 145: else maneja otros errores de conexión
        } else {
          // Línea 146-151: setError() muestra mensaje genérico con instrucciones
          setError(`No se pudo conectar con el servidor en: ${API_CONFIG.BASE_URL}

Verifica:
- XAMPP está corriendo
- Backend está en htdocs/habibbi-backend
- Prueba: ${API_CONFIG.BASE_URL}/api/health`);
        }
        // Línea 152: Cierra el if-else if-else
      // Línea 153: else maneja errores al configurar la petición
      } else {
        // Línea 154: Comentario explicativo
        // Error al configurar la petición
        // Línea 155: console.error() imprime el error
        console.error('❌ Error configurando la petición:', error.message);
        // Línea 156: setError() muestra el mensaje de error
        // + concatena strings
        // error.message || 'Error desconocido' usa el mensaje del error o un mensaje por defecto
        setError('Error al procesar la petición: ' + (error.message || 'Error desconocido'));
      }
      // Línea 157: Cierra el if-else if-else
    // Línea 158: finally se ejecuta siempre, haya error o no
    } finally {
      // Línea 159: setLoading(false) desactiva el estado de carga
      // Esto se ejecuta siempre, incluso si hubo error, para que el botón vuelva a estar habilitado
      setLoading(false); // Desactiva el estado de carga
    }
    // Línea 160: Cierra el try-catch-finally
  };
  // Línea 161: Cierra la función handleSubmit

  // Línea 163-165: Comentario JSDoc que describe la función togglePasswordVisibility
  /**
   * Función para alternar la visibilidad de la contraseña
   */
  // Línea 166: const togglePasswordVisibility declara una constante con una arrow function
  // = () => { define una función que no recibe parámetros
  const togglePasswordVisibility = () => {
    // Línea 167: setShowPassword(!showPassword) cambia el estado showPassword al valor opuesto
    // !showPassword niega el valor actual: si es true, se pone en false; si es false, se pone en true
    // Esto alterna entre mostrar y ocultar la contraseña
    setShowPassword(!showPassword); // Cambia el estado de visibilidad
  };
  // Línea 168: Cierra la función togglePasswordVisibility

  // Línea 170: console.log() imprime un mensaje cuando se renderiza el JSX
  console.log('🎨 Renderizando JSX del Login');

  // Línea 172: return retorna el JSX que se renderizará en el navegador
  // ( inicia el JSX (paréntesis para múltiples líneas)
  return (
    // Línea 173: <div className="login-container"> crea un div con clase CSS
    // className="login-container" establece la clase para estilos
    <div className="login-container">
      // Línea 174: <div className="login-card"> crea un div interno con clase login-card
      <div className="login-card">
        {/* Línea 175: Comentario JSX sobre el header */}
        {/* Logo y título de la aplicación */}
        // Línea 176: <div className="login-header"> crea un div para el encabezado
        <div className="login-header">
          // Línea 177: <h1> crea un elemento de encabezado de nivel 1
          // className="login-title" establece la clase CSS
          // ☕ Habibbi Café es el texto que se muestra
          <h1 className="login-title">☕ Habibbi Café</h1>
          // Línea 178: <p> crea un párrafo
          // className="login-subtitle" establece la clase CSS
          // Sistema de Gestión es el texto que se muestra
          <p className="login-subtitle">Sistema de Gestión</p>
        </div>
        // Línea 179: </div> cierra el div login-header

        {/* Línea 181: Comentario JSX sobre el formulario */}
        {/* Formulario de login */}
        // Línea 182: <form> crea un elemento de formulario HTML
        // onSubmit={handleSubmit} asocia la función handleSubmit al evento submit del formulario
        // Cuando el usuario presiona Enter o hace clic en el botón submit, se ejecuta handleSubmit
        // className="login-form" establece la clase CSS
        <form onSubmit={handleSubmit} className="login-form">
          {/* Línea 183: Comentario JSX sobre el campo de usuario */}
          {/* Campo de nombre de usuario */}
          // Línea 184: <div className="form-group"> crea un contenedor para el campo del formulario
          <div className="form-group">
            // Línea 185: <label> crea una etiqueta para el input
            // htmlFor="username" asocia el label con el input que tiene id="username"
            // className="form-label" establece la clase CSS
            <label htmlFor="username" className="form-label">
              // Línea 186: 👤 Nombre de Usuario es el texto del label
              👤 Nombre de Usuario
            </label>
            // Línea 188-197: <input> crea un campo de entrada de texto
            // type="text" especifica que es un campo de texto
            // id="username" es el identificador único del input (se usa con htmlFor del label)
            // name="username" es el nombre del campo (se usa en handleInputChange para identificar qué campo cambió)
            // value={formData.username} establece el valor del input desde el estado formData
            // {formData.username} interpola el valor de formData.username
            // onChange={handleInputChange} asocia la función handleInputChange al evento change
            // Cuando el usuario escribe, se ejecuta handleInputChange
            // className="form-control" establece la clase CSS
            // placeholder="Ingresa tu usuario" muestra un texto de ayuda cuando el campo está vacío
            // disabled={loading} deshabilita el input cuando loading es true (durante el proceso de login)
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Ingresa tu usuario"
              disabled={loading} // Deshabilita durante la carga
            />
          </div>
          // Línea 198: </div> cierra el div form-group

          {/* Línea 200: Comentario JSX sobre el campo de contraseña */}
          {/* Campo de contraseña con botón para mostrar/ocultar */}
          // Línea 201: <div className="form-group"> crea otro contenedor para el campo de contraseña
          <div className="form-group">
            // Línea 202: <label> crea la etiqueta para el campo de contraseña
            <label htmlFor="password" className="form-label">
              // Línea 203: 🔒 Contraseña es el texto del label
              🔒 Contraseña
            </label>
            // Línea 205: <div className="password-input-container"> crea un contenedor para el input y el botón
            <div className="password-input-container">
              // Línea 206-215: <input> crea el campo de contraseña
              // type={showPassword ? 'text' : 'password'} usa operador ternario para el tipo
              // Si showPassword es true, type='text' (muestra el texto)
              // Si showPassword es false, type='password' (oculta el texto con puntos)
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Ingresa tu contraseña"
                disabled={loading} // Deshabilita durante la carga
              />
              // Línea 216-223: <button> crea un botón para mostrar/ocultar la contraseña
              // type="button" especifica que es un botón normal (no submit, no recarga la página)
              // onClick={togglePasswordVisibility} asocia la función al evento click
              // Cuando se hace clic, se ejecuta togglePasswordVisibility que cambia showPassword
              // className="password-toggle-btn" establece la clase CSS
              // disabled={loading} deshabilita el botón durante la carga
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle-btn"
                disabled={loading}
              >
                // Línea 222: {showPassword ? '🙈' : '👁️'} usa operador ternario para mostrar el emoji
                // Si showPassword es true, muestra 🙈 (ocultar)
                // Si showPassword es false, muestra 👁️ (mostrar)
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            // Línea 224: </div> cierra el div password-input-container
          </div>
          // Línea 225: </div> cierra el div form-group

          {/* Línea 227: Comentario JSX sobre el mensaje de error */}
          {/* Mensaje de error */}
          // Línea 228: {error && ( ... )} usa renderizado condicional
          // error && verifica si error tiene un valor truthy
          // Si error tiene un valor, se renderiza el div con el mensaje
          // Si error es falsy (string vacío, null, undefined), no se renderiza nada
          {error && (
            // Línea 229: <div className="error-message"> crea un div para mostrar el error
            <div className="error-message">
              // Línea 230: ⚠️ {error} muestra el emoji y el mensaje de error
              // {error} interpola el valor de la variable error
              ⚠️ {error}
            </div>
          )}
          // Línea 232: Cierra el renderizado condicional

          {/* Línea 234: Comentario JSX sobre el botón de envío */}
          {/* Botón de envío */}
          // Línea 235-241: <button> crea el botón para enviar el formulario
          // type="submit" especifica que es un botón de envío (dispara el evento submit del formulario)
          // className={`btn btn-primary login-btn ${loading ? 'loading' : ''}`} establece clases CSS dinámicas
          // Template literal (backticks) permite interpolar variables
          // 'btn btn-primary login-btn' son clases fijas
          // ${loading ? 'loading' : ''} agrega la clase 'loading' si loading es true
          // disabled={loading} deshabilita el botón durante la carga
          <button
            type="submit"
            className={`btn btn-primary login-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            // Línea 240: {loading ? '⏳ Iniciando sesión...' : '🚀 Iniciar Sesión'} usa operador ternario
            // Si loading es true, muestra '⏳ Iniciando sesión...'
            // Si loading es false, muestra '🚀 Iniciar Sesión'
            {loading ? '⏳ Iniciando sesión...' : '🚀 Iniciar Sesión'}
          </button>
        </form>
        // Línea 242: </form> cierra el formulario

        {/* Línea 244: Comentario JSX sobre la información del sistema */}
        {/* Información del sistema */}
        // Línea 245: <div className="system-info"> crea un div para mostrar información del sistema
        <div className="system-info">
          // Línea 246-249: <div className="info-item"> crea un div para cada ítem de información
          <div className="info-item">
            // Línea 247: <span className="info-icon"> muestra el emoji del ítem
            <span className="info-icon">📊</span>
            // Línea 248: <span className="info-text"> muestra el texto descriptivo
            <span className="info-text">Gestión Completa de Inventario</span>
          </div>
          // Línea 250-253: Segundo ítem de información
          <div className="info-item">
            <span className="info-icon">💼</span>
            <span className="info-text">Control de Ventas y Reportes</span>
          </div>
          // Línea 254-257: Tercer ítem de información
          <div className="info-item">
            <span className="info-icon">🤖</span>
            <span className="info-text">Recomendaciones Inteligentes</span>
          </div>
        </div>
        // Línea 258: </div> cierra el div system-info
      </div>
      // Línea 259: </div> cierra el div login-card
    </div>
    // Línea 260: </div> cierra el div login-container
  // Línea 261: ); cierra el return y el paréntesis del JSX
  );
  // Línea 262: }; cierra la función Login
};

// Línea 264: export default Login exporta el componente Login como exportación por defecto
// Esto permite importarlo en otros archivos como: import Login from './views/Login'
export default Login;
