import React, { useState } from 'react';
import { usuarios } from '../data/mockData';
import '../styles/Login.css';

/**
 * Componente Login - Maneja la autenticación de usuarios
 * Incluye validación de credenciales y redirección según rol
 */
const Login = ({ onLogin }) => {
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
   * Valida las credenciales y redirige según el rol
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
    
    // Simula un delay de red (como si fuera una petición real)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Busca el usuario en los datos simulados
      const usuario = usuarios.find(user => 
        user.username === formData.username && 
        user.password === formData.password
      );
      
      if (usuario) {
        // Si encuentra el usuario, llama a la función onLogin con los datos
        onLogin(usuario);
        setError(''); // Limpia cualquier error
      } else {
        // Si no encuentra el usuario, muestra error
        setError('Credenciales incorrectas. Intenta nuevamente.');
      }
    } catch (err) {
      // Maneja errores inesperados
      setError('Error al procesar el login. Intenta nuevamente.');
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

        {/* Información de usuarios de prueba */}
        <div className="demo-credentials">
          <h4>👥 Usuarios de Prueba:</h4>
          <div className="credential-item">
            <strong>Admin:</strong> admin / admin123
          </div>
          <div className="credential-item">
            <strong>Vendedor:</strong> vendedor / vendedor123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
