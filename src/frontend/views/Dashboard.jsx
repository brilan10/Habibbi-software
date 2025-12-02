import React, { useState, useEffect } from 'react';
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
  
  // Estado para almacenar los datos del dashboard
  const [datos, setDatos] = useState({
    ventasHoy: 0,
    productoMasVendido: '',
    insumosBajos: [],
    totalVentas: 0,
    clientesNuevos: 0
  });
  
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
  
  // Estado para filtro de estación del gráfico
  const [estacionFiltroGrafico, setEstacionFiltroGrafico] = useState('todas'); // 'todas', 'verano', 'otoño', 'invierno', 'primavera'
  
  // Estado para filtro de categoría de sugerencias ML
  // Categorías reales de la BD: Café, Té, Pastelería, Empanadas, Sándwiches, Bebidas
  const [categoriaFiltroSugerencias, setCategoriaFiltroSugerencias] = useState('pasteleria');
  
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
          nombre: insumo.nombre || '',
          cantidad: insumo.stock || 0,
          stockMinimo: insumo.alerta_stock || 0
        })),
        totalVentas: parseInt(backendData.ventas_hoy) || 0, // Número de transacciones del día
        clientesNuevos: parseInt(backendData.clientes_nuevos) || 0
      });
      
      console.log('📊 Datos del dashboard mapeados:', {
        ventasHoy: parseFloat(backendData.total_ventas_hoy) || 0,
        totalVentas: parseInt(backendData.ventas_hoy) || 0,
        productoMasVendido: backendData.producto_mas_vendido || 'N/A'
      });
      
      console.log('✅ Datos del dashboard cargados correctamente:', backendData);
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
  const cargarPrediccionesML = async () => {
    try {
      setCargandoML(true);
      
      // Cargar predicción por estación
      try {
        const responsePred = await apiGet(API_CONFIG.ML.PREDICCION_ESTACION);
        if (responsePred.data && responsePred.data.success) {
          setPrediccionEstacion(responsePred.data);
          setProductosEstacion(responsePred.data.productos_recomendados || []);
          setProductosCafeEstacion(responsePred.data.productos_cafes || []);
          setProductosDulcesEstacion(responsePred.data.productos_dulces || []);
          setProductosPanaderiaEstacion(responsePred.data.productos_panaderia || []);
          setProductosPasteleriaEstacion(responsePred.data.productos_pasteleria || []);
          setProductosEnergizantesEstacion(responsePred.data.productos_energizantes || []);
          setProductosEmpanadasEstacion(responsePred.data.productos_empanadas || []);
          setDatosGraficos(responsePred.data.graficos || null);
          
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
      
      if (response.data && response.data.success && response.data.data) {
        const insumosBajos = response.data.data.insumos_bajos || [];
        
        if (insumosBajos.length > 0) {
          setAlertasStock(insumosBajos);
          
          // Mostrar notificación si hay nuevos insumos bajos
          console.log(`⚠️ ${insumosBajos.length} insumos con stock bajo detectados`);
        } else {
          setAlertasStock([]);
        }
      }
      
      setVerificandoStock(false);
    } catch (error) {
      console.error('Error verificando stock:', error);
      setVerificandoStock(false);
    }
  };

  /**
   * Efecto para cargar predicciones ML al montar el componente
   */
  useEffect(() => {
    cargarPrediccionesML();
    verificarStockBajo(); // Verificar stock al montar
  }, []);
  
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
        cargarPrediccionesML();
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
  }, [actualizacionesAutomaticas]); // Se ejecuta cuando cambia el estado de auto-actualización


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
      // Cargar datos de productos vendidos en ambos meses
      const [response1, response2] = await Promise.all([
        apiClient.get(API_CONFIG.REPORTES.PRODUCTOS, {
          params: {
            fecha_inicio: `${mesComparacion1}-01`,
            fecha_fin: `${mesComparacion1}-31`
          }
        }),
        apiClient.get(API_CONFIG.REPORTES.PRODUCTOS, {
          params: {
            fecha_inicio: `${mesComparacion2}-01`,
            fecha_fin: `${mesComparacion2}-31`
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
        const datos1 = {
          labels,
          datasets: [{
            label: mesComparacion1 ? new Date(mesComparacion1 + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Mes 1',
            data: dataMes1,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2
    }]
        };

        const datos2 = {
          labels,
          datasets: [{
            label: mesComparacion2 ? new Date(mesComparacion2 + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Mes 2',
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

      {/* Tarjetas de estadísticas principales */}
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
        {alertasStock.length > 0 && (
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
                ALERTA: {alertasStock.length} {alertasStock.length === 1 ? 'insumo' : 'insumos'} con stock bajo detectado{alertasStock.length > 1 ? 's' : ''}
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
        )}
        
        {datos.insumosBajos.length > 0 || alertasStock.length > 0 ? (
          <div className="alerts-grid">
            {/* Combinar alertas de stock y datos del dashboard, eliminando duplicados */}
            {(() => {
              // Usar alertasStock si existe, sino usar datos.insumosBajos
              const insumosMostrar = alertasStock.length > 0 ? alertasStock : datos.insumosBajos;
              
              // Eliminar duplicados por nombre usando un Map
              const insumosUnicos = new Map();
              insumosMostrar.forEach(insumo => {
                const nombre = insumo.nombre || '';
                // Si ya existe, mantener el que tiene menor stock (más crítico)
                if (!insumosUnicos.has(nombre)) {
                  insumosUnicos.set(nombre, insumo);
                } else {
                  const existente = insumosUnicos.get(nombre);
                  const stockActual = insumo.cantidad || insumo.stock || 0;
                  const stockExistente = existente.cantidad || existente.stock || 0;
                  if (stockActual < stockExistente) {
                    insumosUnicos.set(nombre, insumo);
                  }
                }
              });
              
              const insumosFinales = Array.from(insumosUnicos.values());
              
              return insumosFinales.map((insumo, index) => {
                const stockActual = insumo.cantidad || insumo.stock || 0;
                const stockMinimo = insumo.stockMinimo || insumo.alerta_stock || 0;
                const colorAlerta = obtenerColorAlerta(stockActual, stockMinimo);
                
                return (
                  <div 
                    key={`${insumo.nombre}-${index}`}
                    className={`alert-card ${colorAlerta}`}
                    style={{
                      animation: colorAlerta === 'critico' ? 'shake 0.5s' : 'none'
                    }}
                  >
                    <div className="alert-icon">
                      {colorAlerta === 'critico' ? '🔴' : '🟡'}
                    </div>
                    <div className="alert-content">
                      <h4 className="alert-title">{insumo.nombre}</h4>
                      <p className="alert-description">
                        Stock actual: <strong>{stockActual}</strong> | 
                        Mínimo: <strong>{stockMinimo}</strong>
                      </p>
                      <div className="alert-progress">
                        <div 
                          className="progress-bar"
                          style={{
                            width: `${Math.min((stockActual / stockMinimo) * 100, 100)}%`,
                            backgroundColor: colorAlerta === 'critico' ? '#dc3545' : '#ffc107'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="no-alerts">
            <div className="no-alerts-icon">✅</div>
            <p>¡Excelente! Todos los insumos tienen stock suficiente.</p>
          </div>
        )}
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
                🌍 Estación Actual: <span style={{ textTransform: 'capitalize' }}>{prediccionEstacion.estacion}</span>
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
                gap: '1rem'
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
                      let sandwichesBD = filtrarPorCategoriaExacta(productosBD, ['sándwiches', 'sandwiches']);
                      if (sandwichesBD.length === 0) {
                        sandwichesBD = [
                          { id_producto: 30, nombre: 'Sándwich Jamón Queso', categoria: 'Sándwiches', precio: 2800, total_vendido: 0 },
                          { id_producto: 31, nombre: 'Tostado Italiano', categoria: 'Sándwiches', precio: 3500, total_vendido: 0 },
                          { id_producto: 32, nombre: 'Bagel Cream Cheese', categoria: 'Sándwiches', precio: 4200, total_vendido: 0 }
                        ];
                      }
                      productosAMostrar = combinarConVentas(sandwichesBD, todosProductosML);
                      colorTitulo = '#8B4513';
                      break;
                    case 'bebidas':
                      let bebidasBD = filtrarPorCategoriaExacta(productosBD, ['bebidas']);
                      if (bebidasBD.length === 0) {
                        bebidasBD = [
                          { id_producto: 33, nombre: 'Jugo Naranja', categoria: 'Bebidas', precio: 2500, total_vendido: 0 },
                          { id_producto: 34, nombre: 'Limonada', categoria: 'Bebidas', precio: 2200, total_vendido: 0 },
                          { id_producto: 35, nombre: 'Agua Mineral', categoria: 'Bebidas', precio: 1000, total_vendido: 0 },
                          { id_producto: 36, nombre: 'Chocolate Caliente', categoria: 'Bebidas', precio: 2500, total_vendido: 0 }
                        ];
                      }
                      productosAMostrar = combinarConVentas(bebidasBD, todosProductosML);
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
                  
                  return productosAMostrar.slice(0, 5).map((producto, index) => {
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
                <h3 style={{ marginBottom: '1.5rem', color: '#424242' }}>📊 Análisis Visual de Datos</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {/* Gráfico 1: Ventas por Estación - GRANDE */}
                  {datosGraficos.ventas_por_estacion && datosGraficos.ventas_por_estacion.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', gridColumn: 'span 2' }}>
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
                        height={300}
                      />
                    </div>
                  )}

                  {/* Gráfico 2: Tendencia de Ventas Mensuales - GRANDE */}
                  {datosGraficos.ventas_mensuales && datosGraficos.ventas_mensuales.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', gridColumn: 'span 2' }}>
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
                        height={300}
                      />
                    </div>
                  )}

                  {/* Gráfico 3: Productos Top */}
                  {datosGraficos.productos_top && datosGraficos.productos_top.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>Top 5 Productos Más Vendidos</h4>
                      <Bar 
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

                  {/* Gráfico 4: Categorías Vendidas */}
                  {datosGraficos.categorias_vendidas && datosGraficos.categorias_vendidas.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>Distribución por Categoría</h4>
                      <Doughnut 
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
                            onChange={(e) => setEstacionFiltroGrafico(e.target.value)}
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

        {/* Gráfico Comparativo de Dos Meses - Separado y abajo de Top Productos, ocupando todo el ancho */}
        <div style={{ marginTop: '2rem', width: '100%', clear: 'both' }}>
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
                    data={{
                      labels: datosGraficoComparacionMes1.labels || [],
                      datasets: [
                        datosGraficoComparacionMes1.datasets?.[0] || {},
                        datosGraficoComparacionMes2.datasets?.[0] || {}
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
