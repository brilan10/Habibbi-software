/**
 * Configuración de Axios para Habibbi Café
 * Maneja automáticamente errores, timeouts y headers
 */

import axios from 'axios';
import API_CONFIG, { DEFAULT_HEADERS, REQUEST_TIMEOUTS } from './apiConfig';

// =====================================================
// CREAR INSTANCIA DE AXIOS CON CONFIGURACIÓN PERSONALIZADA
// =====================================================

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: REQUEST_TIMEOUTS.DEFAULT,
    headers: DEFAULT_HEADERS,
    // Configuración adicional para mejor compatibilidad
    withCredentials: false, // No enviar cookies automáticamente
    validateStatus: function (status) {
        // Considerar como exitoso cualquier código de estado menor que 500
        return status < 500;
    }
});

// =====================================================
// INTERCEPTORES DE REQUEST (ANTES DE ENVIAR)
// =====================================================

apiClient.interceptors.request.use(
    (config) => {
        // Log de requests para debugging
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params
        });
        
        // Agregar timestamp para evitar caché
        if (config.method === 'get') {
            config.params = {
                ...config.params,
                _t: Date.now()
            };
        }
        
        return config;
    },
    (error) => {
        console.error('❌ Error en request interceptor:', error);
        return Promise.reject(error);
    }
);

// =====================================================
// INTERCEPTORES DE RESPONSE (DESPUÉS DE RECIBIR)
// =====================================================

apiClient.interceptors.response.use(
    (response) => {
        // Log de responses exitosos
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`, {
            data: response.data
        });
        
        return response;
    },
    (error) => {
        // Log detallado de errores
        console.error('❌ Error en response interceptor:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method
        });
        
        // Manejo específico de errores comunes
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ Timeout: La petición tardó demasiado');
            error.message = 'La petición tardó demasiado tiempo. Verifica tu conexión.';
        } else if (error.code === 'NETWORK_ERROR' || !error.response) {
            console.error('🌐 Error de red: No se pudo conectar al servidor');
            error.message = 'No se pudo conectar al servidor. Verifica que el backend esté ejecutándose.';
        } else if (error.response?.status === 500) {
            console.error('🔥 Error interno del servidor');
            error.message = 'Error interno del servidor. Verifica los logs del backend.';
        } else if (error.response?.status === 404) {
            console.error('🔍 Recurso no encontrado');
            error.message = 'El recurso solicitado no fue encontrado.';
        } else if (error.response?.status === 400) {
            console.error('📝 Error de validación');
            error.message = error.response?.data?.error || 'Datos inválidos enviados.';
        }
        
        return Promise.reject(error);
    }
);

// =====================================================
// FUNCIONES AUXILIARES PARA DIFERENTES TIPOS DE REQUEST
// =====================================================

/**
 * Realiza una petición GET
 * @param {string} endpoint - Endpoint del API
 * @param {object} params - Parámetros de consulta
 * @returns {Promise} Respuesta de la petición
 */
export const apiGet = (endpoint, params = {}) => {
    return apiClient.get(endpoint, { params });
};

/**
 * Realiza una petición POST
 * @param {string} endpoint - Endpoint del API
 * @param {object} data - Datos a enviar
 * @returns {Promise} Respuesta de la petición
 */
export const apiPost = (endpoint, data = {}) => {
    return apiClient.post(endpoint, data);
};

/**
 * Realiza una petición PUT
 * @param {string} endpoint - Endpoint del API
 * @param {object} data - Datos a enviar
 * @returns {Promise} Respuesta de la petición
 */
export const apiPut = (endpoint, data = {}) => {
    return apiClient.put(endpoint, data);
};

/**
 * Realiza una petición DELETE
 * @param {string} endpoint - Endpoint del API
 * @returns {Promise} Respuesta de la petición
 */
export const apiDelete = (endpoint) => {
    return apiClient.delete(endpoint);
};

// =====================================================
// FUNCIONES ESPECÍFICAS PARA INSUMOS
// =====================================================

/**
 * Obtiene la lista de insumos
 * @returns {Promise} Lista de insumos
 */
export const getInsumos = () => {
    return apiGet(API_CONFIG.INSUMOS.LIST);
};

/**
 * Obtiene un insumo específico
 * @param {number} id - ID del insumo
 * @returns {Promise} Datos del insumo
 */
export const getInsumo = (id) => {
    return apiGet(`${API_CONFIG.INSUMOS.GET}/${id}`);
};

/**
 * Crea un nuevo insumo
 * @param {object} insumoData - Datos del insumo
 * @returns {Promise} Respuesta de la creación
 */
export const createInsumo = (insumoData) => {
    return apiPost(API_CONFIG.INSUMOS.CREATE, insumoData);
};

/**
 * Actualiza un insumo existente
 * @param {number} id - ID del insumo
 * @param {object} insumoData - Datos actualizados
 * @returns {Promise} Respuesta de la actualización
 */
export const updateInsumo = (id, insumoData) => {
    return apiPut(`${API_CONFIG.INSUMOS.UPDATE}/${id}`, insumoData);
};

/**
 * Elimina un insumo (soft delete)
 * @param {number} id - ID del insumo
 * @returns {Promise} Respuesta de la eliminación
 */
export const deleteInsumo = (id) => {
    return apiDelete(`${API_CONFIG.INSUMOS.DELETE}/${id}`);
};

// =====================================================
// EXPORTAR CLIENTE Y FUNCIONES
// =====================================================

export default apiClient;
export { apiClient };
