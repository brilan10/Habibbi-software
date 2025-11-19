/**
 * Configuración de Axios para Habibbi Café
 * 
 * Axios es una biblioteca para hacer peticiones HTTP al backend
 * Este archivo configura una instancia personalizada de Axios con:
 * - URLs base automáticas
 * - Manejo de errores centralizado
 * - Timeouts configurados
 * - Headers por defecto
 * - Interceptores para logging y manejo de errores
 * 
 * FUNCIONALIDADES:
 * - Intercepta todas las peticiones antes de enviarlas
 * - Intercepta todas las respuestas antes de procesarlas
 * - Maneja errores de red, timeout y del servidor
 * - Proporciona funciones auxiliares para GET, POST, PUT, DELETE
 */

// Importar axios - biblioteca para hacer peticiones HTTP
// axios es más potente que fetch() nativo porque tiene interceptores, timeouts automáticos, etc.
import axios from 'axios';

// Importar configuración del API desde apiConfig.js
// API_CONFIG contiene las URLs base y endpoints
// DEFAULT_HEADERS contiene los headers que se envían en cada petición
// REQUEST_TIMEOUTS contiene los tiempos límite para diferentes tipos de peticiones
import API_CONFIG, { DEFAULT_HEADERS, REQUEST_TIMEOUTS } from './apiConfig';

// =====================================================
// CREAR INSTANCIA DE AXIOS CON CONFIGURACIÓN PERSONALIZADA
// =====================================================

/**
 * Instancia personalizada de Axios
 * 
 * axios.create() crea una nueva instancia con configuración personalizada
 * Todas las peticiones hechas con esta instancia usarán esta configuración
 * 
 * VENTAJAS:
 * - No necesitas especificar la URL base en cada petición
 * - Los interceptores se aplican automáticamente
 * - Timeouts y headers se configuran una sola vez
 */
const apiClient = axios.create({
    // URL base que se antepone a todos los endpoints
    // Ejemplo: si endpoint es '/api/usuarios', la URL completa será BASE_URL + '/api/usuarios'
    baseURL: API_CONFIG.BASE_URL,
    
    // Tiempo máximo de espera para una petición (en milisegundos)
    // Si la petición tarda más, se cancela automáticamente
    // REQUEST_TIMEOUTS.DEFAULT es 10000 (10 segundos)
    timeout: REQUEST_TIMEOUTS.DEFAULT,
    
    // Headers que se envían en todas las peticiones
    // DEFAULT_HEADERS contiene 'Content-Type: application/json' y 'Accept: application/json'
    headers: DEFAULT_HEADERS,
    
    // Configuración adicional para mejor compatibilidad
    // withCredentials: false significa que NO se envían cookies automáticamente
    // Esto es importante para evitar problemas de CORS en algunos servidores
    withCredentials: false,
    
    // Función personalizada para validar códigos de estado HTTP
    // Por defecto, axios solo considera exitosos los códigos 200-299
    // Esta función considera exitosos todos los códigos menores a 500
    // Esto permite manejar errores 400, 401, 404, etc. en los interceptores
    validateStatus: function (status) {
        // Retorna true si el código es menor a 500 (considerado exitoso)
        // Retorna false si el código es 500 o mayor (error del servidor)
        return status < 500;
    }
});

// =====================================================
// INTERCEPTORES DE REQUEST (ANTES DE ENVIAR)
// =====================================================

/**
 * Interceptor de Request
 * 
 * Se ejecuta ANTES de enviar cada petición HTTP
 * Permite modificar la configuración de la petición antes de enviarla
 * 
 * CASOS DE USO:
 * - Agregar headers de autenticación
 * - Agregar parámetros para evitar caché
 * - Logging de peticiones para debugging
 * - Transformar datos antes de enviarlos
 */
