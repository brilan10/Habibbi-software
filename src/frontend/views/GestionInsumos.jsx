import React, { useState, useEffect } from 'react';
import { getInsumos, agregarInsumo, actualizarInsumo, eliminarInsumo } from '../data/stateManager';
import '../styles/GestionInsumos.css';

/**
 * Componente GestionInsumos - Administración de inventario de insumos
 * Permite gestionar el stock, proveedores y alertas de insumos
 */
const GestionInsumos = () => {
  // Estado para la lista de insumos
  const [listaInsumos, setListaInsumos] = useState([]);
  
  // Estado para el formulario de nuevo insumo
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estado para el insumo que se está editando
  const [insumoEditando, setInsumoEditando] = useState(null);

  // Cargar insumos al montar el componente
  useEffect(() => {
    setListaInsumos(getInsumos());
  }, []);
  
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad: '',
    unidad: '',
    stockMinimo: '',
    proveedor: ''
  });

  // Estado para el filtro de alertas
  const [filtroAlertas, setFiltroAlertas] = useState('todos'); // 'todos', 'bajos', 'criticos'

  /**
   * Función para manejar cambios en el formulario
   * Actualiza el estado con los valores ingresados
   */
  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  /**
   * Función para abrir el formulario de nuevo insumo
   * Resetea el formulario y lo muestra
   */
  const abrirFormularioNuevo = () => {
    setFormData({
      nombre: '',
      cantidad: '',
      unidad: '',
      stockMinimo: '',
      proveedor: ''
    });
    setInsumoEditando(null);
    setMostrarFormulario(true);
  };

  /**
   * Función para abrir el formulario de edición
   * Carga los datos del insumo seleccionado
   */
  const abrirFormularioEdicion = (insumo) => {
    setFormData({
      nombre: insumo.nombre,
      cantidad: insumo.cantidad.toString(),
      unidad: insumo.unidad,
      stockMinimo: insumo.stockMinimo.toString(),
      proveedor: insumo.proveedor
    });
    setInsumoEditando(insumo);
    setMostrarFormulario(true);
  };

  /**
   * Función para cerrar el formulario
   * Limpia el estado y oculta el formulario
   */
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setInsumoEditando(null);
    setFormData({
      nombre: '',
      cantidad: '',
      unidad: '',
      stockMinimo: '',
      proveedor: ''
    });
  };

  /**
   * Función para manejar el envío del formulario
   * Agrega un nuevo insumo o actualiza uno existente
   */
  const manejarEnvioFormulario = (e) => {
    e.preventDefault();
    
    // Valida que todos los campos estén llenos
    if (!formData.nombre || !formData.cantidad || !formData.unidad || !formData.stockMinimo || !formData.proveedor) {
      alert('Por favor, completa todos los campos');
      return;
    }

    const datosInsumo = {
      nombre: formData.nombre,
      cantidad: parseFloat(formData.cantidad),
      unidad: formData.unidad,
      stockMinimo: parseFloat(formData.stockMinimo),
      proveedor: formData.proveedor
    };

    if (insumoEditando) {
      // Actualizar insumo existente usando el state manager
      actualizarInsumo(insumoEditando.id, datosInsumo);
      alert('Insumo actualizado correctamente');
    } else {
      // Agregar nuevo insumo usando el state manager
      agregarInsumo(datosInsumo);
      alert('Insumo agregado correctamente');
    }

    // Actualizar la lista local
    setListaInsumos(getInsumos());
    cerrarFormulario();
  };

  /**
   * Función para eliminar un insumo
   * Pide confirmación antes de eliminar
   */
  const eliminarInsumoHandler = (insumoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este insumo?')) {
      eliminarInsumo(insumoId);
      setListaInsumos(getInsumos());
      alert('Insumo eliminado correctamente');
    }
  };

  /**
   * Función para actualizar la cantidad de un insumo
   * Simula una actualización de stock
   */
  const actualizarCantidad = (insumoId, nuevaCantidad) => {
    if (nuevaCantidad < 0) {
      alert('La cantidad no puede ser negativa');
      return;
    }

    setListaInsumos(listaInsumos.map(insumo =>
      insumo.id === insumoId
        ? { ...insumo, cantidad: parseFloat(nuevaCantidad) }
        : insumo
    ));
  };

  /**
   * Función para obtener el estado del stock
   * Retorna 'critico', 'bajo' o 'normal' según la cantidad
   */
  const obtenerEstadoStock = (cantidad, minimo) => {
    const porcentaje = (cantidad / minimo) * 100;
    
    if (porcentaje <= 50) return 'critico';
    if (porcentaje <= 80) return 'bajo';
    return 'normal';
  };

  /**
   * Función para filtrar insumos según el estado del stock
   */
  const insumosFiltrados = listaInsumos.filter(insumo => {
    const estado = obtenerEstadoStock(insumo.cantidad, insumo.stockMinimo);
    
    switch (filtroAlertas) {
      case 'bajos':
        return estado === 'bajo';
      case 'criticos':
        return estado === 'critico';
      default:
        return true;
    }
  });

  /**
   * Función para obtener estadísticas del inventario
   */
  const obtenerEstadisticas = () => {
    const total = listaInsumos.length;
    const bajos = listaInsumos.filter(i => obtenerEstadoStock(i.cantidad, i.stockMinimo) === 'bajo').length;
    const criticos = listaInsumos.filter(i => obtenerEstadoStock(i.cantidad, i.stockMinimo) === 'critico').length;
    const normales = total - bajos - criticos;

    return { total, bajos, criticos, normales };
  };

  const estadisticas = obtenerEstadisticas();

  return (
    <div className="gestion-insumos-container">
      {/* Header de la página */}
      <div className="page-header">
        <h1 className="page-title">📦 Gestión de Insumos</h1>
        <p className="page-subtitle">Control de inventario y alertas de stock</p>
      </div>

      {/* Estadísticas del inventario */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Insumos</h3>
            <p className="stat-value">{estadisticas.total}</p>
          </div>
        </div>
        
        <div className="stat-card normales">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Stock Normal</h3>
            <p className="stat-value">{estadisticas.normales}</p>
          </div>
        </div>
        
        <div className="stat-card bajos">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Stock Bajo</h3>
            <p className="stat-value">{estadisticas.bajos}</p>
          </div>
        </div>
        
        <div className="stat-card criticos">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>Stock Crítico</h3>
            <p className="stat-value">{estadisticas.criticos}</p>
          </div>
        </div>
      </div>

      {/* Barra de acciones y filtros */}
      <div className="actions-bar">
        <button 
          className="btn btn-primary"
          onClick={abrirFormularioNuevo}
        >
          ➕ Agregar Insumo
        </button>
        
        <div className="filtros">
          <label htmlFor="filtro-alertas">Filtrar por estado:</label>
          <select
            id="filtro-alertas"
            value={filtroAlertas}
            onChange={(e) => setFiltroAlertas(e.target.value)}
            className="form-control"
          >
            <option value="todos">Todos los insumos</option>
            <option value="bajos">Stock bajo</option>
            <option value="criticos">Stock crítico</option>
          </select>
        </div>
      </div>

      {/* Tabla de insumos */}
      <div className="table-container">
        <table className="insumos-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Stock Mínimo</th>
              <th>Estado</th>
              <th>Proveedor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumosFiltrados.map((insumo) => {
              const estado = obtenerEstadoStock(insumo.cantidad, insumo.stockMinimo);
              const porcentaje = Math.round((insumo.cantidad / insumo.stockMinimo) * 100);
              
              return (
                <tr key={insumo.id}>
                  <td className="id-cell">{insumo.id}</td>
                  <td className="nombre-cell">
                    <strong>{insumo.nombre}</strong>
                  </td>
                  <td className="cantidad-cell">
                    <input
                      type="number"
                      value={insumo.cantidad}
                      onChange={(e) => actualizarCantidad(insumo.id, e.target.value)}
                      className="cantidad-input"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="unidad-cell">{insumo.unidad}</td>
                  <td className="minimo-cell">{insumo.stockMinimo}</td>
                  <td className="estado-cell">
                    <span className={`estado-badge ${estado}`}>
                      {estado === 'critico' ? '🚨 Crítico' : 
                       estado === 'bajo' ? '⚠️ Bajo' : '✅ Normal'}
                    </span>
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${estado}`}
                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="proveedor-cell">{insumo.proveedor}</td>
                  <td className="acciones-cell">
                    <button
                      className="btn-accion editar"
                      onClick={() => abrirFormularioEdicion(insumo)}
                      title="Editar insumo"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-accion eliminar"
                      onClick={() => eliminarInsumoHandler(insumo.id)}
                      title="Eliminar insumo"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal del formulario */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {insumoEditando ? '✏️ Editar Insumo' : '📦 Nuevo Insumo'}
            </h3>
            
            <form onSubmit={manejarEnvioFormulario} className="insumo-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre del Insumo *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="Ej: Café en Grano"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="proveedor">Proveedor *</label>
                  <input
                    type="text"
                    id="proveedor"
                    name="proveedor"
                    value={formData.proveedor}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="Nombre del proveedor"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cantidad">Cantidad Actual *</label>
                  <input
                    type="number"
                    id="cantidad"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="15"
                    step="1"
                    min="0"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="unidad">Unidad *</label>
                  <select
                    id="unidad"
                    name="unidad"
                    value={formData.unidad}
                    onChange={manejarCambioInput}
                    className="form-control"
                    required
                  >
                    <option value="">Selecciona unidad</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="litros">Litros</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="unidades">Unidades</option>
                    <option value="cajas">Cajas</option>
                    <option value="bolsas">Bolsas</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="stockMinimo">Stock Mínimo *</label>
                <input
                  type="number"
                  id="stockMinimo"
                  name="stockMinimo"
                  value={formData.stockMinimo}
                  onChange={manejarCambioInput}
                  className="form-control"
                  placeholder="5"
                  step="1"
                  min="0"
                  required
                />
                <small className="form-help">
                  Cantidad mínima antes de generar alerta de stock bajo
                </small>
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarFormulario}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {insumoEditando ? 'Actualizar' : 'Agregar'} Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionInsumos;
