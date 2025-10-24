import React, { useState } from 'react';
import { ventas, usuarios, productos } from '../data/mockData';
import '../styles/Reportes.css';

/**
 * Componente Reportes - Sistema de reportes y análisis
 * Permite generar reportes de ventas, productos y usuarios
 */
const Reportes = () => {
  // Estado para los filtros de reportes
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    vendedor: '',
    producto: ''
  });

  // Estado para el tipo de reporte seleccionado
  const [tipoReporte, setTipoReporte] = useState('ventas');

  // Estado para los datos del reporte
  const [datosReporte, setDatosReporte] = useState([]);

  // Estado para indicar si está generando el reporte
  const [generando, setGenerando] = useState(false);

  /**
   * Función para manejar cambios en los filtros
   * Actualiza el estado con los valores seleccionados
   */
  const manejarCambioFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  /**
   * Función para generar el reporte según el tipo seleccionado
   * Simula la generación de datos del reporte
   */
  const generarReporte = async () => {
    setGenerando(true);
    
    // Simula delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    let datos = [];

    switch (tipoReporte) {
      case 'ventas':
        datos = generarReporteVentas();
        break;
      case 'productos':
        datos = generarReporteProductos();
        break;
      case 'vendedores':
        datos = generarReporteVendedores();
        break;
      default:
        datos = [];
    }

    setDatosReporte(datos);
    setGenerando(false);
  };

  /**
   * Función para generar reporte de ventas
   * Filtra y procesa los datos de ventas
   */
  const generarReporteVentas = () => {
    let ventasFiltradas = [...ventas];

    // Aplicar filtros
    if (filtros.fechaInicio) {
      ventasFiltradas = ventasFiltradas.filter(v => v.fecha >= filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      ventasFiltradas = ventasFiltradas.filter(v => v.fecha <= filtros.fechaFin);
    }
    if (filtros.vendedor) {
      ventasFiltradas = ventasFiltradas.filter(v => v.vendedor === filtros.vendedor);
    }

    return ventasFiltradas;
  };

  /**
   * Función para generar reporte de productos
   * Analiza las ventas por producto
   */
  const generarReporteProductos = () => {
    const ventasFiltradas = generarReporteVentas();
    const productosVendidos = {};

    // Agrupar ventas por producto
    ventasFiltradas.forEach(venta => {
      venta.productos.forEach(producto => {
        if (productosVendidos[producto.nombre]) {
          productosVendidos[producto.nombre].cantidad += producto.cantidad;
          productosVendidos[producto.nombre].total += producto.precio * producto.cantidad;
        } else {
          productosVendidos[producto.nombre] = {
            nombre: producto.nombre,
            cantidad: producto.cantidad,
            total: producto.precio * producto.cantidad
          };
        }
      });
    });

    return Object.values(productosVendidos);
  };

  /**
   * Función para generar reporte de vendedores
   * Analiza las ventas por vendedor
   */
  const generarReporteVendedores = () => {
    const ventasFiltradas = generarReporteVentas();
    const vendedores = {};

    // Agrupar ventas por vendedor
    ventasFiltradas.forEach(venta => {
      if (vendedores[venta.vendedor]) {
        vendedores[venta.vendedor].ventas += 1;
        vendedores[venta.vendedor].total += venta.total;
      } else {
        vendedores[venta.vendedor] = {
          vendedor: venta.vendedor,
          ventas: 1,
          total: venta.total
        };
      }
    });

    return Object.values(vendedores);
  };

  /**
   * Función para exportar el reporte (simulada)
   * En una aplicación real, aquí se generaría el archivo
   */
  const exportarReporte = () => {
    if (datosReporte.length === 0) {
      alert('No hay datos para exportar. Genera un reporte primero.');
      return;
    }

    // Simula la exportación
    alert(`Reporte de ${tipoReporte} exportado correctamente.\nTotal de registros: ${datosReporte.length}`);
  };

  /**
   * Función para formatear números como moneda
   */
  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(cantidad);
  };

  /**
   * Función para calcular el total del reporte
   */
  const calcularTotal = () => {
    if (tipoReporte === 'ventas') {
      return datosReporte.reduce((total, venta) => total + venta.total, 0);
    } else if (tipoReporte === 'productos') {
      return datosReporte.reduce((total, producto) => total + producto.total, 0);
    } else if (tipoReporte === 'vendedores') {
      return datosReporte.reduce((total, vendedor) => total + vendedor.total, 0);
    }
    return 0;
  };

  return (
    <div className="reportes-container">
      {/* Header de la página */}
      <div className="page-header">
        <h1 className="page-title">📊 Reportes y Análisis</h1>
        <p className="page-subtitle">Genera reportes detallados del negocio</p>
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
            </select>
          </div>

          {/* Filtro de fechas */}
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

          {/* Filtro de vendedor */}
          <div className="filtro-group">
            <label htmlFor="vendedor">Vendedor</label>
            <select
              id="vendedor"
              name="vendedor"
              value={filtros.vendedor}
              onChange={manejarCambioFiltro}
              className="form-control"
            >
              <option value="">Todos los vendedores</option>
              {usuarios.filter(u => u.rol === 'vendedor').map(usuario => (
                <option key={usuario.id} value={usuario.nombre}>
                  {usuario.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

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
            📥 Exportar
          </button>
        </div>
      </div>

      {/* Resultados del reporte */}
      {datosReporte.length > 0 && (
        <div className="resultados-panel">
          <div className="resultados-header">
            <h3>📋 Resultados del Reporte</h3>
            <div className="resultados-stats">
              <span className="stat-item">
                <strong>Registros:</strong> {datosReporte.length}
              </span>
              <span className="stat-item">
                <strong>Total:</strong> {formatearMoneda(calcularTotal())}
              </span>
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
                      <th>Productos</th>
                      <th>Total</th>
                      <th>Método Pago</th>
                    </>
                  )}
                  {tipoReporte === 'productos' && (
                    <>
                      <th>Producto</th>
                      <th>Cantidad Vendida</th>
                      <th>Total Vendido</th>
                    </>
                  )}
                  {tipoReporte === 'vendedores' && (
                    <>
                      <th>Vendedor</th>
                      <th>Número de Ventas</th>
                      <th>Total Vendido</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {tipoReporte === 'ventas' && datosReporte.map((venta, index) => (
                  <tr key={venta.id || index}>
                    <td>{venta.id}</td>
                    <td>{venta.fecha}</td>
                    <td>{venta.vendedor}</td>
                    <td>{venta.cliente}</td>
                    <td>
                      <ul className="productos-lista">
                        {venta.productos.map((producto, idx) => (
                          <li key={idx}>
                            {producto.cantidad}x {producto.nombre}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="total-cell">{formatearMoneda(venta.total)}</td>
                    <td>{venta.metodoPago}</td>
                  </tr>
                ))}

                {tipoReporte === 'productos' && datosReporte.map((producto, index) => (
                  <tr key={index}>
                    <td className="producto-cell">{producto.nombre}</td>
                    <td className="cantidad-cell">{producto.cantidad}</td>
                    <td className="total-cell">{formatearMoneda(producto.total)}</td>
                  </tr>
                ))}

                {tipoReporte === 'vendedores' && datosReporte.map((vendedor, index) => (
                  <tr key={index}>
                    <td className="vendedor-cell">{vendedor.vendedor}</td>
                    <td className="ventas-cell">{vendedor.ventas}</td>
                    <td className="total-cell">{formatearMoneda(vendedor.total)}</td>
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