apiClient.interceptors.request.use(
    /**
     * Función que se ejecuta cuando la petición se envía exitosamente
     * 
     * @param {Object} config - Configuración de la petición (URL, método, datos, headers, etc.)
     * @returns {Object} config - Configuración modificada (o sin modificar)
     */
    (config) => {
        // Log de requests para debugging
        // Muestra en la consola qué petición se está enviando
        // config.method es el método HTTP (GET, POST, PUT, DELETE)
        // ?. es optional chaining - evita errores si method es undefined
        // toUpperCase() convierte a mayúsculas para mejor legibilidad
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,        // Datos que se envían en el body (POST, PUT)
            params: config.params     // Parámetros de la URL (GET)
        });
        
        // Agregar timestamp para evitar caché en peticiones GET
        // Esto fuerza al navegador a obtener datos frescos del servidor
        // Útil cuando el servidor no tiene headers de caché configurados correctamente
        if (config.method === 'get') {
            // Spread operator (...) copia los parámetros existentes
            // Luego agrega _t con el timestamp actual
            // _t es un parámetro común usado para evitar caché
            config.params = {
                ...config.params,     // Parámetros existentes (si los hay)
                _t: Date.now()        // Timestamp actual en milisegundos
            };
        }
        
        // Retornar la configuración (modificada o sin modificar)
        // Si no retornas config, la petición fallará
        return config;
    },
    /**
     * Función que se ejecuta si hay un error ANTES de enviar la petición
     * 
     * Esto puede ocurrir si:
     * - La configuración de la petición es inválida
     * - Hay un error al preparar la petición
     * 
     * @param {Error} error - Objeto de error
     * @returns {Promise} - Promise rechazada con el error
     */
    (error) => {
        // Log del error para debugging
        console.error('❌ Error en request interceptor:', error);
        
        // Rechazar la Promise con el error
        // Esto hace que la petición falle y se ejecute el catch() correspondiente
        return Promise.reject(error);
    }
);

// =====================================================
// INTERCEPTORES DE RESPONSE (DESPUÉS DE RECIBIR)
// =====================================================

/**
 * Interceptor de Response
 * 
 * Se ejecuta DESPUÉS de recibir la respuesta del servidor
 * Permite procesar o transformar la respuesta antes de que llegue al código que hizo la petición
 * 
 * CASOS DE USO:
 * - Logging de respuestas para debugging
 * - Transformar datos de la respuesta
 * - Manejar errores de forma centralizada
 * - Extraer datos de respuestas anidadas
 */
