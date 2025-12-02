/**
 * Configuración de URLs del Backend - Habibbi Café
 * 
 * Este archivo contiene todas las URLs del backend API
 * para que el frontend pueda conectarse correctamente
 * 
 * FUNCIONALIDADES:
 * - Detecta automáticamente si está en desarrollo local o producción
 * - Define todas las URLs de los endpoints del API
 * - Proporciona funciones auxiliares para construir URLs
 * - Configura headers y timeouts por defecto
 */

// =====================================================
// CONFIGURACIÓN DE URLS DEL BACKEND
// =====================================================

// Detectar si estamos en desarrollo local o producción
// Compara el hostname de la URL actual con localhost o 127.0.0.1
// Si coincide, estamos en desarrollo local (XAMPP)
// Si no coincide, estamos en producción (servidor en línea)
// window.location.hostname obtiene el dominio de la URL actual (ej: "localhost" o "habibbi.cl")
const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Objeto de configuración principal que contiene todas las URLs del API
// Se exporta para que otros archivos puedan importarlo y usar las URLs
const API_CONFIG = {
    // URL base del backend - punto de entrada para todas las peticiones API
    // Se selecciona automáticamente según el entorno (desarrollo o producción)
    // 
    // OPERADOR TERNARIO: condición ? valor_si_verdadero : valor_si_falso
    // Si isLocalDevelopment es true, usa la URL local
    // Si isLocalDevelopment es false, usa la URL de producción
    BASE_URL: isLocalDevelopment 
        ? 'http://localhost/habibbi-api'            // URL para desarrollo local (XAMPP)
                                                    // http://localhost es el servidor local
                                                    // /habibbi-api es la ruta donde está el backend
        : 'https://habibbi.cl/habibbi-backend',     // URL para producción (servidor en línea)
                                                    // https://habibbi.cl es el dominio del servidor
                                                    // /habibbi-backend es la ruta donde está el backend
    
    // Endpoints de autenticación - rutas para login, verificación y logout
    // Estas rutas se concatenan con BASE_URL para formar la URL completa
    // Ejemplo: BASE_URL + AUTH.LOGIN = 'http://localhost/habibbi-backend/api/auth/login'
    AUTH: {
        LOGIN: '/api/auth/login',      // Endpoint para iniciar sesión (POST con correo y contraseña)
        VERIFY: '/api/auth/verify',     // Endpoint para verificar si el token es válido (GET)
        LOGOUT: '/api/auth/logout'     // Endpoint para cerrar sesión (POST)
    },
    
    // Endpoints de usuarios
    USUARIOS: {
        LIST: '/api/usuarios',
        GET: '/api/usuarios',
        CREATE: '/api/usuarios',
        UPDATE: '/api/usuarios',
        DELETE: '/api/usuarios'
    },
    
    // Endpoints de clientes
    CLIENTES: {
        LIST: '/api/clientes',
        GET: '/api/clientes',
        CREATE: '/api/clientes',
        UPDATE: '/api/clientes',
        DELETE: '/api/clientes',
        VENTAS: '/api/clientes'
    },
    
    // Endpoints de productos
    PRODUCTOS: {
        LIST: '/api/productos',
        GET: '/api/productos',
        CREATE: '/api/productos',
        UPDATE: '/api/productos',
        DELETE: '/api/productos',
        STOCK: '/api/productos',
        REACTIVAR: '/api/productos'
    },
    
    // Endpoints de insumos
    INSUMOS: {
        LIST: '/api/insumos',
        GET: '/api/insumos',
        CREATE: '/api/insumos',
        UPDATE: '/api/insumos',
        DELETE: '/api/insumos',
        GET_DEPENDENCIES: '/api/insumos/dependencias'
    },
    
    // Endpoints de recetas
    RECETAS: {
        LIST: '/api/recetas',
        GET: '/api/recetas',
        CREATE: '/api/recetas',
        UPDATE: '/api/recetas',
        DELETE: '/api/recetas'
    },
    
    // Endpoints de ventas
    VENTAS: {
        LIST: '/api/ventas',
        GET: '/api/ventas',
        CREATE: '/api/ventas',
        UPDATE: '/api/ventas',
        DELETE: '/api/ventas'
    },
    
    // Endpoints de caja
    CAJA: {
        LIST: '/api/caja',
        GET: '/api/caja',
        CREATE: '/api/caja',
        UPDATE: '/api/caja',
        DELETE: '/api/caja'
    },
    
    // Endpoints de dashboard
    DASHBOARD: {
        ADMIN: '/api/dashboard/admin',
        VENDEDOR: '/api/dashboard/vendedor'
    },
    
    // Endpoints de estadísticas
    ESTADISTICAS: {
        VENTAS: '/api/estadisticas/ventas',
        PRODUCTOS: '/api/estadisticas/productos'
    },
    
    // Endpoints de Machine Learning
    ML: {
        PREDICCION_ESTACION: '/api/ml/prediccion-estacion',
        PRODUCTOS_ESTACION: '/api/ml/productos-estacion',
        RECOMENDACIONES: '/api/ml/recomendaciones'
    },
    
    // Endpoints de Reportes
    REPORTES: {
        VENTAS: '/api/reportes/ventas',
        PRODUCTOS: '/api/reportes/productos',
        VENDEDORES: '/api/reportes/vendedores',
        MENSUAL: '/api/reportes/mensual',
        SEMANAL: '/api/reportes/semanal',
        EXPORTAR: '/api/reportes/exportar-excel'
    },
    
    // Health check
    HEALTH: '/api/health'
};

