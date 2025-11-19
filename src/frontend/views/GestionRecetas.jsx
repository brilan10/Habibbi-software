import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';
import { useNotification } from '../hooks/useNotification';
import NotificationContainer from '../components/NotificationContainer';
import '../styles/GestionRecetas.css';

/**
 * Componente GestionRecetas - Administración de recetas
 * Conectado al backend para obtener datos reales
 * @param {Object} usuario - Usuario autenticado (opcional, para verificar permisos)
 */
const GestionRecetas = ({ usuario = null }) => {
  // Determinar si el usuario es vendedor (solo lectura)
  const esVendedor = usuario?.rol === 'vendedor';
  // Hook para notificaciones
  const { notifications, showSuccess, showError, showWarning, removeNotification } = useNotification();
  
  // Estados básicos
  const [listaRecetas, setListaRecetas] = useState([]);
  const [listaProductos, setListaProductos] = useState([]);
  const [listaInsumos, setListaInsumos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroActivo, setFiltroActivo] = useState('todos'); // 'todos', 'activos', 'inactivos'
  const [recetaEditando, setRecetaEditando] = useState(null); // ID de la receta que se está editando
  const [confirmacionEliminar, setConfirmacionEliminar] = useState(null); // Estado para confirmación de eliminación
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    productoId: '',
    tamaño: 'M', // Tamaño base: M (350ml)
    insumos: []
  });

  // Función para cargar recetas desde el backend
  const cargarRecetas = async () => {
    try {
      const recetasResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.RECETAS.LIST);
      console.log('📥 Respuesta completa del backend:', recetasResponse.data);
      
      if (recetasResponse.data && recetasResponse.data.success) {
        setListaRecetas(recetasResponse.data.data || []);
        console.log('✅ Recetas cargadas:', recetasResponse.data.data?.length || 0, 'recetas');
      } else {
        console.warn('⚠️ Backend no devolvió success=true:', recetasResponse.data);
        setListaRecetas([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar recetas:', error);
      console.error('❌ Detalles del error:', error.response?.data || error.message);
      showError('Error al cargar recetas: ' + (error.response?.data?.error || error.message));
      setListaRecetas([]);
    }
  };

  // Cargar datos al montar el componente desde el backend
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        // Cargar productos desde el backend
        const productosResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.PRODUCTOS.LIST);
        if (productosResponse.data && productosResponse.data.success) {
          setListaProductos(productosResponse.data.data);
          console.log('✅ Productos cargados:', productosResponse.data.data);
        }

        // Cargar insumos desde el backend
        const insumosResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.INSUMOS.LIST);
        if (insumosResponse.data && insumosResponse.data.success) {
          setListaInsumos(insumosResponse.data.data);
          console.log('✅ Insumos cargados:', insumosResponse.data.data);
        }

        // Cargar recetas desde el backend
        await cargarRecetas();
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  // Función para abrir formulario (nuevo)
  const abrirFormulario = async () => {
    // Recargar insumos para obtener los más recientes
    try {
      const insumosResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.INSUMOS.LIST);
      if (insumosResponse.data && insumosResponse.data.success) {
        setListaInsumos(insumosResponse.data.data);
        console.log('✅ Insumos recargados:', insumosResponse.data.data);
      }
    } catch (error) {
      console.error('Error al recargar insumos:', error);
    }
    
    setRecetaEditando(null);
    setFormData({ productoId: '', tamaño: 'M', insumos: [] });
    setMostrarFormulario(true);
  };

  // Función para abrir formulario en modo edición
  const abrirFormularioEdicion = async (recetaId) => {
    try {
      // Cargar datos de la receta
      const response = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.RECETAS.GET + '/' + recetaId);
      
      if (response.data && response.data.success) {
        const receta = response.data.data;
        
        // Recargar insumos
        const insumosResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.INSUMOS.LIST);
        if (insumosResponse.data && insumosResponse.data.success) {
          setListaInsumos(insumosResponse.data.data);
        }
        
        // Preparar datos del formulario
        const insumosFormulario = receta.insumos.map(ingrediente => {
          // Convertir cantidad de litros a la unidad original si es necesario
          let cantidad = ingrediente.cantidad;
          const insumoCompleto = insumosResponse.data.data.find(i => i.id_insumo == ingrediente.id_insumo);
          let unidad = ingrediente.unidad || (insumoCompleto?.unidad || 'L');
          
          // Si la cantidad es menor a 1 y la unidad es L, probablemente sea ml o cc
          if (unidad === 'L' && cantidad < 1) {
            unidad = 'ml';
            cantidad = cantidad * 1000;
          }
          
          return {
            insumoId: ingrediente.id_insumo.toString(),
            cantidad: cantidad.toString(),
            unidad: unidad
          };
        });
        
        setRecetaEditando(recetaId);
        setFormData({
          productoId: receta.id_producto.toString(),
          tamaño: receta.tamaño || 'M',
          insumos: insumosFormulario
        });
        setMostrarFormulario(true);
      } else {
        showError('Error al cargar la receta para editar');
      }
    } catch (error) {
      console.error('Error al cargar receta para editar:', error);
      showError('Error al cargar la receta para editar');
    }
  };

  // Función para cerrar formulario
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setRecetaEditando(null);
    setFormData({ productoId: '', tamaño: 'M', insumos: [] });
  };

  // Función para agregar insumo al formulario
  const agregarInsumo = () => {
    setFormData({
      ...formData,
      insumos: [...formData.insumos, { insumoId: '', cantidad: '', unidad: 'L' }]
    });
  };

  // Función para actualizar insumo en el formulario
  const actualizarInsumo = (index, campo, valor) => {
    const nuevosInsumos = [...formData.insumos];
    nuevosInsumos[index] = { ...nuevosInsumos[index], [campo]: valor };
    
    // Si se cambia el insumo, establecer la unidad por defecto del insumo
    if (campo === 'insumoId' && valor) {
      const insumoSeleccionado = listaInsumos.find(i => i.id_insumo == valor);
      if (insumoSeleccionado) {
        nuevosInsumos[index].unidad = insumoSeleccionado.unidad || 'L';
      }
    }
    
    setFormData({ ...formData, insumos: nuevosInsumos });
  };

  // Función para eliminar insumo del formulario
  const eliminarInsumo = (index) => {
    const nuevosInsumos = formData.insumos.filter((_, i) => i !== index);
    setFormData({ ...formData, insumos: nuevosInsumos });
  };

  // Función para guardar receta (crear o actualizar)
  const guardarReceta = async () => {
    if (!formData.productoId) {
      showError('Por favor, selecciona un producto');
      return;
    }
    
    if (formData.insumos.length === 0) {
      showError('Por favor, agrega al menos un insumo');
      return;
    }

    // Validar que todos los insumos tengan datos
    const insumosIncompletos = formData.insumos.some(insumo => 
      !insumo.insumoId || !insumo.cantidad
    );
    
    if (insumosIncompletos) {
      showError('Por favor, completa todos los campos de los insumos');
      return;
    }

    // Validar que no haya insumos duplicados
    const insumosIds = formData.insumos.map(i => parseInt(i.insumoId));
    const insumosDuplicados = insumosIds.filter((id, index) => insumosIds.indexOf(id) !== index);
    
    if (insumosDuplicados.length > 0) {
      const nombresDuplicados = insumosDuplicados.map(id => {
        const insumo = listaInsumos.find(i => i.id_insumo == id);
        return insumo ? insumo.nombre : 'Insumo desconocido';
      });
      showError('No puedes agregar el mismo insumo más de una vez: ' + nombresDuplicados.join(', '));
      return;
    }

    try {
      // Preparar datos para enviar al backend
      // Nota: Convertir ml y cc a litros si es necesario
      const insumosData = formData.insumos.map(insumo => {
        let cantidad = parseFloat(insumo.cantidad);
        const unidadSeleccionada = insumo.unidad || listaInsumos.find(i => i.id_insumo == insumo.insumoId)?.unidad || 'L';
        
        // Convertir a litros si la unidad seleccionada es ml o cc
        if (unidadSeleccionada === 'ml') {
          cantidad = cantidad / 1000; // ml a litros
        } else if (unidadSeleccionada === 'cc') {
          cantidad = cantidad / 1000; // cc a litros (1 cc = 1 ml)
        }
        
        return {
          id_insumo: parseInt(insumo.insumoId),
          cantidad: cantidad
        };
      });

      // Obtener el producto para determinar si es bebida
      const productoSeleccionado = listaProductos.find(p => p.id_producto == formData.productoId);
      const esBebida = productoSeleccionado && 
        (productoSeleccionado.categoria?.includes('Bebida') || 
         productoSeleccionado.categoria?.includes('Frías') ||
         productoSeleccionado.categoria?.includes('Calientes'));
      
      // Preparar datos de la receta
      const recetaData = {
        id_producto: parseInt(formData.productoId),
        tamaño: esBebida ? formData.tamaño : 'unico', // Guardar tamaño solo para bebidas
        insumos: insumosData
      };
      
      // Si estamos editando, incluir el nombre actual de la receta
      if (recetaEditando) {
        const recetaActual = listaRecetas.find(r => r.id_receta === recetaEditando);
        if (recetaActual) {
          // Mantener el nombre actual de la receta
          recetaData.nombre = recetaActual.nombre || `Receta ${productoSeleccionado?.nombre || ''}`;
        } else {
          // Si no encontramos la receta, generar un nombre basado en el producto
          recetaData.nombre = `Receta ${productoSeleccionado?.nombre || ''}`;
        }
      }

      console.log('📤 Enviando receta al backend:', recetaData);
      
      let response;
      if (recetaEditando) {
        // Actualizar receta existente
        response = await axios.put(
          API_CONFIG.BASE_URL + API_CONFIG.RECETAS.UPDATE + '/' + recetaEditando,
          recetaData
        );
      } else {
        // Crear nueva receta
        response = await axios.post(
          API_CONFIG.BASE_URL + API_CONFIG.RECETAS.CREATE,
          recetaData
        );
      }
      
      console.log('📥 Respuesta del backend:', response.data);

      if (response.data && response.data.success) {
        showSuccess(recetaEditando ? '✅ Receta actualizada correctamente' : '✅ Receta agregada correctamente');
        
        // Recargar recetas desde el backend
        await cargarRecetas();
        
        cerrarFormulario();
      } else {
        const errorMsg = response.data?.error || response.data?.message || 'Error desconocido';
        console.error('Error del backend:', response.data);
        showError('Error al guardar: ' + errorMsg);
      }
    } catch (error) {
      console.error('Error al guardar receta:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      showError('Error al guardar la receta: ' + errorMsg);
      
      // Mostrar detalles completos en consola para debug
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
        console.error('Status:', error.response.status);
      }
    }
  };

  // Función para solicitar eliminación (mostrar modal)
  const solicitarEliminacion = (recetaId) => {
    const receta = listaRecetas.find(r => r.id_receta === recetaId);
    if (receta) {
      setConfirmacionEliminar({
        id: recetaId,
        nombre: receta?.producto_nombre || receta?.nombre || 'esta receta'
      });
    }
  };

  // Función para cancelar eliminación
  const cancelarEliminacion = () => {
    setConfirmacionEliminar(null);
  };

  // Función para confirmar eliminación (desactivar)
  const confirmarEliminacion = async () => {
    if (!confirmacionEliminar) return;

    try {
      const response = await axios.delete(
        API_CONFIG.BASE_URL + API_CONFIG.RECETAS.DELETE + '/' + confirmacionEliminar.id
      );

      if (response.data && response.data.success) {
        showSuccess(`✅ Receta "${confirmacionEliminar.nombre}" desactivada correctamente`);
        
        // Cerrar el modal
        setConfirmacionEliminar(null);
        
        // Recargar recetas desde el backend
        const recetasResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.RECETAS.LIST);
        if (recetasResponse.data && recetasResponse.data.success) {
          setListaRecetas(recetasResponse.data.data);
        }
      } else {
        showError('Error al desactivar la receta');
      }
    } catch (error) {
      console.error('Error al desactivar receta:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      showError('Error al desactivar la receta: ' + errorMsg);
    }
  };

  // Función para activar receta
  const activarReceta = async (recetaId) => {
    const receta = listaRecetas.find(r => r.id_receta === recetaId);
    const nombreReceta = receta?.producto_nombre || receta?.nombre || 'esta receta';

    try {
      // Enviar PUT con body vacío pero con query parameter para activar
      const response = await axios.put(
        API_CONFIG.BASE_URL + API_CONFIG.RECETAS.UPDATE + '/' + recetaId + '?accion=activar',
        {} // Body vacío
      );

      if (response.data && response.data.success) {
        showSuccess(`✅ Receta "${nombreReceta}" activada correctamente`);
        
        // Recargar recetas desde el backend
        const recetasResponse = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.RECETAS.LIST);
        if (recetasResponse.data && recetasResponse.data.success) {
          setListaRecetas(recetasResponse.data.data);
        }
      } else {
        showError('Error al activar la receta');
      }
    } catch (error) {
      console.error('Error al activar receta:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      showError('Error al activar la receta: ' + errorMsg);
    }
  };

  // Función para determinar categoría basándose en el nombre del producto
  const determinarCategoria = (nombreProducto) => {
    if (!nombreProducto) return 'otra';
    const nombre = nombreProducto.toLowerCase();
    
    // Bebidas calientes
    if (nombre.includes('café') || nombre.includes('cafe') || 
        nombre.includes('capuccino') || nombre.includes('latte') || 
        nombre.includes('expresso') || nombre.includes('espresso') ||
        nombre.includes('americano') || nombre.includes('mocha') ||
        nombre.includes('té') || nombre.includes('te') || nombre.includes('chocolate caliente')) {
      return 'bebida-caliente';
    }
    
    // Bebidas heladas
    if (nombre.includes('jugo') || nombre.includes('limonada') || 
        nombre.includes('frappé') || nombre.includes('frappe') ||
        nombre.includes('smoothie') || nombre.includes('helado')) {
      return 'bebida-helada';
    }
    
    // Comestibles
    if (nombre.includes('sandwich') || nombre.includes('croissant') || 
        nombre.includes('torta') || nombre.includes('torta') ||
        nombre.includes('brownie') || nombre.includes('muffin') ||
        nombre.includes('queque') || nombre.includes('kek') ||
        nombre.includes('pan') || nombre.includes('galleta') ||
        nombre.includes('cheesecake') || nombre.includes('pastel')) {
      return 'comestible';
    }
    
    return 'otra';
  };

  // Filtrar recetas por categoría y estado activo
  const recetasFiltradas = listaRecetas.filter(receta => {
    // Filtro por categoría
    if (filtroCategoria !== 'todas') {
      const categoria = determinarCategoria(receta.producto_nombre);
      if (categoria !== filtroCategoria) {
        return false;
      }
    }
    
    // Filtro por estado activo/inactivo
    if (filtroActivo !== 'todos') {
      const activo = receta.activo !== undefined ? receta.activo : 
                     (receta['1=Activa, 0=Inactiva'] !== undefined ? receta['1=Activa, 0=Inactiva'] : 1);
      
      if (filtroActivo === 'activos' && activo !== 1) {
        return false;
      }
      if (filtroActivo === 'inactivos' && activo !== 0) {
        return false;
      }
    }
    
    return true;
  });

  console.log('GestionRecetas - Renderizando con:', { listaRecetas, listaProductos, listaInsumos });

  return (
    <div className="gestion-recetas-container">
      <NotificationContainer 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />
      {/* Header de la página */}
      <div className="page-header">
        <h1 className="page-title">📝 Gestión de Recetas</h1>
        <p className="page-subtitle">Administra las recetas e ingredientes de cada producto</p>
      </div>

      {/* Barra de acciones */}
      <div className="actions-bar">
        {!esVendedor && (
          <button 
            className="btn btn-primary"
            onClick={abrirFormulario}
          >
            ➕ Nueva Receta
          </button>
        )}
        {esVendedor && (
          <div style={{ color: '#666', fontStyle: 'italic', padding: '8px 0' }}>
            📖 Modo de solo lectura - Solo puedes ver las recetas
          </div>
        )}
        
        {/* Filtro por categoría */}
        <div className="filtros" style={{ marginLeft: '20px'}}>
          <label htmlFor="filtro-categoria">Filtrar por categoría:</label>
          <select
            id="filtro-categoria"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="form-control"
            style={{ width: '200px', marginLeft: '10px' }}
          >
            <option value="todas">Todas las recetas</option>
            <option value="bebida-caliente">Bebidas Calientes</option>
            <option value="bebida-helada">Bebidas Heladas</option>
            <option value="comestible">Comestibles</option>
          </select>
        </div>
        
        {/* Filtro por estado activo/inactivo */}
        <div className="filtros" style={{ marginLeft: '20px'}}>
          <label htmlFor="filtro-activo">Filtrar por estado:</label>
          <select
            id="filtro-activo"
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value)}
            className="form-control"
            style={{ width: '180px', marginLeft: '10px' }}
          >
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
        
        <div className="stats-info">
          <span>Total recetas: <strong>{recetasFiltradas.length}</strong> / {listaRecetas.length}</span>
        </div>
      </div>

      {/* Lista de recetas */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Cargando datos...</p>
        </div>
      ) : (
        <div className="recetas-grid">
          {recetasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', gridColumn: '1 / -1' }}>
              <p>No hay recetas en esta categoría</p>
            </div>
          ) : (
            recetasFiltradas.map((receta) => (
            <div key={receta.id_receta} className="receta-card">
              <div className="receta-header">
                <h3 className="receta-producto">{receta.producto_nombre || receta.nombre}</h3>
                <div className="receta-acciones">
                  {!esVendedor && (
                    <button
                      className="btn-accion editar"
                      onClick={() => abrirFormularioEdicion(receta.id_receta)}
                      title="Editar receta"
                      style={{ marginRight: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ✏️ Editar
                    </button>
                  )}
                  {(() => {
                    const activo = receta.activo !== undefined ? receta.activo : 
                                   (receta['1=Activa, 0=Inactiva'] !== undefined ? receta['1=Activa, 0=Inactiva'] : 1);
                    
                    if (!esVendedor) {
                      if (activo === 0) {
                        // Si está inactiva, mostrar botón de activar
                        return (
                          <button
                            className="btn-accion activar"
                            onClick={() => activarReceta(receta.id_receta)}
                            title="Activar receta"
                            style={{ marginRight: '8px', backgroundColor: '#28a745', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            ✅ Activar
                          </button>
                        );
                      } else {
                        // Si está activa, mostrar botón de eliminar
                        return (
                          <button
                            className="btn-accion eliminar"
                            onClick={() => solicitarEliminacion(receta.id_receta)}
                            title="Desactivar receta"
                          >
                            🗑️
                          </button>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              </div>
              
              <div className="receta-insumos">
                <h4>Ingredientes:</h4>
                <ul className="insumos-lista">
                  {receta.insumos && (() => {
                    // Eliminar duplicados por id_insumo antes de mostrar
                    const ingredientesUnicos = [];
                    const insumosVistos = new Set();
                    
                    receta.insumos.forEach(ingrediente => {
                      const clave = `${ingrediente.id_insumo}_${ingrediente.cantidad}_${ingrediente.unidad}`;
                      if (!insumosVistos.has(clave)) {
                        ingredientesUnicos.push(ingrediente);
                        insumosVistos.add(clave);
                      }
                    });
                    
                    return ingredientesUnicos.map((ingrediente) => (
                      <li key={`${ingrediente.id_detalle || ingrediente.id_insumo}_${ingrediente.cantidad}`} className="insumo-item">
                        <span className="insumo-nombre">{ingrediente.insumo_nombre}</span>
                        <span className="insumo-cantidad">
                          {ingrediente.cantidad} {ingrediente.unidad}
                        </span>
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
            ))
          )}
        </div>
      )}

      {/* Modal del formulario */}
      {mostrarFormulario && !esVendedor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{recetaEditando ? '✏️ Editar Receta' : '📝 Nueva Receta'}</h3>
            
            <form onSubmit={(e) => { e.preventDefault(); guardarReceta(); }} className="receta-form">
              {/* Selector de producto */}
              <div className="form-group">
                <label htmlFor="producto">Producto *</label>
                <select
                  id="producto"
                  value={formData.productoId}
                  onChange={(e) => setFormData({ ...formData, productoId: e.target.value })}
                  className="form-control"
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {listaProductos.map(producto => (
                    <option key={producto.id_producto} value={producto.id_producto}>
                      {producto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de tamaño (solo para bebidas) */}
              {(() => {
                const productoSeleccionado = listaProductos.find(p => p.id_producto == formData.productoId);
                const esBebida = productoSeleccionado && 
                  (productoSeleccionado.categoria?.includes('Bebida') || 
                   productoSeleccionado.categoria?.includes('Frías') ||
                   productoSeleccionado.categoria?.includes('Calientes'));
                
                if (esBebida) {
                  return (
                    <div className="form-group">
                      <label htmlFor="tamaño">Tamaño del Vaso (Base) *</label>
                      <select
                        id="tamaño"
                        value={formData.tamaño}
                        onChange={(e) => setFormData({ ...formData, tamaño: e.target.value })}
                        className="form-control"
                        required
                      >
                        <option value="S">S (Pequeño - 250ml)</option>
                        <option value="M">M (Mediano - 350ml) - Base recomendada</option>
                        <option value="L">L (Grande - 500ml)</option>
                      </select>
                      <small className="form-help" style={{ color: '#666', fontSize: '0.85em' }}>
                        💡 Las cantidades de insumos ingresadas corresponden a este tamaño base. 
                        En el punto de venta se calcularán automáticamente las proporciones para otros tamaños.
                      </small>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Lista de insumos */}
              <div className="insumos-section">
                <div className="insumos-header">
                  <h4>Ingredientes de la Receta</h4>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={agregarInsumo}
                  >
                    ➕ Agregar Insumo
                  </button>
                </div>

                {formData.insumos.map((insumo, index) => (
                  <div key={index} className="insumo-form-row">
                    <div className="form-group">
                      <label>Insumo</label>
                      <select
                        value={insumo.insumoId}
                        onChange={(e) => actualizarInsumo(index, 'insumoId', e.target.value)}
                        className="form-control"
                        required
                      >
                        <option value="">Selecciona un insumo</option>
                        {(() => {
                          // Eliminar duplicados por nombre+unidad (mostrar solo uno de cada combinación, sin case sensitive)
                          const insumosUnicos = listaInsumos.filter((insumoData, idx, self) => 
                            idx === self.findIndex(i => 
                              i.nombre.toLowerCase().trim() === insumoData.nombre.toLowerCase().trim() && 
                              i.unidad === insumoData.unidad
                            )
                          );
                          
                          // Filtrar los ya seleccionados en otros campos
                          const insumosFiltrados = insumosUnicos.filter(insumoData => {
                            // Verificar que este insumo (por nombre+unidad) no esté ya seleccionado en otro campo
                            const yaSeleccionado = formData.insumos.some((i, idx) => {
                              if (idx === index || !i.insumoId) return false;
                              const insumoSeleccionado = listaInsumos.find(ins => ins.id_insumo == i.insumoId);
                              return insumoSeleccionado && 
                                     insumoSeleccionado.nombre.toLowerCase().trim() === insumoData.nombre.toLowerCase().trim() &&
                                     insumoSeleccionado.unidad === insumoData.unidad;
                            });
                            
                            // Mostrar si no está seleccionado, o si es el insumo actual de este campo
                            return !yaSeleccionado || insumoData.id_insumo == insumo.insumoId;
                          });
                          
                          return insumosFiltrados.map(insumoData => (
                            <option key={insumoData.id_insumo} value={insumoData.id_insumo}>
                              {insumoData.nombre} ({insumoData.unidad})
                            </option>
                          ));
                        })()}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Cantidad</label>
                      <input
                        type="number"
                        step="0.01"
                        value={insumo.cantidad}
                        onChange={(e) => actualizarInsumo(index, 'cantidad', e.target.value)}
                        className="form-control"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Unidad</label>
                      <select
                        value={insumo.unidad || (listaInsumos.find(i => i.id_insumo == insumo.insumoId)?.unidad || 'L')}
                        onChange={(e) => actualizarInsumo(index, 'unidad', e.target.value)}
                        className="form-control"
                        required
                      >
                        <option value="L">L (Litros)</option>
                        <option value="ml">ml (Mililitros)</option>
                        <option value="cc">cc (Centímetros cúbicos)</option>
                        <option value="kg">kg (Kilogramos)</option>
                        <option value="g">g (Gramos)</option>
                        <option value="unidad">unidad (Unidades)</option>
                      </select>
                    </div>
                    
                    <button
                      type="button"
                      className="btn-eliminar"
                      onClick={() => eliminarInsumo(index)}
                      title="Eliminar insumo"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
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
                  {recetaEditando ? 'Actualizar Receta' : 'Guardar Receta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación de eliminación elegante */}
      {confirmacionEliminar && (
        <div className="confirmacion-eliminar-overlay">
          <div className="confirmacion-eliminar-modal">
            <div className="confirmacion-header">
              <span className="confirmacion-icon">⚠️</span>
              <h4>Confirmar Desactivación</h4>
            </div>
            <div className="confirmacion-content">
              <p>¿Estás seguro de que quieres desactivar la receta <strong>"{confirmacionEliminar.nombre}"</strong>?</p>
              <div className="confirmacion-warning">
                <p>⚠️ Esta acción desactivará la receta. Podrás reactivarla más tarde.</p>
              </div>
            </div>
            <div className="confirmacion-buttons">
              <button 
                className="btn-cancelar"
                onClick={cancelarEliminacion}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={confirmarEliminacion}
              >
                🗑️ Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionRecetas;