import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import apiClient from '../config/axiosConfig';
import API_CONFIG from '../config/apiConfig';
import '../styles/Dashboard.css';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

/**
 * Componente DashboardVendedor - Dashboard específico para vendedores
 * Muestra estadísticas de ventas del vendedor actual
 */
const DashboardVendedor = () => {
  // Estado para los datos del dashboard
  const [datos, setDatos] = useState({
    ventasHoy: 0,
    totalVentas: 0,
    productoMasVendido: '',
    clientesAtendidos: 0,
    ventasRecientes: [],
    ventasPorHora: [],
    productosVendidos: []
  });
  
  const [cargando, setCargando] = useState(true);

  // Cargar datos al montar el componente desde la base de datos
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      console.log('🔄 DashboardVendedor - Cargando datos desde la BD...');
      
      try {
        // Obtener usuario actual
        const usuarioActual = JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || '{}');
        const id_usuario = usuarioActual.id_usuario || usuarioActual.id;
        
        if (!id_usuario) {
          console.error('❌ No se encontró id_usuario');
          setCargando(false);
          return;
        }
        
        // Obtener resumen del dashboard desde el backend
        const dashboardResponse = await apiClient.get(API_CONFIG.DASHBOARD.VENDEDOR);
        const resumenDashboard = dashboardResponse.data?.success ? dashboardResponse.data.data : null;

        // Cargar ventas recientes desde la BD (últimas 20 ventas ordenadas por fecha DESC)
        const ventasResponse = await apiClient.get(`${API_CONFIG.VENTAS.LIST}?limit=20`);
        const ventas = ventasResponse.data?.success ? ventasResponse.data.data : [];
        
        console.log('📊 Ventas recientes cargadas desde BD:', ventas.length);
        console.log('📊 Ventas:', ventas.map(v => ({ id: v.id_venta, cliente: v.cliente, productos: v.cantidad_productos, fecha: v.fecha })));
        
        // Procesar ventas recientes - tomar las últimas 5 ventas directamente de la BD
        const ventasRecientes = ventas.slice(0, 5).map(venta => {
          const fecha = new Date(venta.fecha);
          
          return {
            id: venta.id_venta,
            cliente: venta.cliente || 'Cliente General',
            total: parseFloat(venta.total) || 0,
            productos: parseInt(venta.cantidad_productos) || 0,
            hora: fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: true })
          };
        });
        
        // Calcular ventas de hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const ventasHoy = ventas.filter(v => {
          const fechaVenta = new Date(v.fecha);
          fechaVenta.setHours(0, 0, 0, 0);
          return fechaVenta.getTime() === hoy.getTime();
        });
        
        const ventasHoyTotalCalculado = ventasHoy.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
        
        // Calcular clientes atendidos: contar clientes únicos por nombre o id_cliente
        // Si hay ventas hoy, usar esas; si no, usar últimas ventas disponibles
        const ventasParaClientes = ventasHoy.length > 0 ? ventasHoy : ventas.slice(0, 50);
        const clientesUnicos = new Set();
        
        ventasParaClientes.forEach(v => {
          if (v.id_cliente && v.id_cliente !== null) {
            // Si tiene id_cliente, usar ese como identificador único
            clientesUnicos.add(`id_${v.id_cliente}`);
          } else if (v.cliente) {
            // Si no tiene id pero tiene nombre de cliente, usar el nombre
            clientesUnicos.add(`nombre_${v.cliente}`);
          } else {
            // Si no tiene cliente, contar como "Cliente General" (una sola vez)
            clientesUnicos.add('cliente_general');
          }
        });
        
        const clientesAtendidosHoy = clientesUnicos.size;
        
        console.log('👥 Clientes atendidos calculados:', {
          ventasHoy: ventasHoy.length,
          ventasParaClientes: ventasParaClientes.length,
          clientesUnicos: Array.from(clientesUnicos),
          totalClientes: clientesAtendidosHoy
        });
        
        // Ventas por hora - usar ventas de hoy si hay, sino usar últimas ventas disponibles
        const ventasParaGrafico = ventasHoy.length > 0 ? ventasHoy : ventas.slice(0, 50);
        const ventasPorHoraMap = {};
        
        ventasParaGrafico.forEach(v => {
          const fechaVenta = new Date(v.fecha);
          const hora = fechaVenta.getHours();
          const horaStr = `${String(hora).padStart(2, '0')}:00`;
          if (!ventasPorHoraMap[horaStr]) {
            ventasPorHoraMap[horaStr] = 0;
          }
          ventasPorHoraMap[horaStr] += parseFloat(v.total || 0);
        });
        
        const ventasPorHora = [];
        // Rango completo: 8 AM a 8 PM (13 horas)
        for (let i = 8; i <= 20; i++) {
          const horaStr = `${String(i).padStart(2, '0')}:00`;
          ventasPorHora.push({
            hora: horaStr,
            ventas: ventasPorHoraMap[horaStr] || 0
          });
        }
        
        console.log('📊 Ventas por hora:', ventasPorHora);
        
        // Productos vendidos (de las últimas ventas de hoy, o últimas ventas si no hay de hoy)
        const productosMap = {};
        const ventasParaProductos = ventasHoy.length > 0 ? ventasHoy.slice(0, 20) : ventas.slice(0, 20);
        
        for (const venta of ventasParaProductos) {
          try {
            // Cargar detalles de cada venta
            const detallesResponse = await apiClient.get(`${API_CONFIG.VENTAS.GET}/${venta.id_venta}`);
            if (detallesResponse.data?.success && detallesResponse.data.data?.detalles) {
              detallesResponse.data.data.detalles.forEach(detalle => {
                const nombre = detalle.producto_nombre || 'Producto';
                if (!productosMap[nombre]) {
                  productosMap[nombre] = 0;
                }
                productosMap[nombre] += parseFloat(detalle.cantidad || 0);
              });
            }
          } catch (error) {
            console.warn(`⚠️ No se pudieron cargar detalles de venta ${venta.id_venta}:`, error);
          }
        }
        
        const productosVendidos = Object.entries(productosMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8) // Top 8 productos
          .map(([nombre, cantidad], index) => ({
            nombre,
            cantidad,
            color: ['#8C6A4F', '#D9A261', '#A67C52', '#6B4423', '#C19A6B', '#AD8256', '#704214', '#5C3A21'][index] || '#8C6A4F'
          }));
        
        const productoMasVendido = productosVendidos[0]?.nombre || 'N/A';

        const montoVentasHoy = resumenDashboard
          ? parseFloat(resumenDashboard.total_ventas_hoy || 0)
          : ventasHoyTotalCalculado;
        const totalVentasHoy = resumenDashboard
          ? parseInt(resumenDashboard.ventas_hoy || 0)
          : ventasHoy.length;
        
        // Usar ventas recientes directamente de la BD (ya están ordenadas por fecha DESC)
        const ventasRecientesFinal = ventasRecientes;
        
        setDatos({
          ventasHoy: montoVentasHoy,
          totalVentas: totalVentasHoy,
          productoMasVendido: productoMasVendido,
          clientesAtendidos: clientesAtendidosHoy,
          ventasRecientes: ventasRecientesFinal,
          ventasPorHora: ventasPorHora,
          productosVendidos: productosVendidos.length > 0 ? productosVendidos : [
            { nombre: 'Café Americano', cantidad: 0, color: '#8C6A4F' },
            { nombre: 'Cappuccino', cantidad: 0, color: '#D9A261' },
            { nombre: 'Croissant', cantidad: 0, color: '#A67C52' },
            { nombre: 'Latte', cantidad: 0, color: '#6B4423' }
          ]
        });
        
        console.log('✅ DashboardVendedor - Datos cargados desde BD:', {
          ventasHoy: montoVentasHoy,
          totalVentas: totalVentasHoy,
          ventasRecientes: ventasRecientesFinal.length,
          productosVendidos: productosVendidos.length
        });
        
      } catch (error) {
        console.error('❌ Error al cargar datos del dashboard vendedor:', error);
        // Mantener datos por defecto en caso de error
        setDatos({
          ventasHoy: 0,
          totalVentas: 0,
          productoMasVendido: 'N/A',
          clientesAtendidos: 0,
          ventasRecientes: [],
          ventasPorHora: [],
          productosVendidos: []
        });
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();

    // Escuchar cambios en localStorage para actualizar dashboard
    const manejarCambioStorage = () => {
      console.log('🔄 DashboardVendedor - Detectando cambio en datos');
      // Recargar datos cada vez que hay cambios
      cargarDatos();
    };

    // Escuchar eventos personalizados de actualización
    window.addEventListener('dashboardActualizado', manejarCambioStorage);
    window.addEventListener('ventaRealizada', manejarCambioStorage);
    window.addEventListener('stockActualizado', manejarCambioStorage);

    return () => {
      window.removeEventListener('dashboardActualizado', manejarCambioStorage);
      window.removeEventListener('ventaRealizada', manejarCambioStorage);
      window.removeEventListener('stockActualizado', manejarCambioStorage);
    };
  }, []);

  // Función para formatear moneda en pesos chilenos
  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(cantidad);
  };

  // Función para obtener la fecha actual
  const obtenerFechaActual = () => {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Configuración del gráfico de barras (ventas por hora)
  const configGraficoVentas = datos.ventasPorHora.length > 0 ? {
    labels: datos.ventasPorHora.map(item => item.hora),
    datasets: [
      {
        label: 'Ventas (CLP)',
        data: datos.ventasPorHora.map(item => item.ventas),
        backgroundColor: '#8C6A4F',
        borderColor: '#6B4423',
        borderWidth: 2,
        borderRadius: 4
      }
    ]
  } : {
    labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
    datasets: [
      {
        label: 'Ventas (CLP)',
        data: Array(13).fill(0),
        backgroundColor: '#8C6A4F',
        borderColor: '#6B4423',
        borderWidth: 2,
        borderRadius: 4
      }
    ]
  };

  // Configuración del gráfico de dona (productos vendidos)
  const configGraficoProductos = datos.productosVendidos.length > 0 ? {
    labels: datos.productosVendidos.map(item => item.nombre),
    datasets: [
      {
        data: datos.productosVendidos.map(item => item.cantidad),
        backgroundColor: datos.productosVendidos.map(item => item.color),
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  } : {
    labels: ['Sin datos'],
    datasets: [
      {
        data: [1],
        backgroundColor: ['#E0E0E0'],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  // Opciones para los gráficos
  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Ventas por Hora'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return 'Ventas: ' + formatearMoneda(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (value >= 1000) {
              return '$' + (value / 1000).toFixed(1) + 'k';
            }
            return formatearMoneda(value);
          },
          stepSize: 1000
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      }
    }
  };

  const opcionesDona = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Productos Más Vendidos'
      }
    }
  };

  if (cargando) {
    return (
      <div className="dashboard-container">
        <div className="page-header">
          <h1 className="page-title">📊 Dashboard Vendedor</h1>
          <p className="page-subtitle">Cargando estadísticas...</p>
        </div>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '24px' }}>⏳</div>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header del dashboard */}
      <div className="page-header">
        <h1 className="page-title">📊 Dashboard Vendedor</h1>
        <p className="page-subtitle">Resumen de ventas - {obtenerFechaActual()}</p>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3 className="stat-value">{formatearMoneda(datos.ventasHoy)}</h3>
            <p className="stat-label">Ventas de Hoy</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <h3 className="stat-value">{datos.totalVentas}</h3>
            <p className="stat-label">Transacciones</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3 className="stat-value">{datos.productoMasVendido}</h3>
            <p className="stat-label">Producto Estrella</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3 className="stat-value">{datos.clientesAtendidos}</h3>
            <p className="stat-label">Clientes Atendidos</p>
          </div>
        </div>
      </div>

      {/* Sección de ventas recientes */}
      <div className="ventas-recientes">
        <h2 className="section-title">🕒 Ventas Recientes</h2>
        <div className="ventas-lista">
          {datos.ventasRecientes.length > 0 ? (
            datos.ventasRecientes.map((venta) => (
              <div key={venta.id} className="venta-item">
                <div className="venta-info">
                  <h4 className="venta-cliente">{venta.cliente}</h4>
                  <p className="venta-detalles">
                    {venta.productos} producto{venta.productos > 1 ? 's' : ''} • {venta.hora}
                  </p>
                </div>
                <div className="venta-total">
                  <span className="total-amount">{formatearMoneda(venta.total)}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
              No hay ventas recientes
            </p>
          )}
        </div>
      </div>

      {/* Sección de gráficos */}
      <div className="graficos-section">
        <h2 className="section-title">📊 Análisis de Ventas</h2>
        <div className="graficos-grid">
          <div className="grafico-card">
            <h3>Ventas por Hora</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <Bar data={configGraficoVentas} options={opcionesGrafico} />
            </div>
          </div>
          
          <div className="grafico-card">
            <h3>Productos Vendidos</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <Doughnut data={configGraficoProductos} options={opcionesDona} />
            </div>
          </div>
        </div>
      </div>

      {/* Sección de objetivos y metas */}
      <div className="objetivos-section">
        <h2 className="section-title">🎯 Objetivos del Día</h2>
        <div className="objetivos-grid">
          <div className="objetivo-card">
            <h4>Meta de Ventas</h4>
            <div className="objetivo-grafico-container">
              <Doughnut 
                data={{
                  labels: ['Completado', 'Pendiente'],
                  datasets: [{
                    data: [
                      Math.min(100, (datos.ventasHoy / 20000) * 100),
                      100 - Math.min(100, (datos.ventasHoy / 20000) * 100)
                    ],
                    backgroundColor: [
                      'rgba(40, 167, 69, 0.8)',  // Verde para completado
                      'rgba(220, 220, 220, 0.3)' // Gris claro para pendiente
                    ],
                    borderWidth: 0
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  cutout: '75%',
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      enabled: false
                    }
                  }
                }}
              />
              <div className="objetivo-centro">
                <div className="objetivo-porcentaje">
                  {Math.round((datos.ventasHoy / 20000) * 100)}%
                </div>
                <div className="objetivo-valor">
                  {formatearMoneda(datos.ventasHoy)}
                </div>
                <div className="objetivo-meta">
                  de {formatearMoneda(20000)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="objetivo-card">
            <h4>Clientes Atendidos</h4>
            <div className="objetivo-grafico-container">
              <Doughnut 
                data={{
                  labels: ['Atendidos', 'Pendientes'],
                  datasets: [{
                    data: [
                      Math.min(100, (datos.clientesAtendidos / 10) * 100),
                      100 - Math.min(100, (datos.clientesAtendidos / 10) * 100)
                    ],
                    backgroundColor: [
                      'rgba(52, 152, 219, 0.8)',  // Azul para atendidos
                      'rgba(220, 220, 220, 0.3)'  // Gris claro para pendientes
                    ],
                    borderWidth: 0
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  cutout: '75%',
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      enabled: false
                    }
                  }
                }}
              />
              <div className="objetivo-centro">
                <div className="objetivo-porcentaje">
                  {Math.round((datos.clientesAtendidos / 10) * 100)}%
                </div>
                <div className="objetivo-valor">
                  {datos.clientesAtendidos}
                </div>
                <div className="objetivo-meta">
                  de 10 clientes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="quick-actions">
        <h2 className="section-title">⚡ Acciones Rápidas</h2>
        <div className="actions-grid">
          <button 
            className="action-btn"
            onClick={() => {
              console.log('🔄 Navegando a: punto-venta');
              window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'punto-venta' } }));
            }}
            title="Ir a Punto de Venta"
          >
            <span className="action-icon">🛒</span>
            <span className="action-text">Nueva Venta</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => {
              console.log('🔄 Navegando a: clientes');
              window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'clientes' } }));
            }}
            title="Ver Clientes"
          >
            <span className="action-icon">👥</span>
            <span className="action-text">Ver Clientes</span>
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
            className="action-btn"
            onClick={() => {
              console.log('🔄 Navegando a: control-caja');
              window.dispatchEvent(new CustomEvent('cambiarVista', { detail: { vista: 'control-caja' } }));
            }}
            title="Control de Caja"
          >
            <span className="action-icon">💰</span>
            <span className="action-text">Control de Caja</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardVendedor;
