import React, { useState } from 'react';
import '../styles/FiltroClientes.css';

/**
 * Componente FiltroClientes - Sistema de búsqueda específico para clientes
 * Permite filtrar clientes por nombre o RUT
 */
const FiltroClientes = ({ 
  clientes, 
  onFiltrar 
}) => {
  // Estado para los filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipoFiltro: 'nombre', // 'nombre' o 'rut'
    orden: 'asc' // 'asc' o 'desc'
  });

  /**
   * Maneja cambios en los filtros
   */
  const manejarCambioFiltro = (campo, valor) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    setFiltros(nuevosFiltros);
    aplicarFiltros(nuevosFiltros);
  };

  /**
   * Aplica los filtros a los clientes
   */
  const aplicarFiltros = (filtrosAplicar) => {
    let clientesFiltrados = [...clientes];

    // Filtro de búsqueda
    if (filtrosAplicar.busqueda) {
      const busqueda = filtrosAplicar.busqueda.toLowerCase();
      
      if (filtrosAplicar.tipoFiltro === 'nombre') {
        clientesFiltrados = clientesFiltrados.filter(cliente => 
          cliente.nombre.toLowerCase().includes(busqueda)
        );
      } else if (filtrosAplicar.tipoFiltro === 'rut') {
        clientesFiltrados = clientesFiltrados.filter(cliente => 
          cliente.rut && cliente.rut.toLowerCase().includes(busqueda)
        );
      }
    }

    // Ordenamiento
    clientesFiltrados.sort((a, b) => {
      if (filtrosAplicar.tipoFiltro === 'nombre') {
        const nombreA = a.nombre.toLowerCase();
        const nombreB = b.nombre.toLowerCase();
        return filtrosAplicar.orden === 'asc' 
          ? nombreA.localeCompare(nombreB)
          : nombreB.localeCompare(nombreA);
      } else if (filtrosAplicar.tipoFiltro === 'rut') {
        const rutA = a.rut || '';
        const rutB = b.rut || '';
        return filtrosAplicar.orden === 'asc' 
          ? rutA.localeCompare(rutB)
          : rutB.localeCompare(rutA);
      }
      return 0;
    });

    onFiltrar(clientesFiltrados);
  };

  /**
   * Limpia todos los filtros
   */
  const limpiarFiltros = () => {
    const filtrosLimpios = {
      busqueda: '',
      tipoFiltro: 'nombre',
      orden: 'asc'
    };
    setFiltros(filtrosLimpios);
    onFiltrar(clientes);
  };

  return (
    <div className="filtro-clientes">
      <div className="filtro-header">
        <h3>🔍 Filtros de Clientes</h3>
        <button 
          className="btn-limpiar"
          onClick={limpiarFiltros}
        >
          🗑️ Limpiar
        </button>
      </div>

      <div className="filtro-controls">
        {/* Tipo de filtro */}
        <div className="filtro-group">
          <label htmlFor="tipoFiltro">Filtrar por:</label>
          <select
            id="tipoFiltro"
            value={filtros.tipoFiltro}
            onChange={(e) => manejarCambioFiltro('tipoFiltro', e.target.value)}
            className="filtro-select"
          >
            <option value="nombre">👤 Nombre</option>
            <option value="rut">🆔 RUT</option>
          </select>
        </div>

        {/* Campo de búsqueda */}
        <div className="filtro-group">
          <label htmlFor="busqueda">
            {filtros.tipoFiltro === 'nombre' ? 'Buscar por nombre:' : 'Buscar por RUT:'}
          </label>
          <input
            type="text"
            id="busqueda"
            value={filtros.busqueda}
            onChange={(e) => manejarCambioFiltro('busqueda', e.target.value)}
            placeholder={
              filtros.tipoFiltro === 'nombre' 
                ? 'Ej: Juan Pérez' 
                : 'Ej: 20.993.899-6'
            }
            className="filtro-input"
          />
        </div>

        {/* Ordenamiento */}
        <div className="filtro-group">
          <label htmlFor="orden">Ordenar:</label>
          <select
            id="orden"
            value={filtros.orden}
            onChange={(e) => manejarCambioFiltro('orden', e.target.value)}
            className="filtro-select"
          >
            <option value="asc">⬆️ A-Z</option>
            <option value="desc">⬇️ Z-A</option>
          </select>
        </div>
      </div>

      {/* Información de resultados */}
      <div className="filtro-info">
        <p>
          <strong>💡 Tip:</strong> 
          {filtros.tipoFiltro === 'nombre' 
            ? ' Busca por nombre completo o parte del nombre'
            : ' Busca por RUT completo o parte del RUT'
          }
        </p>
        <p>
          <strong>📊 Resultados:</strong> 
          {filtros.busqueda ? 'Filtrados' : 'Todos los clientes'}
        </p>
      </div>
    </div>
  );
};

export default FiltroClientes;
