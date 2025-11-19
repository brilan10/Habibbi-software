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
  
  // Estado para filtro de categoría del gráfico único
  const [categoriaFiltroGrafico, setCategoriaFiltroGrafico] = useState('todas'); // 'todas', 'cafes', 'dulces', 'panaderia', 'pasteleria', 'energizantes', 'empanadas'
  
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
   * Efecto para cargar datos del dashboard desde el backend
   */
  useEffect(() => {
    cargarDatos();

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

  // Función para obtener productos según el filtro de categoría seleccionado (según categorías reales de BD)
  const obtenerProductosPorFiltro = () => {
    let productosFiltrados = [];
    
    switch (categoriaFiltroGrafico) {
      case 'Alimentos':
        // Buscar productos con categoría "Alimentos"
        productosFiltrados = (productosEstacion || []).filter(p => {
          if (!p || !p.nombre) return false;
          const categoriaLower = (p.categoria || '').toLowerCase();
          return categoriaLower.includes('alimentos') || categoriaLower.includes('alimento');
        });
        break;
      case 'Bebidas Calientes':
        productosFiltrados = (productosCafeEstacion || []).filter(p => {
          if (!p || !p.nombre) return false;
          const categoriaLower = (p.categoria || '').toLowerCase();
          return categoriaLower.includes('bebidas calientes') || categoriaLower.includes('bebida caliente');
        });
        break;
      case 'Café Monster':
        productosFiltrados = (productosCafeEstacion || []).filter(p => {
          if (!p || !p.nombre) return false;
          const categoriaLower = (p.categoria || '').toLowerCase();
          const nombreLower = (p.nombre || '').toLowerCase();
          return categoriaLower.includes('café monster') || categoriaLower.includes('cafe monster') || 
                 nombreLower.includes('monster');
        });
        break;
      case 'Empanadas':
        productosFiltrados = (productosEmpanadasEstacion || []).filter(p => {
          if (!p || !p.nombre) return false;
          const categoriaLower = (p.categoria || '').toLowerCase();
          const nombreLower = (p.nombre || '').toLowerCase();
          return categoriaLower.includes('empanadas') || categoriaLower.includes('empanada') ||
                 nombreLower.includes('empanada');
        });
        break;
      case 'Energizantes':
        productosFiltrados = (productosEnergizantesEstacion || []).filter(p => {
          if (!p || !p.nombre) return false;
          const categoriaLower = (p.categoria || '').toLowerCase();
          return categoriaLower.includes('energizantes') || categoriaLower.includes('energizante');
        });
        break;
      case 'Panadería':
        productosFiltrados = (productosPanaderiaEstacion || []).filter(p => {
          if (!p || !p.nombre) return false;
          const categoriaLower = (p.categoria || '').toLowerCase();
          return categoriaLower.includes('panadería') || categoriaLower.includes('panaderia');
        });
        break;
      case 'Pastelería':
        productosFiltrados = (productosPasteleriaEstacion || []).filter(p => {
          if (!p || !p.nombre) return false;
          const categoriaLower = (p.categoria || '').toLowerCase();
          return categoriaLower.includes('pastelería') || categoriaLower.includes('pasteleria');
        });
        break;
      case 'todas':
      default:
        // Combinar todos los productos de todas las categorías
        productosFiltrados = [
          ...(productosCafeEstacion || []),
          ...(productosPanaderiaEstacion || []),
          ...(productosPasteleriaEstacion || []),
          ...(productosEnergizantesEstacion || []),
          ...(productosEmpanadasEstacion || []),
          ...(productosEstacion || []).filter(p => {
            const categoriaLower = (p?.categoria || '').toLowerCase();
            return categoriaLower.includes('alimentos') || categoriaLower.includes('bebidas calientes');
          })
        ].filter(p => p && p.nombre && p.total_vendido > 0)
          .sort((a, b) => (b.total_vendido || 0) - (a.total_vendido || 0))
          .slice(0, 12); // Top 12 productos más vendidos
        break;
    }
    
    console.log(`Filtro: ${categoriaFiltroGrafico}, Productos encontrados: ${productosFiltrados.length}`, productosFiltrados);
    return productosFiltrados;
  };

  // Función para obtener colores según categoría (según categorías reales de BD)
  const obtenerColoresPorFiltro = () => {
    switch (categoriaFiltroGrafico) {
      case 'Alimentos':
        return coloresCafe; // Usar colores café para alimentos
      case 'Bebidas Calientes':
        return coloresCafe;
      case 'Café Monster':
        return coloresCafe;
      case 'Panadería':
        return coloresPanaderia;
      case 'Pastelería':
        return coloresPasteleria;
      case 'Energizantes':
        return coloresEnergizantes;
      case 'Empanadas':
        return coloresEmpanadas;
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

            {/* Dulces recomendados para acompañar */}
            {productosDulcesEstacion && productosDulcesEstacion.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#424242' }}>
                  🍰 Sugerencias para acompañar el café
                </h3>
                <div className="ml-productos-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {productosDulcesEstacion.slice(0, 6).map((producto, index) => (
                    <div key={`dulce-${index}`} style={{
                      padding: '1rem',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#AD5D3C' }}>{producto.nombre}</h4>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Categoría:</strong> {producto.categoria}
                      </p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Precio:</strong> {formatearMoneda(producto.precio || 0)}
                      </p>
                      {producto.total_vendido > 0 && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#ad5d3c' }}>
                          <strong>Vendidos:</strong> {producto.total_vendido} unidades
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Panadería */}
            {productosPanaderiaEstacion && productosPanaderiaEstacion.length > 0 ? (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#424242' }}>
                  🥐 Panadería
                </h3>
                <div className="ml-productos-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {productosPanaderiaEstacion.slice(0, 6).map((producto, index) => (
                    <div key={`panaderia-${index}`} style={{
                      padding: '1rem',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#8B4513' }}>{producto.nombre}</h4>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Categoría:</strong> {producto.categoria}
                      </p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Precio:</strong> {formatearMoneda(producto.precio || 0)}
                      </p>
                      {producto.total_vendido > 0 && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#8B4513' }}>
                          <strong>Vendidos:</strong> {producto.total_vendido} unidades
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '6px', border: '1px dashed #ccc' }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#666' }}>🥐 Panadería</h3>
                <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>No hay productos de panadería disponibles en este momento.</p>
              </div>
            )}


            {/* Pastelería */}
            {productosPasteleriaEstacion && productosPasteleriaEstacion.length > 0 ? (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#424242' }}>
                  🎂 Pastelería
                </h3>
                <div className="ml-productos-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {productosPasteleriaEstacion.slice(0, 6).map((producto, index) => (
                    <div key={`pasteleria-${index}`} style={{
                      padding: '1rem',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#D2691E' }}>{producto.nombre}</h4>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Categoría:</strong> {producto.categoria}
                      </p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Precio:</strong> {formatearMoneda(producto.precio || 0)}
                      </p>
                      {producto.total_vendido > 0 && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#D2691E' }}>
                          <strong>Vendidos:</strong> {producto.total_vendido} unidades
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '6px', border: '1px dashed #ccc' }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#666' }}>🎂 Pastelería</h3>
                <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>No hay productos de pastelería disponibles en este momento.</p>
              </div>
            )}


            {/* Energizantes */}
            {productosEnergizantesEstacion && productosEnergizantesEstacion.length > 0 ? (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#424242' }}>
                  ⚡ Energizantes
                </h3>
                <div className="ml-productos-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {productosEnergizantesEstacion.slice(0, 6).map((producto, index) => (
                    <div key={`energizante-${index}`} style={{
                      padding: '1rem',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#FF6B00' }}>{producto.nombre}</h4>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Categoría:</strong> {producto.categoria}
                      </p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Precio:</strong> {formatearMoneda(producto.precio || 0)}
                      </p>
                      {producto.total_vendido > 0 && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#FF6B00' }}>
                          <strong>Vendidos:</strong> {producto.total_vendido} unidades
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '6px', border: '1px dashed #ccc' }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#666' }}>⚡ Energizantes</h3>
                <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>No hay productos energizantes disponibles en este momento.</p>
              </div>
            )}


            {/* Empanadas */}
            {productosEmpanadasEstacion && productosEmpanadasEstacion.length > 0 ? (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#424242' }}>
                  🥟 Empanadas
                </h3>
                <div className="ml-productos-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {productosEmpanadasEstacion.slice(0, 6).map((producto, index) => (
                    <div key={`empanada-${index}`} style={{
                      padding: '1rem',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#CD853F' }}>{producto.nombre}</h4>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Categoría:</strong> {producto.categoria}
                      </p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        <strong>Precio:</strong> {formatearMoneda(producto.precio || 0)}
                      </p>
                      {producto.total_vendido > 0 && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#CD853F' }}>
                          <strong>Vendidos:</strong> {producto.total_vendido} unidades
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '6px', border: '1px dashed #ccc' }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#666' }}>🥟 Empanadas</h3>
                <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>No hay empanadas disponibles en este momento.</p>
              </div>
            )}


            {/* Productos recomendados generales (fallback) */}
            {productosEstacion && productosEstacion.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#424242' }}>
                  📈 Otros productos recomendados para la estación
                </h3>
                <div className="ml-productos-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {productosEstacion.slice(0, 6).map((producto, index) => (
                    <div key={`general-${index}`} style={{
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
                      <h4 style={{ margin: 0, color: '#1976d2', fontSize: '1.1rem' }}>
                        {categoriaFiltroGrafico === 'todas' ? '🏆 Top Productos Más Vendidos (Todas las Categorías)' : 
                         categoriaFiltroGrafico === 'Alimentos' ? '🍽️ Alimentos (Vendidos)' :
                         categoriaFiltroGrafico === 'Bebidas Calientes' ? '☕ Bebidas Calientes (Vendidos)' :
                         categoriaFiltroGrafico === 'Café Monster' ? '☕ Café Monster (Vendidos)' :
                         categoriaFiltroGrafico === 'Empanadas' ? '🥟 Empanadas (Vendidos)' :
                         categoriaFiltroGrafico === 'Energizantes' ? '⚡ Energizantes (Vendidos)' :
                         categoriaFiltroGrafico === 'Panadería' ? '🥐 Panadería (Vendidos)' :
                         categoriaFiltroGrafico === 'Pastelería' ? '🎂 Pastelería (Vendidos)' :
                         'Productos Más Vendidos'}
                      </h4>
                      <div>
                        <label htmlFor="filtro-categoria-grafico" style={{ marginRight: '0.5rem', fontWeight: 'bold', color: '#666' }}>
                          Filtrar por:
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
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: '0.9rem',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="todas">Todas las Categorías</option>
                          <option value="Alimentos">Alimentos</option>
                          <option value="Bebidas Calientes">Bebidas Calientes</option>
                          <option value="Café Monster">Café Monster</option>
                          <option value="Empanadas">Empanadas</option>
                          <option value="Energizantes">Energizantes</option>
                          <option value="Panadería">Panadería</option>
                          <option value="Pastelería">Pastelería</option>
                        </select>
                      </div>
                    </div>
                    {datosDonaUnico ? (
                      <Doughnut 
                        data={datosDonaUnico}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                boxWidth: 12,
                                font: { size: categoriaFiltroGrafico === 'todas' ? 10 : 11 },
                                padding: categoriaFiltroGrafico === 'todas' ? 8 : 10,
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
                        height={categoriaFiltroGrafico === 'todas' ? 350 : 300}
                      />
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
