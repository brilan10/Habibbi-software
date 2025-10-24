import React, { useState, useEffect } from 'react';
import { getProductos, getInsumos } from '../data/stateManager';
import '../styles/GestionRecetas.css';

/**
 * Componente GestionRecetas - Administración de recetas
 * Versión mejorada que sincroniza con stateManager
 */
const GestionRecetas = () => {
  // Estados básicos
  const [listaRecetas, setListaRecetas] = useState([]);
  const [listaProductos, setListaProductos] = useState([]);
  const [listaInsumos, setListaInsumos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    productoId: '',
    insumos: []
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('GestionRecetas - Cargando datos...');
    
    // Cargar datos desde stateManager (datos actualizados)
    try {
      const productos = getProductos();
      const insumos = getInsumos();
      
      setListaProductos(productos);
      setListaInsumos(insumos);
      
      console.log('GestionRecetas - Datos del stateManager cargados:', { productos, insumos });
    } catch (error) {
      console.log('GestionRecetas - Error cargando del stateManager, usando datos estáticos');
      
      // Fallback a datos estáticos si hay error
      setListaProductos([
        { id: 1, nombre: 'Café Americano', precio: 2500, categoria: 'Bebidas Calientes' },
        { id: 2, nombre: 'Cappuccino', precio: 3500, categoria: 'Bebidas Calientes' },
        { id: 3, nombre: 'Croissant', precio: 1800, categoria: 'Panadería' }
      ]);
      
      setListaInsumos([
        { id: 1, nombre: 'Café en Grano', cantidad: 15, unidad: 'kg' },
        { id: 2, nombre: 'Leche Entera', cantidad: 8, unidad: 'litros' },
        { id: 3, nombre: 'Azúcar', cantidad: 2, unidad: 'kg' }
      ]);
    }
    
    // Recetas precargadas (siempre se mantienen)
    setListaRecetas([
      {
        id: 1,
        productoId: 1,
        productoNombre: 'Café Americano',
        ingredientes: [
          { insumoId: 1, insumoNombre: 'Café en Grano', cantidad: 0.02, unidad: 'kg' },
          { insumoId: 2, insumoNombre: 'Leche Entera', cantidad: 0.1, unidad: 'litros' }
        ]
      },
      {
        id: 2,
        productoId: 2,
        productoNombre: 'Cappuccino',
        ingredientes: [
          { insumoId: 1, insumoNombre: 'Café en Grano', cantidad: 0.02, unidad: 'kg' },
          { insumoId: 2, insumoNombre: 'Leche Entera', cantidad: 0.15, unidad: 'litros' }
        ]
      }
    ]);
    
    console.log('GestionRecetas - Datos cargados correctamente');
  }, []);

  // Función para abrir formulario
  const abrirFormulario = () => {
    setFormData({ productoId: '', insumos: [] });
    setMostrarFormulario(true);
  };

  // Función para cerrar formulario
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setFormData({ productoId: '', insumos: [] });
  };

  // Función para agregar insumo al formulario
  const agregarInsumo = () => {
    setFormData({
      ...formData,
      insumos: [...formData.insumos, { insumoId: '', cantidad: '', unidad: 'kg' }]
    });
  };

  // Función para actualizar insumo en el formulario
  const actualizarInsumo = (index, campo, valor) => {
    const nuevosInsumos = [...formData.insumos];
    nuevosInsumos[index] = { ...nuevosInsumos[index], [campo]: valor };
    setFormData({ ...formData, insumos: nuevosInsumos });
  };

  // Función para eliminar insumo del formulario
  const eliminarInsumo = (index) => {
    const nuevosInsumos = formData.insumos.filter((_, i) => i !== index);
    setFormData({ ...formData, insumos: nuevosInsumos });
  };

  // Función para guardar receta
  const guardarReceta = () => {
    if (!formData.productoId) {
      alert('Por favor, selecciona un producto');
      return;
    }
    
    if (formData.insumos.length === 0) {
      alert('Por favor, agrega al menos un insumo');
      return;
    }

    // Validar que todos los insumos tengan datos
    const insumosIncompletos = formData.insumos.some(insumo => 
      !insumo.insumoId || !insumo.cantidad || !insumo.unidad
    );
    
    if (insumosIncompletos) {
      alert('Por favor, completa todos los campos de los insumos');
      return;
    }

    // Obtener nombre del producto
    const producto = listaProductos.find(p => p.id === parseInt(formData.productoId));
    
    // Preparar ingredientes con nombres
    const ingredientes = formData.insumos.map(insumo => {
      const insumoData = listaInsumos.find(i => i.id === parseInt(insumo.insumoId));
      return {
        insumoId: parseInt(insumo.insumoId),
        insumoNombre: insumoData ? insumoData.nombre : 'Insumo no encontrado',
        cantidad: parseFloat(insumo.cantidad),
        unidad: insumo.unidad
      };
    });

    // Crear nueva receta
    const nuevaReceta = {
      id: Date.now(),
      productoId: parseInt(formData.productoId),
      productoNombre: producto ? producto.nombre : 'Producto no encontrado',
      ingredientes: ingredientes
    };

    // Agregar a la lista
    setListaRecetas([...listaRecetas, nuevaReceta]);
    alert('Receta agregada correctamente');
    cerrarFormulario();
  };

  // Función para eliminar receta
  const eliminarReceta = (recetaId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
      setListaRecetas(listaRecetas.filter(r => r.id !== recetaId));
      alert('Receta eliminada correctamente');
    }
  };

  console.log('GestionRecetas - Renderizando con:', { listaRecetas, listaProductos, listaInsumos });

  return (
    <div className="gestion-recetas-container">
      {/* Header de la página */}
      <div className="page-header">
        <h1 className="page-title">📝 Gestión de Recetas</h1>
        <p className="page-subtitle">Administra las recetas e ingredientes de cada producto</p>
      </div>

      {/* Barra de acciones */}
      <div className="actions-bar">
        <button 
          className="btn btn-primary"
          onClick={abrirFormulario}
        >
          ➕ Nueva Receta
        </button>
        <div className="stats-info">
          <span>Total recetas: <strong>{listaRecetas.length}</strong></span>
        </div>
      </div>

      {/* Lista de recetas */}
      <div className="recetas-grid">
        {listaRecetas.map((receta) => (
          <div key={receta.id} className="receta-card">
            <div className="receta-header">
              <h3 className="receta-producto">{receta.productoNombre}</h3>
              <div className="receta-acciones">
                <button
                  className="btn-accion eliminar"
                  onClick={() => eliminarReceta(receta.id)}
                  title="Eliminar receta"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <div className="receta-insumos">
              <h4>Ingredientes:</h4>
              <ul className="insumos-lista">
                {receta.ingredientes.map((ingrediente, index) => (
                  <li key={index} className="insumo-item">
                    <span className="insumo-nombre">{ingrediente.insumoNombre}</span>
                    <span className="insumo-cantidad">
                      {ingrediente.cantidad} {ingrediente.unidad}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Modal del formulario */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📝 Nueva Receta</h3>
            
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
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre}
                    </option>
                  ))}
                </select>
              </div>

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
                        {listaInsumos.map(insumoData => (
                          <option key={insumoData.id} value={insumoData.id}>
                            {insumoData.nombre}
                          </option>
                        ))}
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
                        value={insumo.unidad}
                        onChange={(e) => actualizarInsumo(index, 'unidad', e.target.value)}
                        className="form-control"
                        required
                      >
                        <option value="kg">kg</option>
                        <option value="litros">litros</option>
                        <option value="gramos">gramos</option>
                        <option value="ml">ml</option>
                        <option value="unidades">unidades</option>
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
                  Guardar Receta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionRecetas;