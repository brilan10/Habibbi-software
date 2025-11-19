import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';
import { useNotification } from '../hooks/useNotification';
import NotificationContainer from '../components/NotificationContainer';
import InputModal from '../components/InputModal';
import '../styles/GestionProductos.css';

/**
 * Componente GestionProductos - Administración de productos
 * Permite ver, agregar, editar y eliminar productos del catálogo
 */
const GestionProductos = () => {
  // Estado para la lista de productos
  const [listaProductos, setListaProductos] = useState([]);
  const [calculandoStock, setCalculandoStock] = useState(false);
  
  // Estado para filtros
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  
  // Estado para reactivación
  const [productoReactivar, setProductoReactivar] = useState(null);
  
  // Sistema de notificaciones
  const { notifications, showSuccess, showError, removeNotification } = useNotification();

  // Función para cargar productos
  const cargarProductos = async () => {
    try {
      const response = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.PRODUCTOS.LIST);
      if (response.data && response.data.success) {
        setListaProductos(response.data.data);
        console.log('✅ Productos cargados desde el backend:', response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      showError('Error al cargar productos');
      setListaProductos([]);
    }
  };

  // Cargar productos al montar el componente desde el backend
  useEffect(() => {
    cargarProductos();
  }, []);
  
  const productosFiltrados = useMemo(() => {
    const termino = terminoBusqueda.trim().toLowerCase();
    return listaProductos.filter((producto) => {
      const coincideCategoria = filtroCategoria === 'todas' || producto.categoria === filtroCategoria;
      const estadoProducto = Number(producto.activo ?? 1);
      const coincideEstado = filtroEstado === 'todos'
        ? true
        : filtroEstado === 'activos'
          ? estadoProducto === 1
          : estadoProducto === 0;
      const nombreProducto = (producto.nombre || '').toLowerCase();
      const coincideBusqueda = termino === '' ? true : nombreProducto.includes(termino);
      return coincideCategoria && coincideEstado && coincideBusqueda;
    });
  }, [listaProductos, filtroCategoria, filtroEstado, terminoBusqueda]);
  
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
   * Función para calcular stock disponible basándose en la receta
   */
  const calcularStockDisponible = async (nombreProducto) => {
    if (!nombreProducto || productoEditando) return; // No calcular si está editando
    
    setCalculandoStock(true);
    try {
      // Primero buscar si existe el producto con ese nombre
      const productosResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.PRODUCTOS.LIST);
      if (productosResponse.data && productosResponse.data.success) {
        const productoEncontrado = productosResponse.data.data.find(
          p => p.nombre.toLowerCase().trim() === nombreProducto.toLowerCase().trim()
        );
        
        if (productoEncontrado) {
          // Buscar la receta del producto
          const recetasResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.RECETAS.LIST);
          if (recetasResponse.data && recetasResponse.data.success) {
            const receta = recetasResponse.data.data.find(
              r => r.id_producto === productoEncontrado.id_producto
            );
            
            if (receta && receta.insumos && receta.insumos.length > 0) {
              // Obtener stock de insumos
              const insumosResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.INSUMOS.LIST);
              if (insumosResponse.data && insumosResponse.data.success) {
                const insumos = insumosResponse.data.data;
                let stockMinimo = Infinity;
                let insumoLimitante = null;
                
                // Calcular cuántas unidades se pueden hacer con cada insumo
                receta.insumos.forEach(ingrediente => {
                  // Agrupar insumos duplicados por nombre+unidad
                  const insumosDelTipo = insumos.filter(i => 
                    i.id_insumo === ingrediente.id_insumo
                  );
                  
                  if (insumosDelTipo.length > 0) {
                    // Sumar stock de insumos duplicados
                    const stockTotal = insumosDelTipo.reduce((sum, i) => sum + parseFloat(i.stock || 0), 0);
                    
                    if (ingrediente.cantidad > 0 && stockTotal > 0) {
                      const unidadesPosibles = Math.floor(stockTotal / ingrediente.cantidad);
                      if (unidadesPosibles < stockMinimo) {
                        stockMinimo = unidadesPosibles;
                        insumoLimitante = ingrediente.insumo_nombre || 'insumo';
                      }
                    }
                  }
                });
                
                // Si se calculó stock, actualizarlo
                if (stockMinimo !== Infinity && stockMinimo >= 0) {
                  setFormData(prevState => ({
                    ...prevState,
                    stock: stockMinimo.toString()
                  }));
                  console.log(`✅ Stock calculado: ${stockMinimo} unidades (limitado por: ${insumoLimitante})`);
                } else {
                  console.log('⚠️ No se pudo calcular stock: faltan insumos');
                  setFormData(prevState => ({
                    ...prevState,
                    stock: '0'
                  }));
                }
              }
            } else {
              console.log('⚠️ El producto no tiene receta asociada');
            }
          }
        } else {
          // Producto no existe aún, no se puede calcular
          console.log('ℹ️ El producto aún no existe, no se puede calcular stock');
        }
      }
    } catch (error) {
      console.error('Error al calcular stock:', error);
    } finally {
      setCalculandoStock(false);
    }
  };

  /**
   * Función para manejar cambios en el formulario
   * Actualiza el estado con los valores ingresados
   */
  const manejarCambioInput = async (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Si cambia el nombre, calcular stock automáticamente
    if (name === 'nombre' && value.trim() && !productoEditando) {
      // Esperar un momento para evitar cálculos excesivos
      setTimeout(() => {
        calcularStockDisponible(value.trim());
      }, 500);
    }
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
      descripcion: producto.descripcion || ''
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
   * Agrega un nuevo producto o actualiza uno existente usando Axios
   */
  const manejarEnvioFormulario = async (e) => {
    e.preventDefault();
    
    // Valida que todos los campos estén llenos
    if (!formData.nombre || !formData.precio || !formData.categoria || (!formData.stock && formData.stock !== 0 && formData.stock !== '0')) {
      showError('Por favor, completa todos los campos obligatorios');
      return;
    }

    // Categorías cuyo stock es automático por receta
    const categoriasConReceta = ['Bebidas Calientes', 'Bebidas Frías', 'Bebidas'];
    const usaReceta = categoriasConReceta.includes(formData.categoria);

    const stockValue = (!productoEditando && usaReceta) ? 0 : parseInt(formData.stock) || 0;
    console.log('📦 Datos a enviar:', {
      nombre: formData.nombre,
      precio: parseFloat(formData.precio),
      categoria: formData.categoria,
      stock: stockValue,
      descripcion: formData.descripcion || '',
      destacado: formData.destacado || 0,
      productoEditando: !!productoEditando,
      usaReceta: usaReceta
    });
    
    const datosProducto = {
      nombre: formData.nombre,
      precio: parseFloat(formData.precio),
      categoria: formData.categoria,
      // Si es nuevo producto y usa receta, enviar stock 0; si está editando, enviar el stock ingresado
      stock: stockValue,
      descripcion: formData.descripcion || '',
      destacado: formData.destacado || 0
    };

    try {
      if (productoEditando) {
        // Actualizar producto existente usando Axios
        const productoId = productoEditando.id_producto || productoEditando.id;
        const response = await axios.put(
          `${API_CONFIG.BASE_URL}${API_CONFIG.PRODUCTOS.UPDATE}?id=${productoId}`,
          datosProducto
        );
        
        if (response.data && response.data.success) {
          showSuccess('Producto actualizado correctamente');
          // Recargar la lista de productos
          const productosResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.PRODUCTOS.LIST);
          if (productosResponse.data && productosResponse.data.success) {
            setListaProductos(productosResponse.data.data);
          }
        }
      } else {
        // Agregar nuevo producto usando Axios
        const response = await axios.post(
          API_CONFIG.BASE_URL + API_CONFIG.PRODUCTOS.CREATE,
          datosProducto
        );
        
        if (response.data && response.data.success) {
          // Mensaje amigable considerando stock automático
          const msg = response.data.stock_automatico
            ? 'Producto creado. El stock se calculará automáticamente al definir su receta.'
            : 'Producto agregado correctamente';
          showSuccess(msg);
          // Recargar la lista de productos
          const productosResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.PRODUCTOS.LIST);
          if (productosResponse.data && productosResponse.data.success) {
            setListaProductos(productosResponse.data.data);
          }
        }
      }

      // Limpiar formulario
      setFormData({
        nombre: '',
        precio: '',
        categoria: '',
        stock: '',
        descripcion: '',
        destacado: 0
      });
      setMostrarFormulario(false);
      setProductoEditando(null);
      
      window.dispatchEvent(new CustomEvent('dashboardActualizado', {
        detail: { accion: 'producto_agregado' }
      }));
      
      cerrarFormulario();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      // Mostrar detalle del backend si existe
      const backendMsg = error?.response?.data?.error
        || error?.response?.data?.message
        || 'Error al guardar el producto. Intenta nuevamente.';
      showError(backendMsg);
    }
  };

  /**
   * Función para eliminar un producto usando Axios
   * Pide confirmación antes de eliminar
   */
  const eliminarProductoHandler = async (productoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        const response = await axios.delete(
          `${API_CONFIG.BASE_URL}${API_CONFIG.PRODUCTOS.DELETE}?id=${productoId}`
        );
        
        if (response.data && response.data.success) {
          alert('Producto eliminado correctamente');
          // Recargar la lista de productos
          const productosResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.PRODUCTOS.LIST);
          if (productosResponse.data && productosResponse.data.success) {
            setListaProductos(productosResponse.data.data);
          }
        }
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('Error al eliminar el producto. Intenta nuevamente.');
      }
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
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
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

      {/* Filtros */}
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="filtroCategoria">Filtrar por categoría:</label>
          <select
            id="filtroCategoria"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="todas">Todas las categorías</option>
            {[...new Set(listaProductos.map((producto) => producto.categoria))].map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filtroEstado">Filtrar por estado:</label>
          <select
            id="filtroEstado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los productos</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="busqueda">Buscar por nombre:</label>
          <input
            type="text"
            id="busqueda"
            placeholder="Buscar producto..."
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Resumen filtro */}
      <div className="stats-info" style={{ marginTop: '10px' }}>
        <span>Mostrando: <strong>{productosFiltrados.length}</strong> productos</span>
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
              <th>Estado</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((producto) => {
              const estadoProducto = Number(producto.activo ?? 1);
              return (
                <tr key={producto.id_producto || producto.id}>
                  <td className="id-cell">{producto.id_producto || producto.id}</td>
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
                  <td className="estado-cell">
                    <span className={`estado-badge ${estadoProducto === 1 ? 'activo' : 'inactivo'}`}>
                      {estadoProducto === 1 ? 'Activo' : 'Inactivo'}
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
                      onClick={() => eliminarProductoHandler(producto.id_producto || producto.id)}
                      title="Eliminar producto"
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
                  <label htmlFor="stock">
                    Stock * 
                    {calculandoStock && (
                      <span style={{ color: '#D9A261', fontSize: '0.85em', marginLeft: '10px' }}>
                        ⏳ Calculando...
                      </span>
                    )}
                    {!calculandoStock && formData.stock && !productoEditando && (
                      <span style={{ color: '#4CAF50', fontSize: '0.85em', marginLeft: '10px' }}>
                        ✓ Calculado automáticamente
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder={!productoEditando && ['Bebidas Calientes','Bebidas Frías','Bebidas'].includes(formData.categoria) ? 'Se calculará por receta' : 'Ingresa el stock disponible'}
                    min="0"
                    required
                    disabled={calculandoStock || (!productoEditando && ['Bebidas Calientes','Bebidas Frías','Bebidas'].includes(formData.categoria))}
                    style={{
                      backgroundColor: (calculandoStock || (!productoEditando && ['Bebidas Calientes','Bebidas Frías','Bebidas'].includes(formData.categoria))) ? '#f5f5f5' : 'white',
                      cursor: (calculandoStock || (!productoEditando && ['Bebidas Calientes','Bebidas Frías','Bebidas'].includes(formData.categoria))) ? 'wait' : 'text'
                    }}
                  />
                  <small className="form-help" style={{ fontSize: '0.85em', color: '#666', marginTop: '5px', display: 'block' }}>
                    {!productoEditando && ['Bebidas Calientes','Bebidas Frías','Bebidas'].includes(formData.categoria)
                      ? 'Para bebidas nuevas, el stock se calculará automáticamente según la receta y los insumos.'
                      : productoEditando 
                        ? 'Puedes editar el stock manualmente'
                        : 'El stock se calcula automáticamente según la receta y los insumos disponibles'}
                  </small>
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