apiClient.interceptors.response.use(
    /**
     * Función que se ejecuta cuando la respuesta es exitosa (código < 500)
     * 
     * @param {Object} response - Objeto de respuesta de Axios
     *                           Contiene: data, status, headers, config, etc.
     * @returns {Object} response - Respuesta (modificada o sin modificar)
     */
    (response) => {
        // Log de responses exitosos para debugging
        // Muestra en la consola qué respuesta se recibió
        // response.config contiene la configuración de la petición original
        // response.status es el código HTTP (200, 201, etc.)
        // response.data contiene los datos devueltos por el servidor
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`, {
            data: response.data
        });
        
        // Retornar la respuesta sin modificar
        // Esto permite que el código que hizo la petición reciba la respuesta normalmente
        return response;
    },
    /**
     * Función que se ejecuta cuando hay un error en la respuesta
     * 
     * Esto puede ocurrir si:
     * - El servidor retorna un código de error (500, 404, etc.)
     * - Hay un error de red (no se puede conectar al servidor)
     * - La petición excede el timeout
     * 
     * @param {Error} error - Objeto de error de Axios
     *                       Puede contener: message, code, response, config, etc.
     * @returns {Promise} - Promise rechazada con el error (posiblemente modificado)
     */
    (error) => {
        // Log detallado de errores para debugging
        // Muestra toda la información disponible del error
        console.error('❌ Error en response interceptor:', {
            message: error.message,                    // Mensaje de error
            status: error.response?.status,            // Código HTTP de error (si hay respuesta)
            statusText: error.response?.statusText,    // Texto del código HTTP
            data: error.response?.data,               // Datos del error del servidor
            url: error.config?.url,                   // URL de la petición que falló
            method: error.config?.method              // Método HTTP de la petición
        });
        
        // Manejo específico de diferentes tipos de errores
        // Esto mejora los mensajes de error para que sean más comprensibles
        
        // Error de timeout - la petición tardó más del tiempo límite
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ Timeout: La petición tardó demasiado');
            // Modificar el mensaje de error para que sea más claro
            error.message = 'La petición tardó demasiado tiempo. Verifica tu conexión.';
        } 
        // Error de red - no se pudo conectar al servidor
        else if (error.code === 'NETWORK_ERROR' || !error.response) {
            console.error('🌐 Error de red: No se pudo conectar al servidor');
            // error.response es null cuando no hay respuesta del servidor
            error.message = 'No se pudo conectar al servidor. Verifica que el backend esté ejecutándose.';
        } 
        // Error 500 - error interno del servidor
        else if (error.response?.status === 500) {
            console.error('🔥 Error interno del servidor');
            error.message = 'Error interno del servidor. Verifica los logs del backend.';
        } 
        // Error 404 - recurso no encontrado
        else if (error.response?.status === 404) {
            console.error('🔍 Recurso no encontrado');
            error.message = 'El recurso solicitado no fue encontrado.';
        } 
        // Error 400 - error de validación (datos inválidos)
        else if (error.response?.status === 400) {
            console.error('📝 Error de validación');
            // Intentar obtener el mensaje de error del servidor
            // Si no existe, usar un mensaje por defecto
            error.message = error.response?.data?.error || 'Datos inválidos enviados.';
        }
        
        // Rechazar la Promise con el error (posiblemente modificado)
        // Esto hace que el código que hizo la petición pueda manejar el error con .catch()
        return Promise.reject(error);
    }
);

// =====================================================
// FUNCIONES AUXILIARES PARA DIFERENTES TIPOS DE REQUEST
// =====================================================

// =====================================================
// FUNCIONES AUXILIARES PARA DIFERENTES TIPOS DE REQUEST
// =====================================================

/**
 * Realiza una petición GET
 * 
 * GET se usa para obtener datos del servidor
 * Los parámetros se envían en la URL como query parameters
 * 
 * EJEMPLO DE USO:
 * apiGet('/api/usuarios', { activo: 1 })
 * // Hace: GET /api/usuarios?activo=1
 * 
 * @param {string} endpoint - Endpoint del API (ej: '/api/usuarios')
 * @param {object} params - Parámetros de consulta que se agregan a la URL (opcional)
 *                         Ejemplo: { activo: 1, categoria: 'cafe' }
 * @returns {Promise} Promise que se resuelve con la respuesta del servidor
 *                   Puedes usar .then() o await para obtener los datos
 */
export const apiGet = (endpoint, params = {}) => {
    // apiClient.get() hace una petición GET
    // { params } es un objeto de configuración que contiene los parámetros de consulta
    // Axios automáticamente los convierte a query parameters en la URL
    return apiClient.get(endpoint, { params });
};

/**
 * Realiza una petición POST
 * 
 * POST se usa para crear nuevos recursos o enviar datos al servidor
 * Los datos se envían en el body de la petición (no en la URL)
 * 
 * EJEMPLO DE USO:
 * apiPost('/api/usuarios', { nombre: 'Juan', correo: 'juan@email.com' })
 * // Hace: POST /api/usuarios con el objeto en el body
 * 
 * @param {string} endpoint - Endpoint del API (ej: '/api/usuarios')
 * @param {object} data - Datos a enviar en el body de la petición (opcional)
 *                       Se convierte automáticamente a JSON
 * @returns {Promise} Promise que se resuelve con la respuesta del servidor
 */
export const apiPost = (endpoint, data = {}) => {
    // apiClient.post() hace una petición POST
    // El segundo parámetro son los datos que se envían en el body
    // Axios automáticamente los convierte a JSON y agrega el header Content-Type
    return apiClient.post(endpoint, data);
};

/**
 * Realiza una petición PUT
 * 
 * PUT se usa para actualizar recursos existentes
 * Los datos se envían en el body de la petición
 * 
 * EJEMPLO DE USO:
 * apiPut('/api/usuarios/5', { nombre: 'Juan Actualizado' })
 * // Hace: PUT /api/usuarios/5 con el objeto en el body
 * 
 * @param {string} endpoint - Endpoint del API con el ID del recurso (ej: '/api/usuarios/5')
 * @param {object} data - Datos actualizados a enviar en el body (opcional)
 * @returns {Promise} Promise que se resuelve con la respuesta del servidor
 */
export const apiPut = (endpoint, data = {}) => {
    // apiClient.put() hace una petición PUT
    // Similar a POST, pero PUT indica que es una actualización
    return apiClient.put(endpoint, data);
};

/**
 * Realiza una petición DELETE
 * 
 * DELETE se usa para eliminar recursos del servidor
 * No envía datos en el body, solo la URL con el ID del recurso
 * 
 * EJEMPLO DE USO:
 * apiDelete('/api/usuarios/5')
 * // Hace: DELETE /api/usuarios/5
 * 
 * @param {string} endpoint - Endpoint del API con el ID del recurso a eliminar
 *                           Ejemplo: '/api/usuarios/5'
 * @returns {Promise} Promise que se resuelve con la respuesta del servidor
 */
export const apiDelete = (endpoint) => {
    // apiClient.delete() hace una petición DELETE
    // No necesita datos en el body, solo la URL con el ID
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