// =====================================================
// FUNCIONES AUXILIARES PARA CONSTRUIR URLs
// =====================================================

/**
 * Construye una URL completa del API concatenando BASE_URL con el endpoint
 * 
 * Esta función ayuda a construir URLs de forma consistente en toda la aplicación
 * 
 * EJEMPLO DE USO:
 * buildApiUrl(API_CONFIG.USUARIOS.GET, 5)
 * // Retorna: 'http://localhost/habibbi-backend/api/usuarios/5'
 * 
 * @param {string} endpoint - Endpoint del API (ej: '/api/usuarios')
 * @param {string|number} id - ID opcional para endpoints específicos (ej: 5 para obtener usuario con ID 5)
 * @returns {string} URL completa lista para usar en peticiones HTTP
 */
export const buildApiUrl = (endpoint, id = null) => {
    // Inicia con la URL base y concatena el endpoint
    // Ejemplo: 'http://localhost/habibbi-backend' + '/api/usuarios' = 'http://localhost/habibbi-backend/api/usuarios'
    let url = API_CONFIG.BASE_URL + endpoint;
    
    // Si se proporciona un ID, lo agrega al final de la URL
    // Ejemplo: si id = 5, la URL se convierte en '.../api/usuarios/5'
    // Template literals (backticks) permiten interpolar variables con ${}
    if (id) {
        url += `/${id}`;
    }
    
    // Retorna la URL completa construida
    return url;
};

/**
 * Construye URL para endpoints con sub-recursos
 * @param {string} endpoint - Endpoint base
 * @param {string|number} id - ID del recurso principal
 * @param {string} subResource - Sub-recurso
 * @returns {string} URL completa
 */
export const buildSubResourceUrl = (endpoint, id, subResource) => {
    return `${API_CONFIG.BASE_URL}${endpoint}/${id}/${subResource}`;
};

// =====================================================
// CONFIGURACIÓN DE HEADERS POR DEFECTO
// =====================================================

export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

/**
 * Construye headers con autorización
 * @param {string} token - Token de autenticación
 * @returns {object} Headers con autorización
 */
export const buildAuthHeaders = (token) => {
    return {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
    };
};

// =====================================================
// CONFIGURACIÓN DE TIMEOUTS
// =====================================================

export const REQUEST_TIMEOUTS = {
    DEFAULT: 10000,      // 10 segundos
    UPLOAD: 30000,       // 30 segundos para subidas
    DOWNLOAD: 60000      // 60 segundos para descargas
};

// =====================================================
// EXPORTAR CONFIGURACIÓN COMPLETA
// =====================================================

export default API_CONFIG;