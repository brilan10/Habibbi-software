/**
 * ARCHIVO: GestionProveedores.jsx
 * 
 * Componente React para la gestión completa de proveedores
 * Permite crear, editar, eliminar y visualizar proveedores de insumos
 * 
 * FUNCIONALIDADES:
 * - Listar todos los proveedores activos
 * - Crear nuevos proveedores
 * - Editar proveedores existentes
 * - Eliminar proveedores (con validación de insumos asociados)
 * - Interfaz moderna con modales y notificaciones
 */

// Importar React y los hooks necesarios
// useState: permite crear y manejar estado en componentes funcionales
// useEffect: permite ejecutar efectos secundarios (como cargar datos) cuando el componente se monta
import React, { useState, useEffect } from 'react';

// Importar axios para hacer peticiones HTTP al backend
// axios es una biblioteca que facilita las peticiones HTTP (GET, POST, PUT, DELETE)
import axios from 'axios';

// Importar la configuración de URLs del API
// API_CONFIG contiene todas las URLs base y endpoints del backend
import API_CONFIG from '../config/apiConfig';

// Importar el hook personalizado para notificaciones
// useNotification proporciona funciones para mostrar notificaciones (éxito, error, advertencia)
import { useNotification } from '../hooks/useNotification';

// Importar el componente contenedor de notificaciones
// NotificationContainer muestra las notificaciones en pantalla
import NotificationContainer from '../components/NotificationContainer';

// Importar los estilos CSS específicos para este componente
// Los estilos están en GestionProveedores.css
import '../styles/GestionProveedores.css';

/**
 * Componente GestionProveedores
 * 
 * Componente funcional de React que gestiona proveedores
 * No recibe props (parámetros), es un componente independiente
 */
