/**
 * Configuración de URLs del Backend - Habibbi Café
 * 
 * Este archivo contiene todas las URLs del backend API
 * para que el frontend pueda conectarse correctamente
 */

// =====================================================
// CONFIGURACIÓN DE URLS DEL BACKEND
// =====================================================

// Detectar si estamos en desarrollo local
const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_CONFIG = {
    // URL base del backend
    // En desarrollo local: usa XAMPP local
    // En producción: usa el servidor de producción
    BASE_URL: isLocalDevelopment 
        ? 'http://localhost/habibbi-backend'  // XAMPP local
        : 'https://habibbi.cl/habibbi-backend',
    
    // Endpoints de autenticación
    AUTH: {
        LOGIN: '/api/auth/login',
        VERIFY: '/api/auth/verify',
        LOGOUT: '/api/auth/logout'
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
 * Construye una URL completa del API
 * @param {string} endpoint - Endpoint del API
 * @param {string|number} id - ID opcional para endpoints específicos
 * @returns {string} URL completa
 */
export const buildApiUrl = (endpoint, id = null) => {
    let url = API_CONFIG.BASE_URL + endpoint;
    if (id) {
        url += `/${id}`;
    }
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