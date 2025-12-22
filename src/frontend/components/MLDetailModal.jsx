import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import '../styles/MLDetailModal.css';

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
 * Modal para mostrar gráficos detallados de Machine Learning
 */
const MLDetailModal = ({ tipo, datos, isOpen, onClose }) => {
  if (!isOpen) return null;

  // Función para formatear moneda
  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(cantidad);
  };

  // Configurar gráficos según el tipo
  const renderGraficos = () => {
    switch (tipo) {
      case 'alertas-stock':
        return renderGraficosAlertasStock();
      case 'tendencias':
        return renderGraficosTendencias();
      case 'temporada':
        return renderGraficosTemporada();
      case 'alertas-insumos':
        return renderGraficosAlertasInsumos();
      default:
        return <p>No hay gráficos disponibles para este tipo.</p>;
    }
  };

  // Gráficos para Alertas Predictivas de Stock
  const renderGraficosAlertasStock = () => {
    if (!datos || datos.length === 0) {
      return <p className="no-data">No hay alertas de stock disponibles.</p>;
    }

    // Gráfico 1: Stock actual vs Stock recomendado
    const labels = datos.map(item => item.nombre);
    const stockActual = datos.map(item => item.stock_actual);
    const stockRecomendado = datos.map(item => Math.round(item.cantidad_recomendada));

    const datosGraficoStock = {
      labels: labels,
      datasets: [
        {
          label: 'Stock Actual',
          data: stockActual,
          backgroundColor: 'rgba(220, 53, 69, 0.6)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 2
        },
        {
          label: 'Stock Recomendado',
          data: stockRecomendado,
          backgroundColor: 'rgba(40, 167, 69, 0.6)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 2
        }
      ]
    };

    // Gráfico 2: Días hasta agotar
    const diasAgotar = datos.map(item => item.dias_hasta_agotar);
    const coloresPorNivel = datos.map(item => {
      if (item.nivel_alerta === 'critico') return 'rgba(220, 53, 69, 0.8)';
      if (item.nivel_alerta === 'advertencia') return 'rgba(255, 193, 7, 0.8)';
      return 'rgba(255, 152, 0, 0.8)';
    });

    const datosGraficoDias = {
      labels: labels,
      datasets: [
        {
          label: 'Días hasta agotar',
          data: diasAgotar,
          backgroundColor: coloresPorNivel,
          borderColor: coloresPorNivel.map(c => c.replace('0.8', '1')),
          borderWidth: 2,
          borderRadius: 4
        }
      ]
    };

    const opcionesGrafico = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Comparación de Stock',
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    return (
      <div className="ml-graficos-container">
        <div className="ml-grafico-wrapper">
          <h4>Comparación: Stock Actual vs Recomendado</h4>
          <div className="chart-container">
            <Bar data={datosGraficoStock} options={opcionesGrafico} />
          </div>
        </div>

        <div className="ml-grafico-wrapper">
          <h4>Días hasta Agotar por Producto</h4>
          <div className="chart-container">
            <Bar data={datosGraficoDias} options={{
              ...opcionesGrafico,
              plugins: {
                ...opcionesGrafico.plugins,
                title: {
                  display: true,
                  text: 'Urgencia de Reabastecimiento',
                  font: { size: 16, weight: 'bold' }
                }
              }
            }} />
          </div>
        </div>

        <div className="ml-detalles-tabla">
          <h4>Detalles Completos</h4>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock Actual</th>
                <th>Stock Recomendado</th>
                <th>Días hasta Agotar</th>
                <th>Fecha Estimada</th>
                <th>Nivel</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((item, index) => (
                <tr key={index}>
                  <td><strong>{item.nombre}</strong></td>
                  <td>{item.stock_actual}</td>
                  <td>{Math.round(item.cantidad_recomendada)}</td>
                  <td>{item.dias_hasta_agotar}</td>
                  <td>{item.fecha_agotamiento_estimada ? new Date(item.fecha_agotamiento_estimada).toLocaleDateString('es-CL') : 'N/A'}</td>
                  <td>
                    <span className={`nivel-badge ${item.nivel_alerta}`}>
                      {item.nivel_alerta === 'critico' ? '🔴 Crítico' : 
                       item.nivel_alerta === 'advertencia' ? '🟡 Advertencia' : '🟠 Precaución'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Gráficos para Análisis de Tendencias
  const renderGraficosTendencias = () => {
    if (!datos || !datos.ventas) {
      return <p className="no-data">No hay datos de tendencias disponibles.</p>;
    }

    const ventas = datos.ventas || [];
    const fechas = ventas.map(v => new Date(v.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }));
    const montos = ventas.map(v => parseFloat(v.total_monto || 0));

    const datosGraficoLinea = {
      labels: fechas,
      datasets: [
        {
          label: 'Ventas Diarias (CLP)',
          data: montos,
          borderColor: datos.tendencia === 'creciente' ? 'rgba(40, 167, 69, 1)' :
                     datos.tendencia === 'decreciente' ? 'rgba(220, 53, 69, 1)' :
                     'rgba(23, 162, 184, 1)',
          backgroundColor: datos.tendencia === 'creciente' ? 'rgba(40, 167, 69, 0.1)' :
                          datos.tendencia === 'decreciente' ? 'rgba(220, 53, 69, 0.1)' :
                          'rgba(23, 162, 184, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };

    const opcionesLinea = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        title: {
          display: true,
          text: `Tendencia de Ventas - Últimos ${datos.periodo_dias} días`,
          font: { size: 16, weight: 'bold' }
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
              return formatearMoneda(value);
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    };

    return (
      <div className="ml-graficos-container">
        <div className="ml-grafico-wrapper full-width">
          <h4>Evolución de Ventas</h4>
          <div className="chart-container">
            <Line data={datosGraficoLinea} options={opcionesLinea} />
          </div>
        </div>

        <div className="ml-estadisticas-grid">
          <div className="ml-stat-card">
            <h5>Promedio Primera Mitad</h5>
            <p className="stat-value">{formatearMoneda(datos.promedio_primera_mitad || 0)}</p>
          </div>
          <div className="ml-stat-card">
            <h5>Promedio Segunda Mitad</h5>
            <p className="stat-value">{formatearMoneda(datos.promedio_segunda_mitad || 0)}</p>
          </div>
          <div className="ml-stat-card">
            <h5>Factor de Cambio</h5>
            <p className="stat-value">{datos.factor_cambio?.toFixed(2) || 'N/A'}</p>
          </div>
          <div className="ml-stat-card">
            <h5>Cambio Porcentual</h5>
            <p className={`stat-value ${datos.porcentaje_cambio > 0 ? 'positive' : datos.porcentaje_cambio < 0 ? 'negative' : 'neutral'}`}>
              {datos.porcentaje_cambio > 0 ? '+' : ''}{datos.porcentaje_cambio?.toFixed(2) || 0}%
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Gráficos para Predicción por Temporada
  const renderGraficosTemporada = () => {
    if (!datos || !datos.todos_los_productos || datos.todos_los_productos.length === 0) {
      return <p className="no-data">No hay datos de temporada disponibles.</p>;
    }

    const productos = datos.todos_los_productos || [];
    const top10 = productos.slice(0, 10);

    // Gráfico de barras: Ventas esperadas por producto
    const labels = top10.map(p => p.nombre);
    const ventasEsperadas = top10.map(p => p.ventas_esperadas || 0);
    const coloresPopularidad = top10.map(p => {
      if (p.popularidad === 'muy_alta') return 'rgba(220, 53, 69, 0.8)';
      if (p.popularidad === 'alta') return 'rgba(255, 193, 7, 0.8)';
      if (p.popularidad === 'baja') return 'rgba(108, 117, 125, 0.8)';
      return 'rgba(23, 162, 184, 0.8)';
    });

    const datosGraficoTemporada = {
      labels: labels,
      datasets: [
        {
          label: 'Ventas Esperadas',
          data: ventasEsperadas,
          backgroundColor: coloresPopularidad,
          borderColor: coloresPopularidad.map(c => c.replace('0.8', '1')),
          borderWidth: 2,
          borderRadius: 4
        }
      ]
    };

    // Gráfico de dona: Distribución por popularidad
    const popularidades = ['muy_alta', 'alta', 'normal', 'baja'];
    const conteoPopularidad = popularidades.map(pop => 
      productos.filter(p => p.popularidad === pop).length
    );

    const datosGraficoDona = {
      labels: ['Muy Alta', 'Alta', 'Normal', 'Baja'],
      datasets: [
        {
          data: conteoPopularidad,
          backgroundColor: [
            'rgba(220, 53, 69, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(23, 162, 184, 0.8)',
            'rgba(108, 117, 125, 0.8)'
          ],
          borderColor: [
            'rgba(220, 53, 69, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(23, 162, 184, 1)',
            'rgba(108, 117, 125, 1)'
          ],
          borderWidth: 2
        }
      ]
    };

    const opcionesBarra = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Top 10 Productos - Ventas Esperadas esta Temporada',
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    };

    return (
      <div className="ml-graficos-container">
        <div className="ml-grafico-wrapper">
          <h4>Ventas Esperadas por Producto</h4>
          <div className="chart-container">
            <Bar data={datosGraficoTemporada} options={opcionesBarra} />
          </div>
        </div>

        <div className="ml-grafico-wrapper">
          <h4>Distribución por Nivel de Popularidad</h4>
          <div className="chart-container">
            <Doughnut data={datosGraficoDona} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                },
                title: {
                  display: true,
                  text: 'Productos por Nivel de Demanda',
                  font: { size: 16, weight: 'bold' }
                }
              }
            }} />
          </div>
        </div>

        <div className="ml-detalles-tabla">
          <h4>Todos los Productos de la Temporada</h4>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Ventas Esperadas</th>
                <th>Popularidad</th>
                <th>Factor Estacional</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto, index) => (
                <tr key={index}>
                  <td><strong>{producto.nombre}</strong></td>
                  <td>{producto.categoria || 'N/A'}</td>
                  <td>{producto.ventas_esperadas?.toFixed(2) || 'N/A'}</td>
                  <td>
                    <span className={`popularidad-badge ${producto.popularidad}`}>
                      {producto.popularidad === 'muy_alta' ? '🔥 Muy Alta' :
                       producto.popularidad === 'alta' ? '⬆️ Alta' :
                       producto.popularidad === 'baja' ? '⬇️ Baja' : '➡️ Normal'}
                    </span>
                  </td>
                  <td>{producto.factor_estacional?.toFixed(2) || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Gráficos para Alertas de Insumos (similar a stock)
  const renderGraficosAlertasInsumos = () => {
    if (!datos || datos.length === 0) {
      return <p className="no-data">No hay alertas de insumos disponibles.</p>;
    }

    const labels = datos.map(item => item.nombre);
    const stockActual = datos.map(item => item.stock_actual);
    const stockRecomendado = datos.map(item => Math.round(item.cantidad_recomendada));

    const datosGraficoInsumos = {
      labels: labels,
      datasets: [
        {
          label: 'Stock Actual',
          data: stockActual,
          backgroundColor: 'rgba(220, 53, 69, 0.6)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 2
        },
        {
          label: 'Stock Recomendado',
          data: stockRecomendado,
          backgroundColor: 'rgba(40, 167, 69, 0.6)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 2
        }
      ]
    };

    return (
      <div className="ml-graficos-container">
        <div className="ml-grafico-wrapper full-width">
          <h4>Comparación: Stock Actual vs Recomendado de Insumos</h4>
          <div className="chart-container">
            <Bar data={datosGraficoInsumos} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Alertas de Insumos',
                  font: { size: 16, weight: 'bold' }
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }} />
          </div>
        </div>

        <div className="ml-detalles-tabla">
          <h4>Detalles Completos de Insumos</h4>
          <table>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Unidad</th>
                <th>Stock Actual</th>
                <th>Stock Recomendado</th>
                <th>Días hasta Agotar</th>
                <th>Nivel</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((item, index) => (
                <tr key={index}>
                  <td><strong>{item.nombre}</strong></td>
                  <td>{item.unidad}</td>
                  <td>{item.stock_actual}</td>
                  <td>{Math.round(item.cantidad_recomendada)}</td>
                  <td>{item.dias_hasta_agotar}</td>
                  <td>
                    <span className={`nivel-badge ${item.nivel_alerta}`}>
                      {item.nivel_alerta === 'critico' ? '🔴 Crítico' : 
                       item.nivel_alerta === 'advertencia' ? '🟡 Advertencia' : '🟠 Precaución'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Títulos según tipo
  const getTitle = () => {
    switch (tipo) {
      case 'alertas-stock':
        return '📊 Alertas Predictivas de Stock - Detalles';
      case 'tendencias':
        return '📈 Análisis de Tendencias - Detalles';
      case 'temporada':
        return '🌤️ Predicción por Temporada - Detalles';
      case 'alertas-insumos':
        return '📦 Alertas Predictivas de Insumos - Detalles';
      default:
        return 'Detalles de Machine Learning';
    }
  };

  return (
    <div className="ml-modal-overlay" onClick={onClose}>
      <div className="ml-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ml-modal-header">
          <h2>{getTitle()}</h2>
          <button className="ml-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ml-modal-body">
          {renderGraficos()}
        </div>
      </div>
    </div>
  );
};

export default MLDetailModal;