const GestionProveedores = () => {
  // =====================================================
  // HOOKS Y ESTADO
  // =====================================================
  
  /**
   * Hook useNotification
   * 
   * Desestructuración del objeto retornado por useNotification()
   * Obtiene las funciones y el estado necesario para mostrar notificaciones
   * 
   * notifications: Array con las notificaciones actuales
   * showSuccess: Función para mostrar notificación de éxito (verde)
   * showError: Función para mostrar notificación de error (rojo)
   * showWarning: Función para mostrar notificación de advertencia (amarillo)
   * removeNotification: Función para eliminar una notificación específica
   */
  const { notifications, showSuccess, showError, showWarning, removeNotification } = useNotification();
  
  /**
   * Estado: listaProveedores
   * 
   * useState([]) crea un estado inicializado con un array vacío
   * listaProveedores: Variable que contiene el array de proveedores
   * setListaProveedores: Función para actualizar el array de proveedores
   * 
   * Este estado almacena todos los proveedores cargados desde el backend
   */
  const [listaProveedores, setListaProveedores] = useState([]);
  
  /**
   * Estado: cargando
   * 
   * useState(true) inicializa el estado como true (cargando)
   * cargando: Indica si se están cargando datos del servidor
   * setCargando: Función para cambiar el estado de carga
   * 
   * Se usa para mostrar un indicador de carga mientras se obtienen los datos
   */
  const [cargando, setCargando] = useState(true);
  
  /**
   * Estado: mostrarFormulario
   * 
   * useState(false) inicializa como false (formulario oculto)
   * mostrarFormulario: Controla si el modal del formulario está visible
   * setMostrarFormulario: Función para mostrar/ocultar el formulario
   * 
   * Cuando es true, se muestra el modal para crear/editar proveedor
   */
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  /**
   * Estado: proveedorEditando
   * 
   * useState(null) inicializa como null (ningún proveedor en edición)
   * proveedorEditando: Almacena el objeto del proveedor que se está editando
   * setProveedorEditando: Función para establecer qué proveedor se está editando
   * 
   * Si es null, se está creando un nuevo proveedor
   * Si tiene un objeto, se está editando ese proveedor
   */
  const [proveedorEditando, setProveedorEditando] = useState(null);
  
  /**
   * Estado: formData
   * 
   * useState({...}) inicializa con un objeto con campos vacíos
   * formData: Almacena los datos del formulario (nombre, teléfono, email, dirección)
   * setFormData: Función para actualizar los datos del formulario
   * 
   * Este objeto se usa tanto para crear como para editar proveedores
   */
  const [formData, setFormData] = useState({
    nombre: '',      // Nombre del proveedor (requerido)
    telefono: '',    // Teléfono de contacto (opcional)
    email: '',       // Email de contacto (opcional)
    direccion: ''    // Dirección física (opcional)
  });
  
  /**
   * Estado: confirmacionEliminar
   * 
   * useState(null) inicializa como null (ninguna confirmación pendiente)
   * confirmacionEliminar: Almacena el proveedor que se quiere eliminar (para mostrar confirmación)
   * setConfirmacionEliminar: Función para establecer qué proveedor se quiere eliminar
   * 
   * Si es null, no hay confirmación pendiente
   * Si tiene un objeto, se muestra el modal de confirmación para ese proveedor
   */
  const [confirmacionEliminar, setConfirmacionEliminar] = useState(null);

  // =====================================================
  // FUNCIONES
  // =====================================================
  
  /**
   * Función: cargarProveedores
   * 
   * Función asíncrona que carga la lista de proveedores desde el backend
   * async indica que la función puede usar await para esperar operaciones asíncronas
   */
  const cargarProveedores = async () => {
    // Bloque try-catch para manejar errores
    // Si ocurre un error en el try, se ejecuta el catch
    try {
      // Establecer el estado de carga como true
      // Esto muestra el indicador de "Cargando..." en la interfaz
      setCargando(true);
      
      // Crear un timestamp único para evitar caché del navegador
      // new Date().getTime() obtiene el tiempo actual en milisegundos desde 1970
      // Se agrega como parámetro ?_t=timestamp a la URL para forzar una petición fresca
      const timestamp = new Date().getTime();
      
      // Construir la URL completa del endpoint
      // API_CONFIG.BASE_URL contiene la URL base (ej: http://localhost/habibbi-backend)
      // '/api/proveedores' es el endpoint para obtener proveedores
      // `?_t=${timestamp}` agrega el timestamp como parámetro de consulta para evitar caché
      // Template literals (backticks) permiten interpolar variables con ${}
      const url = API_CONFIG.BASE_URL + '/api/proveedores' + `?_t=${timestamp}`;
      
      // Log de debugging: mostrar la URL desde la que se cargarán los proveedores
      // console.log() escribe en la consola del navegador (útil para desarrollo)
      console.log('🔄 Cargando proveedores desde:', url);
      
      // Hacer petición GET al backend usando axios
      // await espera a que la petición HTTP termine antes de continuar
      // axios.get() hace una petición HTTP GET y retorna una Promise
      // La respuesta se guarda en la variable response
      const response = await axios.get(url);
      
      // Logs de debugging: mostrar información completa de la respuesta
      console.log('📥 Respuesta completa:', response);
      console.log('📥 response.data:', response.data);
      console.log('📥 response.status:', response.status);
      
      // Verificar si la respuesta fue exitosa
      // response.data contiene el cuerpo de la respuesta (JSON parseado)
      // response.data.success indica si la operación fue exitosa (true/false)
      if (response.data && response.data.success) {
        // Extraer el array de proveedores de la respuesta
        // response.data.data contiene el array de proveedores
        // || [] es un fallback: si data es null/undefined, usa un array vacío
        const proveedores = response.data.data || [];
        
        // Logs de debugging: mostrar información sobre los proveedores cargados
        console.log('✅ Proveedores cargados:', proveedores.length);
        console.log('✅ Datos de proveedores:', proveedores);
        
        // Actualizar el estado con los proveedores obtenidos
        // setListaProveedores() actualiza el estado y causa un re-render del componente
        setListaProveedores(proveedores);
        
        // Si no hay proveedores, mostrar advertencia en consola
        if (proveedores.length === 0) {
          console.warn('⚠️ No hay proveedores en la respuesta');
        }
      } else {
        // Si la respuesta no fue exitosa, manejar el error
        console.error('❌ Respuesta del servidor sin éxito:', response.data);
        console.error('❌ response.data.success:', response.data?.success);
        
        // Establecer lista vacía si no hay éxito
        setListaProveedores([]);
        
        // Si hay un mensaje de error en la respuesta, mostrarlo al usuario
        if (response.data && response.data.error) {
          // showError() muestra una notificación roja con el mensaje de error
          showError('Error: ' + response.data.error);
        }
      }
    } catch (error) {
      // Si ocurre un error en la petición HTTP (red, servidor, etc.)
      // catch captura el error y lo maneja
      
      // Logs detallados del error para debugging
      console.error('❌ Error completo al cargar proveedores:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response.data:', error.response?.data);
      console.error('❌ Error message:', error.message);
      
      // Extraer el mensaje de error más descriptivo posible
      // error.response?.data?.error: Error del servidor (si existe)
      // error.message: Mensaje de error de la petición
      // 'Error desconocido': Fallback si no hay mensaje
      // ?. es optional chaining: evita errores si response o data son null/undefined
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      
      // Mostrar notificación de error al usuario
      showError('Error al cargar proveedores: ' + errorMessage);
      
      // Establecer lista vacía en caso de error
      setListaProveedores([]);
    } finally {
      // Bloque finally siempre se ejecuta, haya error o no
      // Establecer carga como false para ocultar el indicador de carga
      setCargando(false);
    }
  };

  /**
   * Hook useEffect
   * 
   * useEffect ejecuta código cuando el componente se monta o cuando cambian las dependencias
   * 
   * Primer parámetro: función a ejecutar
   * Segundo parámetro: array de dependencias ([] significa que solo se ejecuta al montar)
   * 
   * En este caso, carga los proveedores cuando el componente se monta por primera vez
   */
  useEffect(() => {
    // Llamar a la función para cargar proveedores al montar el componente
    cargarProveedores();
  }, []); // Array vacío [] significa que solo se ejecuta una vez al montar

  /**
   * Función: manejarCambioInput
   * 
   * Maneja los cambios en los campos del formulario
   * Se ejecuta cada vez que el usuario escribe en un input
   * 
   * @param {Event} e - Evento del cambio en el input
   */
  const manejarCambioInput = (e) => {
    // Desestructurar el objeto event.target para obtener name y value
    // name: nombre del campo (ej: "nombre", "telefono")
    // value: valor actual del campo (lo que el usuario escribió)
    const { name, value } = e.target;
    
    // Actualizar el estado formData con el nuevo valor
    // prevState es el estado anterior de formData
    // ...prevState copia todas las propiedades del estado anterior
    // [name]: value actualiza solo la propiedad que cambió
    // 
    // Ejemplo: Si name="nombre" y value="Café Premium"
    // Resultado: { nombre: "Café Premium", telefono: "...", email: "...", direccion: "..." }
    setFormData(prevState => ({
      ...prevState,  // Mantener todos los campos anteriores
      [name]: value  // Actualizar solo el campo que cambió (usando computed property name)
    }));
  };

  /**
   * Función: abrirFormularioNuevo
   * 
   * Prepara el formulario para crear un nuevo proveedor
   * Se ejecuta cuando el usuario hace clic en "Agregar Proveedor"
   */
  const abrirFormularioNuevo = () => {
    // Resetear el formulario a valores vacíos
    setFormData({
      nombre: '',
      telefono: '',
      email: '',
      direccion: ''
    });
    
    // Establecer que no se está editando ningún proveedor
    setProveedorEditando(null);
    
    // Mostrar el modal del formulario
    setMostrarFormulario(true);
  };

  /**
   * Función: abrirFormularioEdicion
   * 
   * Prepara el formulario para editar un proveedor existente
   * Se ejecuta cuando el usuario hace clic en el botón de editar (✏️)
   * 
   * @param {Object} proveedor - Objeto con los datos del proveedor a editar
   */
  const abrirFormularioEdicion = (proveedor) => {
    // Cargar los datos del proveedor en el formulario
    // || '' es un fallback: si el campo es null/undefined, usa cadena vacía
    setFormData({
      nombre: proveedor.nombre || '',        // Nombre del proveedor
      telefono: proveedor.telefono || '',    // Teléfono (puede ser null)
      email: proveedor.email || '',          // Email (puede ser null)
      direccion: proveedor.direccion || ''   // Dirección (puede ser null)
    });
    
    // Establecer qué proveedor se está editando
    // Esto permite saber si es creación o edición cuando se guarde
    setProveedorEditando(proveedor);
    
    // Mostrar el modal del formulario
    setMostrarFormulario(true);
  };

  /**
   * Función: cerrarFormulario
   * 
   * Cierra el formulario y limpia los datos
   * Se ejecuta cuando el usuario hace clic en "Cancelar" o en la X
   */
  const cerrarFormulario = () => {
    // Ocultar el modal del formulario
    setMostrarFormulario(false);
    
    // Limpiar el proveedor en edición
    setProveedorEditando(null);
    
    // Resetear el formulario a valores vacíos
    setFormData({
      nombre: '',
      telefono: '',
      email: '',
      direccion: ''
    });
  };

  /**
   * Función: guardarProveedor
   * 
   * Guarda un proveedor (crea nuevo o actualiza existente)
   * Se ejecuta cuando el usuario hace clic en "Crear" o "Actualizar"
   */
  const guardarProveedor = async () => {
    // Validación: verificar que el nombre no esté vacío
    // trim() elimina espacios en blanco al inicio y final
    // Si después de trim() está vacío, mostrar error y salir
    if (!formData.nombre.trim()) {
      showError('El nombre es requerido');
      return; // Terminar la ejecución de la función
    }

    // Bloque try-catch para manejar errores de la petición HTTP
    try {
      // Verificar si se está editando un proveedor existente
      if (proveedorEditando) {
        // ============================================
        // ACTUALIZAR PROVEEDOR EXISTENTE
        // ============================================
        
        // Hacer petición PUT para actualizar el proveedor
        // PUT es el método HTTP para actualizar recursos existentes
        // La URL incluye el ID del proveedor: /api/proveedores/{id}
        // formData contiene los nuevos datos del proveedor
        const response = await axios.put(
          API_CONFIG.BASE_URL + '/api/proveedores/' + proveedorEditando.id_proveedor,
          formData  // Datos a enviar en el body de la petición (se convierte a JSON automáticamente)
        );
        
        // Verificar si la actualización fue exitosa
        if (response.data && response.data.success) {
          // Mostrar notificación de éxito
          showSuccess('Proveedor actualizado exitosamente');
          
          // Cerrar el formulario
          cerrarFormulario();
          
          // Recargar la lista de proveedores para mostrar los cambios
          cargarProveedores();
        } else {
          // Si no fue exitoso, mostrar el error del servidor
          // response.data?.error obtiene el mensaje de error (si existe)
          // || 'Error al actualizar proveedor' es un fallback si no hay mensaje
          showError(response.data?.error || 'Error al actualizar proveedor');
        }
      } else {
        // ============================================
        // CREAR NUEVO PROVEEDOR
        // ============================================
        
        // Hacer petición POST para crear un nuevo proveedor
        // POST es el método HTTP para crear nuevos recursos
        // La URL es /api/proveedores (sin ID porque es nuevo)
        // formData contiene los datos del nuevo proveedor
        const response = await axios.post(
          API_CONFIG.BASE_URL + '/api/proveedores',
          formData  // Datos a enviar en el body de la petición
        );
        
        // Verificar si la creación fue exitosa
        if (response.data && response.data.success) {
          // Mostrar notificación de éxito
          showSuccess('Proveedor creado exitosamente');
          
          // Cerrar el formulario
          cerrarFormulario();
          
          // Recargar la lista de proveedores para mostrar el nuevo proveedor
          cargarProveedores();
        } else {
          // Si no fue exitoso, mostrar el error del servidor
          showError(response.data?.error || 'Error al crear proveedor');
        }
      }
    } catch (error) {
      // Si ocurre un error en la petición HTTP
      console.error('Error al guardar proveedor:', error);
      
      // Extraer el mensaje de error más descriptivo
      const errorMessage = error.response?.data?.error || error.message || 'Error al guardar proveedor';
      
      // Mostrar notificación de error al usuario
      showError(errorMessage);
    }
  };

  /**
   * Función: confirmarEliminar
   * 
   * Muestra el modal de confirmación antes de eliminar un proveedor
   * Se ejecuta cuando el usuario hace clic en el botón de eliminar (🗑️)
   * 
   * @param {Object} proveedor - Objeto con los datos del proveedor a eliminar
   */
  const confirmarEliminar = (proveedor) => {
    // Guardar el proveedor que se quiere eliminar en el estado
    // Esto hace que se muestre el modal de confirmación
    setConfirmacionEliminar(proveedor);
  };

  /**
   * Función: cancelarEliminar
   * 
   * Cancela la eliminación y cierra el modal de confirmación
   * Se ejecuta cuando el usuario hace clic en "Cancelar" en el modal de confirmación
   */
  const cancelarEliminar = () => {
    // Limpiar el estado de confirmación (oculta el modal)
    setConfirmacionEliminar(null);
  };

  /**
   * Función: eliminarProveedor
   * 
   * Elimina un proveedor del servidor
   * Se ejecuta cuando el usuario confirma la eliminación
   */
  const eliminarProveedor = async () => {
    // Verificar que hay un proveedor para eliminar
    // Si no hay, salir de la función (protección contra errores)
    if (!confirmacionEliminar) return;

    // Bloque try-catch para manejar errores
    try {
      // Hacer petición DELETE para eliminar el proveedor
      // DELETE es el método HTTP para eliminar recursos
      // La URL incluye el ID del proveedor: /api/proveedores/{id}
      const response = await axios.delete(
        API_CONFIG.BASE_URL + '/api/proveedores/' + confirmacionEliminar.id_proveedor
      );
      
      // Verificar si la eliminación fue exitosa
      if (response.data && response.data.success) {
        // Mostrar notificación de éxito
        showSuccess('Proveedor eliminado exitosamente');
        
        // Cerrar el modal de confirmación
        setConfirmacionEliminar(null);
        
        // Recargar la lista de proveedores para reflejar la eliminación
        cargarProveedores();
      } else {
        // Si no fue exitoso, mostrar el error
        showError(response.data?.error || 'Error al eliminar proveedor');
        
        // Cerrar el modal de confirmación
        setConfirmacionEliminar(null);
      }
    } catch (error) {
      // Si ocurre un error en la petición HTTP
      console.error('Error al eliminar proveedor:', error);
      
      // Extraer el mensaje de error más descriptivo
      const errorMessage = error.response?.data?.error || error.message || 'Error al eliminar proveedor';
      
      // Mostrar notificación de error
      showError(errorMessage);
      
      // Cerrar el modal de confirmación
      setConfirmacionEliminar(null);
    }
  };

  // =====================================================
  // RENDERIZADO (JSX)
  // =====================================================
  
  /**
   * Return del componente
   * 
   * Retorna el JSX (JavaScript XML) que define la estructura HTML del componente
   * JSX es una sintaxis que permite escribir HTML dentro de JavaScript
   */
  return (
    // Contenedor principal del componente
    // className es el atributo para clases CSS (equivalente a class en HTML)
    <div className="gestion-proveedores-container">
      {/* Header de la página */}
      {/* Los comentarios en JSX se escriben entre {/* */} */}
      <div className="page-header">
        {/* Título principal con emoji */}
        <h1 className="page-title">🏢 Gestión de Proveedores</h1>
        
        {/* Subtítulo descriptivo */}
        <p className="page-subtitle">Administra los proveedores de insumos</p>
      </div>

      {/* Barra de acciones con botón para agregar proveedor */}
      <div className="action-bar">
        {/* Botón para abrir el formulario de nuevo proveedor */}
        {/* onClick es el evento que se ejecuta al hacer clic */}
        <button 
          className="btn btn-primary"  // Clases CSS para estilizar el botón
          onClick={abrirFormularioNuevo}  // Función a ejecutar al hacer clic
        >
          ➕ Agregar Proveedor  {/* Texto del botón con emoji */}
        </button>
      </div>

      {/* Renderizado condicional de la tabla de proveedores */}
      {/* Operador ternario: condición ? valor_si_verdadero : valor_si_falso */}
      {cargando ? (
        // Si está cargando, mostrar indicador de carga
        <div className="loading-container">
          <p>Cargando proveedores...</p>
        </div>
      ) : listaProveedores.length === 0 ? (
        // Si no hay proveedores, mostrar mensaje y botón para agregar el primero
        <div className="empty-state">
          <p>No hay proveedores registrados</p>
          <button className="btn btn-primary" onClick={abrirFormularioNuevo}>
            Agregar primer proveedor
          </button>
        </div>
      ) : (
        // Si hay proveedores, mostrar la tabla
        <div className="table-container">
          {/* Tabla HTML para mostrar los proveedores */}
          <table className="data-table">
            {/* Encabezado de la tabla */}
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            {/* Cuerpo de la tabla */}
            <tbody>
              {/* Mapear cada proveedor a una fila de la tabla */}
              {/* map() itera sobre el array y retorna un elemento JSX por cada item */}
              {/* key es un atributo requerido en React para identificar cada elemento */}
              {listaProveedores.map((proveedor) => (
                <tr key={proveedor.id_proveedor}>
                  {/* Mostrar el ID del proveedor */}
                  <td>{proveedor.id_proveedor}</td>
                  
                  {/* Mostrar el nombre del proveedor */}
                  <td>{proveedor.nombre}</td>
                  
                  {/* Mostrar teléfono o guión si no hay teléfono */}
                  {/* || es el operador OR: si telefono es null/undefined/vacío, muestra '-' */}
                  <td>{proveedor.telefono || '-'}</td>
                  
                  {/* Mostrar email o guión si no hay email */}
                  <td>{proveedor.email || '-'}</td>
                  
                  {/* Mostrar dirección o guión si no hay dirección */}
                  <td>{proveedor.direccion || '-'}</td>
                  
                  {/* Columna de acciones (editar y eliminar) */}
                  <td>
                    <div className="action-buttons">
                      {/* Botón para editar proveedor */}
                      <button
                        className="btn btn-edit"  // Clase CSS para estilo de edición
                        onClick={() => abrirFormularioEdicion(proveedor)}  // Arrow function que llama a la función con el proveedor
                        title="Editar proveedor"  // Tooltip que aparece al pasar el mouse
                      >
                        ✏️  {/* Emoji de lápiz */}
                      </button>
                      
                      {/* Botón para eliminar proveedor */}
                      <button
                        className="btn btn-delete"  // Clase CSS para estilo de eliminación
                        onClick={() => confirmarEliminar(proveedor)}  // Arrow function que muestra confirmación
                        title="Eliminar proveedor"  // Tooltip
                      >
                        🗑️  {/* Emoji de basurero */}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal del formulario (solo se muestra si mostrarFormulario es true) */}
      {/* && es el operador AND: si mostrarFormulario es true, renderiza el modal */}
      {mostrarFormulario && (
        // Overlay (fondo oscuro) del modal
        // onClick={cerrarFormulario} cierra el modal al hacer clic fuera de él
        <div className="modal-overlay" onClick={cerrarFormulario}>
          {/* Contenedor del modal */}
          {/* onClick={(e) => e.stopPropagation()} previene que el clic se propague al overlay */}
          {/* stopPropagation() evita que el clic en el modal cierre el modal */}
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Encabezado del modal */}
            <div className="modal-header">
              {/* Título dinámico: "Editar Proveedor" o "Nuevo Proveedor" */}
              {/* Operador ternario: si hay proveedorEditando, muestra "Editar", sino "Nuevo" */}
              <h2>{proveedorEditando ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              
              {/* Botón para cerrar el modal (X) */}
              <button className="btn-close" onClick={cerrarFormulario}>✕</button>
            </div>
            
            {/* Cuerpo del modal con el formulario */}
            <div className="modal-body">
              {/* Campo: Nombre (requerido) */}
              <div className="form-group">
                {/* Etiqueta del campo */}
                <label htmlFor="nombre">Nombre *</label>
                
                {/* Input de texto para el nombre */}
                <input
                  type="text"  // Tipo de input (texto)
                  id="nombre"  // ID para asociar con el label
                  name="nombre"  // Nombre del campo (se usa en manejarCambioInput)
                  value={formData.nombre}  // Valor controlado desde el estado
                  onChange={manejarCambioInput}  // Función que se ejecuta al cambiar el valor
                  placeholder="Nombre del proveedor"  // Texto de ayuda cuando está vacío
                  required  // Atributo HTML5 para validación (campo obligatorio)
                />
              </div>

              {/* Campo: Teléfono (opcional) */}
              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"  // Tipo de input para teléfono (muestra teclado numérico en móviles)
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={manejarCambioInput}
                  placeholder="Teléfono de contacto"
                />
              </div>

              {/* Campo: Email (opcional) */}
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"  // Tipo de input para email (validación HTML5 básica)
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={manejarCambioInput}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              {/* Campo: Dirección (opcional, textarea) */}
              <div className="form-group">
                <label htmlFor="direccion">Dirección</label>
                {/* textarea permite múltiples líneas de texto */}
                <textarea
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={manejarCambioInput}
                  placeholder="Dirección del proveedor"
                  rows="3"  // Número de filas visibles
                />
              </div>
            </div>

            {/* Pie del modal con botones de acción */}
            <div className="modal-footer">
              {/* Botón para cancelar */}
              <button className="btn btn-secondary" onClick={cerrarFormulario}>
                Cancelar
              </button>
              
              {/* Botón para guardar (crear o actualizar) */}
              {/* Texto dinámico: "Actualizar" si está editando, "Crear" si es nuevo */}
              <button className="btn btn-primary" onClick={guardarProveedor}>
                {proveedorEditando ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {/* Solo se muestra si hay un proveedor en confirmacionEliminar */}
      {confirmacionEliminar && (
        // Overlay del modal de confirmación
        <div className="modal-overlay" onClick={cancelarEliminar}>
          {/* Contenedor del modal de confirmación */}
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            {/* Encabezado del modal */}
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
            </div>
            
            {/* Cuerpo del modal con el mensaje de confirmación */}
            <div className="modal-body">
              {/* Mensaje de confirmación con el nombre del proveedor */}
              <p>
                ¿Estás seguro de que deseas eliminar el proveedor{' '}
                {/* strong hace el texto en negrita */}
                <strong>{confirmacionEliminar.nombre}</strong>?
              </p>
              
              {/* Advertencia si el proveedor tiene insumos asociados */}
              {/* Solo se muestra si insumos_asociados > 0 */}
              {confirmacionEliminar.insumos_asociados > 0 && (
                <p className="warning-text">
                  ⚠️ Este proveedor tiene {confirmacionEliminar.insumos_asociados} insumo(s) asociado(s).
                </p>
              )}
            </div>
            
            {/* Pie del modal con botones */}
            <div className="modal-footer">
              {/* Botón para cancelar la eliminación */}
              <button className="btn btn-secondary" onClick={cancelarEliminar}>
                Cancelar
              </button>
              
              {/* Botón para confirmar la eliminación */}
              <button className="btn btn-danger" onClick={eliminarProveedor}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de notificaciones */}
      {/* NotificationContainer muestra las notificaciones (éxito, error, advertencia) */}
      <NotificationContainer
        notifications={notifications}  // Array de notificaciones a mostrar
        removeNotification={removeNotification}  // Función para eliminar notificaciones
      />
    </div>
  );
};

// Exportar el componente para que pueda ser importado en otros archivos
// export default permite importarlo como: import GestionProveedores from './GestionProveedores'
export default GestionProveedores;
