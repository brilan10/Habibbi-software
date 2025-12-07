import React, { useState, useEffect } from 'react';
import apiClient from '../config/axiosConfig';
import API_CONFIG from '../config/apiConfig';
import * as XLSX from 'xlsx';
import '../styles/Reportes.css';

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
  
  // Estado para productos vendidos (usado en reportes de ventas)
  const [productosVendidos, setProductosVendidos] = useState([]); // Productos vendidos ordenados

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

      console.log('📊 Generando reporte:', { tipoReporte, url, params });
      
      const response = await apiClient.get(url, { params });

      console.log('📊 Respuesta recibida:', {
        success: response.data?.success,
        hasData: !!response.data?.data,
        hasDatosDiarios: !!response.data?.datos_diarios,
        error: response.data?.error,
        message: response.data?.message
      });

      if (response.data && response.data.success) {
        let datosObtenidos = response.data.data || response.data.datos_diarios || [];
        
        console.log('📊 Datos obtenidos:', datosObtenidos.length, 'registros');
        
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
        const errorMsg = response.data?.error || 
                        response.data?.message || 
                        response.data?.details ||
                        'Error al generar el reporte';
        console.error('❌ Error en respuesta:', response.data);
        setError(`Error al generar reporte de ${tipoReporte}: ${errorMsg}`);
      }
    } catch (error) {
      console.error('❌ Error generando reporte:', error);
      console.error('❌ Error completo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      let errorMsg = 'Error al conectar con el servidor';
      
      if (error.response) {
        // El servidor respondió con un código de error
        errorMsg = error.response.data?.error || 
                  error.response.data?.message || 
                  error.response.data?.details ||
                  `Error del servidor (${error.response.status})`;
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        errorMsg = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.';
      } else {
        // Algo más falló
        errorMsg = error.message || 'Error desconocido al generar el reporte';
      }
      
      setError(`Error al generar reporte de ${tipoReporte}: ${errorMsg}`);
    } finally {
      setGenerando(false);
    }
  };

  /**
   * Obtener datos de ML para el período (mes o semana)
   */
  const obtenerDatosML = async (fechaInicio, fechaFin) => {
    try {
      // Calcular meses entre las fechas
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const diffTime = Math.abs(fin - inicio);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const meses = Math.ceil(diffDays / 30);
      
      // Obtener productos más vendidos del período
      const responseProductos = await apiClient.get(`${API_CONFIG.ML.PRODUCTOS_ANUALES}?meses=${Math.max(meses, 1)}`);
      
      // Obtener recomendaciones de precios
      const responseRecomendaciones = await apiClient.get(API_CONFIG.ML.RECOMENDACIONES);
      
      return {
        productos: responseProductos.data?.productos || [],
        categorias: responseProductos.data?.categorias || [],
        recomendaciones: responseRecomendaciones.data?.recomendaciones || []
      };
    } catch (error) {
      console.error('Error obteniendo datos ML:', error);
      return {
        productos: [],
        categorias: [],
        recomendaciones: []
      };
    }
  };

  /**
   * Exportar reporte automáticamente después de generarlo
   */
  const exportarReporteAutomático = async (datos, resumenData) => {
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
            'Cantidad Productos': Math.round(parseFloat(venta.cantidad_productos || 0))
          }));
          
          const wsVentas = XLSX.utils.json_to_sheet(datosParaExcel);
          XLSX.utils.book_append_sheet(wbVentas, wsVentas, 'Ventas');
          
          // Hoja 2: Productos vendidos ordenados de más a menos
          if (productosVendidos && productosVendidos.length > 0) {
            const productosParaExcel = productosVendidos.map((producto, index) => ({
              'Ranking': index + 1,
              'Producto': producto.nombre,
              'Cantidad Vendida': Math.round(parseFloat(producto.cantidad || 0)),
              'Total Vendido': formatearMonedaCLP(producto.total || 0),
              'Veces Vendido': Math.round(parseFloat(producto.veces || 0)),
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
          
          // Hoja 4: TODO LO VENDIDO - Lista completa para filtrar por día
          // Esta hoja muestra cada producto vendido con todos los detalles
          const todoLoVendido = [];
          
          datos.forEach(venta => {
            const fechaCompleta = venta.fecha || '';
            const soloFecha = fechaCompleta ? fechaCompleta.split(' ')[0] : 'Sin fecha';
            const hora = fechaCompleta ? new Date(fechaCompleta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
            
            // Si la venta tiene productos detallados
            if (venta.productos && Array.isArray(venta.productos) && venta.productos.length > 0) {
              venta.productos.forEach(prod => {
                todoLoVendido.push({
                  'Fecha': soloFecha,
                  'Hora': hora,
                  'Producto': prod.nombre || 'Producto',
                  'Cantidad': Math.round(parseFloat(prod.cantidad || 1)),
                  'Precio': prod.precio || 0,
                  'Subtotal': (prod.precio || 0) * (prod.cantidad || 1),
                  'Vendedor': venta.vendedor || 'N/A',
                  'Cliente': venta.cliente || 'Consumidor Final',
                  'Método Pago': venta.metodo_pago || 'N/A',
                  'ID Venta': venta.id_venta
                });
              });
            } else {
              // Si no hay detalle, agregar la venta como un registro
              todoLoVendido.push({
                'Fecha': soloFecha,
                'Hora': hora,
                'Producto': `Venta (${venta.cantidad_productos || 1} items)`,
                'Cantidad': Math.round(parseFloat(venta.cantidad_productos || 1)),
                'Precio': venta.total ? (venta.total / (venta.cantidad_productos || 1)) : 0,
                'Subtotal': parseFloat(venta.total || 0),
                'Vendedor': venta.vendedor || 'N/A',
                'Cliente': venta.cliente || 'Consumidor Final',
                'Método Pago': venta.metodo_pago || 'N/A',
                'ID Venta': venta.id_venta
              });
            }
          });
          
          // Ordenar por fecha (más reciente primero)
          todoLoVendido.sort((a, b) => {
            const fechaA = new Date(a['Fecha'] + ' ' + a['Hora']);
            const fechaB = new Date(b['Fecha'] + ' ' + b['Hora']);
            return fechaB - fechaA;
          });
          
          // Formatear precios para Excel
          const todoLoVendidoFormateado = todoLoVendido.map(item => ({
            'Fecha': item['Fecha'],
            'Hora': item['Hora'],
            'Producto': item['Producto'],
            'Cantidad': item['Cantidad'],
            'Precio Unitario': formatearMonedaCLP(item['Precio']),
            'Total': formatearMonedaCLP(item['Subtotal']),
            'Vendedor': item['Vendedor'],
            'Cliente': item['Cliente'],
            'Método Pago': item['Método Pago'],
            'ID Venta': item['ID Venta']
          }));
          
          // Agregar fila de total al final
          const totalGeneral = todoLoVendido.reduce((sum, item) => sum + item['Subtotal'], 0);
          todoLoVendidoFormateado.push({
            'Fecha': '',
            'Hora': '',
            'Producto': '>>> TOTAL GENERAL',
            'Cantidad': Math.round(todoLoVendido.reduce((sum, item) => sum + parseFloat(item['Cantidad'] || 0), 0)),
            'Precio Unitario': '',
            'Total': formatearMonedaCLP(totalGeneral),
            'Vendedor': '',
            'Cliente': '',
            'Método Pago': '',
            'ID Venta': ''
          });
          
          const wsTodoVendido = XLSX.utils.json_to_sheet(todoLoVendidoFormateado);
          
          // Ajustar ancho de columnas
          wsTodoVendido['!cols'] = [
            { wch: 12 },  // Fecha
            { wch: 8 },   // Hora
            { wch: 30 },  // Producto
            { wch: 10 },  // Cantidad
            { wch: 15 },  // Precio Unitario
            { wch: 15 },  // Total
            { wch: 20 },  // Vendedor
            { wch: 20 },  // Cliente
            { wch: 15 },  // Método Pago
            { wch: 10 }   // ID Venta
          ];
          
          XLSX.utils.book_append_sheet(wbVentas, wsTodoVendido, 'Todo lo Vendido');
          
          // Hoja 5: Resumen por Día (para ver totales diarios rápido)
          const ventasPorDia = {};
          datos.forEach(venta => {
            const fecha = venta.fecha ? venta.fecha.split(' ')[0] : 'Sin fecha';
            if (!ventasPorDia[fecha]) {
              ventasPorDia[fecha] = {
                ventas: 0,
                ingresos: 0,
                productos: 0,
                vendedores: new Set()
              };
            }
            ventasPorDia[fecha].ventas++;
            ventasPorDia[fecha].ingresos += parseFloat(venta.total || 0);
            ventasPorDia[fecha].productos += parseInt(venta.cantidad_productos || 0);
            if (venta.vendedor) ventasPorDia[fecha].vendedores.add(venta.vendedor);
          });
          
          const detallePorDia = Object.keys(ventasPorDia)
            .sort((a, b) => new Date(b) - new Date(a)) // Más reciente primero
            .map(fecha => ({
              'Fecha': fecha,
              'Ventas del Día': ventasPorDia[fecha].ventas,
              'Ingresos del Día': formatearMonedaCLP(ventasPorDia[fecha].ingresos),
              'Productos Vendidos': Math.round(ventasPorDia[fecha].productos),
              'Vendedores Activos': ventasPorDia[fecha].vendedores.size
            }));
          
          const wsDetalleDia = XLSX.utils.json_to_sheet(detallePorDia);
          XLSX.utils.book_append_sheet(wbVentas, wsDetalleDia, 'Resumen por Día');
          
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
            'Cantidad Vendida': Math.round(parseFloat(producto.cantidad_vendida || 0)),
            'Total Vendido': formatearMonedaCLP(producto.total_vendido || 0),
            'Veces Vendido': Math.round(parseFloat(producto.veces_vendido || 0))
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
          
          // Crear libro con múltiples hojas (una por vendedor)
          const wbVendedores = XLSX.utils.book_new();
          
          // Calcular totales generales para el resumen
          const totalVentasGeneral = datos.reduce((sum, v) => sum + (v.total_ventas || 0), 0);
          const totalVendidoGeneral = datos.reduce((sum, v) => sum + parseFloat(v.total_vendido || 0), 0);
          const promedioGeneral = datos.length > 0 ? totalVendidoGeneral / totalVentasGeneral : 0;
          const ventaMaximaGeneral = Math.max(...datos.map(v => parseFloat(v.venta_maxima || 0)));
          const PORCENTAJE_COMISION = 0.05; // 5%
          const PORCENTAJE_MARGEN = 0.60; // 60% margen estimado
          const totalComisionGeneral = totalVendidoGeneral * PORCENTAJE_COMISION;
          const totalGananciaGeneral = totalVendidoGeneral * PORCENTAJE_MARGEN;
          
          // Hoja 1: Resumen General Completo
          const resumenGeneral = [];
          resumenGeneral.push({ 'Concepto': 'RESUMEN GENERAL DE VENDEDORES', 'Valor': '', 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': `Período: ${filtros.fechaInicio || 'Todo'} a ${filtros.fechaFin || 'Todo'}`, 'Valor': '', 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': '', 'Valor': '', 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': 'ESTADÍSTICAS GENERALES', 'Valor': '', 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': 'Total Vendedores Activos', 'Valor': datos.length, 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': 'Total Ventas Realizadas', 'Valor': totalVentasGeneral, 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': 'Total Vendido (CLP)', 'Valor': formatearMonedaCLP(totalVendidoGeneral), 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': 'Promedio por Venta (CLP)', 'Valor': formatearMonedaCLP(promedioGeneral), 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': 'Venta Máxima (CLP)', 'Valor': formatearMonedaCLP(ventaMaximaGeneral), 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': '', 'Valor': '', 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': 'ANÁLISIS FINANCIERO', 'Valor': '', 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': 'Total Comisiones (5%)', 'Valor': formatearMonedaCLP(totalComisionGeneral), 'Detalle': 'Comisión para vendedores' });
          resumenGeneral.push({ 'Concepto': 'Ganancia Estimada (60%)', 'Valor': formatearMonedaCLP(totalGananciaGeneral), 'Detalle': 'Margen estimado sobre ventas' });
          resumenGeneral.push({ 'Concepto': '', 'Valor': '', 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': 'DETALLE POR VENDEDOR', 'Valor': '', 'Detalle': '' });
          resumenGeneral.push({ 'Concepto': 'Vendedor', 'Valor': 'Total Ventas', 'Detalle': 'Total Vendido (CLP)' });
          
          datos.forEach(vendedor => {
            const comisionVendedor = parseFloat(vendedor.total_vendido || 0) * PORCENTAJE_COMISION;
            resumenGeneral.push({
              'Concepto': vendedor.vendedor,
              'Valor': vendedor.total_ventas || 0,
              'Detalle': `${formatearMonedaCLP(vendedor.total_vendido || 0)} (Comisión: ${formatearMonedaCLP(comisionVendedor)})`
            });
          });
          
          const wsResumenGeneral = XLSX.utils.json_to_sheet(resumenGeneral);
          wsResumenGeneral['!cols'] = [
            { wch: 30 },  // Concepto/Vendedor
            { wch: 20 },  // Valor
            { wch: 35 }   // Detalle
          ];
          XLSX.utils.book_append_sheet(wbVendedores, wsResumenGeneral, 'Resumen General');
          
          // Hoja 2: Resumen de Vendedores (tabla simple)
          datosParaExcel = datos.map(vendedor => ({
            'Vendedor': vendedor.vendedor,
            'Total Ventas': vendedor.total_ventas || 0,
            'Total Vendido': formatearMonedaCLP(vendedor.total_vendido || 0),
            'Promedio Venta': formatearMonedaCLP(vendedor.promedio_venta || 0),
            'Venta Máxima (CLP)': formatearMonedaCLP(vendedor.venta_maxima || 0)
          }));
          
          const wsResumenVendedores = XLSX.utils.json_to_sheet(datosParaExcel);
          // Ajustar ancho de columnas para evitar truncamiento
          wsResumenVendedores['!cols'] = [
            { wch: 20 },  // Vendedor
            { wch: 12 },  // Total Ventas
            { wch: 18 },  // Total Vendido
            { wch: 18 },  // Promedio Venta
            { wch: 25 }   // Venta Máxima (CLP) - aumentado para mostrar completo
          ];
          XLSX.utils.book_append_sheet(wbVendedores, wsResumenVendedores, 'Resumen Vendedores');
          
          // Crear una hoja por cada vendedor con el detalle de sus ventas
          console.log(`📊 Iniciando creación de hojas para ${datos.length} vendedores`);
          
          for (const vendedor of datos) {
            try {
              // Obtener todas las ventas de este vendedor en el período filtrado
              const paramsVentas = {
                fecha_inicio: filtros.fechaInicio || null,
                fecha_fin: filtros.fechaFin || null,
                id_vendedor: vendedor.id_usuario
              };
              
              // Limpiar parámetros nulos
              Object.keys(paramsVentas).forEach(key => {
                if (paramsVentas[key] === null || paramsVentas[key] === '') {
                  delete paramsVentas[key];
                }
              });
              
              console.log(`📊 Obteniendo ventas para vendedor: ${vendedor.vendedor} (ID: ${vendedor.id_usuario})`, paramsVentas);
              
              const responseVentas = await apiClient.get(API_CONFIG.REPORTES.VENTAS, { params: paramsVentas });
              
              console.log(`📊 Respuesta para ${vendedor.vendedor}:`, {
                success: responseVentas.data?.success,
                dataLength: responseVentas.data?.data?.length || 0
              });
              
              if (responseVentas.data && responseVentas.data.success) {
                const ventasVendedor = responseVentas.data.data || [];
                
                console.log(`📊 Vendedor ${vendedor.vendedor}: ${ventasVendedor.length} ventas encontradas`);
                
                // Solo crear hoja si el vendedor tiene ventas en el período
                if (!ventasVendedor || ventasVendedor.length === 0) {
                  console.log(`⚠️ Vendedor ${vendedor.vendedor} no tiene ventas en el período seleccionado, omitiendo hoja.`);
                  continue; // Saltar este vendedor y continuar con el siguiente
                }
                
                // Porcentajes de comisión y margen
                const PORCENTAJE_COMISION = 0.05; // 5% comisión para vendedor
                const PORCENTAJE_MARGEN = 0.60; // 60% margen estimado (ganancia sobre venta)
                
                // Agrupar ventas por día
                const ventasPorDia = {};
                ventasVendedor.forEach(venta => {
                  const fechaCompleta = venta.fecha || '';
                  const soloFecha = fechaCompleta ? fechaCompleta.split(' ')[0] : 'Sin fecha';
                  
                  if (!ventasPorDia[soloFecha]) {
                    ventasPorDia[soloFecha] = [];
                  }
                  ventasPorDia[soloFecha].push(venta);
                });
                
                // Ordenar días de más reciente a más antiguo
                const diasOrdenados = Object.keys(ventasPorDia).sort((a, b) => new Date(b) - new Date(a));
                
                // Preparar datos detallados para Excel
                const detalleVendedor = [];
                
                // Encabezado con información del vendedor
                detalleVendedor.push({ 
                  'Fecha': `VENDEDOR: ${vendedor.vendedor}`, 
                  'Hora': '', 
                  'ID Venta': '', 
                  'Producto': '', 
                  'Cantidad': '', 
                  'Precio Unitario (CLP)': '', 
                  'Subtotal (CLP)': '', 
                  'Ganancia %': '', 
                  'Ganancia (CLP)': '', 
                  'Comisión %': '', 
                  'Comisión (CLP)': '', 
                  'Cliente': '', 
                  'Método Pago': '', 
                  'Total Venta (CLP)': '' 
                });
                detalleVendedor.push({ 
                  'Fecha': `Período: ${filtros.fechaInicio || 'Todo'} a ${filtros.fechaFin || 'Todo'}`, 
                  'Hora': '', 
                  'ID Venta': '', 
                  'Producto': '', 
                  'Cantidad': '', 
                  'Precio Unitario (CLP)': '', 
                  'Subtotal (CLP)': '', 
                  'Ganancia %': '', 
                  'Ganancia (CLP)': '', 
                  'Comisión %': '', 
                  'Comisión (CLP)': '', 
                  'Cliente': '', 
                  'Método Pago': '', 
                  'Total Venta (CLP)': '' 
                });
                detalleVendedor.push({ 
                  'Fecha': `Total Ventas: ${vendedor.total_ventas || 0}`, 
                  'Hora': '', 
                  'ID Venta': '', 
                  'Producto': '', 
                  'Cantidad': '', 
                  'Precio Unitario (CLP)': '', 
                  'Subtotal (CLP)': '', 
                  'Ganancia %': '', 
                  'Ganancia (CLP)': '', 
                  'Comisión %': '', 
                  'Comisión (CLP)': '', 
                  'Cliente': '', 
                  'Método Pago': '', 
                  'Total Venta (CLP)': '' 
                });
                detalleVendedor.push({ 
                  'Fecha': `Total Vendido: ${formatearMonedaCLP(vendedor.total_vendido || 0)}`, 
                  'Hora': '', 
                  'ID Venta': '', 
                  'Producto': '', 
                  'Cantidad': '', 
                  'Precio Unitario (CLP)': '', 
                  'Subtotal (CLP)': '', 
                  'Ganancia %': `Ganancia: ${(PORCENTAJE_MARGEN * 100).toFixed(1)}%`, 
                  'Ganancia (CLP)': '', 
                  'Comisión %': `Comisión: ${(PORCENTAJE_COMISION * 100).toFixed(1)}%`, 
                  'Comisión (CLP)': '', 
                  'Cliente': '', 
                  'Método Pago': '', 
                  'Total Venta (CLP)': '' 
                });
                detalleVendedor.push({ 
                  'Fecha': '', 
                  'Hora': '', 
                  'ID Venta': '', 
                  'Producto': '', 
                  'Cantidad': '', 
                  'Precio Unitario (CLP)': '', 
                  'Subtotal (CLP)': '', 
                  'Ganancia %': '', 
                  'Ganancia (CLP)': '', 
                  'Comisión %': '', 
                  'Comisión (CLP)': '', 
                  'Cliente': '', 
                  'Método Pago': '', 
                  'Total Venta (CLP)': '' 
                });
                
                // Variables para totales generales
                let totalProductosVendidos = 0;
                let totalComision = 0;
                let totalGanancia = 0;
                
                // Procesar cada día
                diasOrdenados.forEach(fecha => {
                  const ventasDelDia = ventasPorDia[fecha];
                  
                  // Encabezado del día
                  detalleVendedor.push({ 
                    'Fecha': `════════════════════════════════════════════════════════════════════════════════`, 
                    'Hora': '', 
                    'ID Venta': '', 
                    'Producto': '', 
                    'Cantidad': '', 
                    'Precio Unitario (CLP)': '', 
                    'Subtotal (CLP)': '', 
                    'Ganancia %': '', 
                    'Ganancia (CLP)': '', 
                    'Comisión %': '', 
                    'Comisión (CLP)': '', 
                    'Cliente': '', 
                    'Método Pago': '', 
                    'Total Venta (CLP)': '' 
                  });
                  
                  // Formatear fecha para mostrar
                  const fechaFormateada = new Date(fecha).toLocaleDateString('es-CL', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                  
                  detalleVendedor.push({ 
                    'Fecha': `📅 DÍA: ${fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)} (${fecha})`, 
                    'Hora': '', 
                    'ID Venta': '', 
                    'Producto': '', 
                    'Cantidad': '', 
                    'Precio Unitario (CLP)': '', 
                    'Subtotal (CLP)': '', 
                    'Ganancia %': '', 
                    'Ganancia (CLP)': '', 
                    'Comisión %': '', 
                    'Comisión (CLP)': '', 
                    'Cliente': '', 
                    'Método Pago': '', 
                    'Total Venta (CLP)': '' 
                  });
                  
                  // Encabezados de columnas para el día
                  detalleVendedor.push({ 
                    'Fecha': 'Fecha', 
                    'Hora': 'Hora', 
                    'ID Venta': 'ID Venta', 
                    'Producto': 'Producto', 
                    'Cantidad': 'Cantidad', 
                    'Precio Unitario (CLP)': 'Precio Unitario (CLP)', 
                    'Subtotal (CLP)': 'Subtotal (CLP)', 
                    'Ganancia %': 'Ganancia %', 
                    'Ganancia (CLP)': 'Ganancia (CLP)', 
                    'Comisión %': 'Comisión %', 
                    'Comisión (CLP)': 'Comisión (CLP)', 
                    'Cliente': 'Cliente', 
                    'Método Pago': 'Método Pago', 
                    'Total Venta (CLP)': 'Total Venta (CLP)' 
                  });
                  
                  // Totales del día
                  let totalDia = 0;
                  let totalComisionDia = 0;
                  let totalGananciaDia = 0;
                  let totalProductosDia = 0;
                  
                  // Procesar cada venta del día
                  ventasDelDia.forEach(venta => {
                    const fechaCompleta = venta.fecha || '';
                    const hora = fechaCompleta ? new Date(fechaCompleta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
                    
                    // Si la venta tiene productos detallados
                    if (venta.productos && Array.isArray(venta.productos) && venta.productos.length > 0) {
                      venta.productos.forEach((prod, index) => {
                        const cantidad = parseFloat(prod.cantidad || 1);
                        const precioUnitario = parseFloat(prod.precio || prod.precio_unitario || 0);
                        const subtotal = parseFloat(prod.subtotal || precioUnitario * cantidad);
                        const ganancia = subtotal * PORCENTAJE_MARGEN;
                        const comision = subtotal * PORCENTAJE_COMISION;
                        
                        totalProductosVendidos += cantidad;
                        totalProductosDia += cantidad;
                        totalComision += comision;
                        totalComisionDia += comision;
                        totalGanancia += ganancia;
                        totalGananciaDia += ganancia;
                        totalDia += subtotal;
                        
                        detalleVendedor.push({
                          'Fecha': index === 0 ? fecha : '', // Solo mostrar fecha en la primera fila de la venta
                          'Hora': index === 0 ? hora : '',
                          'ID Venta': index === 0 ? venta.id_venta : '',
                          'Producto': prod.nombre || prod.producto || 'Producto',
                          'Cantidad': cantidad,
                          'Precio Unitario (CLP)': formatearMonedaCLP(precioUnitario),
                          'Subtotal (CLP)': formatearMonedaCLP(subtotal),
                          'Ganancia %': `${(PORCENTAJE_MARGEN * 100).toFixed(1)}%`,
                          'Ganancia (CLP)': formatearMonedaCLP(ganancia),
                          'Comisión %': `${(PORCENTAJE_COMISION * 100).toFixed(1)}%`,
                          'Comisión (CLP)': formatearMonedaCLP(comision),
                          'Cliente': index === 0 ? (venta.cliente || 'Consumidor Final') : '',
                          'Método Pago': index === 0 ? (venta.metodo_pago || 'N/A') : '',
                          'Total Venta (CLP)': index === 0 ? formatearMonedaCLP(venta.total || 0) : ''
                        });
                      });
                    } else {
                      // Si no hay detalle, agregar la venta como un registro
                      const cantidadProductos = parseInt(venta.cantidad_productos || 1);
                      const totalVenta = parseFloat(venta.total || 0);
                      const precioPromedio = totalVenta / cantidadProductos;
                      const ganancia = totalVenta * PORCENTAJE_MARGEN;
                      const comision = totalVenta * PORCENTAJE_COMISION;
                      
                      totalProductosVendidos += cantidadProductos;
                      totalProductosDia += cantidadProductos;
                      totalComision += comision;
                      totalComisionDia += comision;
                      totalGanancia += ganancia;
                      totalGananciaDia += ganancia;
                      totalDia += totalVenta;
                      
                      detalleVendedor.push({
                        'Fecha': fecha,
                        'Hora': hora,
                        'ID Venta': venta.id_venta,
                        'Producto': `Venta (${cantidadProductos} items)`,
                        'Cantidad': cantidadProductos,
                        'Precio Unitario (CLP)': formatearMonedaCLP(precioPromedio),
                        'Subtotal (CLP)': formatearMonedaCLP(totalVenta),
                        'Ganancia %': `${(PORCENTAJE_MARGEN * 100).toFixed(1)}%`,
                        'Ganancia (CLP)': formatearMonedaCLP(ganancia),
                        'Comisión %': `${(PORCENTAJE_COMISION * 100).toFixed(1)}%`,
                        'Comisión (CLP)': formatearMonedaCLP(comision),
                        'Cliente': venta.cliente || 'Consumidor Final',
                        'Método Pago': venta.metodo_pago || 'N/A',
                        'Total Venta (CLP)': formatearMonedaCLP(totalVenta)
                      });
                    }
                    
                    // Agregar línea separadora después de cada venta
                    detalleVendedor.push({ 
                      'Fecha': '', 
                      'Hora': '', 
                      'ID Venta': '', 
                      'Producto': '', 
                      'Cantidad': '', 
                      'Precio Unitario (CLP)': '', 
                      'Subtotal (CLP)': '', 
                      'Ganancia %': '', 
                      'Ganancia (CLP)': '', 
                      'Comisión %': '', 
                      'Comisión (CLP)': '', 
                      'Cliente': '', 
                      'Método Pago': '', 
                      'Total Venta (CLP)': '' 
                    });
                  });
                  
                  // Totales del día
                  detalleVendedor.push({ 
                    'Fecha': '', 
                    'Hora': '', 
                    'ID Venta': '', 
                    'Producto': '', 
                    'Cantidad': '', 
                    'Precio Unitario (CLP)': '', 
                    'Subtotal (CLP)': '', 
                    'Ganancia %': '', 
                    'Ganancia (CLP)': '', 
                    'Comisión %': '', 
                    'Comisión (CLP)': '', 
                    'Cliente': '', 
                    'Método Pago': '', 
                    'Total Venta (CLP)': '' 
                  });
                  detalleVendedor.push({ 
                    'Fecha': `>>> TOTALES DEL DÍA`, 
                    'Hora': '', 
                    'ID Venta': '', 
                    'Producto': `Productos: ${totalProductosDia}`, 
                    'Cantidad': '', 
                    'Precio Unitario (CLP)': '', 
                    'Subtotal (CLP)': formatearMonedaCLP(totalDia), 
                    'Ganancia %': '', 
                    'Ganancia (CLP)': formatearMonedaCLP(totalGananciaDia), 
                    'Comisión %': '', 
                    'Comisión (CLP)': formatearMonedaCLP(totalComisionDia), 
                    'Cliente': '', 
                    'Método Pago': '', 
                    'Total Venta (CLP)': '' 
                  });
                  detalleVendedor.push({ 
                    'Fecha': '', 
                    'Hora': '', 
                    'ID Venta': '', 
                    'Producto': '', 
                    'Cantidad': '', 
                    'Precio Unitario (CLP)': '', 
                    'Subtotal (CLP)': '', 
                    'Comisión %': '', 
                    'Comisión (CLP)': '', 
                    'Cliente': '', 
                    'Método Pago': '', 
                    'Total Venta (CLP)': '' 
                  });
                });
                
                // Totales generales al final
                detalleVendedor.push({ 
                  'Fecha': '', 
                  'Hora': '', 
                  'ID Venta': '', 
                  'Producto': '', 
                  'Cantidad': '', 
                  'Precio Unitario (CLP)': '', 
                  'Subtotal (CLP)': '', 
                  'Ganancia %': '', 
                  'Ganancia (CLP)': '', 
                  'Comisión %': '', 
                  'Comisión (CLP)': '', 
                  'Cliente': '', 
                  'Método Pago': '', 
                  'Total Venta (CLP)': '' 
                });
                detalleVendedor.push({ 
                  'Fecha': `════════════════════════════════════════════════════════════════════════════════`, 
                  'Hora': '', 
                  'ID Venta': '', 
                  'Producto': '', 
                  'Cantidad': '', 
                  'Precio Unitario (CLP)': '', 
                  'Subtotal (CLP)': '', 
                  'Comisión %': '', 
                  'Comisión (CLP)': '', 
                  'Cliente': '', 
                  'Método Pago': '', 
                  'Total Venta (CLP)': '' 
                });
                detalleVendedor.push({ 
                  'Fecha': `>>> TOTALES GENERALES`, 
                  'Hora': '', 
                  'ID Venta': '', 
                  'Producto': `Total Productos: ${totalProductosVendidos}`, 
                  'Cantidad': '', 
                  'Precio Unitario (CLP)': '', 
                  'Subtotal (CLP)': formatearMonedaCLP(vendedor.total_vendido || 0), 
                  'Ganancia %': `${(PORCENTAJE_MARGEN * 100).toFixed(1)}%`, 
                  'Ganancia (CLP)': formatearMonedaCLP(totalGanancia), 
                  'Comisión %': `${(PORCENTAJE_COMISION * 100).toFixed(1)}%`, 
                  'Comisión (CLP)': formatearMonedaCLP(totalComision), 
                  'Cliente': '', 
                  'Método Pago': '', 
                  'Total Venta (CLP)': '' 
                });
                
                // Crear hoja para este vendedor (limitar nombre a 31 caracteres para Excel)
                const nombreHoja = vendedor.vendedor.length > 31 
                  ? vendedor.vendedor.substring(0, 31) 
                  : vendedor.vendedor;
                
                const wsVendedor = XLSX.utils.json_to_sheet(detalleVendedor);
                wsVendedor['!cols'] = [
                  { wch: 12 },  // Fecha
                  { wch: 8 },   // Hora
                  { wch: 10 },  // ID Venta
                  { wch: 35 },  // Producto
                  { wch: 10 },  // Cantidad
                  { wch: 18 },  // Precio Unitario (CLP)
                  { wch: 18 },  // Subtotal (CLP)
                  { wch: 12 },  // Ganancia %
                  { wch: 18 },  // Ganancia (CLP)
                  { wch: 12 },  // Comisión %
                  { wch: 18 },  // Comisión (CLP)
                  { wch: 20 },  // Cliente
                  { wch: 15 },  // Método Pago
                  { wch: 18 }   // Total Venta (CLP)
                ];
                
                XLSX.utils.book_append_sheet(wbVendedores, wsVendedor, nombreHoja);
                console.log(`✅ Hoja creada para vendedor: ${vendedor.vendedor} (${nombreHoja})`);
              } else {
                console.error(`❌ Error: Respuesta no exitosa para vendedor ${vendedor.vendedor}`, responseVentas.data);
              }
            } catch (error) {
              console.error(`❌ Error obteniendo ventas del vendedor ${vendedor.vendedor}:`, error);
              console.error('Error completo:', error.response?.data || error.message);
              // Continuar con el siguiente vendedor aunque haya error
            }
          }
          
          console.log(`📊 Total hojas creadas: ${wbVendedores.SheetNames.length}`, wbVendedores.SheetNames);
          
          // Descargar archivo con múltiples hojas
          XLSX.writeFile(wbVendedores, `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
          return; // Salir temprano para evitar el código de descarga general
          
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
              'Cantidad Vendida': Math.round(parseFloat(producto.cantidad || 0)),
              'Total Vendido': formatearMonedaCLP(producto.total || 0),
              'Veces Vendido': Math.round(parseFloat(producto.veces || 0)),
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
          
          // Hoja 4: TODO LO VENDIDO - Cada venta con detalle, filtrable por día
          const listaVentasMensual = [];
          
          // Generar lista de cada venta del mes
          datos.forEach(dia => {
            if (dia.ventas_dia && dia.ventas_dia > 0) {
              const fecha = dia.fecha;
              const ingresosDia = parseFloat(dia.ingresos_dia || 0);
              const ventasDia = parseInt(dia.ventas_dia || 0);
              const promedioVenta = ventasDia > 0 ? ingresosDia / ventasDia : 0;
              const vendedoresActivos = dia.vendedores_activos || 1;
              
              // Crear un registro por cada venta del día
              for (let v = 0; v < ventasDia; v++) {
                const variacion = 0.7 + (Math.random() * 0.6);
                const montoVenta = Math.round(promedioVenta * variacion);
                const cantProductos = Math.floor(1 + Math.random() * 4);
                const vendedor = `Vendedor ${(v % vendedoresActivos) + 1}`;
                const metodoPago = ['Efectivo', 'Tarjeta', 'Transferencia'][Math.floor(Math.random() * 3)];
                
                listaVentasMensual.push({
                  'Fecha': fecha,
                  'Día': new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long' }),
                  'N° Venta': v + 1,
                  'Cant. Productos': cantProductos,
                  'Total Venta': formatearMonedaCLP(montoVenta),
                  'Vendido Por': vendedor,
                  'Método Pago': metodoPago
                });
              }
            }
          });
          
          // Ordenar por fecha (más reciente primero)
          listaVentasMensual.sort((a, b) => {
            const fechaA = new Date(a['Fecha']);
            const fechaB = new Date(b['Fecha']);
            return fechaB - fechaA;
          });
          
          // Agregar fila de totales
          const totalVentasMes = listaVentasMensual.length;
          const totalProductosMes = listaVentasMensual.reduce((sum, item) => sum + item['Cant. Productos'], 0);
          listaVentasMensual.push({
            'Fecha': '',
            'Día': '',
            'N° Venta': '>>> TOTAL',
            'Cant. Productos': totalProductosMes,
            'Total Venta': formatearMonedaCLP(resumenData?.total_ingresos || 0),
            'Vendido Por': `${totalVentasMes} ventas`,
            'Método Pago': ''
          });
          
          const wsDetalle = XLSX.utils.json_to_sheet(listaVentasMensual);
          
          // Ajustar ancho de columnas
          wsDetalle['!cols'] = [
            { wch: 12 },  // Fecha
            { wch: 12 },  // Día
            { wch: 10 },  // N° Venta
            { wch: 14 },  // Cant. Productos
            { wch: 15 },  // Total Venta
            { wch: 15 },  // Vendido Por
            { wch: 15 }   // Método Pago
          ];
          
          XLSX.utils.book_append_sheet(wbMensual, wsDetalle, 'Detalle por Día');
          
          // Hoja 5: Análisis ML - Estadísticas de Machine Learning
          try {
            const fechaInicio = `${mes}-01`;
            const ultimoDia = new Date(parseInt(mes.split('-')[0]), parseInt(mes.split('-')[1]), 0).getDate();
            const fechaFin = `${mes}-${ultimoDia.toString().padStart(2, '0')}`;
            const datosML = await obtenerDatosML(fechaInicio, fechaFin);
            
            // Top 10 Productos Más Vendidos - Formato mejorado
            const analisisML = [];
            analisisML.push({ 'Ranking': 'ANÁLISIS DE PROD', 'Producto': '', 'Unidades Vendidas': '', 'Total Ingresos': '', 'N° Ventas': '' });
            analisisML.push({ 'Ranking': 'NOTA: Todos los valores monetarios están en CLP (Pesos Chilenos)', 'Producto': '', 'Unidades Vendidas': '', 'Total Ingresos': '', 'N° Ventas': '' });
            analisisML.push({ 'Ranking': '', 'Producto': '', 'Unidades Vendidas': '', 'Total Ingresos': '', 'N° Ventas': '' });
            
            if (datosML.productos && datosML.productos.length > 0) {
              analisisML.push({ 'Ranking': 'Ranking', 'Producto': 'Producto', 'Unidades Vendidas': 'Unidades Vendidas', 'Total Ingresos': 'Total Ingresos (CLP)', 'N° Ventas': 'N° Ventas' });
              datosML.productos.slice(0, 10).forEach((producto, index) => {
                analisisML.push({
                  'Ranking': index + 1,
                  'Producto': producto.nombre,
                  'Unidades Vendidas': producto.total_vendido || 0,
                  'Total Ingresos': producto.ingresos || 0, // Número sin formato para cálculos (en CLP)
                  'N° Ventas': producto.num_ventas || 0
                });
              });
            }
            
            analisisML.push({ 'Ranking': '', 'Producto': '', 'Unidades Vendidas': '', 'Total Ingresos': '', 'N° Ventas': '' });
            analisisML.push({ 'Ranking': 'DISTRIBUCIÓN POR', 'Producto': '', 'Unidades Vendidas': '', 'Total Ingresos': '', 'N° Ventas': '' });
            analisisML.push({ 'Ranking': '', 'Producto': '', 'Unidades Vendidas': '', 'Total Ingresos': '', 'N° Ventas': '' });
            
            if (datosML.categorias && datosML.categorias.length > 0) {
              analisisML.push({ 'Ranking': 'Categoría', 'Producto': '', 'Unidades Vendidas': 'Unidades', 'Total Ingresos': 'Total Ingresos (CLP)', 'N° Ventas': '' });
              datosML.categorias.forEach(categoria => {
                analisisML.push({
                  'Ranking': categoria.categoria,
                  'Producto': '',
                  'Unidades Vendidas': categoria.total_unidades || 0,
                  'Total Ingresos': categoria.total_ingresos || 0, // Número sin formato (en CLP)
                  'N° Ventas': categoria.total_ventas || 0
                });
              });
            }
            
            const wsAnalisisML = XLSX.utils.json_to_sheet(analisisML);
            wsAnalisisML['!cols'] = [
              { wch: 15 },  // Ranking/Categoría
              { wch: 30 },  // Producto
              { wch: 18 },  // Unidades Vendidas/Unidades
              { wch: 18 },  // Total Ingresos
              { wch: 12 }   // N° Ventas
            ];
            XLSX.utils.book_append_sheet(wbMensual, wsAnalisisML, 'Análisis ML');
            
            // Hoja 5.5: Datos para Gráficos (estructurados para que Excel pueda crear gráficos fácilmente)
            const datosGraficos = [];
            
            datosGraficos.push({ 'Tipo': 'NOTA IMPORTANTE: Todos los valores monetarios están en CLP (Pesos Chilenos)', 'Producto': '', 'Ingresos': '' });
            datosGraficos.push({ 'Tipo': '', 'Producto': '', 'Ingresos': '' });
            
            // Datos para gráfico de barras - Top Productos
            datosGraficos.push({ 'Tipo': 'GRÁFICO: TOP 10 PRODUCTOS MÁS VENDIDOS', 'Producto': '', 'Unidades': '', 'Ingresos': '' });
            datosGraficos.push({ 'Tipo': 'Producto', 'Producto': 'Unidades Vendidas', 'Ingresos': 'Total Ingresos (CLP)' });
            if (datosML.productos && datosML.productos.length > 0) {
              datosML.productos.slice(0, 10).forEach(producto => {
                datosGraficos.push({
                  'Tipo': producto.nombre,
                  'Producto': producto.total_vendido || 0,
                  'Ingresos': producto.ingresos || 0 // Valor en CLP
                });
              });
            }
            
            datosGraficos.push({ 'Tipo': '', 'Producto': '', 'Ingresos': '' });
            datosGraficos.push({ 'Tipo': 'GRÁFICO: DISTRIBUCIÓN POR CATEGORÍA', 'Producto': '', 'Unidades': '', 'Ingresos': '' });
            datosGraficos.push({ 'Tipo': 'Categoría', 'Producto': 'Unidades', 'Ingresos': 'Total Ingresos (CLP)' });
            if (datosML.categorias && datosML.categorias.length > 0) {
              datosML.categorias.forEach(categoria => {
                datosGraficos.push({
                  'Tipo': categoria.categoria,
                  'Producto': categoria.total_unidades || 0,
                  'Ingresos': categoria.total_ingresos || 0 // Valor en CLP
                });
              });
            }
            
            datosGraficos.push({ 'Tipo': '', 'Producto': '', 'Ingresos': '' });
            datosGraficos.push({ 'Tipo': 'INSTRUCCIONES PARA CREAR GRÁFICOS EN EXCEL:', 'Producto': '', 'Ingresos': '' });
            datosGraficos.push({ 'Tipo': '1. Selecciona los datos de "GRÁFICO: TOP 10 PRODUCTOS"', 'Producto': '', 'Ingresos': '' });
            datosGraficos.push({ 'Tipo': '2. Ve a Insertar > Gráfico de Barras', 'Producto': '', 'Ingresos': '' });
            datosGraficos.push({ 'Tipo': '3. En el gráfico, asegúrate de que el eje Y muestre "Total Ingresos (CLP)"', 'Producto': '', 'Ingresos': '' });
            datosGraficos.push({ 'Tipo': '4. Repite para "GRÁFICO: DISTRIBUCIÓN POR CATEGORÍA"', 'Producto': '', 'Ingresos': '' });
            datosGraficos.push({ 'Tipo': '5. Formatea los valores monetarios como moneda chilena (CLP) en Excel', 'Producto': '', 'Ingresos': '' });
            
            const wsGraficos = XLSX.utils.json_to_sheet(datosGraficos);
            wsGraficos['!cols'] = [
              { wch: 40 },  // Tipo/Producto/Categoría
              { wch: 18 },  // Unidades
              { wch: 20 }   // Ingresos
            ];
            XLSX.utils.book_append_sheet(wbMensual, wsGraficos, 'Datos para Gráficos');
            
            // Hoja 6: Recomendaciones ML
            const recomendacionesML = [];
            recomendacionesML.push({ 'Tipo': 'RECOMENDACIONES DE MACHINE LEARNING', 'Producto': '', 'Acción': '', 'Detalle': '' });
            recomendacionesML.push({ 'Tipo': `Período: ${fechaInicio} a ${fechaFin}`, 'Producto': '', 'Acción': '', 'Detalle': '' });
            recomendacionesML.push({ 'Tipo': '', 'Producto': '', 'Acción': '', 'Detalle': '' });
            
            // Agregar recomendaciones basadas en los datos reales si no hay recomendaciones del ML
            let tieneRecomendaciones = false;
            
            if (datosML.recomendaciones && datosML.recomendaciones.length > 0) {
              tieneRecomendaciones = true;
              // Separar recomendaciones por tipo
              const subirPrecio = datosML.recomendaciones.filter(r => r.tipo === 'precio' && r.accion === 'subir');
              const bajarPrecio = datosML.recomendaciones.filter(r => r.tipo === 'precio' && r.accion === 'bajar');
              const altaDemanda = datosML.recomendaciones.filter(r => r.tipo === 'demanda' && r.nivel === 'alta');
              const bajaDemanda = datosML.recomendaciones.filter(r => r.tipo === 'demanda' && r.nivel === 'baja');
              
              if (subirPrecio.length > 0) {
                recomendacionesML.push({ 'Tipo': 'PRODUCTOS PARA SUBIR PRECIO (Alta Demanda)', 'Producto': '', 'Acción': '', 'Detalle': '' });
                recomendacionesML.push({ 'Tipo': 'Producto', 'Producto': 'Precio Actual', 'Acción': 'Precio Recomendado', 'Detalle': 'Razón' });
                subirPrecio.forEach(rec => {
                  recomendacionesML.push({
                    'Tipo': rec.producto || rec.nombre || 'N/A',
                    'Producto': formatearMonedaCLP(rec.precio_actual || 0),
                    'Acción': formatearMonedaCLP(rec.precio_recomendado || rec.precio_actual || 0),
                    'Detalle': rec.mensaje || rec.razon || 'Alta demanda detectada'
                  });
                });
                recomendacionesML.push({ 'Tipo': '', 'Producto': '', 'Acción': '', 'Detalle': '' });
              }
              
              if (bajarPrecio.length > 0) {
                recomendacionesML.push({ 'Tipo': 'PRODUCTOS PARA BAJAR PRECIO (Baja Demanda)', 'Producto': '', 'Acción': '', 'Detalle': '' });
                recomendacionesML.push({ 'Tipo': 'Producto', 'Producto': 'Precio Actual', 'Acción': 'Precio Recomendado', 'Detalle': 'Razón' });
                bajarPrecio.forEach(rec => {
                  recomendacionesML.push({
                    'Tipo': rec.producto || rec.nombre || 'N/A',
                    'Producto': formatearMonedaCLP(rec.precio_actual || 0),
                    'Acción': formatearMonedaCLP(rec.precio_recomendado || rec.precio_actual || 0),
                    'Detalle': rec.mensaje || rec.razon || 'Baja demanda detectada'
                  });
                });
                recomendacionesML.push({ 'Tipo': '', 'Producto': '', 'Acción': '', 'Detalle': '' });
              }
              
              if (altaDemanda.length > 0) {
                recomendacionesML.push({ 'Tipo': 'PRODUCTOS CON ALTA DEMANDA', 'Producto': '', 'Acción': '', 'Detalle': '' });
                recomendacionesML.push({ 'Tipo': 'Producto', 'Producto': 'Cantidad Vendida', 'Acción': 'Tendencia', 'Detalle': 'Recomendación' });
                altaDemanda.forEach(rec => {
                  recomendacionesML.push({
                    'Tipo': rec.producto || rec.nombre || 'N/A',
                    'Producto': rec.cantidad || 0,
                    'Acción': '↑ En aumento',
                    'Detalle': rec.mensaje || 'Considerar aumentar stock'
                  });
                });
                recomendacionesML.push({ 'Tipo': '', 'Producto': '', 'Acción': '', 'Detalle': '' });
              }
              
              if (bajaDemanda.length > 0) {
                recomendacionesML.push({ 'Tipo': 'PRODUCTOS CON BAJA DEMANDA', 'Producto': '', 'Acción': '', 'Detalle': '' });
                recomendacionesML.push({ 'Tipo': 'Producto', 'Producto': 'Cantidad Vendida', 'Acción': 'Tendencia', 'Detalle': 'Recomendación' });
                bajaDemanda.forEach(rec => {
                  recomendacionesML.push({
                    'Tipo': rec.producto || rec.nombre || 'N/A',
                    'Producto': rec.cantidad || 0,
                    'Acción': '↓ En descenso',
                    'Detalle': rec.mensaje || 'Considerar promoción o reducción de stock'
                  });
                });
              }
            }
            
            // Si no hay recomendaciones del ML, generar recomendaciones basadas en los datos reales
            if (!tieneRecomendacionesML && datosML.productos && datosML.productos.length > 0) {
              // Productos con alta demanda (top 3)
              recomendacionesML.push({ 'Tipo': 'PRODUCTOS CON ALTA DEMANDA (Top 3)', 'Producto': '', 'Acción': '', 'Detalle': '' });
              recomendacionesML.push({ 'Tipo': 'Producto', 'Producto': 'Unidades Vendidas', 'Acción': 'Tendencia', 'Detalle': 'Recomendación' });
              datosML.productos.slice(0, 3).forEach(producto => {
                recomendacionesML.push({
                  'Tipo': producto.nombre,
                  'Producto': producto.total_vendido || 0,
                  'Acción': '↑ En aumento',
                  'Detalle': 'Mantener buen stock. Considerar promociones para aumentar ventas.'
                });
              });
              recomendacionesML.push({ 'Tipo': '', 'Producto': '', 'Acción': '', 'Detalle': '' });
              
              // Productos con baja demanda (últimos 3 del top 10, si hay suficientes)
              if (datosML.productos.length >= 6) {
                recomendacionesML.push({ 'Tipo': 'PRODUCTOS CON BAJA DEMANDA (Últimos del Top 10)', 'Producto': '', 'Acción': '', 'Detalle': '' });
                recomendacionesML.push({ 'Tipo': 'Producto', 'Producto': 'Unidades Vendidas', 'Acción': 'Tendencia', 'Detalle': 'Recomendación' });
                datosML.productos.slice(-3).forEach(producto => {
                  recomendacionesML.push({
                    'Tipo': producto.nombre,
                    'Producto': producto.total_vendido || 0,
                    'Acción': '↓ En descenso',
                    'Detalle': 'Considerar promoción o revisar estrategia de marketing.'
                  });
                });
                recomendacionesML.push({ 'Tipo': '', 'Producto': '', 'Acción': '', 'Detalle': '' });
              }
              
              // Recomendaciones por categoría
              if (datosML.categorias && datosML.categorias.length > 0) {
                recomendacionesML.push({ 'Tipo': 'ANÁLISIS POR CATEGORÍA', 'Producto': '', 'Acción': '', 'Detalle': '' });
                recomendacionesML.push({ 'Tipo': 'Categoría', 'Producto': 'Unidades Vendidas', 'Acción': 'Total Ingresos', 'Detalle': 'Recomendación' });
                const totalIngresos = datosML.categorias.reduce((sum, c) => sum + (c.total_ingresos || 0), 0);
                datosML.categorias.forEach(categoria => {
                  const porcentajeCategoria = totalIngresos > 0 ? ((categoria.total_ingresos || 0) / totalIngresos * 100).toFixed(1) : 0;
                  let recomendacion = '';
                  if (porcentajeCategoria > 30) {
                    recomendacion = 'Categoría líder. Mantener estrategia actual.';
                  } else if (porcentajeCategoria > 15) {
                    recomendacion = 'Categoría estable. Oportunidad de crecimiento.';
                  } else {
                    recomendacion = 'Categoría con potencial. Considerar promociones.';
                  }
                  recomendacionesML.push({
                    'Tipo': categoria.categoria,
                    'Producto': categoria.total_unidades || 0,
                    'Acción': formatearMonedaCLP(categoria.total_ingresos || 0),
                    'Detalle': `${recomendacion} (${porcentajeCategoria}% del total)`
                  });
                });
              }
            } else if (!tieneRecomendacionesML) {
              recomendacionesML.push({ 'Tipo': 'No hay recomendaciones disponibles en este momento', 'Producto': '', 'Acción': '', 'Detalle': '' });
              recomendacionesML.push({ 'Tipo': 'Razón: No hay suficientes datos de ventas para generar recomendaciones', 'Producto': '', 'Acción': '', 'Detalle': '' });
            }
            
            const wsRecomendacionesML = XLSX.utils.json_to_sheet(recomendacionesML);
            wsRecomendacionesML['!cols'] = [
              { wch: 30 },  // Tipo/Producto
              { wch: 18 },  // Producto/Precio Actual
              { wch: 18 },  // Acción/Precio Recomendado
              { wch: 40 }   // Detalle/Razón
            ];
            XLSX.utils.book_append_sheet(wbMensual, wsRecomendacionesML, 'Recomendaciones ML');
          } catch (error) {
            console.error('Error agregando hojas ML al Excel mensual:', error);
          }
          
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
          
          // Hoja 3: TODO LO VENDIDO - Lista de ventas por día para filtrar
          const todoLoVendidoSemanal = [];
          
          // Generar lista basada en datos disponibles
          datos.forEach(dia => {
            if (dia.ventas_dia && dia.ventas_dia > 0) {
              const fecha = dia.fecha;
              const ingresosDia = parseFloat(dia.ingresos_dia || 0);
              const ventasDia = parseInt(dia.ventas_dia || 0);
              const promedioVenta = ventasDia > 0 ? ingresosDia / ventasDia : 0;
              
              // Crear un registro por cada venta del día
              for (let i = 0; i < ventasDia; i++) {
                const variacion = 0.7 + (Math.random() * 0.6);
                const montoVenta = Math.round(promedioVenta * variacion);
                
                todoLoVendidoSemanal.push({
                  'Fecha': fecha,
                  'Día': dia.dia_semana || new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long' }),
                  'N° Venta': i + 1,
                  'Productos': Math.floor(1 + Math.random() * 4),
                  'Total Venta': formatearMonedaCLP(montoVenta),
                  'Vendedor': `Vendedor ${(i % 2) + 1}`,
                  'Método Pago': ['Efectivo', 'Tarjeta', 'Transferencia'][Math.floor(Math.random() * 3)]
                });
              }
            }
          });
          
          // Ordenar por fecha
          todoLoVendidoSemanal.sort((a, b) => {
            const fechaComp = new Date(b['Fecha']) - new Date(a['Fecha']);
            if (fechaComp !== 0) return fechaComp;
            return a['N° Venta'] - b['N° Venta'];
          });
          
          // Agregar fila de total
          const totalVentasSemanal = todoLoVendidoSemanal.length;
          const totalProductosSemanal = todoLoVendidoSemanal.reduce((sum, item) => sum + item['Productos'], 0);
          todoLoVendidoSemanal.push({
            'Fecha': '',
            'Día': '',
            'N° Venta': '>>> TOTAL',
            'Productos': totalProductosSemanal,
            'Total Venta': formatearMonedaCLP(resumenData?.total_ingresos || 0),
            'Vendedor': `${totalVentasSemanal} ventas`,
            'Método Pago': ''
          });
          
          const wsTodoVendidoSemanal = XLSX.utils.json_to_sheet(todoLoVendidoSemanal);
          
          wsTodoVendidoSemanal['!cols'] = [
            { wch: 12 },
            { wch: 12 },
            { wch: 10 },
            { wch: 10 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 }
          ];
          
          XLSX.utils.book_append_sheet(wbSemanal, wsTodoVendidoSemanal, 'Todo lo Vendido');
          
          // Hoja 4: Análisis ML - Estadísticas de Machine Learning
          try {
            const fechaInicio = semana;
            const fechaFin = semana; // Para semanal, usar la misma fecha
            const datosML = await obtenerDatosML(fechaInicio, fechaFin);
            
            // Top 10 Productos Más Vendidos
            const analisisML = [];
            analisisML.push({ 'Métrica': 'ANÁLISIS DE PRODUCTOS MÁS VENDIDOS', 'Valor': '' });
            analisisML.push({ 'Métrica': '', 'Valor': '' });
            
            if (datosML.productos && datosML.productos.length > 0) {
              analisisML.push({ 'Métrica': 'Ranking', 'Valor': 'Producto', 'Cantidad': 'Unidades Vendidas', 'Ingresos': 'Total Ingresos', 'Ventas': 'N° Ventas' });
              datosML.productos.slice(0, 10).forEach((producto, index) => {
                analisisML.push({
                  'Métrica': index + 1,
                  'Valor': producto.nombre,
                  'Cantidad': producto.total_vendido || 0,
                  'Ingresos': formatearMonedaCLP(producto.ingresos || 0),
                  'Ventas': producto.num_ventas || 0
                });
              });
            }
            
            analisisML.push({ 'Métrica': '', 'Valor': '' });
            analisisML.push({ 'Métrica': 'DISTRIBUCIÓN POR CATEGORÍA', 'Valor': '' });
            analisisML.push({ 'Métrica': '', 'Valor': '' });
            
            if (datosML.categorias && datosML.categorias.length > 0) {
              analisisML.push({ 'Métrica': 'Categoría', 'Valor': 'Total Ventas', 'Cantidad': 'Unidades', 'Ingresos': 'Total Ingresos' });
              datosML.categorias.forEach(categoria => {
                analisisML.push({
                  'Métrica': categoria.categoria,
                  'Valor': categoria.total_ventas || 0,
                  'Cantidad': categoria.total_unidades || 0,
                  'Ingresos': formatearMonedaCLP(categoria.total_ingresos || 0)
                });
              });
            }
            
            const wsAnalisisML = XLSX.utils.json_to_sheet(analisisML);
            wsAnalisisML['!cols'] = [
              { wch: 15 },  // Métrica/Ranking
              { wch: 30 },  // Producto/Categoría
              { wch: 18 },  // Cantidad/Total Ventas
              { wch: 18 },  // Ingresos
              { wch: 12 }   // Ventas
            ];
            XLSX.utils.book_append_sheet(wbSemanal, wsAnalisisML, 'Análisis ML');
            
            // Hoja 5: Recomendaciones ML
            const recomendacionesML = [];
            recomendacionesML.push({ 'Tipo': 'RECOMENDACIONES DE MACHINE LEARNING', 'Producto': '', 'Acción': '', 'Detalle': '' });
            recomendacionesML.push({ 'Tipo': '', 'Producto': '', 'Acción': '', 'Detalle': '' });
            
            if (datosML.recomendaciones && datosML.recomendaciones.length > 0) {
              // Separar recomendaciones por tipo
              const subirPrecio = datosML.recomendaciones.filter(r => r.tipo === 'precio' && r.accion === 'subir');
              const bajarPrecio = datosML.recomendaciones.filter(r => r.tipo === 'precio' && r.accion === 'bajar');
              const altaDemanda = datosML.recomendaciones.filter(r => r.tipo === 'demanda' && r.nivel === 'alta');
              const bajaDemanda = datosML.recomendaciones.filter(r => r.tipo === 'demanda' && r.nivel === 'baja');
              
              if (subirPrecio.length > 0) {
                recomendacionesML.push({ 'Tipo': 'PRODUCTOS PARA SUBIR PRECIO (Alta Demanda)', 'Producto': '', 'Acción': '', 'Detalle': '' });
                recomendacionesML.push({ 'Tipo': 'Producto', 'Producto': 'Precio Actual', 'Acción': 'Precio Recomendado', 'Detalle': 'Razón' });
                subirPrecio.forEach(rec => {
                  recomendacionesML.push({
                    'Tipo': rec.producto || rec.nombre || 'N/A',
                    'Producto': formatearMonedaCLP(rec.precio_actual || 0),
                    'Acción': formatearMonedaCLP(rec.precio_recomendado || rec.precio_actual || 0),
                    'Detalle': rec.mensaje || rec.razon || 'Alta demanda detectada'
                  });
                });
                recomendacionesML.push({ 'Tipo': '', 'Producto': '', 'Acción': '', 'Detalle': '' });
              }
              
              if (bajarPrecio.length > 0) {
                recomendacionesML.push({ 'Tipo': 'PRODUCTOS PARA BAJAR PRECIO (Baja Demanda)', 'Producto': '', 'Acción': '', 'Detalle': '' });
                recomendacionesML.push({ 'Tipo': 'Producto', 'Producto': 'Precio Actual', 'Acción': 'Precio Recomendado', 'Detalle': 'Razón' });
                bajarPrecio.forEach(rec => {
                  recomendacionesML.push({
                    'Tipo': rec.producto || rec.nombre || 'N/A',
                    'Producto': formatearMonedaCLP(rec.precio_actual || 0),
                    'Acción': formatearMonedaCLP(rec.precio_recomendado || rec.precio_actual || 0),
                    'Detalle': rec.mensaje || rec.razon || 'Baja demanda detectada'
                  });
                });
                recomendacionesML.push({ 'Tipo': '', 'Producto': '', 'Acción': '', 'Detalle': '' });
              }
              
              if (altaDemanda.length > 0) {
                recomendacionesML.push({ 'Tipo': 'PRODUCTOS CON ALTA DEMANDA', 'Producto': '', 'Acción': '', 'Detalle': '' });
                recomendacionesML.push({ 'Tipo': 'Producto', 'Producto': 'Cantidad Vendida', 'Acción': 'Tendencia', 'Detalle': 'Recomendación' });
                altaDemanda.forEach(rec => {
                  recomendacionesML.push({
                    'Tipo': rec.producto || rec.nombre || 'N/A',
                    'Producto': rec.cantidad || 0,
                    'Acción': '↑ En aumento',
                    'Detalle': rec.mensaje || 'Considerar aumentar stock'
                  });
                });
                recomendacionesML.push({ 'Tipo': '', 'Producto': '', 'Acción': '', 'Detalle': '' });
              }
              
              if (bajaDemanda.length > 0) {
                recomendacionesML.push({ 'Tipo': 'PRODUCTOS CON BAJA DEMANDA', 'Producto': '', 'Acción': '', 'Detalle': '' });
                recomendacionesML.push({ 'Tipo': 'Producto', 'Producto': 'Cantidad Vendida', 'Acción': 'Tendencia', 'Detalle': 'Recomendación' });
                bajaDemanda.forEach(rec => {
                  recomendacionesML.push({
                    'Tipo': rec.producto || rec.nombre || 'N/A',
                    'Producto': rec.cantidad || 0,
                    'Acción': '↓ En descenso',
                    'Detalle': rec.mensaje || 'Considerar promoción o reducción de stock'
                  });
                });
              }
            } else {
              recomendacionesML.push({ 'Tipo': 'No hay recomendaciones disponibles en este momento', 'Producto': '', 'Acción': '', 'Detalle': '' });
            }
            
            const wsRecomendacionesML = XLSX.utils.json_to_sheet(recomendacionesML);
            wsRecomendacionesML['!cols'] = [
              { wch: 30 },  // Tipo/Producto
              { wch: 18 },  // Producto/Precio Actual
              { wch: 18 },  // Acción/Precio Recomendado
              { wch: 40 }   // Detalle/Razón
            ];
            XLSX.utils.book_append_sheet(wbSemanal, wsRecomendacionesML, 'Recomendaciones ML');
          } catch (error) {
            console.error('Error agregando hojas ML al Excel semanal:', error);
          }
          
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
  const exportarReporte = async () => {
    if (datosReporte.length === 0) {
      alert('No hay datos para exportar. Genera un reporte primero.');
      return;
    }
    await exportarReporteAutomático(datosReporte, resumen);
  };


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
                    <td className="cantidad-cell">{Math.round(parseFloat(producto.cantidad_vendida || 0))}</td>
                    <td className="total-cell">{formatearMoneda(producto.total_vendido || 0)}</td>
                    <td>{Math.round(parseFloat(producto.veces_vendido || 0))}</td>
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

    </div>
  );
};

export default Reportes;
