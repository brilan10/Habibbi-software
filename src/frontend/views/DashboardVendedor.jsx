import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
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

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      
      // Simular carga de datos (en una app real vendría del servidor)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos simulados para el vendedor
      setDatos({
        ventasHoy: 12500, // $12.500 CLP
        totalVentas: 8,
        productoMasVendido: 'Café Americano',
        clientesAtendidos: 5,
        ventasRecientes: [
          {
            id: 1,
            cliente: 'Juan Pérez',
            total: 6800,
            productos: 2,
            hora: '14:30'
          },
          {
            id: 2,
            cliente: 'María González',
            total: 2500,
            productos: 1,
            hora: '13:45'
          },
          {
            id: 3,
            cliente: 'Carlos López',
            total: 5300,
            productos: 3,
            hora: '12:20'
          }
        ],
        ventasPorHora: [
          { hora: '08:00', ventas: 0 },
          { hora: '09:00', ventas: 2500 },
          { hora: '10:00', ventas: 1800 },
          { hora: '11:00', ventas: 3200 },
          { hora: '12:00', ventas: 1500 },
          { hora: '13:00', ventas: 0 },
          { hora: '14:00', ventas: 3000 }
        ],
        productosVendidos: [
          { nombre: 'Café Americano', cantidad: 15, color: '#8C6A4F' },
          { nombre: 'Cappuccino', cantidad: 8, color: '#D9A261' },
          { nombre: 'Croissant', cantidad: 12, color: '#A67C52' },
          { nombre: 'Latte', cantidad: 5, color: '#6B4423' }
        ]
      });
      
      setCargando(false);
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
  const configGraficoVentas = {
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
  };

  // Configuración del gráfico de dona (productos vendidos)
  const configGraficoProductos = {
    labels: datos.productosVendidos.map(item => item.nombre),
    datasets: [
      {
        data: datos.productosVendidos.map(item => item.cantidad),
        backgroundColor: datos.productosVendidos.map(item => item.color),
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  // Opciones para los gráficos
  const opcionesGrafico = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Ventas por Hora'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatearMoneda(value);
          }
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
          {datos.ventasRecientes.map((venta) => (
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
          ))}
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
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, (datos.ventasHoy / 20000) * 100)}%` }}
              ></div>
            </div>
            <p>{formatearMoneda(datos.ventasHoy)} / {formatearMoneda(20000)}</p>
          </div>
          
          <div className="objetivo-card">
            <h4>Clientes Atendidos</h4>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, (datos.clientesAtendidos / 10) * 100)}%` }}
              ></div>
            </div>
            <p>{datos.clientesAtendidos} / 10 clientes</p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="acciones-rapidas">
        <h2 className="section-title">⚡ Acciones Rápidas</h2>
        <div className="acciones-grid">
          <button className="accion-btn">
            🛒 Nueva Venta
          </button>
          <button className="accion-btn">
            👥 Ver Clientes
          </button>
          <button className="accion-btn">
            📊 Ver Reportes
          </button>
          <button className="accion-btn">
            ⚙️ Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardVendedor;
