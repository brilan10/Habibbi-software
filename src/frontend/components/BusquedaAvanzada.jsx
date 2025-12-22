import React, { useState } from 'react';
import '../styles/BusquedaAvanzada.css';

/**
 * Componente BusquedaAvanzada - Sistema de búsqueda y filtros
 * Permite filtrar datos por múltiples criterios
 */
const BusquedaAvanzada = ({ 
  datos, 
  campos, 
  onFiltrar, 
  placeholder = "Buscar...",
  mostrarFiltros = true 
}) => {
  // Estado para los filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    campo: 'todos',
    orden: 'asc',
    fechaDesde: '',
    fechaHasta: '',
    rangoPrecio: { min: '', max: '' }
  });

  // Estado para mostrar/ocultar filtros avanzados
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

  /**
   * Maneja cambios en los filtros
   */
  const manejarCambioFiltro = (campo, valor) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    setFiltros(nuevosFiltros);
    aplicarFiltros(nuevosFiltros);
  };

  /**
   * Aplica los filtros a los datos
   */
  const aplicarFiltros = (filtrosAplicar) => {
    let datosFiltrados = [...datos];

    // Filtro de búsqueda general
    if (filtrosAplicar.busqueda) {
      const busqueda = filtrosAplicar.busqueda.toLowerCase();
      datosFiltrados = datosFiltrados.filter(item => {
        if (filtrosAplicar.campo === 'todos') {
          return Object.values(item).some(valor => 
            valor && valor.toString().toLowerCase().includes(busqueda)
          );
        } else {
          const valorCampo = item[filtrosAplicar.campo];
          return valorCampo && valorCampo.toString().toLowerCase().includes(busqueda);
        }
      });
    }

    // Filtro por fechas
    if (filtrosAplicar.fechaDesde) {
      datosFiltrados = datosFiltrados.filter(item => {
        const fechaItem = new Date(item.fecha || item.fechaRegistro || item.fechaCreacion);
        const fechaDesde = new Date(filtrosAplicar.fechaDesde);
        return fechaItem >= fechaDesde;
      });
    }

    if (filtrosAplicar.fechaHasta) {
      datosFiltrados = datosFiltrados.filter(item => {
        const fechaItem = new Date(item.fecha || item.fechaRegistro || item.fechaCreacion);
        const fechaHasta = new Date(filtrosAplicar.fechaHasta);
        return fechaItem <= fechaHasta;
      });
    }

    // Filtro por rango de precio
    if (filtrosAplicar.rangoPrecio.min) {
      datosFiltrados = datosFiltrados.filter(item => {
        const precio = item.precio || item.total || item.monto || 0;
        return precio >= parseFloat(filtrosAplicar.rangoPrecio.min);
      });
    }

    if (filtrosAplicar.rangoPrecio.max) {
      datosFiltrados = datosFiltrados.filter(item => {
        const precio = item.precio || item.total || item.monto || 0;
        return precio <= parseFloat(filtrosAplicar.rangoPrecio.max);
      });
    }

    // Ordenamiento
    if (filtrosAplicar.orden !== 'ninguno') {
      datosFiltrados.sort((a, b) => {
        const campoA = a[filtrosAplicar.campo] || a.nombre || a.id;
        const campoB = b[filtrosAplicar.campo] || b.nombre || b.id;
        
        if (filtrosAplicar.orden === 'asc') {
          return campoA > campoB ? 1 : -1;
        } else {
          return campoA < campoB ? 1 : -1;
        }
      });
    }

    // Llamar a la función de callback con los datos filtrados
    onFiltrar(datosFiltrados);
  };

  /**
   * Limpia todos los filtros
   */
  const limpiarFiltros = () => {
    const filtrosLimpios = {
      busqueda: '',
      campo: 'todos',
      orden: 'asc',
      fechaDesde: '',
      fechaHasta: '',
      rangoPrecio: { min: '', max: '' }
    };
    setFiltros(filtrosLimpios);
    onFiltrar(datos);
  };

  return (
    <div className="busqueda-avanzada">
      {/* Barra de búsqueda principal */}
      <div className="busqueda-principal">
        <div className="busqueda-input-container">
          <input
            type="text"
            placeholder={placeholder}
            value={filtros.busqueda}
            onChange={(e) => manejarCambioFiltro('busqueda', e.target.value)}
            className="busqueda-input"
          />
          <span className="busqueda-icon">🔍</span>
        </div>
        
        <select
          value={filtros.campo}
          onChange={(e) => manejarCambioFiltro('campo', e.target.value)}
          className="campo-select"
        >
          <option value="todos">Todos los campos</option>
          {campos.map(campo => (
            <option key={campo.id} value={campo.id}>
              {campo.nombre}
            </option>
          ))}
        </select>

        <button
          className="btn-filtros"
          onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
        >
          {mostrarFiltrosAvanzados ? '🔼' : '🔽'} Filtros
        </button>

        <button
          className="btn-limpiar"
          onClick={limpiarFiltros}
        >
          🗑️ Limpiar
        </button>
      </div>

      {/* Filtros avanzados */}
      {mostrarFiltrosAvanzados && mostrarFiltros && (
        <div className="filtros-avanzados">
          <div className="filtros-grid">
            {/* Ordenamiento */}
            <div className="filtro-grupo">
              <label>Ordenar por:</label>
              <select
                value={filtros.orden}
                onChange={(e) => manejarCambioFiltro('orden', e.target.value)}
                className="filtro-select"
              >
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
                <option value="ninguno">Sin ordenar</option>
              </select>
            </div>

            {/* Filtro por fechas */}
            <div className="filtro-grupo">
              <label>Fecha desde:</label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => manejarCambioFiltro('fechaDesde', e.target.value)}
                className="filtro-input"
              />
            </div>

            <div className="filtro-grupo">
              <label>Fecha hasta:</label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => manejarCambioFiltro('fechaHasta', e.target.value)}
                className="filtro-input"
              />
            </div>

            {/* Filtro por rango de precio */}
            <div className="filtro-grupo">
              <label>Precio mínimo:</label>
              <input
                type="number"
                placeholder="0"
                value={filtros.rangoPrecio.min}
                onChange={(e) => manejarCambioFiltro('rangoPrecio', { 
                  ...filtros.rangoPrecio, 
                  min: e.target.value 
                })}
                className="filtro-input"
              />
            </div>

            <div className="filtro-grupo">
              <label>Precio máximo:</label>
              <input
                type="number"
                placeholder="999999"
                value={filtros.rangoPrecio.max}
                onChange={(e) => manejarCambioFiltro('rangoPrecio', { 
                  ...filtros.rangoPrecio, 
                  max: e.target.value 
                })}
                className="filtro-input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusquedaAvanzada;
