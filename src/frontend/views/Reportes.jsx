import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import apiClient from '../config/axiosConfig';
import API_CONFIG from '../config/apiConfig';
import * as XLSX from 'xlsx';
import '../styles/Reportes.css';

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
 * Componente Reportes - Sistema de reportes y análisis
 * Permite generar reportes de ventas, productos y usuarios con datos reales de BD
 */
const Reportes = () => {
  // Estado para los filtros de reportes
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    idVendedor: '',
    periodo: 'mes' // mes, semana, personalizado
  });

  // Estado para el tipo de reporte seleccionado
  const [tipoReporte, setTipoReporte] = useState('ventas');
  
  // Estado para período específico (mes, semana)
  // Por defecto usar el mes actual del año actual
  const fechaActual = new Date();
  const mesActual = fechaActual.toISOString().slice(0, 7); // YYYY-MM
  const [mes, setMes] = useState(mesActual); // YYYY-MM - Mes actual (2025)
  const [semana, setSemana] = useState(fechaActual.toISOString().slice(0, 10)); // YYYY-MM-DD - Fecha actual

  // Estado para los datos del reporte
  const [datosReporte, setDatosReporte] = useState([]);
  const [resumen, setResumen] = useState(null);

  // Estado para indicar si está generando el reporte
  const [generando, setGenerando] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [error, setError] = useState('');
  
  // Estado para gráficos
  const [productosVendidos, setProductosVendidos] = useState([]); // Productos vendidos ordenados
  const [categoriaFiltro, setCategoriaFiltro] = useState(''); // Filtro de categoría para gráfico
  const [mesComparacion1, setMesComparacion1] = useState(mesActual); // Mes 1 para comparación
  const [mesComparacion2, setMesComparacion2] = useState(''); // Mes 2 para comparación
  const [datosGraficoCategoria, setDatosGraficoCategoria] = useState(null); // Datos para gráfico por categoría
  const [datosGraficoComparacion, setDatosGraficoComparacion] = useState(null); // Datos para gráfico comparativo
  const [cargandoGraficoCategoria, setCargandoGraficoCategoria] = useState(false); // Estado de carga separado para gráfico de categoría
  const [cargandoGraficoComparacion, setCargandoGraficoComparacion] = useState(false); // Estado de carga separado para gráfico comparativo

  // Cargar vendedores al montar el componente
  useEffect(() => {
    cargarVendedores();
    // Establecer fechas por defecto (último mes)
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setFiltros(prev => ({
      ...prev,
      fechaInicio: primerDiaMes.toISOString().slice(0, 10),
      fechaFin: hoy.toISOString().slice(0, 10)
    }));
  }, []);

  /**
   * Cargar lista de vendedores
   */
  const cargarVendedores = async () => {
    try {
      const response = await apiClient.get(API_CONFIG.USUARIOS.LIST);
      if (response.data && response.data.success) {
        const vendedoresData = response.data.data.filter(u => u.rol === 'vendedor');
        setVendedores(vendedoresData);
      }
    } catch (error) {
      console.error('Error cargando vendedores:', error);
    }
  };

  /**
   * Función para manejar cambios en los filtros
   */
  const manejarCambioFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  /**
   * Generar reporte según el tipo y período seleccionado
   */
  const generarReporte = async () => {
    setGenerando(true);
    setError('');
    
    try {
      let url = '';
      let params = {};

      // Determinar URL según tipo de reporte
      switch (tipoReporte) {
        case 'ventas':
          url = API_CONFIG.REPORTES.VENTAS;
          params = {
            fecha_inicio: filtros.fechaInicio || null,
            fecha_fin: filtros.fechaFin || null,
            id_vendedor: filtros.idVendedor || null
          };
          break;
        case 'productos':
          url = API_CONFIG.REPORTES.PRODUCTOS;
          params = {
            fecha_inicio: filtros.fechaInicio || null,
            fecha_fin: filtros.fechaFin || null
          };
          break;
        case 'vendedores':
          url = API_CONFIG.REPORTES.VENDEDORES;
          params = {
            fecha_inicio: filtros.fechaInicio || null,
            fecha_fin: filtros.fechaFin || null
          };
          break;
        case 'mensual':
          url = API_CONFIG.REPORTES.MENSUAL;
          params = {
            mes: mes,
            year: mes.split('-')[0]
          };
          break;
        case 'semanal':
          url = API_CONFIG.REPORTES.SEMANAL;
          params = {
            fecha_inicio: semana,
            fecha_fin: semana
          };
          break;
        default:
          setError('Tipo de reporte no válido');
          setGenerando(false);
          return;
      }

      // Limpiar parámetros nulos
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '') {
          delete params[key];
        }
      });

      const response = await apiClient.get(url, { params });

      if (response.data && response.data.success) {
        let datosObtenidos = response.data.data || response.data.datos_diarios || [];
        
        // Ordenar productos de más a menos vendidos si es reporte de productos
        if (tipoReporte === 'productos') {
          datosObtenidos = datosObtenidos.sort((a, b) => 
            (b.cantidad_vendida || 0) - (a.cantidad_vendida || 0)
          );
        }
        
        // Si es reporte de ventas, extraer y ordenar productos vendidos
        if (tipoReporte === 'ventas') {
          const productosMap = {};
          
          // Recopilar todos los productos de todas las ventas
          datosObtenidos.forEach(venta => {
            if (venta.productos && Array.isArray(venta.productos)) {
              venta.productos.forEach(producto => {
                const nombre = producto.producto || producto.nombre;
                const cantidad = parseFloat(producto.cantidad || 0);
                
                if (productosMap[nombre]) {
                  productosMap[nombre].cantidad += cantidad;
                  productosMap[nombre].total += parseFloat(producto.subtotal || 0);
                  productosMap[nombre].veces += 1;
                } else {
                  productosMap[nombre] = {
                    nombre: nombre,
                    cantidad: cantidad,
                    total: parseFloat(producto.subtotal || 0),
                    veces: 1,
                    precio_unitario: parseFloat(producto.precio_unitario || producto.precio || 0)
                  };
                }
              });
            }
          });
          
          // Convertir a array y ordenar de más a menos vendido
          const productosOrdenados = Object.values(productosMap)
            .sort((a, b) => b.cantidad - a.cantidad);
          
          setProductosVendidos(productosOrdenados);
        } else {
          setProductosVendidos([]);
        }
        
        setDatosReporte(datosObtenidos);
        setResumen(response.data.resumen || null);
        setError(''); // Limpiar error si hay éxito
        
        // NO exportar automáticamente - solo cuando el usuario lo solicite
      } else {
        const errorMsg = response.data?.error || response.data?.message || 'Error al generar el reporte';
        console.error('Error en respuesta:', response.data);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      console.error('Error completo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.message || 
                      'Error al conectar con el servidor';
      setError(errorMsg);
    } finally {
      setGenerando(false);
    }
  };

  /**
   * Exportar reporte automáticamente después de generarlo
   */
  const exportarReporteAutomático = (datos, resumenData) => {
    try {
      // Función para formatear moneda CLP (declarada una sola vez fuera del switch)
      const formatearMonedaCLP = (cantidad) => {
        if (!cantidad || cantidad === 0) return '$0';
        return new Intl.NumberFormat('es-CL', {
          style: 'currency',
          currency: 'CLP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(cantidad);
      };

      let datosParaExcel = [];
      let nombreArchivo = '';

      switch (tipoReporte) {
        case 'ventas':
          nombreArchivo = `Reporte_Ventas_${filtros.fechaInicio || 'todo'}_${filtros.fechaFin || 'todo'}`;
          
          // Crear libro con múltiples hojas
          const wbVentas = XLSX.utils.book_new();
          
          // Hoja 1: Ventas (sin detalles de productos)
          datosParaExcel = datos.map(venta => ({
            'ID': venta.id_venta,
            'Fecha': venta.fecha,
            'Hora': venta.fecha ? new Date(venta.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            'Vendedor': venta.vendedor || 'N/A',
            'Cliente': venta.cliente || 'N/A',
            'Total': formatearMonedaCLP(venta.total || 0),
            'Método Pago': venta.metodo_pago,
            'Cantidad Productos': venta.cantidad_productos || 0
          }));
          
          const wsVentas = XLSX.utils.json_to_sheet(datosParaExcel);
          XLSX.utils.book_append_sheet(wbVentas, wsVentas, 'Ventas');
          
          // Hoja 2: Productos vendidos ordenados de más a menos
          if (productosVendidos && productosVendidos.length > 0) {
            const productosParaExcel = productosVendidos.map((producto, index) => ({
              'Ranking': index + 1,
              'Producto': producto.nombre,
              'Cantidad Vendida': producto.cantidad,
              'Total Vendido': formatearMonedaCLP(producto.total || 0),
              'Veces Vendido': producto.veces,
              'Precio Unitario': formatearMonedaCLP(producto.precio_unitario || 0)
            }));
            
            const wsProductos = XLSX.utils.json_to_sheet(productosParaExcel);
            XLSX.utils.book_append_sheet(wbVentas, wsProductos, 'Productos Más Vendidos');
          }
          
          // Hoja 3: Resumen de Ventas
          const resumenVentas = [];
          if (resumenData) {
            resumenVentas.push({
              'Concepto': 'Total Ventas',
              'Valor': resumenData.total_ventas || datos.length
            });
            const totalIngresos = datos.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
            resumenVentas.push({
              'Concepto': 'Total Ingresos',
              'Valor': formatearMonedaCLP(totalIngresos)
            });
            resumenVentas.push({
              'Concepto': 'Promedio por Venta',
              'Valor': datos.length > 0 ? formatearMonedaCLP(totalIngresos / datos.length) : formatearMonedaCLP(0)
            });
            
            // Ventas por método de pago
            const ventasPorMetodo = {};
            datos.forEach(venta => {
              const metodo = venta.metodo_pago || 'N/A';
              if (!ventasPorMetodo[metodo]) {
                ventasPorMetodo[metodo] = { cantidad: 0, total: 0 };
              }
              ventasPorMetodo[metodo].cantidad++;
              ventasPorMetodo[metodo].total += parseFloat(venta.total || 0);
            });
            
            Object.keys(ventasPorMetodo).forEach(metodo => {
              resumenVentas.push({
                'Concepto': `Ventas ${metodo}`,
                'Valor': ventasPorMetodo[metodo].cantidad
              });
              resumenVentas.push({
                'Concepto': `Ingresos ${metodo}`,
                'Valor': formatearMonedaCLP(ventasPorMetodo[metodo].total)
              });
            });
          }
          const wsResumenVentas = XLSX.utils.json_to_sheet(resumenVentas);
          XLSX.utils.book_append_sheet(wbVentas, wsResumenVentas, 'Resumen');
          
          // Descargar archivo con múltiples hojas
          XLSX.writeFile(wbVentas, `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
          return; // Salir temprano para evitar el código de descarga general
          
          break;
        case 'productos':
          nombreArchivo = `Reporte_Productos_${filtros.fechaInicio || 'todo'}_${filtros.fechaFin || 'todo'}`;
          
          // Crear libro con múltiples hojas
          const wbProductos = XLSX.utils.book_new();
          
          // Hoja 1: Productos ordenados de más a menos vendidos
          datosParaExcel = datos.map((producto, index) => ({
            'Ranking': index + 1,
            'Producto': producto.nombre,
            'Categoría': producto.categoria || 'Sin categoría',
            'Precio Unitario': formatearMonedaCLP(producto.precio || 0),
            'Cantidad Vendida': producto.cantidad_vendida || 0,
            'Total Vendido': formatearMonedaCLP(producto.total_vendido || 0),
            'Veces Vendido': producto.veces_vendido || 0
          }));
          
          const wsProductosLista = XLSX.utils.json_to_sheet(datosParaExcel);
          XLSX.utils.book_append_sheet(wbProductos, wsProductosLista, 'Productos Más Vendidos');
          
          // Hoja 2: Resumen por Categoría
          const productosPorCategoria = {};
          datos.forEach(producto => {
            const categoria = producto.categoria || 'Sin categoría';
            if (!productosPorCategoria[categoria]) {
              productosPorCategoria[categoria] = {
                cantidad: 0,
                totalVendido: 0,
                vecesVendido: 0,
                productos: 0
              };
            }
            productosPorCategoria[categoria].cantidad += producto.cantidad_vendida || 0;
            productosPorCategoria[categoria].totalVendido += producto.total_vendido || 0;
            productosPorCategoria[categoria].vecesVendido += producto.veces_vendido || 0;
            productosPorCategoria[categoria].productos++;
          });
          
          const resumenCategorias = Object.keys(productosPorCategoria).map(categoria => ({
            'Categoría': categoria,
            'Productos Diferentes': productosPorCategoria[categoria].productos,
            'Cantidad Total Vendida': productosPorCategoria[categoria].cantidad,
            'Total Vendido': formatearMonedaCLP(productosPorCategoria[categoria].totalVendido),
            'Veces Vendido': productosPorCategoria[categoria].vecesVendido
          }));
          
          const wsCategorias = XLSX.utils.json_to_sheet(resumenCategorias);
          XLSX.utils.book_append_sheet(wbProductos, wsCategorias, 'Resumen por Categoría');
          
          // Hoja 3: Resumen General
          const resumenProductos = [];
          const totalProductos = datos.length;
          const totalCantidad = datos.reduce((sum, p) => sum + (p.cantidad_vendida || 0), 0);
          const totalVendido = datos.reduce((sum, p) => sum + (p.total_vendido || 0), 0);
          const totalVeces = datos.reduce((sum, p) => sum + (p.veces_vendido || 0), 0);
          
          resumenProductos.push({
            'Concepto': 'Total Productos Diferentes',
            'Valor': totalProductos
          });
          resumenProductos.push({
            'Concepto': 'Cantidad Total Vendida',
            'Valor': totalCantidad
          });
          resumenProductos.push({
            'Concepto': 'Total Vendido',
            'Valor': formatearMonedaCLP(totalVendido)
          });
          resumenProductos.push({
            'Concepto': 'Total Veces Vendido',
            'Valor': totalVeces
          });
          resumenProductos.push({
            'Concepto': 'Promedio por Producto',
            'Valor': totalProductos > 0 ? formatearMonedaCLP(totalVendido / totalProductos) : formatearMonedaCLP(0)
          });
          
          const wsResumenProductos = XLSX.utils.json_to_sheet(resumenProductos);
          XLSX.utils.book_append_sheet(wbProductos, wsResumenProductos, 'Resumen');
          
          // Descargar archivo con múltiples hojas
          XLSX.writeFile(wbProductos, `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
          return; // Salir temprano para evitar el código de descarga general
          
          break;
        case 'vendedores':
          nombreArchivo = `Reporte_Vendedores_${filtros.fechaInicio || 'todo'}_${filtros.fechaFin || 'todo'}`;
          
          datosParaExcel = datos.map(vendedor => ({
            'Vendedor': vendedor.vendedor,
            'Total Ventas': vendedor.total_ventas || 0,
            'Total Vendido': formatearMonedaCLP(vendedor.total_vendido || 0),
            'Promedio Venta': formatearMonedaCLP(vendedor.promedio_venta || 0),
            'Venta Máxima': formatearMonedaCLP(vendedor.venta_maxima || 0)
          }));
          break;
        case 'mensual':
          nombreArchivo = `Reporte_Mensual_${mes}`;
          
          // Crear libro con múltiples hojas
          const wbMensual = XLSX.utils.book_new();
          
          // Hoja 1: Días con Ventas (formato como en la imagen)
          const diasConVentas = datos.map(dia => ({
            'Fecha': dia.fecha,
            'Ventas del Día': (dia.ventas_dia && dia.ventas_dia > 0) ? 1 : 0,
            'Ingresos del Día': formatearMonedaCLP(dia.ingresos_dia || 0),
            'Vendedores Activos': (dia.vendedores_activos && dia.vendedores_activos > 0) ? 1 : 0
          }));
          
          const wsDias = XLSX.utils.json_to_sheet(diasConVentas);
          XLSX.utils.book_append_sheet(wbMensual, wsDias, 'Reporte');
          
          // Hoja 2: Productos Más Vendidos (si hay datos de productos)
          if (productosVendidos && productosVendidos.length > 0) {
            const productosMensual = productosVendidos.map((producto, index) => ({
              'Ranking': index + 1,
              'Producto': producto.nombre,
              'Cantidad Vendida': producto.cantidad || 0,
              'Total Vendido': formatearMonedaCLP(producto.total || 0),
              'Veces Vendido': producto.veces || 0,
              'Precio Unitario': formatearMonedaCLP(producto.precio_unitario || 0)
            }));
            const wsProductosMensual = XLSX.utils.json_to_sheet(productosMensual);
            XLSX.utils.book_append_sheet(wbMensual, wsProductosMensual, 'Productos Más Vendidos');
          }
          
          // Hoja 3: Resumen Mensual
          const resumenMensual = [];
          if (resumenData) {
            resumenMensual.push({
              'Concepto': 'Total Ventas',
              'Valor': resumenData.total_ventas || 0
            });
            resumenMensual.push({
              'Concepto': 'Total Ingresos',
              'Valor': formatearMonedaCLP(resumenData.total_ingresos || 0)
            });
            resumenMensual.push({
              'Concepto': 'Vendedores Activos',
              'Valor': resumenData.vendedores || 0
            });
            resumenMensual.push({
              'Concepto': 'Promedio por Venta',
              'Valor': resumenData.total_ventas > 0 
                ? formatearMonedaCLP(resumenData.total_ingresos / resumenData.total_ventas)
                : formatearMonedaCLP(0)
            });
            
            // Calcular días con ventas
            const diasConVentasCount = diasConVentas.filter(d => d['Ventas del Día'] === 1).length;
            resumenMensual.push({
              'Concepto': 'Días con Ventas',
              'Valor': diasConVentasCount
            });
            
            // Calcular días sin ventas
            const diasSinVentasCount = diasConVentas.filter(d => d['Ventas del Día'] === 0).length;
            resumenMensual.push({
              'Concepto': 'Días sin Ventas',
              'Valor': diasSinVentasCount
            });
          }
          const wsResumen = XLSX.utils.json_to_sheet(resumenMensual);
          XLSX.utils.book_append_sheet(wbMensual, wsResumen, 'Resumen');
          
          // Hoja 4: Detalle por Día (con más información)
          const detalleDias = datos.map(dia => ({
            'Fecha': dia.fecha,
            'Día de la Semana': new Date(dia.fecha).toLocaleDateString('es-ES', { weekday: 'long' }),
            'Ventas del Día': dia.ventas_dia || 0,
            'Ingresos del Día': formatearMonedaCLP(dia.ingresos_dia || 0),
            'Vendedores Activos': dia.vendedores_activos || 0,
            'Promedio por Venta': dia.ventas_dia > 0 
              ? formatearMonedaCLP((dia.ingresos_dia || 0) / dia.ventas_dia)
              : formatearMonedaCLP(0),
            'Hubo Ventas': (dia.ventas_dia && dia.ventas_dia > 0) ? 'Sí' : 'No'
          }));
          const wsDetalle = XLSX.utils.json_to_sheet(detalleDias);
          XLSX.utils.book_append_sheet(wbMensual, wsDetalle, 'Detalle por Día');
          
          // Descargar archivo con múltiples hojas
          XLSX.writeFile(wbMensual, `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
          return; // Salir temprano para evitar el código de descarga general
          
          break;
        case 'semanal':
          nombreArchivo = `Reporte_Semanal_${semana}`;
          
          // Crear libro con múltiples hojas
          const wbSemanal = XLSX.utils.book_new();
          
          // Hoja 1: Días de la semana
          datosParaExcel = datos.map(dia => ({
            'Fecha': dia.fecha,
            'Día': dia.dia_semana || '',
            'Ventas del Día': dia.ventas_dia || 0,
            'Ingresos del Día': formatearMonedaCLP(dia.ingresos_dia || 0),
            'Hubo Ventas': (dia.ventas_dia && dia.ventas_dia > 0) ? 'Sí' : 'No'
          }));
          
          const wsSemanal = XLSX.utils.json_to_sheet(datosParaExcel);
          XLSX.utils.book_append_sheet(wbSemanal, wsSemanal, 'Reporte');
          
          // Hoja 2: Resumen Semanal
          const resumenSemanal = [];
          if (resumenData) {
            resumenSemanal.push({
              'Concepto': 'Total Ventas',
              'Valor': resumenData.total_ventas || 0
            });
            resumenSemanal.push({
              'Concepto': 'Total Ingresos',
              'Valor': formatearMonedaCLP(resumenData.total_ingresos || 0)
            });
            resumenSemanal.push({
              'Concepto': 'Promedio por Venta',
              'Valor': resumenData.total_ventas > 0 
                ? formatearMonedaCLP(resumenData.total_ingresos / resumenData.total_ventas)
                : formatearMonedaCLP(0)
            });
            
            // Calcular días con ventas
            const diasConVentasSemanal = datos.filter(d => d.ventas_dia && d.ventas_dia > 0).length;
            resumenSemanal.push({
              'Concepto': 'Días con Ventas',
              'Valor': diasConVentasSemanal
            });
            
            // Calcular días sin ventas
            const diasSinVentasSemanal = datos.filter(d => !d.ventas_dia || d.ventas_dia === 0).length;
            resumenSemanal.push({
              'Concepto': 'Días sin Ventas',
              'Valor': diasSinVentasSemanal
            });
            
            // Mejor día (más ingresos)
            const mejorDia = datos.reduce((mejor, dia) => {
              return (dia.ingresos_dia || 0) > (mejor.ingresos_dia || 0) ? dia : mejor;
            }, datos[0] || {});
            
            if (mejorDia.fecha) {
              resumenSemanal.push({
                'Concepto': 'Mejor Día',
                'Valor': mejorDia.fecha
              });
              resumenSemanal.push({
                'Concepto': 'Ingresos Mejor Día',
                'Valor': formatearMonedaCLP(mejorDia.ingresos_dia || 0)
            });
          }
          }
          
          const wsResumenSemanal = XLSX.utils.json_to_sheet(resumenSemanal);
          XLSX.utils.book_append_sheet(wbSemanal, wsResumenSemanal, 'Resumen');
          
          // Descargar archivo con múltiples hojas
          XLSX.writeFile(wbSemanal, `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
          return; // Salir temprano para evitar el código de descarga general
          
          break;
        default:
          return;
      }

      // Crear libro de Excel (solo si no es reporte de ventas, que ya se descargó arriba)
      if (tipoReporte !== 'ventas') {
      const ws = XLSX.utils.json_to_sheet(datosParaExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
      XLSX.writeFile(wb, `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      }
    } catch (error) {
      console.error('Error exportando automáticamente:', error);
    }
  };

  /**
   * Exportar reporte a Excel (manual - botón)
   */
  const exportarReporte = () => {
    if (datosReporte.length === 0) {
      alert('No hay datos para exportar. Genera un reporte primero.');
      return;
    }
    exportarReporteAutomático(datosReporte, resumen);
  };

  // Colores para gráficos de dona según categoría (igual que Dashboard)
  const coloresCafe = ['#8C6A4F', '#A67C52', '#704214', '#B0855C', '#5C3A21', '#AD8256'];
  const coloresDulces = ['#FFB74D', '#FF8A65', '#F06292', '#BA68C8', '#4DB6AC', '#9575CD'];
  const coloresPanaderia = ['#D4A574', '#C19A6B', '#B8860B', '#CD853F', '#DEB887', '#F4A460'];
  const coloresPasteleria = ['#FFB6C1', '#FFC0CB', '#FFD700', '#FFA07A', '#FF69B4', '#FF1493'];
  const coloresEnergizantes = ['#FF6B00', '#FF8C00', '#FFA500', '#FFD700', '#FF6347', '#FF4500'];
  const coloresEmpanadas = ['#CD853F', '#D2691E', '#BC8F8F', '#A0522D', '#8B4513', '#654321'];
  const coloresBebidasFrias = ['#4FC3F7', '#29B6F6', '#03A9F4', '#0288D1', '#0277BD', '#01579B'];

  const obtenerColoresPorCategoria = (categoria) => {
    const catLower = categoria.toLowerCase();
    if (catLower.includes('alimentos')) return coloresCafe; // Usar colores café para alimentos
    if (catLower.includes('bebidas calientes')) return coloresCafe;
    if (catLower.includes('café monster') || catLower.includes('cafe monster')) return coloresCafe;
    if (catLower.includes('panadería') || catLower.includes('panaderia')) return coloresPanaderia;
    if (catLower.includes('pastelería') || catLower.includes('pasteleria')) return coloresPasteleria;
    if (catLower.includes('energizantes')) return coloresEnergizantes;
    if (catLower.includes('empanadas')) return coloresEmpanadas;
    return coloresCafe; // Default
  };

  /**
   * Preparar datos para gráfico de dona (igual que Dashboard)
   */
  const prepararDatosDona = (lista, colores) => {
    if (!lista || lista.length === 0) return null;
    const labels = lista.map((item) => item.nombre?.length > 22 ? `${item.nombre.slice(0, 22)}…` : item.nombre);
    const data = lista.map((item) => item.cantidad_vendida || item.total_vendido || 0);
    if (data.every(valor => valor <= 0)) {
      return null;
    }
    return {
      labels,
      datasets: [{
        label: 'Unidades vendidas',
        data,
        backgroundColor: colores.slice(0, lista.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  };

  /**
   * Cargar datos para gráfico por categoría
   */
  const cargarGraficoCategoria = async () => {
    // Validar que haya un filtro seleccionado
    if (!categoriaFiltro || categoriaFiltro.trim() === '') {
      setDatosGraficoCategoria(null);
      setCargandoGraficoCategoria(false);
      return;
    }

    // Limpiar datos anteriores inmediatamente para evitar conflictos
    setDatosGraficoCategoria(null);
    setCargandoGraficoCategoria(true);
    
    try {
      // Usar las fechas del reporte generado o las fechas por defecto
      const fechaInicio = datosReporte.length > 0 && filtros.fechaInicio 
        ? filtros.fechaInicio 
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
      const fechaFin = datosReporte.length > 0 && filtros.fechaFin 
        ? filtros.fechaFin 
        : new Date().toISOString().slice(0, 10);

      const response = await apiClient.get(API_CONFIG.REPORTES.PRODUCTOS, {
        params: {
          fecha_inicio: fechaInicio || null,
          fecha_fin: fechaFin || null
        }
      });

      if (response.data && response.data.success) {
        const productos = response.data.data || [];
        
        // Mapeo mejorado de categorías para búsqueda flexible (según categorías reales de BD)
        const categoriaLower = categoriaFiltro.toLowerCase();
        const categoriasBusqueda = {
          'alimentos': ['alimentos', 'alimento'],
          'bebidas calientes': ['bebidas calientes', 'bebidas caliente', 'caliente', 'americano', 'latte', 'cappuccino', 'expresso'],
          'café monster': ['café monster', 'cafe monster', 'monster'],
          'empanadas': ['empanadas', 'empanada'],
          'energizantes': ['energizantes', 'energizante', 'monster', 'red bull', 'bebida energética'],
          'panadería': ['panadería', 'panaderia', 'pan', 'croissant', 'muffin'],
          'pastelería': ['pastelería', 'pasteleria', 'pastel', 'torta', 'tartaleta']
        };
        
        // Obtener palabras clave para la categoría seleccionada
        const palabrasClave = categoriasBusqueda[categoriaLower] || [categoriaLower];
        
        // Filtrar por categoría con búsqueda mejorada
        const productosFiltrados = productos
          .filter(p => {
            if (!p.categoria) return false;
            const categoriaProducto = p.categoria.toLowerCase();
            const nombreProducto = (p.nombre || '').toLowerCase();
            
            // Buscar en categoría o nombre del producto
            return palabrasClave.some(palabra => 
              categoriaProducto.includes(palabra) || nombreProducto.includes(palabra)
            );
          })
          .sort((a, b) => (b.cantidad_vendida || 0) - (a.cantidad_vendida || 0))
          .slice(0, 10); // Top 10

        if (productosFiltrados.length > 0) {
          const colores = obtenerColoresPorCategoria(categoriaFiltro);
          const datosDona = prepararDatosDona(productosFiltrados, colores);
          setDatosGraficoCategoria(datosDona);
        } else {
          setDatosGraficoCategoria(null);
        }
      }
    } catch (error) {
      console.error('Error cargando gráfico por categoría:', error);
      setDatosGraficoCategoria(null);
    } finally {
      setCargandoGraficoCategoria(false);
    }
  };

  // Estado para datos comparativos separados (dos gráficos de dona)
  const [datosGraficoComparacionMes1, setDatosGraficoComparacionMes1] = useState(null);
  const [datosGraficoComparacionMes2, setDatosGraficoComparacionMes2] = useState(null);

  /**
   * Cargar datos para gráfico comparativo de dos meses
   */
  const cargarGraficoComparacion = async () => {
    if (!mesComparacion1 || !mesComparacion2) {
      setDatosGraficoComparacionMes1(null);
      setDatosGraficoComparacionMes2(null);
      setCargandoGraficoComparacion(false);
      return;
    }

    setCargandoGraficoComparacion(true);
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

      if (response1.data?.success && response2.data?.success) {
        const productosMes1 = (response1.data.data || [])
          .sort((a, b) => (b.cantidad_vendida || 0) - (a.cantidad_vendida || 0))
          .slice(0, 8); // Top 8 productos
        
        const productosMes2 = (response2.data.data || [])
          .sort((a, b) => (b.cantidad_vendida || 0) - (a.cantidad_vendida || 0))
          .slice(0, 8); // Top 8 productos

        // Preparar datos de dona para cada mes
        const coloresComparacion = ['#8C6A4F', '#A67C52', '#704214', '#B0855C', '#5C3A21', '#AD8256', '#D4A574', '#C19A6B'];
        
        if (productosMes1.length > 0) {
          const datosDona1 = prepararDatosDona(productosMes1, coloresComparacion);
          setDatosGraficoComparacionMes1(datosDona1);
        } else {
          setDatosGraficoComparacionMes1(null);
        }

        if (productosMes2.length > 0) {
          const datosDona2 = prepararDatosDona(productosMes2, coloresComparacion);
          setDatosGraficoComparacionMes2(datosDona2);
        } else {
          setDatosGraficoComparacionMes2(null);
        }
      }
    } catch (error) {
      console.error('Error cargando gráfico comparativo:', error);
      setDatosGraficoComparacionMes1(null);
      setDatosGraficoComparacionMes2(null);
    } finally {
      setCargandoGraficoComparacion(false);
    }
  };

  // Cargar gráfico por categoría cuando cambia el filtro
  useEffect(() => {
    // Limpiar datos anteriores inmediatamente cuando cambia el filtro
    setDatosGraficoCategoria(null);
    setCargandoGraficoCategoria(false); // Asegurar que el estado de carga se resetee
    
    if (categoriaFiltro && categoriaFiltro.trim() !== '') {
      // Pequeño delay para evitar múltiples llamadas simultáneas
      const timeoutId = setTimeout(() => {
        cargarGraficoCategoria();
      }, 150);
      
      return () => {
        clearTimeout(timeoutId);
        // Asegurar que el estado de carga se resetee si el componente se desmonta o cambia el filtro
        setCargandoGraficoCategoria(false);
      };
    } else {
      // Si no hay filtro seleccionado, asegurar que todo esté limpio
      setDatosGraficoCategoria(null);
      setCargandoGraficoCategoria(false);
    }
  }, [categoriaFiltro]);

  // Cargar gráfico comparativo cuando cambian los meses
  useEffect(() => {
    if (mesComparacion1 && mesComparacion2) {
      cargarGraficoComparacion();
    } else {
      setDatosGraficoComparacionMes1(null);
      setDatosGraficoComparacionMes2(null);
    }
  }, [mesComparacion1, mesComparacion2]);

  /**
   * Formatear números como moneda
   */
  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(cantidad);
  };

  /**
   * Calcular el total del reporte
   */
  const calcularTotal = () => {
    if (tipoReporte === 'ventas') {
      return datosReporte.reduce((total, venta) => total + parseFloat(venta.total || 0), 0);
    } else if (tipoReporte === 'productos') {
      return datosReporte.reduce((total, producto) => total + parseFloat(producto.total_vendido || 0), 0);
    } else if (tipoReporte === 'vendedores') {
      return datosReporte.reduce((total, vendedor) => total + parseFloat(vendedor.total_vendido || 0), 0);
    } else if (tipoReporte === 'mensual' || tipoReporte === 'semanal') {
      return resumen ? parseFloat(resumen.total_ingresos || 0) : 0;
    }
    return 0;
  };

  /**
   * Manejar cambio de período
   */
  const manejarCambioPeriodo = (e) => {
    const nuevoPeriodo = e.target.value;
    setFiltros(prev => ({ ...prev, periodo: nuevoPeriodo }));
    
    if (nuevoPeriodo === 'mes') {
      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setFiltros(prev => ({
        ...prev,
        fechaInicio: primerDiaMes.toISOString().slice(0, 10),
        fechaFin: hoy.toISOString().slice(0, 10)
      }));
    } else if (nuevoPeriodo === 'semana') {
      const hoy = new Date();
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
      setFiltros(prev => ({
        ...prev,
        fechaInicio: lunes.toISOString().slice(0, 10),
        fechaFin: hoy.toISOString().slice(0, 10)
      }));
    }
  };

  return (
    <div className="reportes-container">
      {/* Header de la página */}
      <div className="page-header">
        <h1 className="page-title">📊 Reportes y Análisis</h1>
        <p className="page-subtitle">Genera reportes detallados del negocio con datos reales</p>
      </div>

      {/* Panel de filtros y configuración */}
      <div className="filtros-panel">
        <h3>🔧 Configuración del Reporte</h3>
        
        <div className="filtros-grid">
          {/* Selector de tipo de reporte */}
          <div className="filtro-group">
            <label htmlFor="tipo-reporte">Tipo de Reporte</label>
            <select
              id="tipo-reporte"
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value)}
              className="form-control"
            >
              <option value="ventas">📈 Reporte de Ventas</option>
              <option value="productos">☕ Productos Más Vendidos</option>
              <option value="vendedores">👥 Rendimiento de Vendedores</option>
              <option value="mensual">📅 Reporte Mensual</option>
              <option value="semanal">📆 Reporte Semanal</option>
            </select>
          </div>

          {/* Selector de período para reportes mensuales/semanales */}
          {(tipoReporte === 'mensual' || tipoReporte === 'semanal') && (
            <>
              {tipoReporte === 'mensual' && (
                <div className="filtro-group">
                  <label htmlFor="mes">Mes</label>
                  <input
                    type="month"
                    id="mes"
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    className="form-control"
                  />
                </div>
              )}
              {tipoReporte === 'semanal' && (
                <div className="filtro-group">
                  <label htmlFor="semana">Semana (Selecciona cualquier día)</label>
                  <input
                    type="date"
                    id="semana"
                    value={semana}
                    onChange={(e) => setSemana(e.target.value)}
                    className="form-control"
                  />
                </div>
              )}
            </>
          )}

          {/* Filtros de fechas para otros reportes */}
          {(tipoReporte === 'ventas' || tipoReporte === 'productos' || tipoReporte === 'vendedores') && (
            <>
              <div className="filtro-group">
                <label htmlFor="fecha-inicio">Fecha Inicio</label>
                <input
                  type="date"
                  id="fecha-inicio"
                  name="fechaInicio"
                  value={filtros.fechaInicio}
                  onChange={manejarCambioFiltro}
                  className="form-control"
                />
              </div>

              <div className="filtro-group">
                <label htmlFor="fecha-fin">Fecha Fin</label>
                <input
                  type="date"
                  id="fecha-fin"
                  name="fechaFin"
                  value={filtros.fechaFin}
                  onChange={manejarCambioFiltro}
                  className="form-control"
                />
              </div>
            </>
          )}

          {/* Filtro de vendedor (solo para reporte de ventas) */}
          {tipoReporte === 'ventas' && (
            <div className="filtro-group">
              <label htmlFor="vendedor">Vendedor</label>
              <select
                id="vendedor"
                name="idVendedor"
                value={filtros.idVendedor}
                onChange={manejarCambioFiltro}
                className="form-control"
              >
                <option value="">Todos los vendedores</option>
                {vendedores.map(usuario => (
                  <option key={usuario.id_usuario} value={usuario.id_usuario}>
                    {usuario.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="error-message" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fee', color: '#c33', borderRadius: '4px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Botones de acción */}
        <div className="filtros-actions">
          <button
            className="btn btn-primary"
            onClick={generarReporte}
            disabled={generando}
          >
            {generando ? '⏳ Generando...' : '📊 Generar Reporte'}
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={exportarReporte}
            disabled={datosReporte.length === 0}
          >
            📥 Exportar a Excel
          </button>
        </div>
      </div>

      {/* Resumen del reporte */}
      {resumen && (
        <div className="resumen-panel" style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <h3>📊 Resumen</h3>
          <div className="resumen-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            {resumen.total_ventas !== undefined && (
              <div>
                <strong>Total Ventas:</strong> {resumen.total_ventas}
              </div>
            )}
            {resumen.total_ingresos !== undefined && (
              <div>
                <strong>Total Ingresos:</strong> {formatearMoneda(resumen.total_ingresos)}
              </div>
            )}
            {resumen.promedio_venta !== undefined && (
              <div>
                <strong>Promedio Venta:</strong> {formatearMoneda(resumen.promedio_venta)}
              </div>
            )}
            {resumen.vendedores !== undefined && (
              <div>
                <strong>Vendedores:</strong> {resumen.vendedores}
              </div>
            )}
            {resumen.clientes_atendidos !== undefined && (
              <div>
                <strong>Clientes Atendidos:</strong> {resumen.clientes_atendidos}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resultados del reporte */}
      {datosReporte.length > 0 && (
        <div className="resultados-panel">
          <div className="resultados-header">
            <h3>📋 Resultados del Reporte</h3>
            <div className="resultados-actions">
              <div className="resultados-stats">
                <span className="stat-item">
                  <strong>Registros:</strong> {datosReporte.length}
                </span>
                <span className="stat-item">
                  <strong>Total:</strong> {formatearMoneda(calcularTotal())}
                </span>
              </div>
              <div className="resultados-buttons">
                <button
                  className="btn-accion-reporte"
                  onClick={exportarReporte}
                  title="Exportar a Excel"
                >
                  📥 Exportar Excel
                </button>
                <button
                  className="btn-accion-reporte"
                  onClick={() => generarReporte()}
                  title="Actualizar reporte"
                >
                  🔄 Actualizar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de resultados */}
          <div className="tabla-container">
            <table className="reporte-table">
              <thead>
                <tr>
                  {tipoReporte === 'ventas' && (
                    <>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Vendedor</th>
                      <th>Cliente</th>
                      <th>Cantidad Productos</th>
                      <th>Total</th>
                      <th>Método Pago</th>
                    </>
                  )}
                  {tipoReporte === 'productos' && (
                    <>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Cantidad Vendida</th>
                      <th>Total Vendido</th>
                      <th>Veces Vendido</th>
                      <th>Precio Unitario</th>
                    </>
                  )}
                  {tipoReporte === 'vendedores' && (
                    <>
                      <th>Vendedor</th>
                      <th>Total Ventas</th>
                      <th>Total Vendido</th>
                      <th>Promedio Venta</th>
                      <th>Venta Máxima</th>
                    </>
                  )}
                  {(tipoReporte === 'mensual' || tipoReporte === 'semanal') && (
                    <>
                      <th>Fecha</th>
                      <th>Día</th>
                      <th>Ventas</th>
                      <th>Ingresos</th>
                      {tipoReporte === 'mensual' && <th>Vendedores Activos</th>}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {tipoReporte === 'ventas' && datosReporte.map((venta, index) => (
                  <tr key={venta.id_venta || index}>
                    <td>{venta.id_venta}</td>
                    <td>{new Date(venta.fecha).toLocaleDateString('es-CL')}</td>
                    <td>{venta.vendedor || 'N/A'}</td>
                    <td>{venta.cliente || 'N/A'}</td>
                    <td className="cantidad-cell">{venta.cantidad_productos || 0}</td>
                    <td className="total-cell">{formatearMoneda(venta.total)}</td>
                    <td>{venta.metodo_pago}</td>
                  </tr>
                ))}

                {tipoReporte === 'productos' && datosReporte.map((producto, index) => (
                  <tr key={producto.id_producto || index}>
                    <td className="producto-cell">{producto.nombre}</td>
                    <td>{producto.categoria || 'Sin categoría'}</td>
                    <td className="cantidad-cell">{producto.cantidad_vendida || 0}</td>
                    <td className="total-cell">{formatearMoneda(producto.total_vendido || 0)}</td>
                    <td>{producto.veces_vendido || 0}</td>
                    <td>{formatearMoneda(producto.precio || 0)}</td>
                  </tr>
                ))}

                {tipoReporte === 'vendedores' && datosReporte.map((vendedor, index) => (
                  <tr key={vendedor.id_usuario || index}>
                    <td className="vendedor-cell">{vendedor.vendedor}</td>
                    <td className="ventas-cell">{vendedor.total_ventas || 0}</td>
                    <td className="total-cell">{formatearMoneda(vendedor.total_vendido || 0)}</td>
                    <td>{formatearMoneda(vendedor.promedio_venta || 0)}</td>
                    <td>{formatearMoneda(vendedor.venta_maxima || 0)}</td>
                  </tr>
                ))}

                {(tipoReporte === 'mensual' || tipoReporte === 'semanal') && datosReporte.map((dia, index) => (
                  <tr key={dia.fecha || index}>
                    <td>{new Date(dia.fecha).toLocaleDateString('es-CL')}</td>
                    <td>{dia.dia_semana || ''}</td>
                    <td>{dia.ventas_dia || 0}</td>
                    <td className="total-cell">
                      <span className="ingresos-label">Ingresos:</span> {formatearMoneda(dia.ingresos_dia || 0)}
                    </td>
                    {tipoReporte === 'mensual' && <td>{dia.vendedores_activos || 0}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay datos */}
      {datosReporte.length === 0 && !generando && (
        <div className="no-data-message">
          <div className="no-data-icon">📊</div>
          <h3>No hay datos para mostrar</h3>
          <p>Configura los filtros y genera un reporte para ver los resultados</p>
        </div>
      )}

      {/* Gráficos de Análisis */}
      <div className="graficos-panel" style={{ marginTop: '2rem' }}>
        <h3>📈 Análisis Visual</h3>
          
          {/* Gráfico por Categoría */}
          <div className="grafico-container" style={{ marginBottom: '2rem', background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h4 style={{ marginBottom: '1rem', color: '#8C6A4F' }}>Gráfico por Categoría</h4>
            <div className="filtro-categoria" style={{ marginBottom: '1rem' }}>
              <label htmlFor="categoria-filtro" style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>
                Filtrar por categoría:
              </label>
              <select
                id="categoria-filtro"
                value={categoriaFiltro}
                onChange={(e) => {
                  const nuevaCategoria = e.target.value;
                  // Limpiar datos y estado de carga inmediatamente al cambiar
                  setDatosGraficoCategoria(null);
                  setCargandoGraficoCategoria(false);
                  // Actualizar el filtro (esto disparará el useEffect)
                  setCategoriaFiltro(nuevaCategoria);
                }}
                className="form-control"
                style={{ display: 'inline-block', width: 'auto', minWidth: '200px' }}
              >
                <option value="">-- Seleccionar categoría --</option>
                <option value="Alimentos">Alimentos</option>
                <option value="Bebidas Calientes">Bebidas Calientes</option>
                <option value="Café Monster">Café Monster</option>
                <option value="Empanadas">Empanadas</option>
                <option value="Energizantes">Energizantes</option>
                <option value="Panadería">Panadería</option>
                <option value="Pastelería">Pastelería</option>
              </select>
            </div>
            
            {cargandoGraficoCategoria ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando gráfico...</div>
            ) : datosGraficoCategoria ? (
              <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '500px' }}>
                  <Doughnut 
                    data={datosGraficoCategoria}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        title: {
                          display: true,
                          text: `${categoriaFiltro} (Vendidos)`,
                          font: { size: 18, weight: 'bold' },
                          color: '#8C6A4F'
                        },
                        legend: {
                          display: true,
                          position: 'bottom',
                          labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: { size: 12 }
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
              </div>
            ) : categoriaFiltro ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No hay productos de esta categoría en el período seleccionado
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                Selecciona una categoría para ver el gráfico
              </div>
            )}
          </div>

          {/* Gráfico Comparativo de Dos Meses */}
          <div className="grafico-container" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h4 style={{ marginBottom: '1rem', color: '#8C6A4F' }}>Comparación de Meses</h4>
            <div className="filtros-comparacion" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <label htmlFor="mes-comparacion-1" style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>
                  Mes 1:
                </label>
                <input
                  type="month"
                  id="mes-comparacion-1"
                  value={mesComparacion1}
                  onChange={(e) => setMesComparacion1(e.target.value)}
                  className="form-control"
                  style={{ display: 'inline-block', width: 'auto' }}
                />
              </div>
              <div>
                <label htmlFor="mes-comparacion-2" style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>
                  Mes 2:
                </label>
                <input
                  type="month"
                  id="mes-comparacion-2"
                  value={mesComparacion2}
                  onChange={(e) => setMesComparacion2(e.target.value)}
                  className="form-control"
                  style={{ display: 'inline-block', width: 'auto' }}
                />
              </div>
            </div>
            
            {cargandoGraficoComparacion ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando comparación...</div>
            ) : (datosGraficoComparacionMes1 || datosGraficoComparacionMes2) ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Gráfico Mes 1 */}
                <div>
                  <h5 style={{ textAlign: 'center', marginBottom: '1rem', color: '#8C6A4F', fontSize: '1rem' }}>
                    {mesComparacion1}
                  </h5>
                  {datosGraficoComparacionMes1 ? (
                    <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Doughnut 
                        data={datosGraficoComparacionMes1}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'bottom',
                              labels: {
                                padding: 10,
                                usePointStyle: true,
                                font: { size: 11 }
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
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      Sin datos para este mes
                    </div>
                  )}
                </div>

                {/* Gráfico Mes 2 */}
                <div>
                  <h5 style={{ textAlign: 'center', marginBottom: '1rem', color: '#8C6A4F', fontSize: '1rem' }}>
                    {mesComparacion2}
                  </h5>
                  {datosGraficoComparacionMes2 ? (
                    <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Doughnut 
                        data={datosGraficoComparacionMes2}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'bottom',
                              labels: {
                                padding: 10,
                                usePointStyle: true,
                                font: { size: 11 }
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
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      Sin datos para este mes
                    </div>
                  )}
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
  );
};

export default Reportes;
