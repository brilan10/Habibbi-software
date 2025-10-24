import React, { useState, useEffect } from 'react';
import { getDashboardData } from '../data/stateManager';
import '../styles/Dashboard.css';

/**
 * Componente Dashboard - Panel principal para administradores
 * Muestra estadísticas clave del negocio y alertas importantes
 */
const Dashboard = () => {
  // Estado para almacenar los datos del dashboard
  const [datos, setDatos] = useState({
    ventasHoy: 0,
    productoMasVendido: '',
    insumosBajos: [],
    totalVentas: 0,
    clientesNuevos: 0
  });
  
  // Estado para simular la carga de datos
  const [cargando, setCargando] = useState(true);
  const [actualizacionesAutomaticas, setActualizacionesAutomaticas] = useState(true);

  /**
   * Efecto para simular la carga de datos del dashboard
   * En una aplicación real, aquí harías una petición a la API
   */
  useEffect(() => {
    // Simula el tiempo de carga de datos
    const cargarDatos = async () => {
      setCargando(true);
      
      // Simula delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Carga datos del state manager
      setDatos(getDashboardData());
      setCargando(false);
    };

    cargarDatos();

    // Escuchar cambios en localStorage para actualizar dashboard
    const manejarCambioStorage = () => {
      console.log('🔄 Dashboard - Detectando cambio en datos');
      setDatos(getDashboardData());
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
  }, []); // Array vacío significa que solo se ejecuta una vez

  /**
   * Función para formatear números como moneda
   * Convierte números a formato de moneda chilena
   */
  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(cantidad);
  };

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

  return (
    <div className="dashboard-container">
      {/* Header del dashboard */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">📊 Dashboard Administrativo</h1>
        <p className="dashboard-subtitle">
          Resumen general del negocio - {new Date().toLocaleDateString('es-MX')}
        </p>
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
        <h2 className="section-title">⚠️ Alertas de Inventario</h2>
        
        {datos.insumosBajos.length > 0 ? (
          <div className="alerts-grid">
            {/* Mapea cada insumo con stock bajo */}
            {datos.insumosBajos.map((insumo, index) => (
              <div 
                key={index} 
                className={`alert-card ${obtenerColorAlerta(insumo.cantidad, insumo.stockMinimo)}`}
              >
                <div className="alert-icon">
                  {obtenerColorAlerta(insumo.cantidad, insumo.stockMinimo) === 'critico' ? '🔴' : '🟡'}
                </div>
                <div className="alert-content">
                  <h4 className="alert-title">{insumo.nombre}</h4>
                  <p className="alert-description">
                    Stock actual: <strong>{insumo.cantidad}</strong> | 
                    Mínimo: <strong>{insumo.stockMinimo}</strong>
                  </p>
                  <div className="alert-progress">
                    <div 
                      className="progress-bar"
                      style={{
                        width: `${Math.min((insumo.cantidad / insumo.stockMinimo) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-alerts">
            <div className="no-alerts-icon">✅</div>
            <p>¡Excelente! Todos los insumos tienen stock suficiente.</p>
          </div>
        )}
      </div>

      {/* Sección de acciones rápidas */}
      <div className="quick-actions">
        <h2 className="section-title">⚡ Acciones Rápidas</h2>
        <div className="actions-grid">
          <button className="action-btn">
            <span className="action-icon">📦</span>
            <span className="action-text">Agregar Insumo</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">☕</span>
            <span className="action-text">Nuevo Producto</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">👤</span>
            <span className="action-text">Nuevo Usuario</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">📊</span>
            <span className="action-text">Ver Reportes</span>
          </button>
          <button 
            className={`action-btn ${actualizacionesAutomaticas ? 'active' : ''}`}
            onClick={() => {
              setActualizacionesAutomaticas(!actualizacionesAutomaticas);
              console.log(`🔄 Actualizaciones automáticas: ${!actualizacionesAutomaticas ? 'ACTIVADAS' : 'DESACTIVADAS'}`);
            }}
          >
            <span className="action-icon">{actualizacionesAutomaticas ? '🔄' : '⏸️'}</span>
            <span className="action-text">
              {actualizacionesAutomaticas ? 'Auto-actualizar ON' : 'Auto-actualizar OFF'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
