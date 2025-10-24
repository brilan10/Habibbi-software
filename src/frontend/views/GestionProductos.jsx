import React, { useState, useEffect } from 'react';
import { getProductos, agregarProducto, actualizarProducto, eliminarProducto } from '../data/stateManager';
import '../styles/GestionProductos.css';

/**
 * Componente GestionProductos - Administración de productos
 * Permite ver, agregar, editar y eliminar productos del catálogo
 */
const GestionProductos = () => {
  // Estado para la lista de productos
  const [listaProductos, setListaProductos] = useState([]);

  // Cargar productos al montar el componente
  useEffect(() => {
    setListaProductos(getProductos());

    // Escuchar eventos personalizados para sincronizar
    const manejarCambioProductos = () => {
      try {
        const productosData = getProductos();
        setListaProductos(productosData);
        console.log('🔄 GestionProductos - Productos sincronizados');
      } catch (error) {
        console.log('Error sincronizando productos:', error);
      }
    };

    // Escuchar eventos de actualización de productos
    window.addEventListener('productoAgregado', manejarCambioProductos);
    window.addEventListener('productoActualizado', manejarCambioProductos);
    window.addEventListener('productoEliminado', manejarCambioProductos);

    return () => {
      window.removeEventListener('productoAgregado', manejarCambioProductos);
      window.removeEventListener('productoActualizado', manejarCambioProductos);
      window.removeEventListener('productoEliminado', manejarCambioProductos);
    };
  }, []);
  
  // Estado para el formulario de nuevo producto
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estado para el producto que se está editando
  const [productoEditando, setProductoEditando] = useState(null);
  
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    categoria: '',
    stock: '',
    descripcion: ''
  });

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
   * Función para abrir el formulario de nuevo producto
   * Resetea el formulario y lo muestra
   */
  const abrirFormularioNuevo = () => {
    setFormData({
      nombre: '',
      precio: '',
      categoria: '',
      stock: '',
      descripcion: ''
    });
    setProductoEditando(null);
    setMostrarFormulario(true);
  };

  /**
   * Función para abrir el formulario de edición
   * Carga los datos del producto seleccionado
   */
  const abrirFormularioEdicion = (producto) => {
    setFormData({
      nombre: producto.nombre,
      precio: producto.precio.toString(),
      categoria: producto.categoria,
      stock: producto.stock.toString(),
      descripcion: producto.descripcion
    });
    setProductoEditando(producto);
    setMostrarFormulario(true);
  };

  /**
   * Función para cerrar el formulario
   * Limpia el estado y oculta el formulario
   */
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setProductoEditando(null);
    setFormData({
      nombre: '',
      precio: '',
      categoria: '',
      stock: '',
      descripcion: ''
    });
  };

  /**
   * Función para manejar el envío del formulario
   * Agrega un nuevo producto o actualiza uno existente
   */
  const manejarEnvioFormulario = (e) => {
    e.preventDefault();
    
    // Valida que todos los campos estén llenos
    if (!formData.nombre || !formData.precio || !formData.categoria || !formData.stock) {
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }

    const datosProducto = {
      nombre: formData.nombre,
      precio: parseFloat(formData.precio),
      categoria: formData.categoria,
      stock: parseInt(formData.stock),
      descripcion: formData.descripcion || ''
    };

    if (productoEditando) {
      // Actualizar producto existente usando el state manager
      actualizarProducto(productoEditando.id, datosProducto);
      alert('Producto actualizado correctamente');
    } else {
      // Agregar nuevo producto usando el state manager
      agregarProducto(datosProducto);
      alert('Producto agregado correctamente');
    }

    // Actualizar la lista local
    setListaProductos(getProductos());
    
    // Disparar eventos para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('productoAgregado', {
      detail: { producto: datosProducto }
    }));
    window.dispatchEvent(new CustomEvent('stockActualizado', {
      detail: { accion: 'producto_agregado', producto: datosProducto }
    }));
    window.dispatchEvent(new CustomEvent('dashboardActualizado', {
      detail: { accion: 'producto_agregado' }
    }));
    
    cerrarFormulario();
  };

  /**
   * Función para eliminar un producto
   * Pide confirmación antes de eliminar
   */
  const eliminarProductoHandler = (productoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      eliminarProducto(productoId);
      setListaProductos(getProductos());
      alert('Producto eliminado correctamente');
    }
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

  return (
    <div className="gestion-productos-container">
      {/* Header de la página */}
      <div className="page-header">
        <h1 className="page-title">☕ Gestión de Productos</h1>
        <p className="page-subtitle">Administra el catálogo de productos de la cafetería</p>
      </div>

      {/* Barra de acciones */}
      <div className="actions-bar">
        <button 
          className="btn btn-primary"
          onClick={abrirFormularioNuevo}
        >
          ➕ Agregar Producto
        </button>
        <div className="stats-info">
          <span>Total productos: <strong>{listaProductos.length}</strong></span>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="table-container">
        <table className="productos-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaProductos.map((producto) => (
              <tr key={producto.id}>
                <td className="id-cell">{producto.id}</td>
                <td className="nombre-cell">
                  <strong>{producto.nombre}</strong>
                </td>
                <td className="precio-cell">
                  {formatearMoneda(producto.precio)}
                </td>
                <td className="categoria-cell">
                  <span className="categoria-badge">
                    {producto.categoria}
                  </span>
                </td>
                <td className="stock-cell">
                  <span className={`stock-badge ${producto.stock < 10 ? 'bajo' : 'normal'}`}>
                    {producto.stock}
                  </span>
                </td>
                <td className="descripcion-cell">
                  {producto.descripcion || 'Sin descripción'}
                </td>
                <td className="acciones-cell">
                  <button
                    className="btn-accion editar"
                    onClick={() => abrirFormularioEdicion(producto)}
                    title="Editar producto"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-accion eliminar"
                    onClick={() => eliminarProductoHandler(producto.id)}
                    title="Eliminar producto"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal del formulario */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {productoEditando ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
            </h3>
            
            <form onSubmit={manejarEnvioFormulario} className="producto-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre del Producto *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="Ej: Café Americano"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="precio">Precio (CLP) *</label>
                  <input
                    type="number"
                    id="precio"
                    name="precio"
                    value={formData.precio}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="2500"
                    step="100"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="categoria">Categoría *</label>
                  <select
                    id="categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={manejarCambioInput}
                    className="form-control"
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    <option value="Bebidas Calientes">Bebidas Calientes</option>
                    <option value="Bebidas Frías">Bebidas Frías</option>
                    <option value="Panadería">Panadería</option>
                    <option value="Postres">Postres</option>
                    <option value="Comida">Comida</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="stock">Stock *</label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={manejarCambioInput}
                  className="form-control"
                  placeholder="Descripción del producto (opcional)"
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
                  {productoEditando ? 'Actualizar' : 'Agregar'} Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionProductos;
