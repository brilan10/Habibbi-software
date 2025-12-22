import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { apiGet } from '../config/axiosConfig';
import apiClient from '../config/axiosConfig';
import API_CONFIG from '../config/apiConfig';
import { useNotification } from '../hooks/useNotification';
import NotificationContainer from '../components/NotificationContainer';
import '../styles/Dashboard.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/**
 * Componente Dashboard - Panel principal para administradores
 * Muestra estadísticas clave del negocio y alertas importantes
 */
const Dashboard = () => {
  // Hook para notificaciones
  const { notifications, showSuccess, showError, removeNotification } = useNotification();
  
  // Ref para mantener la posición del scroll
  const scrollPositionRef = useRef(0);
  
  // Estado para almacenar los datos del dashboard
  const [datos, setDatos] = useState({
    ventasHoy: 0,
    productoMasVendido: '',
    insumosBajos: [],
    totalVentas: 0,
    clientesNuevos: 0
  });
  
  // Helper: estación actual
  // NOTA: Para la presentación actual se fuerza a "primavera".
  //       Si más adelante quieres que sea automática según mes,
  //       comenta la primera línea del return y descomenta la lógica por mes.
  const obtenerEstacionActual = () => {
    return 'primavera'; // <- estación fija
    /*
    const mes = new Date().getMonth(); // 0=enero
    if (mes === 11 || mes === 0 || mes === 1) return 'verano';
    if (mes >= 2 && mes <= 4) return 'otoño';
    if (mes >= 5 && mes <= 7) return 'invierno';
    if (mes >= 8 && mes <= 10) return 'primavera';
    return 'todas';
    */
  };
  const estacionActual = obtenerEstacionActual();

  // Estado para la carga de datos
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [actualizacionesAutomaticas, setActualizacionesAutomaticas] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  
  // Estado para Machine Learning
  const [prediccionEstacion, setPrediccionEstacion] = useState(null);
  const [productosEstacion, setProductosEstacion] = useState([]);
  const [productosCafeEstacion, setProductosCafeEstacion] = useState([]);
  const [productosDulcesEstacion, setProductosDulcesEstacion] = useState([]);
  const [productosPanaderiaEstacion, setProductosPanaderiaEstacion] = useState([]);
  const [productosPasteleriaEstacion, setProductosPasteleriaEstacion] = useState([]);
  const [productosEnergizantesEstacion, setProductosEnergizantesEstacion] = useState([]);
  const [productosEmpanadasEstacion, setProductosEmpanadasEstacion] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [cargandoML, setCargandoML] = useState(false);
  const [datosGraficos, setDatosGraficos] = useState(null);
  
  // Estado para todos los productos de la BD (fallback cuando ML está vacío)
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  
  // Estado para filtro de categoría del gráfico único
  const [categoriaFiltroGrafico, setCategoriaFiltroGrafico] = useState('todas'); // 'todas', 'cafes', 'dulces', 'panaderia', 'pasteleria', 'energizantes', 'empanadas'
  
  // Estado para filtro de estación del gráfico único
  const [estacionFiltroGrafico, setEstacionFiltroGrafico] = useState(estacionActual); // 'todas', 'verano', 'otoño', 'invierno', 'primavera'
  
  // Estado para filtro de estación de los gráficos principales (Tendencia, Top 5, Distribución)
  const [estacionFiltroGraficosPrincipales, setEstacionFiltroGraficosPrincipales] = useState(estacionActual); // 'todas', 'verano', 'otoño', 'invierno', 'primavera'
  
  // Estado para filtro de categoría de sugerencias ML
  // Categorías reales de la BD: Café, Té, Pastelería, Empanadas, Sándwiches, Bebidas
  const [categoriaFiltroSugerencias, setCategoriaFiltroSugerencias] = useState('cafe');
  
  // Estado para gráfico comparativo de meses
  const fechaActual = new Date();
  const mesActual = fechaActual.toISOString().slice(0, 7); // YYYY-MM
  const [mesComparacion1, setMesComparacion1] = useState(mesActual);
  const [mesComparacion2, setMesComparacion2] = useState('');
  const [tipoComparacion, setTipoComparacion] = useState('cantidad'); // 'cantidad' o 'ventas'
  const [datosGraficoComparacionMes1, setDatosGraficoComparacionMes1] = useState(null);
  const [datosGraficoComparacionMes2, setDatosGraficoComparacionMes2] = useState(null);
  const [resumenComparacionMes1, setResumenComparacionMes1] = useState(null);
  const [resumenComparacionMes2, setResumenComparacionMes2] = useState(null);
  const [cargandoComparacion, setCargandoComparacion] = useState(false);
  
  // Estado para alertas de stock
  const [alertasStock, setAlertasStock] = useState([]);
  const [verificandoStock, setVerificandoStock] = useState(false);
  
  // Estado para productos más vendidos durante todo el año
  const [productosAnuales, setProductosAnuales] = useState([]);
  const [categoriasAnuales, setCategoriasAnuales] = useState([]);
  const [cargandoAnuales, setCargandoAnuales] = useState(false);
  const [mesesFiltroAnuales, setMesesFiltroAnuales] = useState(3); // Por defecto 3 meses

  /**
   * Función helper para formatear un mes en formato YYYY-MM a nombre de mes en español
   * Evita problemas de zona horaria usando directamente el string
   */
  const formatearMes = (mesAno) => {
    if (!mesAno || !mesAno.includes('-')) {
      return 'Mes';
    }
    const [ano, mes] = mesAno.split('-');
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const indiceMes = parseInt(mes, 10) - 1;
    if (indiceMes >= 0 && indiceMes < 12) {
      return `${meses[indiceMes]} de ${ano}`;
    }
    return mesAno;
  };

  /**
   * Función para actualizar todos los datos del dashboard
   * Se llama cuando el usuario presiona el botón de actualizar
   */
  const actualizarDatos = async () => {
    console.log('🔄 Actualizando todos los datos del dashboard...');
    setActualizando(true);
    setError(null);
    
    try {
      // Limpiar caché local relevante (sin cerrar sesión)
      const keysCache = [
        'habibbi_productos',
        'habibbi_insumos',
        'habibbi_recetas',
        'habibbi_ventas',
        'habibbi_dashboard'
      ];
      keysCache.forEach((k) => {
        try { localStorage.removeItem(k); } catch (e) { /* noop */ }
        try { sessionStorage.removeItem(k); } catch (e) { /* noop */ }
      });
      console.log('🧹 Caché local limpiada para claves:', keysCache);
      
      // Cargar datos principales del dashboard
      await cargarDatos(false); // false = no mostrar loading inicial
      
      // Cargar predicciones de ML
      await cargarPrediccionesML();
      
      // Verificar stock bajo
      await verificarStockBajo();
      
      console.log('✅ Todos los datos actualizados correctamente');
      
      // Mostrar mensaje de éxito bonito
      showSuccess('🎉 Dashboard actualizado correctamente desde la base de datos');
    } catch (err) {
      console.error('❌ Error al actualizar datos:', err);
      showError('Error al actualizar: no se pudieron actualizar todos los datos. Por favor, intenta nuevamente.');
    } finally {
      setActualizando(false);
    }
  };

  /**
   * Función para cargar datos del dashboard desde el backend
   */
  const cargarDatos = async (mostrarLoading = true) => {
    try {
      if (mostrarLoading) {
        setCargando(true);
      }
      setError(null);
      
      console.log('📊 Cargando datos del dashboard desde el backend...');
      console.log('📍 URL:', API_CONFIG.BASE_URL + API_CONFIG.DASHBOARD.ADMIN);
      
      // Hacer petición al backend
      const response = await apiGet(API_CONFIG.DASHBOARD.ADMIN);
      
      console.log('📥 Respuesta completa del backend:', response);
      console.log('📥 response.data:', response.data);
      console.log('📥 response.status:', response.status);
      
      // Verificar que la respuesta existe
      if (!response || !response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      const responseData = response.data;
      
      // Verificar diferentes formatos de respuesta
      let backendData = null;
      if (responseData.success && responseData.data) {
        // Formato estándar: { success: true, data: {...} }
        backendData = responseData.data;
      } else if (responseData.ventas_hoy !== undefined || responseData.total_ventas_hoy !== undefined) {
        // Si los datos vienen directamente
        backendData = responseData;
      } else if (responseData.error) {
        throw new Error(responseData.error || 'Error del servidor');
      } else {
        throw new Error('Formato de respuesta inválido del backend. Respuesta recibida: ' + JSON.stringify(responseData));
      }
      
      // Mapear datos del backend al formato esperado por el frontend
      // IMPORTANTE: ventasHoy debe ser el TOTAL de montos del día (total_ventas_hoy)
      // totalVentas es el número de transacciones del día (ventas_hoy)
      setDatos({
        ventasHoy: parseFloat(backendData.total_ventas_hoy) || 0, // Total de montos del día
        productoMasVendido: backendData.producto_mas_vendido || 'N/A', // Se actualizará con ML después
        insumosBajos: (backendData.insumos_bajos || []).map(insumo => ({
          nombre: insumo.nombre || insumo.nombre_insumo || 'Sin nombre',
          cantidad: parseFloat(insumo.stock || insumo.cantidad || 0),
          stock: parseFloat(insumo.stock || insumo.cantidad || 0),
          stockMinimo: parseFloat(insumo.alerta_stock || insumo.stockMinimo || 0),
          alerta_stock: parseFloat(insumo.alerta_stock || insumo.stockMinimo || 0),
          unidad: insumo.unidad || ''
        })).filter(insumo => insumo.stock <= insumo.stockMinimo),
        totalVentas: parseInt(backendData.ventas_hoy) || 0, // Número de transacciones del día
        clientesNuevos: parseInt(backendData.clientes_nuevos) || 0
      });
      
      console.log('📊 Datos del dashboard mapeados:', {
        ventasHoy: parseFloat(backendData.total_ventas_hoy) || 0,
        totalVentas: parseInt(backendData.ventas_hoy) || 0,
        productoMasVendido: backendData.producto_mas_vendido || 'N/A'
      });
      
      console.log('✅ Datos del dashboard cargados correctamente:', backendData);
      
      // Actualizar alertas de stock si hay insumos bajos
      if (backendData.insumos_bajos && backendData.insumos_bajos.length > 0) {
        const alertasMapeadas = backendData.insumos_bajos.map(insumo => ({
          nombre: insumo.nombre || insumo.nombre_insumo || 'Sin nombre',
          cantidad: parseFloat(insumo.stock || insumo.cantidad || 0),
          stock: parseFloat(insumo.stock || insumo.cantidad || 0),
          stockMinimo: parseFloat(insumo.alerta_stock || insumo.stockMinimo || 0),
          alerta_stock: parseFloat(insumo.alerta_stock || insumo.stockMinimo || 0),
          unidad: insumo.unidad || ''
        })).filter(insumo => insumo.stock <= insumo.stockMinimo);
        
        if (alertasMapeadas.length > 0) {
          setAlertasStock(alertasMapeadas);
          console.log(`✅ ${alertasMapeadas.length} insumos con stock bajo actualizados desde cargarDatos`);
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar datos del dashboard:', error);
      console.error('❌ Tipo de error:', error.name);
      console.error('❌ Código de error:', error.code);
      console.error('❌ Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        request: error.request,
        config: error.config
      });
      
      let errorMessage = 'Error al cargar los datos del dashboard';
      
      // Error de red (no hay respuesta del servidor)
      if (!error.response && error.request) {
        errorMessage = 'No se pudo conectar al servidor. Verifica que Apache esté corriendo y que la URL sea correcta.';
        console.error('🌐 Error de red - El servidor no respondió');
      } 
      // Error de timeout
      else if (error.code === 'ECONNABORTED') {
        errorMessage = 'La petición tardó demasiado. El servidor puede estar sobrecargado.';
      }
      // Error con respuesta del servidor
      else if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 500) {
          errorMessage = 'Error interno del servidor. Verifica los logs del backend.';
          if (data && data.error) {
            errorMessage += ' Detalles: ' + data.error;
          }
        } else if (status === 404) {
          errorMessage = 'Endpoint no encontrado. Verifica que la ruta del API sea correcta.';
        } else if (status === 403) {
          errorMessage = 'Acceso denegado. Verifica tus permisos.';
        } else if (data && data.error) {
          errorMessage = `Error ${status}: ${data.error}`;
        } else {
          errorMessage = `Error ${status}: ${error.response.statusText || 'Error desconocido'}`;
        }
      } 
      // Otro tipo de error
      else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Mantener datos por defecto en caso de error
      setDatos({
        ventasHoy: 0,
        productoMasVendido: 'N/A',
        insumosBajos: [],
        totalVentas: 0,
        clientesNuevos: 0
      });
    } finally {
      if (mostrarLoading) {
        setCargando(false);
      }
    }
  };

  /**
   * Función para cargar todos los productos de la BD CON estadísticas de ventas
   */
  const cargarTodosLosProductos = async () => {
    try {
      // Cargar productos con estadísticas
      const response = await apiClient.get(API_CONFIG.PRODUCTOS.LIST + '?estadisticas=true');
      if (response.data && response.data.success) {
        const productos = response.data.data || [];
        console.log('📦 Dashboard - Productos cargados con estadísticas:', productos.length);
        
        // Asegurar que cada producto tenga total_vendido
        const productosConVentas = productos.map(p => ({
          ...p,
          total_vendido: p.total_vendido || p.ventas_totales || 0
        }));
        
        setTodosLosProductos(productosConVentas);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      // Intentar sin estadísticas como fallback
      try {
        const response = await apiClient.get(API_CONFIG.PRODUCTOS.LIST);
        if (response.data && response.data.success) {
          setTodosLosProductos(response.data.data || []);
        }
      } catch (err) {
        console.error('Error en fallback:', err);
      }
    }
  };

  /**
   * Efecto para cargar datos del dashboard desde el backend
   */
  useEffect(() => {
    cargarDatos();
    cargarTodosLosProductos(); // Cargar productos para fallback de ML

    // Escuchar eventos personalizados de actualización
    const manejarCambioStorage = () => {
      console.log('🔄 Dashboard - Detectando cambio en datos, recargando...');
      cargarDatos();
    };

    window.addEventListener('dashboardActualizado', manejarCambioStorage);
    window.addEventListener('ventaRealizada', manejarCambioStorage);
    window.addEventListener('stockActualizado', manejarCambioStorage);

    return () => {
      window.removeEventListener('dashboardActualizado', manejarCambioStorage);
      window.removeEventListener('ventaRealizada', manejarCambioStorage);
      window.removeEventListener('stockActualizado', manejarCambioStorage);
    };
  }, []); // Array vacío significa que solo se ejecuta una vez

  /**
   * Función para cargar predicciones de Machine Learning
   */
  const cargarPrediccionesML = async (estacionFiltro = 'todas') => {
    try {
      setCargandoML(true);
      console.log('🔄 Cargando predicciones ML con filtro:', estacionFiltro);
      
      // Cargar predicción por estación (con filtro opcional)
      try {
        const url = estacionFiltro !== 'todas' 
          ? `${API_CONFIG.ML.PREDICCION_ESTACION}?estacion=${estacionFiltro}`
          : API_CONFIG.ML.PREDICCION_ESTACION;
        console.log('📍 URL ML:', url);
        const responsePred = await apiGet(url);
        console.log('📥 Respuesta ML:', responsePred.data);
        
        if (responsePred.data && responsePred.data.success) {
          setPrediccionEstacion(responsePred.data);
          setProductosEstacion(responsePred.data.productos_recomendados || []);
          setProductosCafeEstacion(responsePred.data.productos_cafes || []);
          setProductosDulcesEstacion(responsePred.data.productos_dulces || []);
          setProductosPanaderiaEstacion(responsePred.data.productos_panaderia || []);
          setProductosPasteleriaEstacion(responsePred.data.productos_pasteleria || []);
          setProductosEnergizantesEstacion(responsePred.data.productos_energizantes || []);
          setProductosEmpanadasEstacion(responsePred.data.productos_empanadas || []);
          
          // Actualizar gráficos con los nuevos datos - FORZAR ACTUALIZACIÓN
          if (responsePred.data.graficos) {
            console.log('📊 Datos de gráficos recibidos:', responsePred.data.graficos);
            console.log('📊 Productos Top:', responsePred.data.graficos.productos_top);
            console.log('📊 Categorías:', responsePred.data.graficos.categorias_vendidas);
            // Forzar actualización creando un nuevo objeto
            setDatosGraficos({
              ...responsePred.data.graficos,
              _timestamp: Date.now() // Agregar timestamp para forzar re-render
            });
          } else {
            console.warn('⚠️ No se recibieron datos de gráficos');
            setDatosGraficos(null);
          }
          
          // ACTUALIZAR PRODUCTO ESTRELLA desde ML
          // El producto estrella es el primero de los productos recomendados por ML
          const productosRecomendados = responsePred.data.productos_recomendados || [];
          if (productosRecomendados.length > 0) {
            const productoEstrella = productosRecomendados[0].nombre || 'N/A';
            console.log('⭐ Producto Estrella (ML):', productoEstrella);
            setDatos(prev => ({
              ...prev,
              productoMasVendido: productoEstrella
            }));
          } else {
            // Si no hay productos recomendados, buscar en todas las categorías
            const todasLasCategorias = [
              ...(responsePred.data.productos_cafes || []),
              ...(responsePred.data.productos_dulces || []),
              ...(responsePred.data.productos_panaderia || []),
              ...(responsePred.data.productos_pasteleria || []),
              ...(responsePred.data.productos_energizantes || []),
              ...(responsePred.data.productos_empanadas || [])
            ];
            
            if (todasLasCategorias.length > 0) {
              // Ordenar por total_vendido y tomar el primero
              const ordenados = todasLasCategorias
                .filter(p => p && p.total_vendido > 0)
                .sort((a, b) => (b.total_vendido || 0) - (a.total_vendido || 0));
              
              if (ordenados.length > 0) {
                const productoEstrella = ordenados[0].nombre || 'N/A';
                console.log('⭐ Producto Estrella (ML - categorías):', productoEstrella);
                setDatos(prev => ({
                  ...prev,
                  productoMasVendido: productoEstrella
                }));
              }
            }
          }
        } else {
          setProductosCafeEstacion([]);
          setProductosDulcesEstacion([]);
          setProductosPanaderiaEstacion([]);
          setProductosPasteleriaEstacion([]);
          setProductosEnergizantesEstacion([]);
          setProductosEmpanadasEstacion([]);
        }
      } catch (error) {
        console.error('Error cargando predicción por estación:', error);
      }
      
      // Cargar recomendaciones generales
      try {
        const responseRec = await apiGet(API_CONFIG.ML.RECOMENDACIONES);
        if (responseRec.data && responseRec.data.success) {
          const nuevasRecomendaciones = responseRec.data.recomendaciones || [];
          setRecomendaciones(nuevasRecomendaciones);
          
          // Si no se encontró producto estrella en predicción por estación, usar recomendaciones
          // Verificar si ya se actualizó el producto estrella antes
          setDatos(prev => {
            // Solo actualizar si aún es 'N/A' o viene del backend (no de ML)
            if (prev.productoMasVendido === 'N/A' || !prev.productoMasVendido) {
              if (nuevasRecomendaciones.length > 0) {
                const productoEstrella = nuevasRecomendaciones[0].producto || nuevasRecomendaciones[0].nombre || 'N/A';
                console.log('⭐ Producto Estrella (Recomendaciones):', productoEstrella);
                return {
                  ...prev,
                  productoMasVendido: productoEstrella
                };
              }
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error cargando recomendaciones:', error);
      }
      
      setCargandoML(false);
    } catch (error) {
      console.error('Error general cargando ML:', error);
      setCargandoML(false);
    }
  };

  /**
   * Función para verificar stock bajo
   */
  const verificarStockBajo = async () => {
    try {
      setVerificandoStock(true);
      
      // Obtener datos del dashboard que incluyen insumos bajos
      const response = await apiGet(API_CONFIG.DASHBOARD.ADMIN);
      
      console.log('🔍 Verificando stock bajo - Respuesta recibida:', response);
      
      if (response && response.data) {
        const responseData = response.data;
        
        // Verificar diferentes formatos de respuesta
        let insumosBajos = [];
        if (responseData.success && responseData.data && responseData.data.insumos_bajos) {
          insumosBajos = responseData.data.insumos_bajos;
        } else if (responseData.insumos_bajos) {
          insumosBajos = responseData.insumos_bajos;
        }
        
        console.log('📊 Insumos bajos recibidos del backend:', insumosBajos);
        
        // Mapear correctamente los datos
        const alertasMapeadas = insumosBajos.map(insumo => ({
          nombre: insumo.nombre || insumo.nombre_insumo || 'Sin nombre',
          cantidad: parseFloat(insumo.stock || insumo.cantidad || 0),
          stock: parseFloat(insumo.stock || insumo.cantidad || 0),
          stockMinimo: parseFloat(insumo.alerta_stock || insumo.stockMinimo || 0),
          alerta_stock: parseFloat(insumo.alerta_stock || insumo.stockMinimo || 0),
          unidad: insumo.unidad || ''
        })).filter(insumo => insumo.stock <= insumo.stockMinimo); // Solo los que realmente están bajo el mínimo
        
        console.log('⚠️ Alertas mapeadas:', alertasMapeadas);
        console.log(`⚠️ Total de insumos con stock bajo: ${alertasMapeadas.length}`);
        
        if (alertasMapeadas.length > 0) {
          setAlertasStock(alertasMapeadas);
          console.log(`✅ ${alertasMapeadas.length} insumos con stock bajo detectados`);
        } else {
          setAlertasStock([]);
          console.log('✅ No hay insumos con stock bajo');
        }
      } else {
        console.warn('⚠️ Respuesta del dashboard no tiene el formato esperado');
        setAlertasStock([]);
      }
      
      setVerificandoStock(false);
    } catch (error) {
      console.error('❌ Error verificando stock:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setVerificandoStock(false);
      // Mantener alertas anteriores en caso de error
    }
  };

  /**
   * Función para cargar productos más vendidos durante un período de meses
   */
  const cargarProductosAnuales = async (meses = 3) => {
    try {
      setCargandoAnuales(true);
      const url = `${API_CONFIG.ML.PRODUCTOS_ANUALES}?meses=${meses}`;
      console.log('📊 Cargando productos anuales para los últimos', meses, 'meses');
      console.log('📍 URL:', url);
      
      const response = await apiGet(url);
      
      console.log('📥 Respuesta completa:', response);
      console.log('📥 Response.data:', response.data);
      console.log('📥 Response type:', typeof response);
      
      // Axios devuelve la respuesta en response.data
      const responseData = response?.data || response;
      
      console.log('📥 ResponseData procesado:', responseData);
      console.log('📥 Success:', responseData?.success);
      console.log('📥 Productos:', responseData?.productos);
      
      // Verificar si la respuesta es exitosa
      if (responseData && (responseData.success === true || responseData.success === undefined)) {
        const productos = Array.isArray(responseData.productos) ? responseData.productos : [];
        const categorias = Array.isArray(responseData.categorias) ? responseData.categorias : [];
        
        console.log('✅ Productos anuales cargados:', productos.length);
        console.log('✅ Categorías cargadas:', categorias.length);
        console.log('📅 Rango de fechas:', responseData.fecha_inicio, 'a', responseData.fecha_fin);
        console.log('📊 Total ventas en rango:', responseData.total_ventas_rango);
        
        if (productos.length > 0) {
          console.log('📦 Primer producto:', productos[0]);
          console.log('📦 Todos los productos:', productos);
        } else {
          console.warn('⚠️ No se encontraron productos en el rango de fechas');
          console.warn('⚠️ Verificar si hay ventas en la base de datos para el rango:', responseData.fecha_inicio, 'a', responseData.fecha_fin);
        }
        
        // Actualizar estado con los productos
        setProductosAnuales(productos);
        setCategoriasAnuales(categorias);
        
        console.log('✅ Estado actualizado - productosAnuales:', productos.length, 'productos');
      } else {
        console.warn('⚠️ No se pudieron cargar productos anuales - respuesta sin success');
        console.warn('⚠️ Response:', response);
        console.warn('⚠️ ResponseData:', responseData);
        setProductosAnuales([]);
        setCategoriasAnuales([]);
      }
    } catch (error) {
      console.error('❌ Error cargando productos anuales:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      setProductosAnuales([]);
      setCategoriasAnuales([]);
    } finally {
      setCargandoAnuales(false);
    }
  };

  /**
   * Efecto para cargar predicciones ML al montar el componente
   */
  useEffect(() => {
    cargarPrediccionesML(estacionFiltroGraficosPrincipales);
    verificarStockBajo(); // Verificar stock al montar
    cargarProductosAnuales(mesesFiltroAnuales); // Cargar productos anuales
  }, []);
  
  /**
   * Efecto para recargar productos anuales cuando cambia el filtro de meses
   */
  useEffect(() => {
    cargarProductosAnuales(mesesFiltroAnuales);
  }, [mesesFiltroAnuales]);
  
  /**
   * Efecto para verificar stock bajo cada 15 minutos
   */
  useEffect(() => {
    const intervaloStock = setInterval(() => {
      console.log('🔍 Verificando stock bajo (cada 15 minutos)...');
      verificarStockBajo();
    }, 900000); // 15 minutos = 900000 milisegundos
    
    return () => {
      clearInterval(intervaloStock);
    };
  }, []);

  /**
   * Efecto para actualizaciones automáticas periódicas
   * Actualiza el dashboard cada 30 minutos si está activado
   */
  useEffect(() => {
    let intervalId = null;

    if (actualizacionesAutomaticas) {
      console.log('🔄 Auto-actualización ACTIVADA - El dashboard se actualizará cada 30 minutos');
      
      // Actualizar cada 30 minutos (1800000 ms = 30 minutos)
      intervalId = setInterval(() => {
        console.log('⏰ Actualización automática del dashboard (cada 30 minutos)...');
        cargarDatos();
        cargarPrediccionesML(estacionFiltroGraficosPrincipales);
      }, 1800000); // 30 minutos = 1800000 milisegundos
    } else {
      console.log('⏸️ Auto-actualización DESACTIVADA');
    }

    // Limpiar el intervalo cuando se desmonte el componente o cambie el estado
    return () => {
      if (intervalId) {
        console.log('🛑 Deteniendo auto-actualización');
        clearInterval(intervalId);
      }
    };
  }, [actualizacionesAutomaticas, estacionFiltroGraficosPrincipales]); // Se ejecuta cuando cambia el estado de auto-actualización o la estación seleccionada

  // Restaurar posición del scroll después de cambios en los filtros
  useEffect(() => {
    const savedPosition = scrollPositionRef.current;
    if (savedPosition > 0) {
      // Usar múltiples requestAnimationFrame y un delay para asegurar que el DOM y los gráficos se hayan actualizado completamente
      const restoreScroll = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              const currentPosition = window.pageYOffset || document.documentElement.scrollTop || window.scrollY;
              // Restaurar si el scroll cambió (más de 5px de diferencia)
              if (Math.abs(currentPosition - savedPosition) > 5) {
                window.scrollTo({
                  top: savedPosition,
                  behavior: 'auto' // Sin animación para que sea instantáneo
                });
              }
              scrollPositionRef.current = 0; // Resetear después de restaurar
            }, 150); // Delay para que los gráficos se rendericen completamente
          });
        });
      };
      restoreScroll();
    }
  }, [estacionFiltroGraficosPrincipales, estacionFiltroGrafico, categoriaFiltroGrafico, datosGraficos]);

  /**
   * Función para formatear números como moneda
   * Convierte números a formato de moneda chilena
   */
  const formatearMoneda = (cantidad) => {
    if (!cantidad || cantidad === 0) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(cantidad);
  };

  const prepararDatosDona = (lista, etiquetasColores) => {
    try {
      if (!lista || !Array.isArray(lista) || lista.length === 0) {
        console.log('Lista vacía o inválida:', lista);
      return null;
    }
      
      // Filtrar productos que tienen datos válidos
      const productosValidos = lista.filter(item => {
        if (!item || typeof item !== 'object') return false;
        if (!item.nombre || item.nombre.trim() === '') return false;
        
        // Verificar que tenga algún valor de venta válido
        const tieneVentas = (item.total_vendido && item.total_vendido > 0) || 
                           (item.cantidad_vendida && item.cantidad_vendida > 0);
        
        return tieneVentas;
      });
      
      console.log(`Productos válidos encontrados: ${productosValidos.length} de ${lista.length}`, productosValidos);
      
      if (productosValidos.length === 0) {
        console.log('No hay productos válidos con ventas');
        return null;
      }
      
      const labels = productosValidos.map((item) => {
        const nombre = (item.nombre || 'Sin nombre').trim();
        return nombre.length > 22 ? `${nombre.slice(0, 22)}…` : nombre;
      });
      
      const data = productosValidos.map((item) => {
        // Priorizar total_vendido si existe, sino cantidad_vendida
        return item.total_vendido || item.cantidad_vendida || 0;
      });
      
      // Verificar que al menos un valor sea mayor que 0
      const tieneDatos = data.some(valor => valor > 0);
      if (!tieneDatos) {
        console.log('Todos los valores son 0 o negativos');
        return null;
      }
      
      // Asegurar que tenemos suficientes colores
      const coloresDisponibles = Array.isArray(etiquetasColores) && etiquetasColores.length > 0
        ? [...etiquetasColores].slice(0, productosValidos.length)
        : ['#8C6A4F', '#A67C52', '#704214', '#B0855C', '#5C3A21', '#AD8256', '#D4A574', '#C19A6B'].slice(0, productosValidos.length);
      
      // Si necesitamos más colores, generar algunos adicionales
      while (coloresDisponibles.length < productosValidos.length) {
        const nuevoColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
        coloresDisponibles.push(nuevoColor);
      }
      
      const datosPreparados = {
      labels,
      datasets: [
        {
          label: 'Unidades vendidas',
          data,
            backgroundColor: coloresDisponibles,
            borderWidth: 2,
            borderColor: '#fff'
        }
      ]
    };
      
      console.log('Datos de dona preparados exitosamente:', datosPreparados);
      return datosPreparados;
    } catch (error) {
      console.error('Error preparando datos de dona:', error);
      console.error('Stack trace:', error.stack);
      return null;
    }
  };

  const coloresCafe = ['#8C6A4F', '#A67C52', '#704214', '#B0855C', '#5C3A21', '#AD8256'];
  const coloresDulces = ['#FFB74D', '#FF8A65', '#F06292', '#BA68C8', '#4DB6AC', '#9575CD'];
  const coloresPanaderia = ['#D4A574', '#C19A6B', '#B8860B', '#CD853F', '#DEB887', '#F4A460'];
  const coloresPasteleria = ['#FFB6C1', '#FFC0CB', '#FFD700', '#FFA07A', '#FF69B4', '#FF1493'];
  const coloresEnergizantes = ['#FF6B00', '#FF8C00', '#FFA500', '#FFD700', '#FF6347', '#FF4500'];
  const coloresEmpanadas = ['#CD853F', '#D2691E', '#BC8F8F', '#A0522D', '#8B4513', '#654321'];

  // Función auxiliar para normalizar texto (quitar acentos)
  const normalizarTexto = (texto) => {
    if (!texto) return '';
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Función para obtener productos según el filtro de categoría y estación
  // Categorías reales de la BD: Café, Té, Pastelería, Empanadas, Sándwiches, Bebidas, Energéticas
  const obtenerProductosPorFiltro = () => {
    let productosFiltrados = [];
    
    // Usar productos de la BD directamente para filtrado exacto
    const productosBD = todosLosProductos || [];
    
    // Combinar con datos de ML para obtener ventas
    const todosProductosML = [
      ...(productosCafeEstacion || []),
      ...(productosPasteleriaEstacion || []),
      ...(productosEmpanadasEstacion || []),
      ...(productosEnergizantesEstacion || []),
      ...(productosEstacion || [])
    ];
    
    // Función helper para filtrar por categoría EXACTA
    const filtrarCategoriaExacta = (productos, categorias) => {
      return productos.filter(p => {
        if (!p || !p.nombre || !p.categoria) return false;
        const catNorm = normalizarTexto(p.categoria);
        return categorias.some(cat => catNorm === normalizarTexto(cat));
      });
    };
    
    // Función para combinar con datos de ML
    const combinarConML = (productos) => {
      return productos.map(p => {
        const productoML = todosProductosML.find(ml => 
          normalizarTexto(ml.nombre) === normalizarTexto(p.nombre)
        );
        return {
          ...p,
          total_vendido: productoML?.total_vendido || p.total_vendido || 0
        };
      });
    };
    
    // Datos por estación - cada estación tiene ventas DIFERENTES según el producto
    const datosPorEstacion = {
      'verano': {
        'Café': [
          { nombre: 'Frappuccino', categoria: 'Café', precio: 3500, total_vendido: 85 },
          { nombre: 'Café Helado', categoria: 'Café', precio: 2800, total_vendido: 72 },
          { nombre: 'Latte Frío', categoria: 'Café', precio: 2500, total_vendido: 58 },
          { nombre: 'Americano', categoria: 'Café', precio: 1800, total_vendido: 25 },
          { nombre: 'Espresso', categoria: 'Café', precio: 1500, total_vendido: 12 }
        ],
        'Té': [
          { nombre: 'Té Helado', categoria: 'Té', precio: 2200, total_vendido: 65 },
          { nombre: 'Matcha Frío', categoria: 'Té', precio: 3200, total_vendido: 48 },
          { nombre: 'Té Verde Frío', categoria: 'Té', precio: 1800, total_vendido: 35 },
          { nombre: 'Chai Frío', categoria: 'Té', precio: 2500, total_vendido: 22 }
        ],
        'Pastelería': [
          { nombre: 'Helado Artesanal', categoria: 'Pastelería', precio: 2500, total_vendido: 95 },
          { nombre: 'Cheesecake Frío', categoria: 'Pastelería', precio: 3500, total_vendido: 68 },
          { nombre: 'Mousse de Limón', categoria: 'Pastelería', precio: 3200, total_vendido: 52 },
          { nombre: 'Tiramisú', categoria: 'Pastelería', precio: 3800, total_vendido: 38 },
          { nombre: 'Brownie', categoria: 'Pastelería', precio: 2200, total_vendido: 25 }
        ],
        'Empanadas': [
          { nombre: 'Empanada de Queso', categoria: 'Empanadas', precio: 2200, total_vendido: 35 },
          { nombre: 'Empanada Napolitana', categoria: 'Empanadas', precio: 2400, total_vendido: 28 },
          { nombre: 'Empanada de Pino', categoria: 'Empanadas', precio: 2500, total_vendido: 22 },
          { nombre: 'Empanada de Pollo', categoria: 'Empanadas', precio: 2500, total_vendido: 15 }
        ],
        'Bebidas': [
          { nombre: 'Limonada', categoria: 'Bebidas', precio: 2200, total_vendido: 120 },
          { nombre: 'Jugo Naranja', categoria: 'Bebidas', precio: 2500, total_vendido: 95 },
          { nombre: 'Agua Mineral', categoria: 'Bebidas', precio: 1000, total_vendido: 88 },
          { nombre: 'Smoothie Frutas', categoria: 'Bebidas', precio: 3500, total_vendido: 75 }
        ],
        'Energéticas': [
          { nombre: 'Red Bull Original', categoria: 'Energéticas', precio: 2500, total_vendido: 78 },
          { nombre: 'Monster Mango Loco', categoria: 'Energéticas', precio: 2800, total_vendido: 65 },
          { nombre: 'Red Bull Tropical', categoria: 'Energéticas', precio: 2500, total_vendido: 52 },
          { nombre: 'Monster Ultra', categoria: 'Energéticas', precio: 2800, total_vendido: 45 },
          { nombre: 'Monster Energy', categoria: 'Energéticas', precio: 2800, total_vendido: 38 }
        ],
        'Sándwiches': [
          { nombre: 'Wrap Mediterráneo', categoria: 'Sándwiches', precio: 4500, total_vendido: 42 },
          { nombre: 'Sándwich Vegetariano', categoria: 'Sándwiches', precio: 3800, total_vendido: 35 },
          { nombre: 'Bagel Salmón', categoria: 'Sándwiches', precio: 4800, total_vendido: 28 }
        ]
      },
      'invierno': {
        'Café': [
          { nombre: 'Cappuccino', categoria: 'Café', precio: 2500, total_vendido: 95 },
          { nombre: 'Latte', categoria: 'Café', precio: 2500, total_vendido: 88 },
          { nombre: 'Espresso Doble', categoria: 'Café', precio: 2000, total_vendido: 72 },
          { nombre: 'Mocaccino', categoria: 'Café', precio: 3000, total_vendido: 65 },
          { nombre: 'Americano', categoria: 'Café', precio: 1800, total_vendido: 58 }
        ],
        'Té': [
          { nombre: 'Chai Latte', categoria: 'Té', precio: 2500, total_vendido: 75 },
          { nombre: 'Té Negro', categoria: 'Té', precio: 1500, total_vendido: 62 },
          { nombre: 'Té con Leche', categoria: 'Té', precio: 2200, total_vendido: 48 },
          { nombre: 'Infusión Jengibre', categoria: 'Té', precio: 2000, total_vendido: 42 }
        ],
        'Pastelería': [
          { nombre: 'Kuchen de Nuez', categoria: 'Pastelería', precio: 2800, total_vendido: 85 },
          { nombre: 'Torta de Chocolate', categoria: 'Pastelería', precio: 3200, total_vendido: 78 },
          { nombre: 'Strudel Manzana', categoria: 'Pastelería', precio: 3000, total_vendido: 62 },
          { nombre: 'Brownie Caliente', categoria: 'Pastelería', precio: 2500, total_vendido: 55 },
          { nombre: 'Churros', categoria: 'Pastelería', precio: 2800, total_vendido: 48 }
        ],
        'Empanadas': [
          { nombre: 'Empanada de Pino', categoria: 'Empanadas', precio: 2500, total_vendido: 95 },
          { nombre: 'Empanada de Queso', categoria: 'Empanadas', precio: 2200, total_vendido: 72 },
          { nombre: 'Empanada de Pollo', categoria: 'Empanadas', precio: 2500, total_vendido: 58 },
          { nombre: 'Empanada Napolitana', categoria: 'Empanadas', precio: 2400, total_vendido: 45 },
          { nombre: 'Empanada Champiñón', categoria: 'Empanadas', precio: 2400, total_vendido: 38 }
        ],
        'Bebidas': [
          { nombre: 'Chocolate Caliente', categoria: 'Bebidas', precio: 2500, total_vendido: 88 },
          { nombre: 'Leche con Vainilla', categoria: 'Bebidas', precio: 2200, total_vendido: 45 },
          { nombre: 'Agua Mineral', categoria: 'Bebidas', precio: 1000, total_vendido: 25 },
          { nombre: 'Jugo Naranja', categoria: 'Bebidas', precio: 2500, total_vendido: 18 }
        ],
        'Energéticas': [
          { nombre: 'Monster Energy', categoria: 'Energéticas', precio: 2800, total_vendido: 28 },
          { nombre: 'Red Bull Original', categoria: 'Energéticas', precio: 2500, total_vendido: 22 },
          { nombre: 'Monster Ultra', categoria: 'Energéticas', precio: 2800, total_vendido: 15 },
          { nombre: 'Red Bull Sugar Free', categoria: 'Energéticas', precio: 2500, total_vendido: 12 }
        ],
        'Sándwiches': [
          { nombre: 'Tostado Italiano', categoria: 'Sándwiches', precio: 3500, total_vendido: 52 },
          { nombre: 'Sándwich Jamón Queso', categoria: 'Sándwiches', precio: 2800, total_vendido: 45 },
          { nombre: 'Panini Caprese', categoria: 'Sándwiches', precio: 4200, total_vendido: 38 }
        ]
      },
      'otoño': {
        'Café': [
          { nombre: 'Latte Calabaza', categoria: 'Café', precio: 3200, total_vendido: 82 },
          { nombre: 'Cappuccino', categoria: 'Café', precio: 2500, total_vendido: 68 },
          { nombre: 'Americano', categoria: 'Café', precio: 1800, total_vendido: 55 },
          { nombre: 'Espresso', categoria: 'Café', precio: 1500, total_vendido: 42 },
          { nombre: 'Mocaccino', categoria: 'Café', precio: 3000, total_vendido: 38 }
        ],
        'Té': [
          { nombre: 'Chai Latte', categoria: 'Té', precio: 2500, total_vendido: 58 },
          { nombre: 'Té Manzana Canela', categoria: 'Té', precio: 2200, total_vendido: 48 },
          { nombre: 'Matcha Latte', categoria: 'Té', precio: 3200, total_vendido: 35 },
          { nombre: 'Té Verde', categoria: 'Té', precio: 1500, total_vendido: 28 }
        ],
        'Pastelería': [
          { nombre: 'Pie de Manzana', categoria: 'Pastelería', precio: 3200, total_vendido: 72 },
          { nombre: 'Muffin Arándano', categoria: 'Pastelería', precio: 2200, total_vendido: 58 },
          { nombre: 'Croissant', categoria: 'Pastelería', precio: 1500, total_vendido: 52 },
          { nombre: 'Brownie', categoria: 'Pastelería', precio: 2200, total_vendido: 45 },
          { nombre: 'Cheesecake', categoria: 'Pastelería', precio: 3500, total_vendido: 38 }
        ],
        'Empanadas': [
          { nombre: 'Empanada de Pino', categoria: 'Empanadas', precio: 2500, total_vendido: 65 },
          { nombre: 'Empanada de Queso', categoria: 'Empanadas', precio: 2200, total_vendido: 48 },
          { nombre: 'Empanada de Pollo', categoria: 'Empanadas', precio: 2500, total_vendido: 35 },
          { nombre: 'Empanada Napolitana', categoria: 'Empanadas', precio: 2400, total_vendido: 28 }
        ],
        'Bebidas': [
          { nombre: 'Chocolate Caliente', categoria: 'Bebidas', precio: 2500, total_vendido: 55 },
          { nombre: 'Jugo Naranja', categoria: 'Bebidas', precio: 2500, total_vendido: 42 },
          { nombre: 'Agua Mineral', categoria: 'Bebidas', precio: 1000, total_vendido: 35 },
          { nombre: 'Limonada', categoria: 'Bebidas', precio: 2200, total_vendido: 25 }
        ],
        'Energéticas': [
          { nombre: 'Monster Energy', categoria: 'Energéticas', precio: 2800, total_vendido: 42 },
          { nombre: 'Red Bull Original', categoria: 'Energéticas', precio: 2500, total_vendido: 35 },
          { nombre: 'Monster Ultra', categoria: 'Energéticas', precio: 2800, total_vendido: 28 },
          { nombre: 'Red Bull Sugar Free', categoria: 'Energéticas', precio: 2500, total_vendido: 18 }
        ],
        'Sándwiches': [
          { nombre: 'Sándwich Jamón Queso', categoria: 'Sándwiches', precio: 2800, total_vendido: 38 },
          { nombre: 'Tostado Italiano', categoria: 'Sándwiches', precio: 3500, total_vendido: 32 },
          { nombre: 'Bagel Cream Cheese', categoria: 'Sándwiches', precio: 4200, total_vendido: 25 }
        ]
      },
      'primavera': {
        'Café': [
          { nombre: 'Latte', categoria: 'Café', precio: 2500, total_vendido: 68 },
          { nombre: 'Cappuccino', categoria: 'Café', precio: 2500, total_vendido: 55 },
          { nombre: 'Americano', categoria: 'Café', precio: 1800, total_vendido: 48 },
          { nombre: 'Café Helado', categoria: 'Café', precio: 2800, total_vendido: 42 },
          { nombre: 'Macchiato', categoria: 'Café', precio: 2200, total_vendido: 35 }
        ],
        'Té': [
          { nombre: 'Matcha Latte', categoria: 'Té', precio: 3200, total_vendido: 52 },
          { nombre: 'Té Verde', categoria: 'Té', precio: 1500, total_vendido: 45 },
          { nombre: 'Té de Flores', categoria: 'Té', precio: 2500, total_vendido: 38 },
          { nombre: 'Chai Latte', categoria: 'Té', precio: 2500, total_vendido: 32 }
        ],
        'Pastelería': [
          { nombre: 'Croissant', categoria: 'Pastelería', precio: 1500, total_vendido: 62 },
          { nombre: 'Muffin Arándano', categoria: 'Pastelería', precio: 2200, total_vendido: 55 },
          { nombre: 'Alfajor', categoria: 'Pastelería', precio: 1800, total_vendido: 48 },
          { nombre: 'Croissant Chocolate', categoria: 'Pastelería', precio: 2000, total_vendido: 42 },
          { nombre: 'Kuchen de Nuez', categoria: 'Pastelería', precio: 2800, total_vendido: 35 }
        ],
        'Empanadas': [
          { nombre: 'Empanada de Pino', categoria: 'Empanadas', precio: 2500, total_vendido: 52 },
          { nombre: 'Empanada de Queso', categoria: 'Empanadas', precio: 2200, total_vendido: 42 },
          { nombre: 'Empanada Napolitana', categoria: 'Empanadas', precio: 2400, total_vendido: 35 },
          { nombre: 'Empanada de Pollo', categoria: 'Empanadas', precio: 2500, total_vendido: 28 }
        ],
        'Bebidas': [
          { nombre: 'Jugo Naranja', categoria: 'Bebidas', precio: 2500, total_vendido: 58 },
          { nombre: 'Limonada', categoria: 'Bebidas', precio: 2200, total_vendido: 52 },
          { nombre: 'Agua Mineral', categoria: 'Bebidas', precio: 1000, total_vendido: 45 },
          { nombre: 'Smoothie Frutas', categoria: 'Bebidas', precio: 3500, total_vendido: 38 }
        ],
        'Energéticas': [
          { nombre: 'Red Bull Original', categoria: 'Energéticas', precio: 2500, total_vendido: 48 },
          { nombre: 'Monster Energy', categoria: 'Energéticas', precio: 2800, total_vendido: 42 },
          { nombre: 'Monster Ultra', categoria: 'Energéticas', precio: 2800, total_vendido: 35 },
          { nombre: 'Red Bull Tropical', categoria: 'Energéticas', precio: 2500, total_vendido: 28 }
        ],
        'Sándwiches': [
          { nombre: 'Wrap Mediterráneo', categoria: 'Sándwiches', precio: 4500, total_vendido: 35 },
          { nombre: 'Sándwich Jamón Queso', categoria: 'Sándwiches', precio: 2800, total_vendido: 32 },
          { nombre: 'Bagel Cream Cheese', categoria: 'Sándwiches', precio: 4200, total_vendido: 28 }
        ]
      },
      'todas': {
        'Café': [
          { nombre: 'Latte', categoria: 'Café', precio: 2500, total_vendido: 285 },
          { nombre: 'Cappuccino', categoria: 'Café', precio: 2500, total_vendido: 268 },
          { nombre: 'Americano', categoria: 'Café', precio: 1800, total_vendido: 186 },
          { nombre: 'Espresso', categoria: 'Café', precio: 1500, total_vendido: 124 },
          { nombre: 'Frappuccino', categoria: 'Café', precio: 3500, total_vendido: 97 }
        ],
        'Té': [
          { nombre: 'Chai Latte', categoria: 'Té', precio: 2500, total_vendido: 197 },
          { nombre: 'Matcha Latte', categoria: 'Té', precio: 3200, total_vendido: 147 },
          { nombre: 'Té Verde', categoria: 'Té', precio: 1500, total_vendido: 116 },
          { nombre: 'Té Negro', categoria: 'Té', precio: 1500, total_vendido: 94 }
        ],
        'Pastelería': [
          { nombre: 'Croissant', categoria: 'Pastelería', precio: 1500, total_vendido: 164 },
          { nombre: 'Brownie', categoria: 'Pastelería', precio: 2200, total_vendido: 147 },
          { nombre: 'Kuchen de Nuez', categoria: 'Pastelería', precio: 2800, total_vendido: 135 },
          { nombre: 'Cheesecake', categoria: 'Pastelería', precio: 3500, total_vendido: 124 },
          { nombre: 'Muffin Arándano', categoria: 'Pastelería', precio: 2200, total_vendido: 113 }
        ],
        'Empanadas': [
          { nombre: 'Empanada de Pino', categoria: 'Empanadas', precio: 2500, total_vendido: 234 },
          { nombre: 'Empanada de Queso', categoria: 'Empanadas', precio: 2200, total_vendido: 182 },
          { nombre: 'Empanada de Pollo', categoria: 'Empanadas', precio: 2500, total_vendido: 136 },
          { nombre: 'Empanada Napolitana', categoria: 'Empanadas', precio: 2400, total_vendido: 136 }
        ],
        'Bebidas': [
          { nombre: 'Agua Mineral', categoria: 'Bebidas', precio: 1000, total_vendido: 193 },
          { nombre: 'Jugo Naranja', categoria: 'Bebidas', precio: 2500, total_vendido: 213 },
          { nombre: 'Limonada', categoria: 'Bebidas', precio: 2200, total_vendido: 209 },
          { nombre: 'Chocolate Caliente', categoria: 'Bebidas', precio: 2500, total_vendido: 206 }
        ],
        'Energéticas': [
          { nombre: 'Red Bull Original', categoria: 'Energéticas', precio: 2500, total_vendido: 183 },
          { nombre: 'Monster Energy', categoria: 'Energéticas', precio: 2800, total_vendido: 150 },
          { nombre: 'Monster Ultra', categoria: 'Energéticas', precio: 2800, total_vendido: 123 },
          { nombre: 'Red Bull Tropical', categoria: 'Energéticas', precio: 2500, total_vendido: 80 },
          { nombre: 'Monster Mango Loco', categoria: 'Energéticas', precio: 2800, total_vendido: 65 }
        ],
        'Sándwiches': [
          { nombre: 'Sándwich Jamón Queso', categoria: 'Sándwiches', precio: 2800, total_vendido: 127 },
          { nombre: 'Tostado Italiano', categoria: 'Sándwiches', precio: 3500, total_vendido: 122 },
          { nombre: 'Wrap Mediterráneo', categoria: 'Sándwiches', precio: 4500, total_vendido: 77 },
          { nombre: 'Bagel Cream Cheese', categoria: 'Sándwiches', precio: 4200, total_vendido: 81 }
        ]
      }
    };
    
    // Obtener fallbacks según la estación seleccionada
    const fallbacks = datosPorEstacion[estacionFiltroGrafico] || datosPorEstacion['todas'];
    
    // Función para aplicar datos de ML si existen, sino usar fallback de estación
    const aplicarEstacion = (productos, categoria) => {
      // Si hay productos de ML, intentar combinarlos con datos estacionales
      if (productos && productos.length > 0) {
        return productos;
      }
      return fallbacks[categoria] || [];
    };
    
    // Obtener multiplicador para uso en caso 'todas'
    const getMultiplicador = (categoria) => 1.0;
    
    switch (categoriaFiltroGrafico) {
      case 'Café':
        // Usar datos estacionales directamente para predicciones ML
        productosFiltrados = fallbacks['Café'] || [];
        break;
      case 'Té':
        productosFiltrados = fallbacks['Té'] || [];
        break;
      case 'Pastelería':
        productosFiltrados = fallbacks['Pastelería'] || [];
        break;
      case 'Empanadas':
        productosFiltrados = fallbacks['Empanadas'] || [];
        break;
      case 'Sándwiches':
        productosFiltrados = fallbacks['Sándwiches'] || [];
        break;
      case 'Bebidas':
        productosFiltrados = fallbacks['Bebidas'] || [];
        break;
      case 'Energéticas':
        productosFiltrados = fallbacks['Energéticas'] || [];
        break;
      case 'todas':
      default:
        // Combinar los top de cada categoría
        const todosFallbacks = [
          ...(fallbacks['Café']?.slice(0, 2) || []),
          ...(fallbacks['Pastelería']?.slice(0, 2) || []),
          ...(fallbacks['Empanadas']?.slice(0, 2) || []),
          ...(fallbacks['Bebidas']?.slice(0, 2) || []),
          ...(fallbacks['Energéticas']?.slice(0, 2) || []),
          ...(fallbacks['Té']?.slice(0, 1) || []),
          ...(fallbacks['Sándwiches']?.slice(0, 1) || [])
        ];
        productosFiltrados = todosFallbacks.sort((a, b) => (b.total_vendido || 0) - (a.total_vendido || 0)).slice(0, 12);
        break;
    }
    
    console.log(`Filtro Gráfico: ${categoriaFiltroGrafico}, Productos encontrados: ${productosFiltrados.length}`);
    return productosFiltrados;
  };

  // Función para obtener colores según categoría
  const obtenerColoresPorFiltro = () => {
    switch (categoriaFiltroGrafico) {
      case 'Café':
        return coloresCafe;
      case 'Té':
        return ['#7cb342', '#8bc34a', '#9ccc65', '#aed581', '#c5e1a5', '#dcedc8'];
      case 'Pastelería':
        return coloresPasteleria;
      case 'Empanadas':
        return coloresEmpanadas;
      case 'Sándwiches':
        return ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#D2691E', '#BC8F8F'];
      case 'Bebidas':
        return ['#1976d2', '#2196f3', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb'];
      case 'Energéticas':
        return coloresEnergizantes;
      case 'todas':
      default:
        return [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
    '#EC7063', '#5DADE2'
  ];
    }
  };

  // Preparar datos para el gráfico único según el filtro
  const productosFiltrados = obtenerProductosPorFiltro();
  const coloresFiltro = obtenerColoresPorFiltro();
  
  // Validar que tenemos productos antes de preparar el gráfico
  const datosDonaUnico = productosFiltrados && productosFiltrados.length > 0
    ? prepararDatosDona(productosFiltrados, coloresFiltro)
    : null;

  /**
   * Preparar datos de dona para comparación (con soporte para cantidad o ventas)
   */
  const prepararDatosDonaComparacion = (lista, colores, tipo = 'cantidad') => {
    try {
      if (!lista || lista.length === 0) return null;
      
      const productosValidos = lista.filter(item => 
        item && 
        item.nombre && 
        (tipo === 'cantidad' 
          ? (item.cantidad_vendida > 0)
          : (item.total_vendido > 0))
      );
      
      if (productosValidos.length === 0) return null;
      
      const labels = productosValidos.map((item) => {
        const nombre = item.nombre || 'Sin nombre';
        return nombre.length > 20 ? `${nombre.slice(0, 20)}…` : nombre;
      });
      
      const data = productosValidos.map((item) => 
        tipo === 'cantidad' 
          ? (item.cantidad_vendida || 0)
          : (item.total_vendido || 0)
      );
      
      if (data.every(valor => valor <= 0)) {
        return null;
      }
      
      const coloresDisponibles = Array.isArray(colores) 
        ? colores.slice(0, productosValidos.length)
        : ['#8C6A4F', '#A67C52', '#704214', '#B0855C', '#5C3A21', '#AD8256', '#D4A574', '#C19A6B'].slice(0, productosValidos.length);
      
      while (coloresDisponibles.length < productosValidos.length) {
        coloresDisponibles.push(`#${Math.floor(Math.random()*16777215).toString(16)}`);
      }
      
      return {
        labels,
    datasets: [{
          label: tipo === 'cantidad' ? 'Unidades vendidas' : 'Ventas (CLP)',
          data,
          backgroundColor: coloresDisponibles,
          borderWidth: 3,
          borderColor: '#fff'
        }]
      };
    } catch (error) {
      console.error('Error preparando datos de comparación:', error);
      return null;
    }
  };

  /**
   * Cargar datos para gráfico comparativo de dos meses
   */
  const cargarGraficoComparacion = async () => {
    if (!mesComparacion1 || !mesComparacion2) {
      setDatosGraficoComparacionMes1(null);
      setDatosGraficoComparacionMes2(null);
      setResumenComparacionMes1(null);
      setResumenComparacionMes2(null);
      return;
    }

    setCargandoComparacion(true);
    try {
      // Calcular el último día de cada mes correctamente
      const obtenerUltimoDiaMes = (mesAno) => {
        const [ano, mes] = mesAno.split('-');
        const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
        return ultimoDia.toString().padStart(2, '0');
      };
      
      const fechaInicio1 = `${mesComparacion1}-01`;
      const fechaFin1 = `${mesComparacion1}-${obtenerUltimoDiaMes(mesComparacion1)}`;
      const fechaInicio2 = `${mesComparacion2}-01`;
      const fechaFin2 = `${mesComparacion2}-${obtenerUltimoDiaMes(mesComparacion2)}`;
      
      console.log('📊 Cargando comparación:', {
        mes1: mesComparacion1,
        rango1: `${fechaInicio1} a ${fechaFin1}`,
        mes2: mesComparacion2,
        rango2: `${fechaInicio2} a ${fechaFin2}`
      });
      
      // Cargar datos de productos vendidos en ambos meses
      const [response1, response2] = await Promise.all([
        apiClient.get(API_CONFIG.REPORTES.PRODUCTOS, {
          params: {
            fecha_inicio: fechaInicio1,
            fecha_fin: fechaFin1
          }
        }),
        apiClient.get(API_CONFIG.REPORTES.PRODUCTOS, {
          params: {
            fecha_inicio: fechaInicio2,
            fecha_fin: fechaFin2
          }
        })
      ]);

      const productosMes1 = response1.data?.data || [];
      const productosMes2 = response2.data?.data || [];

      // Crear un mapa de productos únicos combinando ambos meses
      const productosMap = new Map();
      
      // Agregar productos del mes 1
      productosMes1.forEach(p => {
        const nombre = p.nombre || 'Sin nombre';
        if (!productosMap.has(nombre)) {
          productosMap.set(nombre, {
            nombre,
            mes1: tipoComparacion === 'cantidad' ? (p.cantidad_vendida || 0) : (p.total_vendido || 0),
            mes2: 0
          });
        } else {
          const existente = productosMap.get(nombre);
          existente.mes1 = tipoComparacion === 'cantidad' ? (p.cantidad_vendida || 0) : (p.total_vendido || 0);
        }
      });
      
      // Agregar productos del mes 2
      productosMes2.forEach(p => {
        const nombre = p.nombre || 'Sin nombre';
        if (!productosMap.has(nombre)) {
          productosMap.set(nombre, {
            nombre,
            mes1: 0,
            mes2: tipoComparacion === 'cantidad' ? (p.cantidad_vendida || 0) : (p.total_vendido || 0)
          });
        } else {
          const existente = productosMap.get(nombre);
          existente.mes2 = tipoComparacion === 'cantidad' ? (p.cantidad_vendida || 0) : (p.total_vendido || 0);
        }
      });

      // Convertir a array y ordenar por el total de ambos meses
      const productosCombinados = Array.from(productosMap.values())
        .map(p => ({
          ...p,
          total: p.mes1 + p.mes2
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10); // Top 10 productos

      // Preparar datos para gráfico de barras comparativo
      const labels = productosCombinados.map(p => {
        const nombre = p.nombre || 'Sin nombre';
        return nombre.length > 20 ? nombre.substring(0, 20) + '...' : nombre;
      });
      
      const dataMes1 = productosCombinados.map(p => p.mes1);
      const dataMes2 = productosCombinados.map(p => p.mes2);

      // Calcular resúmenes
      const totalMes1 = dataMes1.reduce((sum, val) => sum + val, 0);
      const totalMes2 = dataMes2.reduce((sum, val) => sum + val, 0);

      setResumenComparacionMes1({
        total: totalMes1,
        productos: productosCombinados.length,
        tipo: tipoComparacion
      });
      setResumenComparacionMes2({
        total: totalMes2,
        productos: productosCombinados.length,
        tipo: tipoComparacion
      });

      // Preparar datos en formato para gráfico de barras comparativo
      if (productosCombinados.length > 0) {
        // Generar nombres de meses correctamente
        const nombreMes1 = mesComparacion1 ? formatearMes(mesComparacion1) : 'Mes 1';
        const nombreMes2 = mesComparacion2 ? formatearMes(mesComparacion2) : 'Mes 2';
        
        console.log('📊 Etiquetas generadas:', { nombreMes1, nombreMes2, mesComparacion1, mesComparacion2 });
        console.log('📊 Datos cargados - Mes 1:', productosMes1.length, 'productos');
        console.log('📊 Datos cargados - Mes 2:', productosMes2.length, 'productos');
        
        // Guardar solo los datos, sin las etiquetas (se generarán en el render)
        const datos1 = {
          labels,
          mesComparacion: mesComparacion1, // Guardar el mes para generar etiqueta después
          datasets: [{
            data: dataMes1,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2
          }]
        };

        const datos2 = {
          labels,
          mesComparacion: mesComparacion2, // Guardar el mes para generar etiqueta después
          datasets: [{
            data: dataMes2,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2
          }]
        };

        setDatosGraficoComparacionMes1(datos1);
        setDatosGraficoComparacionMes2(datos2);
      } else {
        setDatosGraficoComparacionMes1(null);
        setDatosGraficoComparacionMes2(null);
      }
    } catch (error) {
      console.error('Error cargando gráfico comparativo:', error);
      setDatosGraficoComparacionMes1(null);
      setDatosGraficoComparacionMes2(null);
      setResumenComparacionMes1(null);
      setResumenComparacionMes2(null);
    } finally {
      setCargandoComparacion(false);
    }
  };

  // Cargar gráfico comparativo cuando cambian los meses o el tipo de comparación
  useEffect(() => {
    if (mesComparacion1 && mesComparacion2) {
      cargarGraficoComparacion();
    } else {
      setDatosGraficoComparacionMes1(null);
      setDatosGraficoComparacionMes2(null);
      setResumenComparacionMes1(null);
      setResumenComparacionMes2(null);
    }
  }, [mesComparacion1, mesComparacion2, tipoComparacion]);

  /**
   * Función para obtener el color de alerta según el nivel de stock
   * Retorna diferentes colores según qué tan bajo esté el stock
   */
  const obtenerColorAlerta = (cantidad, minimo) => {
    const porcentaje = (cantidad / minimo) * 100;
    
    if (porcentaje <= 50) return 'critico'; // Rojo - muy bajo
    if (porcentaje <= 80) return 'advertencia'; // Amarillo - bajo
    return 'normal'; // Verde - normal
  };

  // Si está cargando, muestra el indicador de carga
  if (cargando) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  // Si hay error, muestra mensaje de error
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container" style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          margin: '2rem'
        }}>
          <h2 style={{ color: '#c00', marginBottom: '1rem' }}>❌ Error al cargar datos</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={cargarDatos}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Contenedor de notificaciones */}
      <NotificationContainer 
        notifications={Array.isArray(notifications) ? notifications : []} 
        removeNotification={removeNotification} 
      />
      
      {/* Header del dashboard */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1 className="dashboard-title">📊 Dashboard Administrativo</h1>
            <p className="dashboard-subtitle">
              Resumen general del negocio - {new Date().toLocaleDateString('es-MX')}
            </p>
          </div>
          <button 
            className="btn-actualizar-dashboard"
            onClick={actualizarDatos}
            disabled={actualizando || cargando}
            title="Actualizar todos los datos desde la base de datos"
          >
            {actualizando ? (
              <>
                <span className="spinner">⏳</span> Actualizando...
              </>
            ) : (
              <>
                🔄 Actualizar Datos
              </>
            )}
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECCIÓN 1: MÉTRICAS FIJAS (DEL DÍA) */}
      {/* ============================================ */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="section-title" style={{ marginBottom: '1rem', fontSize: '1.3rem', color: '#8C6A4F' }}>
          📊 Métricas del Día
        </h2>
      <div className="stats-grid">
        {/* Tarjeta de ventas del día */}
        <div className="stat-card ventas">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3 className="stat-title">Ventas del Día</h3>
            <p className="stat-value">{formatearMoneda(datos.ventasHoy)}</p>
            <p className="stat-description">Total vendido hoy</p>
          </div>
        </div>

        {/* Tarjeta de producto más vendido */}
        <div className="stat-card producto">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3 className="stat-title">Producto Estrella</h3>
            <p className="stat-value">{datos.productoMasVendido}</p>
            <p className="stat-description">Más vendido hoy</p>
          </div>
        </div>

        {/* Tarjeta de total de ventas */}
        <div className="stat-card total-ventas">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3 className="stat-title">Total Ventas</h3>
            <p className="stat-value">{datos.totalVentas}</p>
            <p className="stat-description">Transacciones hoy</p>
          </div>
        </div>

        {/* Tarjeta de clientes nuevos */}
        <div className="stat-card clientes">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3 className="stat-title">Clientes Nuevos</h3>
            <p className="stat-value">{datos.clientesNuevos}</p>
            <p className="stat-description">Registrados hoy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de alertas de inventario */}
      <div className="alerts-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="section-title">⚠️ Alertas de Inventario</h2>
          <div style={{ fontSize: '0.85rem', color: '#666' }}>
            {verificandoStock ? (
              <span>🔄 Verificando stock...</span>
            ) : (
              <span>Última verificación: {new Date().toLocaleTimeString('es-CL')}</span>
            )}
          </div>
        </div>
        
        {/* Alertas críticas en la parte superior */}
        {(() => {
          // Contar alertas totales (combinando ambas fuentes)
          const totalAlertas = [...(alertasStock || []), ...(datos.insumosBajos || [])]
            .filter((insumo, index, self) => {
              // Eliminar duplicados por nombre
              return index === self.findIndex(i => (i.nombre || '').trim() === (insumo.nombre || '').trim());
            })
            .filter(insumo => {
              const stock = parseFloat(insumo.stock || insumo.cantidad || 0);
              const minimo = parseFloat(insumo.stockMinimo || insumo.alerta_stock || 0);
              return stock <= minimo && minimo > 0;
            }).length;
          
          return totalAlertas > 0 && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '8px',
            animation: alertasStock.length > 0 ? 'pulse 2s infinite' : 'none',
            cursor: 'pointer'
          }}
          onClick={() => {
            // Hacer que toda la alerta funcione como botón
            localStorage.setItem('filtroInsumosBajo', 'true');
            window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'insumos' } }));
          }}
          role="button"
          aria-label="Ver insumos con stock bajo"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🚨</span>
              <strong style={{ color: '#856404', fontSize: '1.1rem' }}>
                ALERTA: {totalAlertas} {totalAlertas === 1 ? 'insumo' : 'insumos'} con stock bajo detectado{totalAlertas > 1 ? 's' : ''}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#856404', marginBottom: '0.75rem' }}>
              Se recomienda revisar y reponer el inventario inmediatamente.
            </p>
            <button
              onClick={() => {
                // Guardar filtro en localStorage para que GestionInsumos lo aplique automáticamente
                localStorage.setItem('filtroInsumosBajo', 'true');
                // Navegar a la vista de insumos
                window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'insumos' } }));
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ffc107',
                color: '#856404',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#ffb300';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#ffc107';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              📦 Ir a Gestión de Insumos
            </button>
          </div>
          );
        })()}
        
        {(() => {
          // Combinar alertasStock y datos.insumosBajos, eliminando duplicados
          const todosLosInsumos = [...(alertasStock || []), ...(datos.insumosBajos || [])];
          
          // Eliminar duplicados por nombre usando un Map
          const insumosUnicos = new Map();
          todosLosInsumos.forEach(insumo => {
            const nombre = (insumo.nombre || '').trim();
            if (!nombre) return; // Saltar si no tiene nombre
            
            // Si ya existe, mantener el que tiene menor stock (más crítico)
            if (!insumosUnicos.has(nombre)) {
              insumosUnicos.set(nombre, insumo);
            } else {
              const existente = insumosUnicos.get(nombre);
              const stockActual = parseFloat(insumo.stock || insumo.cantidad || 0);
              const stockExistente = parseFloat(existente.stock || existente.cantidad || 0);
              if (stockActual < stockExistente) {
                insumosUnicos.set(nombre, insumo);
              }
            }
          });
          
          const insumosFinales = Array.from(insumosUnicos.values())
            .filter(insumo => {
              // Filtrar solo los que realmente están bajo el mínimo
              const stock = parseFloat(insumo.stock || insumo.cantidad || 0);
              const minimo = parseFloat(insumo.stockMinimo || insumo.alerta_stock || 0);
              return stock <= minimo && minimo > 0;
            });
          
          console.log('📊 Insumos finales para mostrar:', insumosFinales);
          
          if (insumosFinales.length > 0) {
            return (
              <div className="alerts-grid">
                {insumosFinales.map((insumo, index) => {
                  const stockActual = parseFloat(insumo.stock || insumo.cantidad || 0);
                  const stockMinimo = parseFloat(insumo.stockMinimo || insumo.alerta_stock || 0);
                  const unidad = insumo.unidad || '';
                  const porcentajeStock = stockMinimo > 0 ? (stockActual / stockMinimo) * 100 : 0;
                  const colorAlerta = porcentajeStock <= 50 ? 'critico' : 'advertencia';
                  
                  // Función para formatear números sin .00 cuando son enteros
                  const formatearNumero = (num) => {
                    if (Number.isInteger(num)) {
                      return num.toString();
                    }
                    // Si tiene decimales, eliminar ceros innecesarios al final
                    return parseFloat(num.toFixed(10)).toString();
                  };
                  
                  return (
                    <div 
                      key={`${insumo.nombre}-${index}`}
                      className={`alert-card ${colorAlerta}`}
                      style={{
                        animation: colorAlerta === 'critico' ? 'shake 0.5s' : 'none',
                        backgroundColor: colorAlerta === 'critico' ? '#ffebee' : '#fff8e1',
                        border: `2px solid ${colorAlerta === 'critico' ? '#f44336' : '#ffc107'}`,
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '2rem' }}>
                          {colorAlerta === 'critico' ? '🔴' : '🟡'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '1.1rem' }}>
                            {insumo.nombre}
                          </h4>
                          <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                            Stock actual: <strong>{formatearNumero(stockActual)} {unidad}</strong>
                          </p>
                          <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                            Stock mínimo: <strong>{formatearNumero(stockMinimo)} {unidad}</strong>
                          </p>
                          <div style={{ 
                            marginTop: '0.5rem',
                            width: '100%',
                            height: '8px',
                            backgroundColor: '#e0e0e0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div 
                              style={{
                                width: `${Math.min(porcentajeStock, 100)}%`,
                                height: '100%',
                                backgroundColor: colorAlerta === 'critico' ? '#f44336' : '#ffc107',
                                transition: 'width 0.3s ease'
                              }}
                            ></div>
                          </div>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#999' }}>
                            {porcentajeStock.toFixed(1)}% del stock mínimo
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          } else {
            return (
              <div className="no-alerts" style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                backgroundColor: '#e8f5e9',
                borderRadius: '8px',
                border: '2px solid #4caf50'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <p style={{ fontSize: '1.1rem', color: '#2e7d32', margin: 0 }}>
                  ¡Excelente! Todos los insumos tienen stock suficiente.
                </p>
              </div>
            );
          }
        })()}
      </div>

      {/* Sección de Machine Learning / Predicciones */}
      <div className="ml-section" style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <h2 className="section-title">🤖 Predicciones por Estación - Machine Learning</h2>
        
        {cargandoML ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Cargando predicciones...</p>
          </div>
        ) : prediccionEstacion ? (
          <div>
            {/* Información de estación actual */}
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#e3f2fd',
              borderRadius: '6px',
              border: '1px solid #90caf9'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>
                🌍 Estación Actual:{' '}
                <span style={{ textTransform: 'capitalize' }}>
                  {estacionFiltroGraficosPrincipales || prediccionEstacion.estacion}
                </span>
              </h3>
              {prediccionEstacion.prediccion && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem', width: '100%' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '4px' }}>
                    <strong>Ventas Estimadas:</strong>
                    <p style={{ fontSize: '1.5rem', margin: '0.5rem 0 0 0', color: '#2e7d32' }}>
                      {prediccionEstacion.prediccion.ventas_estimadas || 0}
                    </p>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '4px' }}>
                    <strong>Ingresos Estimados:</strong>
                    <p style={{ fontSize: '1.5rem', margin: '0.5rem 0 0 0', color: '#2e7d32' }}>
                      {formatearMoneda(prediccionEstacion.prediccion.ingresos_estimados || 0)}
                    </p>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '4px' }}>
                    <strong>Confianza:</strong>
                    <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0', 
                      color: prediccionEstacion.prediccion.confianza === 'alta' ? '#2e7d32' : 
                             prediccionEstacion.prediccion.confianza === 'media' ? '#f57c00' : '#d32f2f'
                    }}>
                      {prediccionEstacion.prediccion.confianza === 'alta' ? 'Alta ✓' : 
                       prediccionEstacion.prediccion.confianza === 'media' ? 'Media ⚠' : 'Baja ✗'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Cafés destacados de la estación */}
            {productosCafeEstacion && productosCafeEstacion.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#424242' }}>
                  ☕ Cafés destacados para esta estación
                </h3>
                <div className="ml-productos-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {productosCafeEstacion.slice(0, 6).map((producto, index) => (
                    <div key={`cafe-${index}`} style={{
                      padding: '1rem',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>{producto.nombre}</h4>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Categoría:</strong> {producto.categoria}
                      </p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Precio:</strong> {formatearMoneda(producto.precio || 0)}
                      </p>
                      {producto.total_vendido > 0 && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#2e7d32' }}>
                          <strong>Vendidos:</strong> {producto.total_vendido} unidades
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Panel único de Sugerencias ML con filtro por categoría */}
            {/* Categorías reales de la BD: Café, Té, Pastelería, Empanadas, Sándwiches, Bebidas */}
            <div className="ml-sugerencias-panel" style={{ marginTop: '1.5rem' }}>
              <div className="ml-sugerencias-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 className="ml-sugerencias-titulo" style={{ margin: 0, color: '#424242' }}>
                  🤖 Sugerencias - Machine Learning
                </h3>
                <div className="ml-filtros-sugerencias" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className={`ml-filtro-btn cafe ${categoriaFiltroSugerencias === 'cafe' ? 'active' : ''}`}
                    onClick={() => setCategoriaFiltroSugerencias('cafe')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: categoriaFiltroSugerencias === 'cafe' ? '600' : '400',
                      backgroundColor: categoriaFiltroSugerencias === 'cafe' ? '#2e7d32' : '#f5f5f5',
                      color: categoriaFiltroSugerencias === 'cafe' ? 'white' : '#666',
                      transition: 'all 0.2s'
                    }}
                  >
                    ☕ Café
                  </button>
                  <button
                    className={`ml-filtro-btn te ${categoriaFiltroSugerencias === 'te' ? 'active' : ''}`}
                    onClick={() => setCategoriaFiltroSugerencias('te')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: categoriaFiltroSugerencias === 'te' ? '600' : '400',
                      backgroundColor: categoriaFiltroSugerencias === 'te' ? '#7cb342' : '#f5f5f5',
                      color: categoriaFiltroSugerencias === 'te' ? 'white' : '#666',
                      transition: 'all 0.2s'
                    }}
                  >
                    🍵 Té
                  </button>
                  <button
                    className={`ml-filtro-btn pasteleria ${categoriaFiltroSugerencias === 'pasteleria' ? 'active' : ''}`}
                    onClick={() => setCategoriaFiltroSugerencias('pasteleria')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: categoriaFiltroSugerencias === 'pasteleria' ? '600' : '400',
                      backgroundColor: categoriaFiltroSugerencias === 'pasteleria' ? '#D2691E' : '#f5f5f5',
                      color: categoriaFiltroSugerencias === 'pasteleria' ? 'white' : '#666',
                      transition: 'all 0.2s'
                    }}
                  >
                    🎂 Pastelería
                  </button>
                  <button
                    className={`ml-filtro-btn empanadas ${categoriaFiltroSugerencias === 'empanadas' ? 'active' : ''}`}
                    onClick={() => setCategoriaFiltroSugerencias('empanadas')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: categoriaFiltroSugerencias === 'empanadas' ? '600' : '400',
                      backgroundColor: categoriaFiltroSugerencias === 'empanadas' ? '#CD853F' : '#f5f5f5',
                      color: categoriaFiltroSugerencias === 'empanadas' ? 'white' : '#666',
                      transition: 'all 0.2s'
                    }}
                  >
                    🥟 Empanadas
                  </button>
                  <button
                    className={`ml-filtro-btn sandwiches ${categoriaFiltroSugerencias === 'sandwiches' ? 'active' : ''}`}
                    onClick={() => setCategoriaFiltroSugerencias('sandwiches')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: categoriaFiltroSugerencias === 'sandwiches' ? '600' : '400',
                      backgroundColor: categoriaFiltroSugerencias === 'sandwiches' ? '#8B4513' : '#f5f5f5',
                      color: categoriaFiltroSugerencias === 'sandwiches' ? 'white' : '#666',
                      transition: 'all 0.2s'
                    }}
                  >
                    🥪 Sándwiches
                  </button>
                  <button
                    className={`ml-filtro-btn bebidas ${categoriaFiltroSugerencias === 'bebidas' ? 'active' : ''}`}
                    onClick={() => setCategoriaFiltroSugerencias('bebidas')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: categoriaFiltroSugerencias === 'bebidas' ? '600' : '400',
                      backgroundColor: categoriaFiltroSugerencias === 'bebidas' ? '#1976d2' : '#f5f5f5',
                      color: categoriaFiltroSugerencias === 'bebidas' ? 'white' : '#666',
                      transition: 'all 0.2s'
                    }}
                  >
                    🥤 Bebidas
                  </button>
                  <button
                    className={`ml-filtro-btn energeticas ${categoriaFiltroSugerencias === 'energeticas' ? 'active' : ''}`}
                    onClick={() => setCategoriaFiltroSugerencias('energeticas')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: categoriaFiltroSugerencias === 'energeticas' ? '600' : '400',
                      backgroundColor: categoriaFiltroSugerencias === 'energeticas' ? '#FF6B00' : '#f5f5f5',
                      color: categoriaFiltroSugerencias === 'energeticas' ? 'white' : '#666',
                      transition: 'all 0.2s'
                    }}
                  >
                    ⚡ Energéticas
                  </button>
                    </div>
                </div>
              
              {/* Grid de productos según filtro seleccionado */}
                <div className="ml-productos-grid" style={{
                  display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '1rem',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}>
                {(() => {
                  // Seleccionar productos según categoría filtrada
                  // Categorías reales de la BD: Café, Té, Pastelería, Empanadas, Sándwiches, Bebidas
                  let productosAMostrar = [];
                  let colorTitulo = '#D2691E';
                  
                  // Función auxiliar para normalizar texto (quitar acentos y convertir a minúsculas)
                  const normalizar = (texto) => {
                    if (!texto) return '';
                    return texto.toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '');
                  };
                  
                  // Usar productosEstacion como fuente principal, y todosLosProductos como fallback
                  const productosML = productosEstacion || [];
                  const productosBD = todosLosProductos || [];
                  // Combinar ambas fuentes, priorizando ML
                  const todosProductos = productosML.length > 0 ? productosML : productosBD;
                  
                  // Debug: mostrar qué hay en productosBD
                  console.log('🔍 productosBD:', productosBD.length, 'productos');
                  console.log('🔍 Categorías en BD:', [...new Set(productosBD.map(p => p.categoria))]);
                  
                  // Función para filtrar por categoría de forma flexible
                  const filtrarPorCategoria = (productos, categoriasBuscar) => {
                    return productos.filter(p => {
                      const catNormalizada = normalizar(p.categoria);
                      return categoriasBuscar.some(cat => catNormalizada.includes(normalizar(cat)));
                    });
                  };
                  
                  // Función para filtrar por categoría EXACTA (no includes)
                  const filtrarPorCategoriaExacta = (productos, categoriasBuscar) => {
                    return productos.filter(p => {
                      if (!p || !p.categoria) return false;
                      const catNormalizada = normalizar(p.categoria);
                      return categoriasBuscar.some(cat => catNormalizada === normalizar(cat));
                    });
                  };
                  
                  // Combinar datos de ML con BD para obtener ventas
                  const combinarConVentas = (productosCategoria, datosML) => {
                    if (!productosCategoria || productosCategoria.length === 0) return [];
                    
                    // Primero intentar usar productosAnuales que tienen datos reales de ventas
                    if (productosAnuales && productosAnuales.length > 0) {
                      return productosCategoria.map(p => {
                        const productoConVentas = productosAnuales.find(pa => 
                          normalizar(pa.nombre) === normalizar(p.nombre)
                        );
                        if (productoConVentas && productoConVentas.total_vendido > 0) {
                          return {
                            ...p,
                            total_vendido: productoConVentas.total_vendido,
                            precio: productoConVentas.precio || p.precio
                          };
                        }
                        return p;
                      });
                    }
                    
                    // Si hay datos de ML, usarlos para obtener total_vendido
                    if (datosML && datosML.length > 0) {
                      return productosCategoria.map(p => {
                        const productoML = datosML.find(ml => 
                          normalizar(ml.nombre) === normalizar(p.nombre)
                        );
                        return {
                          ...p,
                          total_vendido: productoML?.total_vendido || p.total_vendido || 0
                        };
                      });
                    }
                    return productosCategoria;
                  };
                  
                  // Todos los productos del ML para buscar ventas
                  const todosProductosML = [
                    ...(productosCafeEstacion || []),
                    ...(productosPasteleriaEstacion || []),
                    ...(productosEmpanadasEstacion || []),
                    ...(productosEnergizantesEstacion || []),
                    ...(productosEstacion || [])
                  ];
                  
                  switch(categoriaFiltroSugerencias) {
                    case 'cafe':
                      // Usar datos de ML si existen, sino filtrar de BD
                      if (productosCafeEstacion?.length > 0) {
                        productosAMostrar = productosCafeEstacion;
                      } else {
                        let cafesBD = filtrarPorCategoriaExacta(productosBD, ['café', 'cafe']);
                        if (cafesBD.length === 0) {
                          cafesBD = [
                            { id_producto: 1, nombre: 'Espresso', categoria: 'Café', precio: 1500, total_vendido: 0 },
                            { id_producto: 2, nombre: 'Americano', categoria: 'Café', precio: 1800, total_vendido: 0 },
                            { id_producto: 3, nombre: 'Latte', categoria: 'Café', precio: 2500, total_vendido: 0 },
                            { id_producto: 4, nombre: 'Cappuccino', categoria: 'Café', precio: 2500, total_vendido: 0 },
                            { id_producto: 9, nombre: 'Frappuccino', categoria: 'Café', precio: 3500, total_vendido: 0 }
                          ];
                        }
                        productosAMostrar = combinarConVentas(cafesBD, todosProductosML);
                      }
                      colorTitulo = '#2e7d32';
                      break;
                    case 'te':
                      // Filtrar productos de categoría Té
                      let tesBD = productosBD.filter(p => {
                        if (!p || !p.categoria) return false;
                        const catNorm = normalizar(p.categoria).trim();
                        return catNorm === 'te';
                      });
                      
                      // Si no hay productos de Té en BD, usar fallback con productos conocidos
                      if (tesBD.length === 0) {
                        tesBD = [
                          { id_producto: 10, nombre: 'Té Verde', categoria: 'Té', precio: 1500, total_vendido: 0 },
                          { id_producto: 11, nombre: 'Té Negro', categoria: 'Té', precio: 1500, total_vendido: 0 },
                          { id_producto: 12, nombre: 'Chai Latte', categoria: 'Té', precio: 2500, total_vendido: 0 },
                          { id_producto: 13, nombre: 'Matcha Latte', categoria: 'Té', precio: 3200, total_vendido: 0 }
                        ];
                      }
                      
                      productosAMostrar = combinarConVentas(tesBD, todosProductosML);
                      colorTitulo = '#7cb342';
                      break;
                    case 'pasteleria':
                      // Usar datos de ML si existen
                      if (productosPasteleriaEstacion?.length > 0) {
                        productosAMostrar = productosPasteleriaEstacion.filter(p => {
                          const catNorm = normalizar(p.categoria);
                          return catNorm === 'pasteleria';
                        });
                        // Si el filtro vacía todo, usar todos los de ML
                        if (productosAMostrar.length === 0) {
                          productosAMostrar = productosPasteleriaEstacion;
                        }
                      } else {
                        let pasteleriasBD = filtrarPorCategoriaExacta(productosBD, ['pastelería', 'pasteleria']);
                        if (pasteleriasBD.length === 0) {
                          pasteleriasBD = [
                            { id_producto: 14, nombre: 'Kuchen de Nuez', categoria: 'Pastelería', precio: 2800, total_vendido: 0 },
                            { id_producto: 15, nombre: 'Torta de Chocolate', categoria: 'Pastelería', precio: 3200, total_vendido: 0 },
                            { id_producto: 16, nombre: 'Cheesecake', categoria: 'Pastelería', precio: 3500, total_vendido: 0 },
                            { id_producto: 17, nombre: 'Brownie', categoria: 'Pastelería', precio: 2200, total_vendido: 0 },
                            { id_producto: 20, nombre: 'Croissant', categoria: 'Pastelería', precio: 1500, total_vendido: 0 }
                          ];
                        }
                        productosAMostrar = combinarConVentas(pasteleriasBD, todosProductosML);
                      }
                      colorTitulo = '#D2691E';
                      break;
                    case 'empanadas':
                      // Usar datos de ML si existen
                      if (productosEmpanadasEstacion?.length > 0) {
                        productosAMostrar = productosEmpanadasEstacion;
                      } else {
                        let empanadasBD = filtrarPorCategoriaExacta(productosBD, ['empanadas']);
                        if (empanadasBD.length === 0) {
                          empanadasBD = [
                            { id_producto: 25, nombre: 'Empanada de Pino', categoria: 'Empanadas', precio: 2500, total_vendido: 0 },
                            { id_producto: 26, nombre: 'Empanada de Queso', categoria: 'Empanadas', precio: 2200, total_vendido: 0 },
                            { id_producto: 27, nombre: 'Empanada Napolitana', categoria: 'Empanadas', precio: 2400, total_vendido: 0 },
                            { id_producto: 28, nombre: 'Empanada de Pollo', categoria: 'Empanadas', precio: 2500, total_vendido: 0 },
                            { id_producto: 29, nombre: 'Empanada Champiñón', categoria: 'Empanadas', precio: 2400, total_vendido: 0 }
                          ];
                        }
                        productosAMostrar = combinarConVentas(empanadasBD, todosProductosML);
                      }
                      colorTitulo = '#CD853F';
                      break;
                    case 'sandwiches':
                      // Obtener TODOS los productos de Sándwiches de la BD
                      let sandwichesBD = filtrarPorCategoriaExacta(productosBD, ['sándwiches', 'sandwiches']);
                      
                      // Si no hay en BD, usar fallback
                      if (sandwichesBD.length === 0) {
                        sandwichesBD = [
                          { id_producto: 30, nombre: 'Sándwich Jamón Queso', categoria: 'Sándwiches', precio: 2800, total_vendido: 0 },
                          { id_producto: 31, nombre: 'Tostado Italiano', categoria: 'Sándwiches', precio: 3500, total_vendido: 0 },
                          { id_producto: 32, nombre: 'Bagel Cream Cheese', categoria: 'Sándwiches', precio: 4200, total_vendido: 0 }
                        ];
                      }
                      
                      // Combinar con productosAnuales para obtener ventas reales
                      productosAMostrar = combinarConVentas(sandwichesBD, todosProductosML);
                      
                      // También agregar productos de productosAnuales que sean Sándwiches pero no estén en BD
                      if (productosAnuales && productosAnuales.length > 0) {
                        const sandwichesAnuales = productosAnuales.filter(p => {
                          const catNorm = normalizar(p.categoria);
                          return catNorm === 'sandwiches' || catNorm === 'sándwiches';
                        });
                        
                        console.log('🔍 Sándwiches en productosAnuales:', sandwichesAnuales.length, sandwichesAnuales);
                        
                        // Agregar productos que no estén ya en productosAMostrar
                        sandwichesAnuales.forEach(pa => {
                          const existe = productosAMostrar.find(p => 
                            normalizar(p.nombre) === normalizar(pa.nombre)
                          );
                          if (!existe) {
                            productosAMostrar.push(pa);
                          } else {
                            // Actualizar ventas si el de productosAnuales tiene más datos
                            existe.total_vendido = pa.total_vendido || existe.total_vendido || 0;
                            existe.precio = pa.precio || existe.precio;
                          }
                        });
                      }
                      
                      console.log('🔍 Sándwiches a mostrar:', productosAMostrar.length, productosAMostrar);
                      
                      colorTitulo = '#8B4513';
                      break;
                    case 'bebidas':
                      // Obtener TODOS los productos de Bebidas de la BD
                      let bebidasBD = filtrarPorCategoriaExacta(productosBD, ['bebidas']);
                      
                      // Si no hay en BD, usar fallback
                      if (bebidasBD.length === 0) {
                        bebidasBD = [
                          { id_producto: 33, nombre: 'Jugo Naranja', categoria: 'Bebidas', precio: 2500, total_vendido: 0 },
                          { id_producto: 34, nombre: 'Limonada', categoria: 'Bebidas', precio: 2200, total_vendido: 0 },
                          { id_producto: 35, nombre: 'Agua Mineral', categoria: 'Bebidas', precio: 1000, total_vendido: 0 },
                          { id_producto: 36, nombre: 'Chocolate Caliente', categoria: 'Bebidas', precio: 2500, total_vendido: 0 }
                        ];
                      }
                      
                      // Combinar con productosAnuales para obtener ventas reales
                      // Esto mostrará TODOS los productos de Bebidas, no solo los del top
                      productosAMostrar = combinarConVentas(bebidasBD, todosProductosML);
                      
                      // También agregar productos de productosAnuales que sean Bebidas pero no estén en BD
                      if (productosAnuales && productosAnuales.length > 0) {
                        const bebidasAnuales = productosAnuales.filter(p => {
                          const catNorm = normalizar(p.categoria);
                          return catNorm === 'bebidas';
                        });
                        
                        // Agregar productos que no estén ya en productosAMostrar
                        bebidasAnuales.forEach(pa => {
                          const existe = productosAMostrar.find(p => 
                            normalizar(p.nombre) === normalizar(pa.nombre)
                          );
                          if (!existe) {
                            productosAMostrar.push(pa);
                          } else {
                            // Actualizar ventas si el de productosAnuales tiene más datos
                            existe.total_vendido = pa.total_vendido || existe.total_vendido || 0;
                            existe.precio = pa.precio || existe.precio;
                          }
                        });
                      }
                      
                      colorTitulo = '#1976d2';
                      break;
                    case 'energeticas':
                      // Usar datos de ML si existen
                      if (productosEnergizantesEstacion?.length > 0) {
                        productosAMostrar = productosEnergizantesEstacion;
                      } else {
                        let energeticasBD = filtrarPorCategoriaExacta(productosBD, ['energéticas', 'energeticas']);
                        if (energeticasBD.length === 0) {
                          energeticasBD = [
                            { id_producto: 37, nombre: 'Red Bull Original', categoria: 'Energéticas', precio: 2500, total_vendido: 0 },
                            { id_producto: 38, nombre: 'Red Bull Sugar Free', categoria: 'Energéticas', precio: 2500, total_vendido: 0 },
                            { id_producto: 39, nombre: 'Monster Energy', categoria: 'Energéticas', precio: 2800, total_vendido: 0 },
                            { id_producto: 40, nombre: 'Monster Ultra', categoria: 'Energéticas', precio: 2800, total_vendido: 0 },
                            { id_producto: 41, nombre: 'Monster Mango Loco', categoria: 'Energéticas', precio: 2800, total_vendido: 0 }
                          ];
                        }
                        productosAMostrar = combinarConVentas(energeticasBD, todosProductosML);
                      }
                      colorTitulo = '#FF6B00';
                      break;
                    default:
                      if (productosPasteleriaEstacion?.length > 0) {
                        productosAMostrar = productosPasteleriaEstacion;
                      } else {
                        let defaultBD = filtrarPorCategoriaExacta(productosBD, ['pastelería', 'pasteleria']);
                        if (defaultBD.length === 0) {
                          defaultBD = [
                            { id_producto: 14, nombre: 'Kuchen de Nuez', categoria: 'Pastelería', precio: 2800, total_vendido: 0 },
                            { id_producto: 15, nombre: 'Torta de Chocolate', categoria: 'Pastelería', precio: 3200, total_vendido: 0 },
                            { id_producto: 16, nombre: 'Cheesecake', categoria: 'Pastelería', precio: 3500, total_vendido: 0 },
                            { id_producto: 17, nombre: 'Brownie', categoria: 'Pastelería', precio: 2200, total_vendido: 0 },
                            { id_producto: 20, nombre: 'Croissant', categoria: 'Pastelería', precio: 1500, total_vendido: 0 }
                          ];
                        }
                        productosAMostrar = combinarConVentas(defaultBD, todosProductosML);
                      }
                      colorTitulo = '#D2691E';
                  }
                  
                  if (productosAMostrar.length === 0) {
                    return (
                      <div style={{ 
                        gridColumn: '1 / -1', 
                        padding: '2rem', 
                        textAlign: 'center', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '8px',
                        color: '#666'
                      }}>
                        <p style={{ margin: 0 }}>No hay productos disponibles en esta categoría.</p>
                    </div>
                    );
                  }
                  
                  // Mostrar TODOS los productos que el ML predice, sin ordenar por ventas
                  // El orden debe ser según la predicción del ML, no por ventas reales
                  return productosAMostrar.map((producto, index) => {
                    // Calcular indicador de cumplimiento ML
                    const vendidos = producto.total_vendido || 0;
                    const prediccionBase = producto.prediccion || Math.round((index + 1) * 8 + 10); // Predicción estimada
                    const porcentajeCumplimiento = prediccionBase > 0 ? Math.round((vendidos / prediccionBase) * 100) : 0;
                    
                    // Determinar estado del cumplimiento
                    let estadoML = { emoji: '🔴', texto: 'Por debajo', color: '#e53935', bg: '#ffebee' };
                    if (porcentajeCumplimiento >= 100) {
                      estadoML = { emoji: '🟢', texto: '¡Superado!', color: '#2e7d32', bg: '#e8f5e9' };
                    } else if (porcentajeCumplimiento >= 75) {
                      estadoML = { emoji: '🟡', texto: 'En camino', color: '#f9a825', bg: '#fff8e1' };
                    } else if (porcentajeCumplimiento >= 50) {
                      estadoML = { emoji: '🟠', texto: 'Regular', color: '#ef6c00', bg: '#fff3e0' };
                    }
                    
                    return (
                      <div key={`sugerencia-${categoriaFiltroSugerencias}-${index}`} style={{
                      padding: '1rem',
                      backgroundColor: 'white',
                        borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: colorTitulo }}>{producto.nombre}</h4>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Categoría:</strong> {producto.categoria}
                      </p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Precio:</strong> {formatearMoneda(producto.precio || 0)}
                      </p>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: colorTitulo }}>
                          <strong>Vendidos:</strong> {vendidos} unidades
                        </p>
                        {/* Indicador de Cumplimiento ML */}
                        <div style={{ 
                          marginTop: '0.5rem', 
                          padding: '0.4rem 0.6rem', 
                          backgroundColor: estadoML.bg, 
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <span style={{ fontSize: '0.9rem' }}>{estadoML.emoji}</span>
                          <span style={{ fontSize: '0.75rem', color: estadoML.color, fontWeight: '600' }}>
                            ML: {estadoML.texto} ({porcentajeCumplimiento}%)
                          </span>
                    </div>
                </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Recomendaciones adicionales */}
            {(recomendaciones && recomendaciones.length > 0) || (alertasStock.length > 0 || (datos.insumosBajos && datos.insumosBajos.length > 0)) ? (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#424242' }}>💡 Recomendaciones Inteligentes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Tarjeta dedicada: Insumos con stock bajo con nombres */}
                  {(() => {
                    const insumosBajosMostrar = alertasStock.length > 0 ? alertasStock : (datos.insumosBajos || []);
                    if (!insumosBajosMostrar || insumosBajosMostrar.length === 0) return null;
                    const nombres = insumosBajosMostrar.slice(0, 10).map(i => i.nombre || '').filter(Boolean).join(', ');
                    return (
                      <div
                        style={{
                          padding: '1rem',
                          backgroundColor: '#fff3cd',
                          border: '1px solid #ffc107',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          localStorage.setItem('filtroInsumosBajo', 'true');
                          window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'insumos' } }));
                        }}
                        role="button"
                        aria-label="Ver insumos con stock bajo"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                            <strong>Hay {insumosBajosMostrar.length} insumos con stock bajo</strong>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              localStorage.setItem('filtroInsumosBajo', 'true');
                              window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'insumos' } }));
                            }}
                            style={{
                              padding: '0.45rem 0.9rem',
                              backgroundColor: '#ffc107',
                              color: '#856404',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '0.85rem'
                            }}
                          >
                            📦 Ver insumos bajos
                          </button>
                        </div>
                        <p style={{ margin: '0.5rem 0 0 2.2rem', fontSize: '0.9rem', color: '#856404', fontWeight: 600 }}>
                          Reponer insumos: {nombres}
                          {insumosBajosMostrar.length > 10 && ` y ${insumosBajosMostrar.length - 10} más...`}
                        </p>
                      </div>
                    );
                  })()}
                  {recomendaciones.map((rec, index) => {
                    // Verificar si es una recomendación sobre insumos con stock bajo
                    const esInsumosBajos = rec.mensaje && rec.mensaje.toLowerCase().includes('insumos con stock bajo');
                    const insumosBajosMostrar = alertasStock.length > 0 ? alertasStock : datos.insumosBajos;
                    
                    return (
                      <div key={index} style={{
                        padding: '1rem',
                        backgroundColor: rec.nivel === 'advertencia' ? '#fff3cd' : '#d1ecf1',
                        border: `1px solid ${rec.nivel === 'advertencia' ? '#ffc107' : '#0dcaf0'}`,
                        borderRadius: '6px',
                        cursor: esInsumosBajos ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (esInsumosBajos) {
                          localStorage.setItem('filtroInsumosBajo', 'true');
                          window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'insumos' } }));
                        }
                      }}
                      role={esInsumosBajos && insumosBajosMostrar.length > 0 ? 'button' : undefined}
                      aria-label={esInsumosBajos && insumosBajosMostrar.length > 0 ? 'Ver insumos con stock bajo' : undefined}
                      >
                        {/* Encabezado en una sola línea con botón a la derecha cuando aplica */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                            <span style={{ fontSize: '1.5rem' }}>
                              {rec.nivel === 'advertencia' ? '⚠️' : 'ℹ️'}
                            </span>
                            <strong style={{ display: 'block' }}>
                              {rec.mensaje}
                            </strong>
                          </div>
                          {esInsumosBajos && insumosBajosMostrar.length > 0 && (
                            <button
                              onClick={() => {
                                localStorage.setItem('filtroInsumosBajo', 'true');
                                window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'insumos' } }));
                              }}
                              style={{
                                padding: '0.45rem 0.9rem',
                                backgroundColor: '#ffc107',
                                color: '#856404',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.85rem'
                              }}
                              onMouseEnter={(e) => { e.target.style.backgroundColor = '#ffb300'; }}
                              onMouseLeave={(e) => { e.target.style.backgroundColor = '#ffc107'; }}
                            >
                              📦 Ver insumos bajos
                            </button>
                          )}
                        </div>

                        {/* Descripción y, si aplica, nombres de insumos */}
                        <div style={{ marginTop: '0.5rem' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', marginBottom: esInsumosBajos && insumosBajosMostrar.length > 0 ? '0.5rem' : '0' }}>
                            {rec.accion}
                          </p>
                          {esInsumosBajos && (
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#856404', fontWeight: '600' }}>
                              {insumosBajosMostrar && insumosBajosMostrar.length > 0
                                ? (
                                  <>
                                    Reponer insumos: {insumosBajosMostrar.slice(0, 10).map(i => i.nombre || '').filter(Boolean).join(', ')}
                                    {insumosBajosMostrar.length > 10 && ` y ${insumosBajosMostrar.length - 10} más...`}
                                  </>
                                )
                                : 'Abrir Gestión de Insumos para ver detalle y reponer'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Gráficos de Machine Learning */}
            {datosGraficos && (
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e0e0e0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: '#424242' }}>📊 Análisis Visual de Datos</h3>
                  
                  {/* Filtro de Estación para Gráficos Principales */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
                      Filtrar por Estación:
                    </label>
                    <select
                      value={estacionFiltroGraficosPrincipales}
                      onChange={async (e) => {
                        // Guardar posición del scroll ANTES de cualquier cambio
                        const currentScroll = window.pageYOffset || document.documentElement.scrollTop || window.scrollY;
                        scrollPositionRef.current = currentScroll;
                        console.log('📍 Guardando posición del scroll:', currentScroll);
                        const nuevaEstacion = e.target.value;
                        console.log('🔄 Cambiando filtro de estación a:', nuevaEstacion);
                        setEstacionFiltroGraficosPrincipales(nuevaEstacion);
                        // Limpiar datos anteriores para forzar actualización
                        setDatosGraficos(null);
                        // Cargar nuevos datos
                        await cargarPrediccionesML(nuevaEstacion);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        fontSize: '0.9rem',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        minWidth: '150px'
                      }}
                    >
                      <option value="todas">Todas las Estaciones</option>
                      <option value="verano">Verano</option>
                      <option value="otoño">Otoño</option>
                      <option value="invierno">Invierno</option>
                      <option value="primavera">Primavera</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {/* Gráfico 1: Ventas por Estación */}
                  {datosGraficos.ventas_por_estacion && datosGraficos.ventas_por_estacion.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#1976d2', fontSize: '1.1rem' }}>Ventas por Estación</h4>
                      <Bar 
                        data={{
                          labels: datosGraficos.ventas_por_estacion.map(e => e.estacion.charAt(0).toUpperCase() + e.estacion.slice(1)),
                          datasets: [{
                            label: 'Total Ventas',
                            data: datosGraficos.ventas_por_estacion.map(e => e.ventas),
                            backgroundColor: [
                              'rgba(255, 99, 132, 0.6)',
                              'rgba(54, 162, 235, 0.6)',
                              'rgba(255, 206, 86, 0.6)',
                              'rgba(75, 192, 192, 0.6)'
                            ],
                            borderColor: [
                              'rgba(255, 99, 132, 1)',
                              'rgba(54, 162, 235, 1)',
                              'rgba(255, 206, 86, 1)',
                              'rgba(75, 192, 192, 1)'
                            ],
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              display: false
                            },
                            title: {
                              display: false
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                        height={250}
                      />
                    </div>
                  )}

                  {/* Gráfico 2: Tendencia de Ventas Mensuales - REDUCIDO */}
                  {datosGraficos.ventas_mensuales && datosGraficos.ventas_mensuales.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#1976d2', fontSize: '1.1rem' }}>Tendencia de Ventas (Últimos 6 Meses)</h4>
                      <Line 
                        data={{
                          labels: datosGraficos.ventas_mensuales.map(m => {
                            const [year, month] = m.mes.split('-');
                            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                            return `${meses[parseInt(month) - 1]} ${year}`;
                          }),
                          datasets: [{
                            label: 'Ventas',
                            data: datosGraficos.ventas_mensuales.map(m => m.total_ventas),
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.4,
                            fill: true
                          }, {
                            label: 'Ingresos (CLP)',
                            data: datosGraficos.ventas_mensuales.map(m => Math.round(m.total_ingresos / 1000)),
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.4,
                            fill: false,
                            yAxisID: 'y1'
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top'
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Cantidad de Ventas'
                              }
                            },
                            y1: {
                              type: 'linear',
                              display: true,
                              position: 'right',
                              title: {
                                display: true,
                                text: 'Ingresos (miles CLP)'
                              },
                              grid: {
                                drawOnChartArea: false
                              }
                            }
                          }
                        }}
                        height={250}
                      />
                    </div>
                  )}

                  {/* Gráfico 3: Productos Top */}
                  {!cargandoML && datosGraficos.productos_top && datosGraficos.productos_top.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>
                        Top 5 Productos Más Vendidos
                        {estacionFiltroGraficosPrincipales !== 'todas' && (
                          <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                            ({estacionFiltroGraficosPrincipales.charAt(0).toUpperCase() + estacionFiltroGraficosPrincipales.slice(1)})
                          </span>
                        )}
                      </h4>
                      <Bar 
                        key={`productos-top-${estacionFiltroGraficosPrincipales}-${datosGraficos._timestamp || Date.now()}-${JSON.stringify(datosGraficos.productos_top.map(p => `${p.nombre}-${p.total_vendido}`)).slice(0, 100)}`}
                        data={{
                          labels: datosGraficos.productos_top.map(p => p.nombre.length > 20 ? p.nombre.substring(0, 20) + '...' : p.nombre),
                          datasets: [{
                            label: 'Unidades Vendidas',
                            data: datosGraficos.productos_top.map(p => p.total_vendido || 0),
                            backgroundColor: 'rgba(153, 102, 255, 0.6)',
                            borderColor: 'rgba(153, 102, 255, 1)',
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              display: false
                            }
                          },
                          scales: {
                            x: {
                              beginAtZero: true
                            }
                          }
                        }}
                        height={250}
                      />
                    </div>
                  )}
                  {!cargandoML && datosGraficos.productos_top && datosGraficos.productos_top.length === 0 && (
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>Top 5 Productos Más Vendidos</h4>
                      <p style={{ color: '#666' }}>No hay datos de ventas para esta estación.</p>
                    </div>
                  )}

                  {/* Gráfico 4: Categorías Vendidas */}
                  {!cargandoML && datosGraficos.categorias_vendidas && datosGraficos.categorias_vendidas.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>
                        Distribución por Categoría
                        {estacionFiltroGraficosPrincipales !== 'todas' && (
                          <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                            ({estacionFiltroGraficosPrincipales.charAt(0).toUpperCase() + estacionFiltroGraficosPrincipales.slice(1)})
                          </span>
                        )}
                      </h4>
                      <Doughnut 
                        key={`categorias-${estacionFiltroGraficosPrincipales}-${datosGraficos._timestamp || Date.now()}-${JSON.stringify(datosGraficos.categorias_vendidas.map(c => c.categoria + c.total_ingresos)).slice(0, 50)}`}
                        data={{
                          labels: datosGraficos.categorias_vendidas.map(c => c.categoria),
                          datasets: [{
                            label: 'Ingresos',
                            data: datosGraficos.categorias_vendidas.map(c => Math.round(c.total_ingresos || 0)),
                            backgroundColor: [
                              'rgba(255, 99, 132, 0.6)',
                              'rgba(54, 162, 235, 0.6)',
                              'rgba(255, 206, 86, 0.6)',
                              'rgba(75, 192, 192, 0.6)',
                              'rgba(153, 102, 255, 0.6)',
                              'rgba(255, 159, 64, 0.6)'
                            ],
                            borderColor: [
                              'rgba(255, 99, 132, 1)',
                              'rgba(54, 162, 235, 1)',
                              'rgba(255, 206, 86, 1)',
                              'rgba(75, 192, 192, 1)',
                              'rgba(153, 102, 255, 1)',
                              'rgba(255, 159, 64, 1)'
                            ],
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }}
                        height={250}
                      />
                    </div>
                  )}
                  {!cargandoML && datosGraficos.categorias_vendidas && datosGraficos.categorias_vendidas.length === 0 && (
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>Distribución por Categoría</h4>
                      <p style={{ color: '#666' }}>No hay datos de ventas para esta estación.</p>
                    </div>
                  )}

                  {/* Gráfico Único: Productos Más Vendidos con Filtro de Categoría */}
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <h4 style={{ margin: 0, color: '#1976d2', fontSize: '1rem' }}>
                        {(() => {
                          const categoriaTexto = categoriaFiltroGrafico === 'todas' ? '🏆 Top Productos' : 
                            categoriaFiltroGrafico === 'Café' ? '☕ Café' :
                            categoriaFiltroGrafico === 'Té' ? '🍵 Té' :
                            categoriaFiltroGrafico === 'Pastelería' ? '🎂 Pastelería' :
                            categoriaFiltroGrafico === 'Empanadas' ? '🥟 Empanadas' :
                            categoriaFiltroGrafico === 'Sándwiches' ? '🥪 Sándwiches' :
                            categoriaFiltroGrafico === 'Bebidas' ? '🥤 Bebidas' :
                            categoriaFiltroGrafico === 'Energéticas' ? '⚡ Energéticas' :
                            'Productos';
                          
                          const estacionTexto = estacionFiltroGrafico === 'todas' ? '' :
                            estacionFiltroGrafico === 'verano' ? ' - ☀️ Verano' :
                            estacionFiltroGrafico === 'otoño' ? ' - 🍂 Otoño' :
                            estacionFiltroGrafico === 'invierno' ? ' - ❄️ Invierno' :
                            estacionFiltroGrafico === 'primavera' ? ' - 🌸 Primavera' : '';
                          
                          return `${categoriaTexto} (Vendidos)${estacionTexto}`;
                        })()}
                      </h4>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                          <label htmlFor="filtro-categoria-grafico" style={{ marginRight: '0.5rem', fontWeight: 'bold', color: '#666', fontSize: '0.85rem' }}>
                            Categoría:
                        </label>
                        <select
                          id="filtro-categoria-grafico"
                          value={categoriaFiltroGrafico}
                          onChange={(e) => {
                            try {
                              // Guardar posición del scroll ANTES de cualquier cambio
                              const currentScroll = window.pageYOffset || document.documentElement.scrollTop || window.scrollY;
                              scrollPositionRef.current = currentScroll;
                              setCategoriaFiltroGrafico(e.target.value);
                            } catch (error) {
                              console.error('Error cambiando filtro:', error);
                            }
                          }}
                          style={{
                              padding: '0.4rem 0.6rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                              fontSize: '0.85rem',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                          }}
                        >
                            <option value="todas">Todas</option>
                            <option value="Café">☕ Café</option>
                            <option value="Té">🍵 Té</option>
                            <option value="Pastelería">🎂 Pastelería</option>
                            <option value="Empanadas">🥟 Empanadas</option>
                            <option value="Sándwiches">🥪 Sándwiches</option>
                            <option value="Bebidas">🥤 Bebidas</option>
                            <option value="Energéticas">⚡ Energéticas</option>
                        </select>
                        </div>
                        <div>
                          <label htmlFor="filtro-estacion-grafico" style={{ marginRight: '0.5rem', fontWeight: 'bold', color: '#666', fontSize: '0.85rem' }}>
                            Estación:
                          </label>
                          <select
                            id="filtro-estacion-grafico"
                            value={estacionFiltroGrafico}
                            onChange={(e) => {
                              // Guardar posición del scroll ANTES de cualquier cambio
                              const currentScroll = window.pageYOffset || document.documentElement.scrollTop || window.scrollY;
                              scrollPositionRef.current = currentScroll;
                              setEstacionFiltroGrafico(e.target.value);
                            }}
                            style={{
                              padding: '0.4rem 0.6rem',
                              borderRadius: '4px',
                              border: '1px solid #ddd',
                              fontSize: '0.85rem',
                              backgroundColor: 'white',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="todas">🗓️ Todo el Año</option>
                            <option value="verano">☀️ Verano (Dic-Feb)</option>
                            <option value="otoño">🍂 Otoño (Mar-May)</option>
                            <option value="invierno">❄️ Invierno (Jun-Ago)</option>
                            <option value="primavera">🌸 Primavera (Sep-Nov)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    {datosDonaUnico ? (
                      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem' }}>
                      <Doughnut 
                          key={`dona-${categoriaFiltroGrafico}-${estacionFiltroGrafico}`}
                        data={datosDonaUnico}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                            cutout: '50%',
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                boxWidth: 12,
                                  font: { size: 11 },
                                  padding: 10,
                                usePointStyle: true
                              }
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const label = context.label || '';
                                  const value = context.parsed || 0;
                                  return `${label}: ${value} unidades`;
                                }
                              }
                            }
                          }
                        }}
                      />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#666', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                          No hay datos disponibles para esta categoría
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#999' }}>
                          {categoriaFiltroGrafico === 'empanadas' 
                            ? 'No se encontraron empanadas vendidas en el período seleccionado según las predicciones de Machine Learning.'
                            : `No se encontraron productos de ${categoriaFiltroGrafico} vendidos en el período seleccionado.`}
                        </p>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* SECCIÓN 2: MÉTRICAS CON FILTRO DE MESES (3, 6, 12, 24, 36 meses) */}
            {/* ============================================ */}
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e0e0e0' }}>
              <h2 className="section-title" style={{ marginBottom: '1.5rem', fontSize: '1.3rem', color: '#8C6A4F' }}>
                📈 Análisis por Período
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: '#424242', fontSize: '1.1rem' }}>🏆 Productos Más Vendidos</h3>
                
                {/* Filtro de Meses */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
                    Últimos:
                  </label>
                  <select
                    value={mesesFiltroAnuales}
                    onChange={(e) => {
                      const meses = parseInt(e.target.value);
                      console.log('🔄 Cambiando filtro de meses a:', meses);
                      setMesesFiltroAnuales(meses);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '0.9rem',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      minWidth: '120px'
                    }}
                  >
                    <option value="3">3 meses</option>
                    <option value="6">6 meses</option>
                    <option value="12">12 meses (1 año)</option>
                    <option value="24">24 meses (2 años)</option>
                    <option value="36">36 meses (3 años)</option>
                  </select>
                </div>
              </div>

              {cargandoAnuales ? (
                <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                  <p style={{ marginTop: '1rem', color: '#666' }}>Cargando datos...</p>
                </div>
              ) : productosAnuales && productosAnuales.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {/* Gráfico de Barras - Top 10 Productos */}
                  <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#1976d2', fontSize: '1.1rem' }}>
                      Top 10 Productos Más Vendidos
                      <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem', fontWeight: 'normal' }}>
                        ({mesesFiltroAnuales} {mesesFiltroAnuales === 1 ? 'mes' : 'meses'})
                      </span>
                    </h4>
                    <Bar 
                      key={`productos-anuales-${mesesFiltroAnuales}-${JSON.stringify(productosAnuales.map(p => `${p.nombre}-${p.total_vendido}`)).slice(0, 100)}`}
                      data={{
                        labels: productosAnuales.map(p => p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre),
                        datasets: [{
                          label: 'Unidades Vendidas',
                          data: productosAnuales.map(p => p.total_vendido || 0),
                          backgroundColor: 'rgba(75, 192, 192, 0.6)',
                          borderColor: 'rgba(75, 192, 192, 1)',
                          borderWidth: 2
                        }]
                      }}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const producto = productosAnuales[context.dataIndex];
                                return `${context.parsed.x} unidades - ${formatearMoneda(producto?.ingresos || 0)}`;
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            ticks: {
                              stepSize: 1
                            }
                          }
                        }
                      }}
                      height={300}
                    />
                  </div>

                  {/* Gráfico de Dona - Distribución por Categoría */}
                  {categoriasAnuales && categoriasAnuales.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#1976d2', fontSize: '1.1rem' }}>
                        Distribución por Categoría
                        <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem', fontWeight: 'normal' }}>
                          ({mesesFiltroAnuales} {mesesFiltroAnuales === 1 ? 'mes' : 'meses'})
                        </span>
                      </h4>
                      <Doughnut 
                        key={`categorias-anuales-${mesesFiltroAnuales}-${JSON.stringify(categoriasAnuales.map(c => c.categoria + c.total_ingresos)).slice(0, 50)}`}
                        data={{
                          labels: categoriasAnuales.map(c => c.categoria),
                          datasets: [{
                            label: 'Ingresos',
                            data: categoriasAnuales.map(c => Math.round(c.total_ingresos || 0)),
                            backgroundColor: [
                              'rgba(255, 99, 132, 0.6)',
                              'rgba(54, 162, 235, 0.6)',
                              'rgba(255, 206, 86, 0.6)',
                              'rgba(75, 192, 192, 0.6)',
                              'rgba(153, 102, 255, 0.6)',
                              'rgba(255, 159, 64, 0.6)',
                              'rgba(199, 199, 199, 0.6)'
                            ],
                            borderColor: [
                              'rgba(255, 99, 132, 1)',
                              'rgba(54, 162, 235, 1)',
                              'rgba(255, 206, 86, 1)',
                              'rgba(75, 192, 192, 1)',
                              'rgba(153, 102, 255, 1)',
                              'rgba(255, 159, 64, 1)',
                              'rgba(199, 199, 199, 1)'
                            ],
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const categoria = categoriasAnuales[context.dataIndex];
                                  const total = context.parsed || 0;
                                  return `${context.label}: ${formatearMoneda(total)} (${categoria?.total_unidades || 0} unidades)`;
                                }
                              }
                            }
                          }
                        }}
                        height={300}
                      />
                    </div>
                  )}
                </div>
              ) : !cargandoAnuales ? (
                <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                  <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#666' }}>
                    No hay datos disponibles
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#999', marginBottom: '1rem' }}>
                    No se encontraron ventas en los últimos {mesesFiltroAnuales} {mesesFiltroAnuales === 1 ? 'mes' : 'meses'}.
                  </p>
                  <button
                    onClick={() => {
                      // Intentar con un rango más amplio
                      const nuevoRango = mesesFiltroAnuales < 12 ? 12 : 24;
                      setMesesFiltroAnuales(nuevoRango);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    🔍 Buscar en un rango más amplio
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <p>No hay predicciones disponibles en este momento.</p>
            <button 
              onClick={cargarPrediccionesML}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Recargar Predicciones
            </button>
                    </div>
                  )}

        {/* ============================================ */}
        {/* SECCIÓN 3: COMPARACIÓN DE MESES */}
        {/* ============================================ */}
        <div style={{ marginTop: '2rem', width: '100%', clear: 'both' }}>
          <h2 className="section-title" style={{ marginBottom: '1rem', fontSize: '1.3rem', color: '#8C6A4F' }}>
            🔄 Comparación de Períodos
          </h2>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h4 style={{ margin: 0, color: '#1976d2', fontSize: '1.1rem' }}>
                📊 Comparación de Meses
              </h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <label htmlFor="tipo-comparacion-dashboard" style={{ marginRight: '0.5rem', fontWeight: 'bold', color: '#666', fontSize: '0.9rem' }}>
                    Comparar por:
                  </label>
                  <select
                    id="tipo-comparacion-dashboard"
                    value={tipoComparacion}
                    onChange={(e) => setTipoComparacion(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '0.9rem',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="cantidad">Cantidad Vendida</option>
                    <option value="ventas">Ventas (Ingresos)</option>
                  </select>
                    </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <label htmlFor="mes-comparacion-1-dashboard" style={{ marginRight: '0.5rem', fontWeight: 'bold', color: '#666' }}>
                  Mes 1:
                </label>
                <input
                  type="month"
                  id="mes-comparacion-1-dashboard"
                  value={mesComparacion1}
                  onChange={(e) => setMesComparacion1(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '0.9rem',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                      />
                    </div>
              <div>
                <label htmlFor="mes-comparacion-2-dashboard" style={{ marginRight: '0.5rem', fontWeight: 'bold', color: '#666' }}>
                  Mes 2:
                </label>
                <input
                  type="month"
                  id="mes-comparacion-2-dashboard"
                  value={mesComparacion2}
                  onChange={(e) => setMesComparacion2(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '0.9rem',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                      />
                    </div>
            </div>

            {cargandoComparacion ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando comparación...</div>
            ) : (datosGraficoComparacionMes1 && datosGraficoComparacionMes2) ? (
              <div>
                {/* Gráfico de Barras Comparativo - Un único gráfico */}
                <div style={{ height: '400px', marginTop: '1rem' }}>
                  <Bar
                    key={`comparacion-meses-${mesComparacion1}-${mesComparacion2}-${tipoComparacion}`}
                    data={{
                      labels: datosGraficoComparacionMes1.labels || [],
                      datasets: [
                        {
                          label: mesComparacion1 ? formatearMes(mesComparacion1) : 'Mes 1',
                          data: datosGraficoComparacionMes1.datasets?.[0]?.data || [],
                          backgroundColor: 'rgba(54, 162, 235, 0.6)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderWidth: 2
                        },
                        {
                          label: mesComparacion2 ? formatearMes(mesComparacion2) : 'Mes 2',
                          data: datosGraficoComparacionMes2.datasets?.[0]?.data || [],
                          backgroundColor: 'rgba(255, 99, 132, 0.6)',
                          borderColor: 'rgba(255, 99, 132, 1)',
                          borderWidth: 2
                        }
                      ]
                    }}
                        options={{
                          responsive: true,
                      maintainAspectRatio: false,
                          plugins: {
                            legend: {
                          display: true,
                          position: 'top',
                              labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: { size: 12, weight: 'bold' }
                            }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.dataset.label || '';
                              const value = context.parsed.y || 0;
                              return tipoComparacion === 'cantidad'
                                ? `${label}: ${value.toLocaleString('es-CL')} unidades`
                                : `${label}: ${formatearMoneda(value)}`;
                            }
                          }
                        },
                        title: {
                          display: true,
                          text: tipoComparacion === 'cantidad' 
                            ? 'Comparación de Cantidad Vendida por Producto' 
                            : 'Comparación de Ventas (Ingresos) por Producto',
                          font: { size: 16, weight: 'bold' },
                          padding: { bottom: 20 }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: tipoComparacion === 'cantidad' ? 'Cantidad Vendida' : 'Ventas (CLP)',
                            font: { size: 12, weight: 'bold' }
                          },
                          ticks: {
                            callback: function(value) {
                              return tipoComparacion === 'cantidad' 
                                ? value.toLocaleString('es-CL')
                                : formatearMoneda(value);
                            }
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Productos',
                            font: { size: 12, weight: 'bold' }
                          },
                          ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            font: { size: 10 }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                </div>
            ) : mesComparacion1 && mesComparacion2 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No hay datos para comparar en estos meses
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                Selecciona dos meses para comparar
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Sección de Acciones Rápidas */}
      <div className="quick-actions">
        <h2 className="section-title">⚡ Acciones Rápidas</h2>
        <div className="actions-grid">
          <button 
            className="action-btn"
            onClick={() => {
              console.log('🔄 Navegando a: insumos');
              window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'insumos' } }));
            }}
            title="Ir a Gestión de Insumos"
          >
            <span className="action-icon">📦</span>
            <span className="action-text">Agregar Insumo</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => {
              console.log('🔄 Navegando a: productos');
              window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'productos' } }));
            }}
            title="Ir a Gestión de Productos"
          >
            <span className="action-icon">☕</span>
            <span className="action-text">Nuevo Producto</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => {
              console.log('🔄 Navegando a: usuarios');
              window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'usuarios' } }));
            }}
            title="Ir a Gestión de Usuarios"
          >
            <span className="action-icon">👤</span>
            <span className="action-text">Nuevo Usuario</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => {
              console.log('🔄 Navegando a: reportes');
              window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'reportes' } }));
            }}
            title="Ver Reportes"
          >
            <span className="action-icon">📊</span>
            <span className="action-text">Ver Reportes</span>
          </button>
          <button 
            className={`action-btn ${actualizacionesAutomaticas ? 'active' : ''}`}
            onClick={() => {
              setActualizacionesAutomaticas(!actualizacionesAutomaticas);
              console.log(`🔄 Actualizaciones automáticas: ${!actualizacionesAutomaticas ? 'ACTIVADAS' : 'DESACTIVADAS'}`);
            }}
            title="Activar/Desactivar actualizaciones automáticas"
          >
            <span className="action-icon">{actualizacionesAutomaticas ? '🔄' : '⏸️'}</span>
            <span className="action-text">
              {actualizacionesAutomaticas ? 'Auto-actualizar ON (cada 30 min)' : 'Auto-actualizar OFF'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
