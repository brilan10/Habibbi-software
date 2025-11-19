import React, { useState, useEffect } from 'react';
import apiClient from '../config/axiosConfig';
import API_CONFIG from '../config/apiConfig';
import '../styles/Login.css';

/**
 * Componente Login - Maneja la autenticación de usuarios
 * Incluye validación de credenciales y redirección según rol
 */
const Login = ({ onLogin }) => {
  console.log('🔐 Componente Login renderizado');
  
  // Estados para manejar los datos del formulario
  const [formData, setFormData] = useState({
    username: '', // Campo para el nombre de usuario
    password: ''  // Campo para la contraseña
  });
  
  // Estado para manejar errores de validación
  const [error, setError] = useState('');
  
  // Estado para mostrar/ocultar la contraseña
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para indicar si está procesando el login
  const [loading, setLoading] = useState(false);

  // =====================================================
  // SCRIPT DE PRUEBA - Cargar usuarios al iniciar
  // =====================================================
  useEffect(() => {
    // Función para obtener usuarios del servidor
    const cargarUsuariosPrueba = async () => {
      try {
        console.log('🔍 ========== PRUEBA DE CONEXIÓN A BASE DE DATOS ==========');
        console.log('🔍 Verificando conexión al servidor...');
        
        // Intentar obtener usuarios del endpoint de prueba
        const testUrl = API_CONFIG.BASE_URL + '/test_usuarios.php';
        console.log('🔍 URL de prueba:', testUrl);
        
        const response = await apiClient.get('/test_usuarios.php');
        
        if (response.data && response.data.success) {
          console.log('✅ ========== CONEXIÓN EXITOSA ==========');
          console.log('✅ Total de usuarios encontrados:', response.data.total);
          console.log('');
          console.log('📋 ========== LISTA DE USUARIOS ==========');
          
          response.data.usuarios.forEach((usuario, index) => {
            console.log(`\n👤 USUARIO #${index + 1}:`);
            console.log('   ID:', usuario.id_usuario);
            console.log('   Nombre:', usuario.nombre, usuario.apellido);
            console.log('   Correo:', usuario.correo);
            console.log('   Rol:', usuario.rol);
            console.log('   Activo:', usuario.activo ? 'Sí' : 'No');
            console.log('   Tipo de contraseña:', usuario.clave_tipo);
            console.log('   Contraseña (preview):', usuario.clave_preview);
            console.log('   Contraseña (completa):', usuario.clave);
          });
          
          console.log('');
          console.log('✅ ========== FIN DE PRUEBA ==========');
          console.log('💡 Puedes usar estos datos para probar el login');
          
        } else {
          console.error('❌ Error al obtener usuarios:', response.data);
        }
      } catch (error) {
        // NO bloquear el renderizado si hay error en la prueba
        console.warn('⚠️ ========== ADVERTENCIA EN PRUEBA ==========');
        console.warn('⚠️ No se pudo conectar al servidor de prueba');
        console.warn('⚠️ URL intentada:', API_CONFIG.BASE_URL + '/test_usuarios.php');
        console.warn('⚠️ Esto NO afecta el funcionamiento del login');
        
        if (error.response) {
          console.warn('⚠️ Error del servidor:', error.response.status);
        } else if (error.request) {
          console.warn('⚠️ No se recibió respuesta del servidor');
        } else {
          console.warn('⚠️ Error:', error.message);
        }
      }
    };
    
    // Ejecutar la prueba al cargar el componente (sin bloquear renderizado)
    // Usar setTimeout para no bloquear el render inicial
    setTimeout(() => {
      cargarUsuariosPrueba();
    }, 1000);
  }, []); // Solo se ejecuta una vez al cargar

  /**
   * Función para manejar cambios en los inputs del formulario
   * Se ejecuta cada vez que el usuario escribe en los campos
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target; // Extrae el nombre y valor del input
    
    // Actualiza el estado del formulario con el nuevo valor
    setFormData(prevState => ({
      ...prevState, // Mantiene los valores anteriores
      [name]: value  // Actualiza solo el campo que cambió
    }));
    
    // Limpia errores cuando el usuario empieza a escribir
    if (error) {
      setError('');
    }
  };

  /**
   * Función para manejar el envío del formulario
   * Hace petición real al backend PHP usando Axios
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario
    
    // Valida que ambos campos estén llenos
    if (!formData.username || !formData.password) {
      setError('Por favor, completa todos los campos');
      return;
    }
    
    setLoading(true); // Activa el estado de carga
    setError(''); // Limpia errores anteriores
    
    try {
      // Construir la URL del endpoint (sin BASE_URL porque apiClient ya lo tiene)
      const loginUrl = API_CONFIG.AUTH.LOGIN;
      const datosEnviados = {
        correo: formData.username, // El backend espera 'correo'
        clave: formData.password   // El backend espera 'clave'
      };
      
      const urlCompleta = API_CONFIG.BASE_URL + loginUrl;
      console.log('🚀 Intentando login en:', urlCompleta);
      console.log('📤 Datos enviados:', { ...datosEnviados, clave: '***' });
      console.log('🌐 BASE_URL configurado:', API_CONFIG.BASE_URL);
      console.log('🔗 Endpoint completo:', urlCompleta);
      
      // Verificar primero que el backend esté disponible
      try {
        const healthCheck = await apiClient.get('/api/health');
        console.log('✅ Backend disponible:', healthCheck.data);
      } catch (healthError) {
        console.warn('⚠️ No se pudo verificar salud del backend:', healthError.message);
        console.warn('⚠️ Continuando con login de todas formas...');
      }
      
      // Usar apiClient que tiene mejor manejo de errores y configuración
      const response = await apiClient.post(loginUrl, datosEnviados);
      
      console.log('Respuesta del servidor:', response.data);
      
      // Si la respuesta es exitosa
      if (response.data && response.data.success) {
        // Transformar los datos del backend al formato esperado por el frontend
        // El backend devuelve id_usuario, pero también puede devolver id
        const usuarioBackend = response.data.usuario;
        const usuarioData = {
          id: usuarioBackend.id_usuario || usuarioBackend.id,
          id_usuario: usuarioBackend.id_usuario || usuarioBackend.id, // Asegurar ambos campos
          username: usuarioBackend.correo || usuarioBackend.username,
          password: formData.password, // Mantener para compatibilidad
          rol: usuarioBackend.rol,
          nombre: usuarioBackend.nombre,
          apellido: usuarioBackend.apellido || '',
          email: usuarioBackend.correo || usuarioBackend.email
        };
        
        console.log('✅ Usuario transformado para frontend:', usuarioData);
        
        // Llamar a la función onLogin con los datos del backend
        onLogin(usuarioData);
        setError(''); // Limpia cualquier error
      } else {
        // Si el backend devuelve error
        setError(response.data?.message || response.data?.error || 'Credenciales incorrectas. Intenta nuevamente.');
      }
    } catch (error) {
      // Maneja errores de red o del servidor
      console.error('Error en login:', error);
      
      if (error.response) {
        // El servidor respondió con un código de error
        const errorMessage = error.response.data?.error || error.response.data?.message || 'Error del servidor';
        setError(errorMessage);
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        console.error('❌ No se recibió respuesta del servidor');
        console.error('URL intentada:', API_CONFIG.BASE_URL + API_CONFIG.AUTH.LOGIN);
        console.error('Error completo:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje:', error.message);
        
        // Mensaje más específico según el tipo de error
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
          setError(`No se pudo conectar al servidor. Verifica que:
          
1. XAMPP esté corriendo (Apache y MySQL)
2. El backend esté en: C:\\xampp\\htdocs\\habibbi-backend\\
3. La URL sea correcta: ${API_CONFIG.BASE_URL}

Prueba abrir en el navegador: ${API_CONFIG.BASE_URL}/api/health`);
        } else if (error.message && (error.message.includes('CORS') || error.message.includes('cors'))) {
          setError('Error de CORS. Verifica que el backend permita solicitudes desde el frontend.');
        } else if (error.code === 'ECONNABORTED') {
          setError('La petición tardó demasiado. Verifica que el backend esté ejecutándose.');
        } else {
          setError(`No se pudo conectar con el servidor en: ${API_CONFIG.BASE_URL}

Verifica:
- XAMPP está corriendo
- Backend está en htdocs/habibbi-backend
- Prueba: ${API_CONFIG.BASE_URL}/api/health`);
        }
      } else {
        // Error al configurar la petición
        console.error('❌ Error configurando la petición:', error.message);
        setError('Error al procesar la petición: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      setLoading(false); // Desactiva el estado de carga
    }
  };

  /**
   * Función para alternar la visibilidad de la contraseña
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword); // Cambia el estado de visibilidad
  };

  console.log('🎨 Renderizando JSX del Login');
  
  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo y título de la aplicación */}
        <div className="login-header">
          <h1 className="login-title">☕ Habibbi Café</h1>
          <p className="login-subtitle">Sistema de Gestión</p>
        </div>

        {/* Formulario de login */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Campo de nombre de usuario */}
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              👤 Nombre de Usuario
            </label>
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

          {/* Campo de contraseña con botón para mostrar/ocultar */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              🔒 Contraseña
            </label>
            <div className="password-input-container">
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
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle-btn"
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            className={`btn btn-primary login-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? '⏳ Iniciando sesión...' : '🚀 Iniciar Sesión'}
          </button>
        </form>

        {/* Información del sistema */}
        <div className="system-info">
          <div className="info-item">
            <span className="info-icon">📊</span>
            <span className="info-text">Gestión Completa de Inventario</span>
          </div>
          <div className="info-item">
            <span className="info-icon">💼</span>
            <span className="info-text">Control de Ventas y Reportes</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🤖</span>
            <span className="info-text">Recomendaciones Inteligentes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
