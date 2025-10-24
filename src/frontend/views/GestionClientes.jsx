import React, { useState } from 'react';
import { clientes } from '../data/mockData';
import FiltroClientes from '../components/FiltroClientes';
import RegistroClienteRapido from '../components/RegistroClienteRapido';
import '../styles/GestionClientes.css';

/**
 * Componente GestionClientes - Administración de clientes
 * Permite gestionar la base de datos de clientes de la cafetería
 */
const GestionClientes = () => {
  // Estado para la lista de clientes
  const [listaClientes, setListaClientes] = useState(clientes);
  
  // Estado para el formulario de nuevo cliente
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estado para el registro rápido
  const [mostrarRegistroRapido, setMostrarRegistroRapido] = useState(false);
  
  // Estado para el cliente que se está editando
  const [clienteEditando, setClienteEditando] = useState(null);
  
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  // Estado para el historial de compras
  const [historialCompras, setHistorialCompras] = useState([
    {
      id: 1,
      clienteId: 1,
      fecha: '2024-10-23',
      productos: [
        { nombre: 'Café Americano', cantidad: 2, precio: 2500 },
        { nombre: 'Croissant', cantidad: 1, precio: 1800 }
      ],
      total: 6800,
      metodoPago: 'Efectivo'
    },
    {
      id: 2,
      clienteId: 1,
      fecha: '2024-10-22',
      productos: [
        { nombre: 'Cappuccino', cantidad: 1, precio: 3500 }
      ],
      total: 3500,
      metodoPago: 'Tarjeta'
    },
    {
      id: 3,
      clienteId: 2,
      fecha: '2024-10-23',
      productos: [
        { nombre: 'Latte', cantidad: 1, precio: 3200 },
        { nombre: 'Muffin', cantidad: 2, precio: 2000 }
      ],
      total: 7200,
      metodoPago: 'Efectivo'
    }
  ]);

  // Estado para mostrar historial de un cliente específico
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Estado para el filtro de búsqueda
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  
  // Estado para los datos filtrados
  const [datosFiltrados, setDatosFiltrados] = useState(clientes);

  // Función para formatear moneda
  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(cantidad);
  };

  // Función para obtener historial de un cliente
  const obtenerHistorialCliente = (clienteId) => {
    return historialCompras.filter(compra => compra.clienteId === clienteId);
  };

  // Función para calcular estadísticas del cliente
  const calcularEstadisticasCliente = (clienteId) => {
    const compras = obtenerHistorialCliente(clienteId);
    const totalCompras = compras.length;
    const totalGastado = compras.reduce((sum, compra) => sum + compra.total, 0);
    const promedioCompra = totalCompras > 0 ? totalGastado / totalCompras : 0;
    const ultimaCompra = compras.length > 0 ? compras[0].fecha : null;

    return {
      totalCompras,
      totalGastado,
      promedioCompra,
      ultimaCompra
    };
  };

  // Función para ver historial de un cliente
  const verHistorial = (cliente) => {
    setClienteSeleccionado(cliente);
  };

  // Función para cerrar historial
  const cerrarHistorial = () => {
    setClienteSeleccionado(null);
  };

  // Función para manejar filtros de búsqueda avanzada
  const manejarFiltros = (datosFiltrados) => {
    setDatosFiltrados(datosFiltrados);
  };

  // Configuración de campos para búsqueda avanzada
  const camposBusqueda = [
    { id: 'nombre', nombre: 'Nombre' },
    { id: 'telefono', nombre: 'Teléfono' },
    { id: 'email', nombre: 'Email' },
    { id: 'direccion', nombre: 'Dirección' }
  ];

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
   * Función para abrir el formulario de nuevo cliente
   * Resetea el formulario y lo muestra
   */
  const abrirFormularioNuevo = () => {
    setFormData({
      nombre: '',
      telefono: '',
      email: '',
      direccion: ''
    });
    setClienteEditando(null);
    setMostrarFormulario(true);
  };

  /**
   * Función para abrir el formulario de edición
   * Carga los datos del cliente seleccionado
   */
  const abrirFormularioEdicion = (cliente) => {
    setFormData({
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion
    });
    setClienteEditando(cliente);
    setMostrarFormulario(true);
  };

  /**
   * Función para cerrar el formulario
   * Limpia el estado y oculta el formulario
   */
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setClienteEditando(null);
    setFormData({
      nombre: '',
      telefono: '',
      email: '',
      direccion: ''
    });
  };

  /**
   * Función para manejar el registro rápido de cliente
   */
  const manejarClienteRegistrado = (nuevoCliente) => {
    setListaClientes([...listaClientes, nuevoCliente]);
    setMostrarRegistroRapido(false);
    alert(`Cliente ${nuevoCliente.nombre} registrado correctamente`);
  };

  /**
   * Función para cancelar el registro rápido
   */
  const cancelarRegistroRapido = () => {
    setMostrarRegistroRapido(false);
  };

  /**
   * Función para validar el formulario
   * Verifica que todos los campos requeridos estén completos
   */
  const validarFormulario = () => {
    if (!formData.nombre || !formData.telefono) {
      alert('Por favor, completa al menos el nombre y teléfono');
      return false;
    }

    // Validar formato de email si se proporciona
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Por favor, ingresa un email válido');
        return false;
      }
    }

    // Validar formato de teléfono
    const telefonoRegex = /^[\d\s\-\+\(\)]+$/;
    if (!telefonoRegex.test(formData.telefono)) {
      alert('Por favor, ingresa un teléfono válido');
      return false;
    }

    return true;
  };

  /**
   * Función para manejar el envío del formulario
   * Agrega un nuevo cliente o actualiza uno existente
   */
  const manejarEnvioFormulario = (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    const nuevoCliente = {
      id: clienteEditando ? clienteEditando.id : Date.now(),
      nombre: formData.nombre,
      telefono: formData.telefono,
      email: formData.email || '',
      direccion: formData.direccion || '',
      fechaRegistro: clienteEditando ? clienteEditando.fechaRegistro : new Date().toISOString().split('T')[0]
    };

    if (clienteEditando) {
      // Actualiza cliente existente
      setListaClientes(listaClientes.map(c => 
        c.id === clienteEditando.id ? nuevoCliente : c
      ));
      alert('Cliente actualizado correctamente');
    } else {
      // Agrega nuevo cliente
      setListaClientes([...listaClientes, nuevoCliente]);
      alert('Cliente agregado correctamente');
    }

    cerrarFormulario();
  };

  /**
   * Función para eliminar un cliente
   * Pide confirmación antes de eliminar
   */
  const eliminarCliente = (clienteId) => {
    const cliente = listaClientes.find(c => c.id === clienteId);
    
    if (window.confirm(`¿Estás seguro de que quieres eliminar al cliente "${cliente.nombre}"?`)) {
      setListaClientes(listaClientes.filter(c => c.id !== clienteId));
      alert('Cliente eliminado correctamente');
    }
  };

  /**
   * Función para filtrar clientes según la búsqueda
   */
  const clientesFiltrados = listaClientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    cliente.telefono.includes(filtroBusqueda) ||
    cliente.email.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  /**
   * Función para obtener estadísticas de clientes
   */
  const obtenerEstadisticas = () => {
    const total = listaClientes.length;
    const conEmail = listaClientes.filter(c => c.email).length;
    const conDireccion = listaClientes.filter(c => c.direccion).length;
    const registradosHoy = listaClientes.filter(c => 
      c.fechaRegistro === new Date().toISOString().split('T')[0]
    ).length;

    return { total, conEmail, conDireccion, registradosHoy };
  };

  const estadisticas = obtenerEstadisticas();

  /**
   * Función para formatear fecha
   */
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX');
  };

  return (
    <div className="gestion-clientes-container">
      {/* Header de la página */}
      <div className="page-header">
        <h1 className="page-title">👤 Gestión de Clientes</h1>
        <p className="page-subtitle">Administra la base de datos de clientes</p>
      </div>

      {/* Estadísticas de clientes */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Clientes</h3>
            <p className="stat-value">{estadisticas.total}</p>
          </div>
        </div>
        
        <div className="stat-card email">
          <div className="stat-icon">📧</div>
          <div className="stat-content">
            <h3>Con Email</h3>
            <p className="stat-value">{estadisticas.conEmail}</p>
          </div>
        </div>
        
        <div className="stat-card direccion">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h3>Con Dirección</h3>
            <p className="stat-value">{estadisticas.conDireccion}</p>
          </div>
        </div>
        
        <div className="stat-card nuevos">
          <div className="stat-icon">🆕</div>
          <div className="stat-content">
            <h3>Registrados Hoy</h3>
            <p className="stat-value">{estadisticas.registradosHoy}</p>
          </div>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="actions-bar">
        <button 
          className="btn btn-primary"
          onClick={abrirFormularioNuevo}
        >
          ➕ Nuevo Cliente
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => setMostrarRegistroRapido(true)}
        >
          ⚡ Registro Rápido
        </button>
      </div>

      {/* Filtro de clientes */}
      <FiltroClientes
        clientes={listaClientes}
        onFiltrar={manejarFiltros}
      />

      {/* Tabla de clientes */}
      <div className="table-container">
        <table className="clientes-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Dirección</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datosFiltrados.map((cliente) => (
              <tr key={cliente.id}>
                <td className="id-cell">{cliente.id}</td>
                <td className="nombre-cell">
                  <strong>{cliente.nombre}</strong>
                </td>
                <td className="telefono-cell">{cliente.telefono}</td>
                <td className="email-cell">
                  {cliente.email ? (
                    <a href={`mailto:${cliente.email}`} className="email-link">
                      {cliente.email}
                    </a>
                  ) : (
                    <span className="no-data">Sin email</span>
                  )}
                </td>
                <td className="direccion-cell">
                  {cliente.direccion || <span className="no-data">Sin dirección</span>}
                </td>
                <td className="fecha-cell">
                  {formatearFecha(cliente.fechaRegistro)}
                </td>
                <td className="acciones-cell">
                  <button
                    className="btn-accion historial"
                    onClick={() => verHistorial(cliente)}
                    title="Ver historial de compras"
                  >
                    📊
                  </button>
                  <button
                    className="btn-accion editar"
                    onClick={() => abrirFormularioEdicion(cliente)}
                    title="Editar cliente"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-accion eliminar"
                    onClick={() => eliminarCliente(cliente.id)}
                    title="Eliminar cliente"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {clientesFiltrados.length === 0 && (
          <div className="no-results">
            <p>No se encontraron clientes que coincidan con la búsqueda</p>
          </div>
        )}
      </div>

      {/* Modal del formulario */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {clienteEditando ? '✏️ Editar Cliente' : '👤 Nuevo Cliente'}
            </h3>
            
            <form onSubmit={manejarEnvioFormulario} className="cliente-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre Completo *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={manejarCambioInput}
                  className="form-control"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono *</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="555-0123"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="direccion">Dirección</label>
                <textarea
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={manejarCambioInput}
                  className="form-control"
                  placeholder="Calle, número, colonia, ciudad"
                  rows="3"
                />
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
                  {clienteEditando ? 'Actualizar' : 'Agregar'} Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de historial de compras */}
      {clienteSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content historial-modal">
            <div className="modal-header">
              <h3>📊 Historial de Compras - {clienteSeleccionado.nombre}</h3>
              <button 
                className="btn-cerrar"
                onClick={cerrarHistorial}
              >
                ✕
              </button>
            </div>
            
            <div className="historial-content">
              {/* Estadísticas del cliente */}
              {(() => {
                const stats = calcularEstadisticasCliente(clienteSeleccionado.id);
                return (
                  <div className="cliente-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Compras:</span>
                      <span className="stat-value">{stats.totalCompras}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Gastado:</span>
                      <span className="stat-value">{formatearMoneda(stats.totalGastado)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Promedio por Compra:</span>
                      <span className="stat-value">{formatearMoneda(stats.promedioCompra)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Última Compra:</span>
                      <span className="stat-value">{stats.ultimaCompra || 'Nunca'}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Lista de compras */}
              <div className="compras-lista">
                <h4>Compras Realizadas</h4>
                {obtenerHistorialCliente(clienteSeleccionado.id).length > 0 ? (
                  <div className="compras-grid">
                    {obtenerHistorialCliente(clienteSeleccionado.id).map((compra) => (
                      <div key={compra.id} className="compra-item">
                        <div className="compra-header">
                          <span className="compra-fecha">{compra.fecha}</span>
                          <span className="compra-total">{formatearMoneda(compra.total)}</span>
                        </div>
                        <div className="compra-productos">
                          {compra.productos.map((producto, index) => (
                            <div key={index} className="producto-item">
                              <span className="producto-nombre">{producto.nombre}</span>
                              <span className="producto-cantidad">x{producto.cantidad}</span>
                              <span className="producto-precio">{formatearMoneda(producto.precio)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="compra-metodo">
                          <span className="metodo-label">Método:</span>
                          <span className="metodo-valor">{compra.metodoPago}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-compras">
                    <p>Este cliente no tiene compras registradas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de registro rápido */}
      {mostrarRegistroRapido && (
        <div className="modal-overlay">
          <div className="modal-content registro-cliente-modal">
            <RegistroClienteRapido
              onClienteRegistrado={manejarClienteRegistrado}
              onCancelar={cancelarRegistroRapido}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionClientes;
