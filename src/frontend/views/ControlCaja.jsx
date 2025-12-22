import React, { useState, useEffect } from 'react';
import '../styles/ControlCaja.css';
import AlertModal from '../components/AlertModal';
import InputModal from '../components/InputModal';

/**
 * Componente ControlCaja - Gestión de caja diaria
 * Permite apertura, cierre y control de efectivo
 */
const ControlCaja = () => {
  // Estados para el control de caja
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [fechaApertura, setFechaApertura] = useState(null);
  const [fechaCierre, setFechaCierre] = useState(null);
  const [efectivoInicial, setEfectivoInicial] = useState(0);
  const [efectivoActual, setEfectivoActual] = useState(0);
  const [ventasEfectivo, setVentasEfectivo] = useState(0);
  const [ventasTarjeta, setVentasTarjeta] = useState(0);
  const [totalVentas, setTotalVentas] = useState(0);
  const [movimientos, setMovimientos] = useState([]);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [alerta, setAlerta] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [mostrarModalAbrir, setMostrarModalAbrir] = useState(false);
  const [mostrarModalMovimiento, setMostrarModalMovimiento] = useState(false);

  // Cargar estado de caja al montar el componente
  useEffect(() => {
    // Simular carga de datos de caja
    const cargarEstadoCaja = () => {
      // En una app real, esto vendría del servidor
      const estadoCaja = localStorage.getItem('estadoCaja');
      if (estadoCaja) {
        const datos = JSON.parse(estadoCaja);
        setCajaAbierta(datos.cajaAbierta || false);
        setFechaApertura(datos.fechaApertura);
        setEfectivoInicial(datos.efectivoInicial || 0);
        setEfectivoActual(datos.efectivoActual || 0);
        setVentasEfectivo(datos.ventasEfectivo || 0);
        setVentasTarjeta(datos.ventasTarjeta || 0);
        setTotalVentas(datos.totalVentas || 0);
        setMovimientos(datos.movimientos || []);
      }
    };

    cargarEstadoCaja();

    // Escuchar cambios en localStorage para sincronizar con ventas
    const manejarCambioStorage = () => {
      console.log('🔄 ControlCaja - Detectando cambio en localStorage');
      cargarEstadoCaja();
    };

    // Escuchar cambios en localStorage
    window.addEventListener('storage', manejarCambioStorage);
    
    // Escuchar eventos personalizados de actualización
    window.addEventListener('cajaActualizada', manejarCambioStorage);
    window.addEventListener('ventaRealizada', manejarCambioStorage);

    return () => {
      window.removeEventListener('storage', manejarCambioStorage);
      window.removeEventListener('cajaActualizada', manejarCambioStorage);
      window.removeEventListener('ventaRealizada', manejarCambioStorage);
    };
  }, []);

  // Función para formatear moneda
  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(cantidad);
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString('es-CL');
  };

  // Función para forzar actualización manual
  const forzarActualizacion = () => {
    console.log('🔄 Forzando actualización de Control de Caja...');
    const estadoCaja = localStorage.getItem('estadoCaja');
    if (estadoCaja) {
      const datos = JSON.parse(estadoCaja);
      setCajaAbierta(datos.cajaAbierta || false);
      setFechaApertura(datos.fechaApertura);
      setEfectivoInicial(datos.efectivoInicial || 0);
      setEfectivoActual(datos.efectivoActual || 0);
      setVentasEfectivo(datos.ventasEfectivo || 0);
      setVentasTarjeta(datos.ventasTarjeta || 0);
      setTotalVentas(datos.totalVentas || 0);
      setMovimientos(datos.movimientos || []);
      console.log('✅ Control de Caja actualizado manualmente');
    }
  };

  // Función para abrir caja
  const abrirCaja = () => {
    setMostrarModalAbrir(true);
  };

  // Función para confirmar apertura de caja
  const confirmarAbrirCaja = (efectivoInicialInput) => {
    // El modal devuelve directamente el valor cuando hay un solo campo
    const valor = typeof efectivoInicialInput === 'string' ? efectivoInicialInput : 
                  (efectivoInicialInput?.efectivoInicial || efectivoInicialInput || '');
    const efectivoInicialNum = parseFloat(valor) || 0;
    
    if (valor === '' || valor === null || valor === undefined || isNaN(efectivoInicialNum)) {
      setAlerta({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Por favor, ingresa un valor válido para el efectivo inicial'
      });
      setMostrarModalAbrir(false);
      return;
    }

    if (efectivoInicialNum < 0) {
      setAlerta({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'El efectivo inicial no puede ser negativo'
      });
      setMostrarModalAbrir(false);
      return;
    }

    const ahora = new Date().toISOString();
    const nuevoEstado = {
      cajaAbierta: true,
      fechaApertura: ahora,
      efectivoInicial: efectivoInicialNum,
      efectivoActual: efectivoInicialNum,
      ventasEfectivo: 0,
      ventasTarjeta: 0,
      totalVentas: 0,
      movimientos: [{
        id: Date.now(),
        tipo: 'apertura',
        descripcion: 'Apertura de caja',
        monto: efectivoInicialNum,
        fecha: ahora
      }]
    };

    setCajaAbierta(true);
    setFechaApertura(ahora);
    setEfectivoInicial(efectivoInicialNum);
    setEfectivoActual(efectivoInicialNum);
    setVentasEfectivo(0);
    setVentasTarjeta(0);
    setTotalVentas(0);
    setMovimientos(nuevoEstado.movimientos);

    // Guardar en localStorage
    localStorage.setItem('estadoCaja', JSON.stringify(nuevoEstado));
    
    setMostrarModalAbrir(false);
    
    setAlerta({
      isOpen: true,
      type: 'success',
      title: 'Caja Abierta',
      message: `Caja abierta con ${formatearMoneda(efectivoInicialNum)}`
    });
  };

  // Función para cerrar caja
  const cerrarCaja = () => {
    if (!cajaAbierta) {
      setAlerta({
        isOpen: true,
        type: 'warning',
        title: 'Caja Cerrada',
        message: 'La caja no está abierta. Primero debes abrir la caja.'
      });
      return;
    }

    // Mostrar modal de confirmación con detalles
    setMostrarModalCierre(true);
  };

  // Función para confirmar el cierre de caja
  const confirmarCierreCaja = () => {
    const efectivoEsperado = efectivoInicial + ventasEfectivo;
    const diferencia = efectivoActual - efectivoEsperado;

    const ahora = new Date().toISOString();
    const nuevoMovimiento = {
      id: Date.now(),
      tipo: 'cierre',
      descripcion: 'Cierre de caja',
      monto: efectivoActual,
      fecha: ahora,
      diferencia: diferencia
    };

    const nuevoEstado = {
      cajaAbierta: false,
      fechaApertura: null,
      fechaCierre: ahora,
      efectivoInicial: 0,
      efectivoActual: 0,
      ventasEfectivo: 0,
      ventasTarjeta: 0,
      totalVentas: 0,
      movimientos: [...movimientos, nuevoMovimiento]
    };

    setCajaAbierta(false);
    setFechaCierre(ahora);
    setEfectivoInicial(0);
    setEfectivoActual(0);
    setVentasEfectivo(0);
    setVentasTarjeta(0);
    setTotalVentas(0);
    setMovimientos(nuevoEstado.movimientos);

    // Guardar en localStorage
    localStorage.setItem('estadoCaja', JSON.stringify(nuevoEstado));
    
    // Cerrar modal
    setMostrarModalCierre(false);
    
    // Mostrar confirmación de cierre exitoso
    setAlerta({
      isOpen: true,
      type: 'success',
      title: 'Caja Cerrada',
      message: `Caja cerrada exitosamente. Diferencia: ${formatearMoneda(diferencia)}`
    });
  };

  // Cancelar cierre de caja
  const cancelarCierreCaja = () => {
    setMostrarModalCierre(false);
  };

  // Función para agregar movimiento manual
  const agregarMovimiento = () => {
    setMostrarModalMovimiento(true);
  };

  // Función para confirmar agregar movimiento
  const confirmarAgregarMovimiento = (datos) => {
    // El modal devuelve un objeto cuando hay múltiples campos
    const descripcion = datos.descripcion || '';
    const montoStr = datos.monto || datos;
    const monto = parseFloat(montoStr);
    
    if (!descripcion || descripcion.trim() === '' || isNaN(monto) || montoStr === '') {
      setAlerta({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Datos inválidos. Por favor, completa todos los campos correctamente.'
      });
      setMostrarModalMovimiento(false);
      return;
    }

    const nuevoMovimiento = {
      id: Date.now(),
      tipo: monto > 0 ? 'ingreso' : 'egreso',
      descripcion: descripcion.trim(),
      monto: monto,
      fecha: new Date().toISOString()
    };

    const nuevosMovimientos = [...movimientos, nuevoMovimiento];
    const nuevoEfectivo = efectivoActual + monto;

    setMovimientos(nuevosMovimientos);
    setEfectivoActual(nuevoEfectivo);

    // Guardar en localStorage
    const estadoActual = JSON.parse(localStorage.getItem('estadoCaja') || '{}');
    localStorage.setItem('estadoCaja', JSON.stringify({
      ...estadoActual,
      efectivoActual: nuevoEfectivo,
      movimientos: nuevosMovimientos
    }));

    setMostrarModalMovimiento(false);

    setAlerta({
      isOpen: true,
      type: 'success',
      title: 'Movimiento Agregado',
      message: `Movimiento agregado: ${formatearMoneda(monto)}`
    });
  };

  return (
    <div className="control-caja-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">💰 Control de Caja</h1>
        <p className="page-subtitle">Gestión diaria de efectivo y transacciones</p>
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={forzarActualizacion}
          >
            🔄 Actualizar Datos
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              // Simular venta de prueba en efectivo
              const monto = 2500;
              const estadoCaja = JSON.parse(localStorage.getItem('estadoCaja') || '{}');
              if (estadoCaja.cajaAbierta) {
                const nuevoEfectivo = (estadoCaja.efectivoActual || 0) + monto;
                const nuevasVentasEfectivo = (estadoCaja.ventasEfectivo || 0) + monto;
                const nuevoTotalVentas = (estadoCaja.totalVentas || 0) + monto;

                const estadoActualizado = {
                  ...estadoCaja,
                  efectivoActual: nuevoEfectivo,
                  ventasEfectivo: nuevasVentasEfectivo,
                  totalVentas: nuevoTotalVentas,
                  movimientos: [
                    ...(estadoCaja.movimientos || []),
                    {
                      id: Date.now(),
                      tipo: 'venta',
                      descripcion: 'Venta de Prueba - Café (Efectivo)',
                      monto: monto,
                      fecha: new Date().toISOString()
                    }
                  ]
                };

                localStorage.setItem('estadoCaja', JSON.stringify(estadoActualizado));
                
                // Disparar eventos
                window.dispatchEvent(new CustomEvent('cajaActualizada', {
                  detail: { venta: { total: monto }, estadoCaja: estadoActualizado }
                }));
                
                setAlerta({
                  isOpen: true,
                  type: 'success',
                  title: 'Venta Registrada',
                  message: `Venta en efectivo agregada: $${monto.toLocaleString()} CLP`
                });
                forzarActualizacion();
              } else {
                setAlerta({
                  isOpen: true,
                  type: 'warning',
                  title: 'Caja Cerrada',
                  message: 'La caja debe estar abierta para registrar ventas. Por favor, abre la caja primero.'
                });
              }
            }}
          >
            💰 Venta Efectivo
          </button>
          <button 
            className="btn btn-success" 
            onClick={() => {
              // Simular venta de prueba con tarjeta
              const monto = 3500;
              const estadoCaja = JSON.parse(localStorage.getItem('estadoCaja') || '{}');
              if (estadoCaja.cajaAbierta) {
                const nuevasVentasTarjeta = (estadoCaja.ventasTarjeta || 0) + monto;
                const nuevoTotalVentas = (estadoCaja.totalVentas || 0) + monto;

                const estadoActualizado = {
                  ...estadoCaja,
                  ventasTarjeta: nuevasVentasTarjeta,
                  totalVentas: nuevoTotalVentas,
                  movimientos: [
                    ...(estadoCaja.movimientos || []),
                    {
                      id: Date.now(),
                      tipo: 'venta',
                      descripcion: 'Venta de Prueba - Cappuccino (Tarjeta)',
                      monto: monto,
                      fecha: new Date().toISOString()
                    }
                  ]
                };

                localStorage.setItem('estadoCaja', JSON.stringify(estadoActualizado));
                
                // Disparar eventos
                window.dispatchEvent(new CustomEvent('cajaActualizada', {
                  detail: { venta: { total: monto }, estadoCaja: estadoActualizado }
                }));
                
                setAlerta({
                  isOpen: true,
                  type: 'success',
                  title: 'Venta Registrada',
                  message: `Venta con tarjeta agregada: $${monto.toLocaleString()} CLP`
                });
                forzarActualizacion();
              } else {
                setAlerta({
                  isOpen: true,
                  type: 'warning',
                  title: 'Caja Cerrada',
                  message: 'La caja debe estar abierta para registrar ventas. Por favor, abre la caja primero.'
                });
              }
            }}
          >
            💳 Venta Tarjeta
          </button>
        </div>
      </div>

      {/* Estado de la caja */}
      <div className="estado-caja">
        <div className={`estado-indicator ${cajaAbierta ? 'abierta' : 'cerrada'}`}>
          <div className="estado-icon">
            {cajaAbierta ? '🟢' : '🔴'}
          </div>
          <div className="estado-texto">
            <h3>{cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}</h3>
            <p>
              {cajaAbierta 
                ? `Abierta desde: ${formatearFecha(fechaApertura)}`
                : `Cerrada desde: ${formatearFecha(fechaCierre)}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Resumen financiero */}
      {cajaAbierta && (
        <div className="resumen-financiero">
          <h2 className="section-title">📊 Resumen del Día</h2>
          <div className="resumen-grid">
            <div className="resumen-card">
              <h4>Efectivo Inicial</h4>
              <p className="monto">{formatearMoneda(efectivoInicial)}</p>
            </div>
            <div className="resumen-card">
              <h4>Efectivo Actual</h4>
              <p className="monto">{formatearMoneda(efectivoActual)}</p>
            </div>
            <div className="resumen-card">
              <h4>Ventas Efectivo</h4>
              <p className="monto">{formatearMoneda(ventasEfectivo)}</p>
            </div>
            <div className="resumen-card">
              <h4>Ventas Tarjeta</h4>
              <p className="monto">{formatearMoneda(ventasTarjeta)}</p>
            </div>
            <div className="resumen-card">
              <h4>Total Ventas</h4>
              <p className="monto">{formatearMoneda(totalVentas)}</p>
            </div>
            <div className="resumen-card">
              <h4>Diferencia</h4>
              <p className={`monto ${(efectivoActual - (efectivoInicial + ventasEfectivo)) >= 0 ? 'positivo' : 'negativo'}`}>
                {formatearMoneda(efectivoActual - (efectivoInicial + ventasEfectivo))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Acciones de caja */}
      <div className="acciones-caja">
        <h2 className="section-title">⚡ Acciones</h2>
        <div className="acciones-grid">
          {!cajaAbierta ? (
            <button className="btn btn-success" onClick={abrirCaja}>
              🔓 Abrir Caja
            </button>
          ) : (
            <>
              <button className="btn btn-danger" onClick={cerrarCaja}>
                🔒 Cerrar Caja
              </button>
              <button className="btn btn-secondary" onClick={agregarMovimiento}>
                ➕ Agregar Movimiento
              </button>
            </>
          )}
        </div>
      </div>

      {/* Movimientos recientes */}
      {movimientos.length > 0 && (
        <div className="movimientos-section">
          <h2 className="section-title">📋 Movimientos Recientes</h2>
          <div className="movimientos-lista">
            {movimientos.slice(-10).reverse().map((movimiento) => (
              <div key={movimiento.id} className="movimiento-item">
                <div className="movimiento-info">
                  <h4>{movimiento.descripcion}</h4>
                  <p>{formatearFecha(movimiento.fecha)}</p>
                </div>
                <div className={`movimiento-monto ${movimiento.tipo}`}>
                  {movimiento.tipo === 'egreso' ? '-' : '+'}{formatearMoneda(Math.abs(movimiento.monto))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmación para cerrar caja */}
      {mostrarModalCierre && (
        <ModalCierreCaja
          isOpen={mostrarModalCierre}
          efectivoInicial={efectivoInicial}
          ventasEfectivo={ventasEfectivo}
          efectivoEsperado={efectivoInicial + ventasEfectivo}
          efectivoActual={efectivoActual}
          diferencia={efectivoActual - (efectivoInicial + ventasEfectivo)}
          formatearMoneda={formatearMoneda}
          onConfirm={confirmarCierreCaja}
          onCancel={cancelarCierreCaja}
        />
      )}

      {/* Modal de alerta */}
      <AlertModal
        isOpen={alerta.isOpen}
        type={alerta.type}
        title={alerta.title}
        message={alerta.message}
        onConfirm={() => setAlerta({ ...alerta, isOpen: false })}
      />

      {/* Modal para abrir caja */}
      <InputModal
        isOpen={mostrarModalAbrir}
        title="Abrir Caja"
        message="Ingrese el efectivo inicial con el que abrirá la caja"
        fields={[
          {
            name: 'efectivoInicial',
            label: 'Efectivo Inicial',
            type: 'number',
            placeholder: 'Ingrese el monto inicial',
            min: 0,
            step: 100
          }
        ]}
        confirmText="Abrir Caja"
        cancelText="Cancelar"
        icon="💰"
        onConfirm={confirmarAbrirCaja}
        onCancel={() => setMostrarModalAbrir(false)}
      />

      {/* Modal para agregar movimiento */}
      <InputModal
        isOpen={mostrarModalMovimiento}
        title="Agregar Movimiento"
        message="Registre un movimiento de ingreso o egreso de efectivo"
        fields={[
          {
            name: 'descripcion',
            label: 'Descripción',
            type: 'text',
            placeholder: 'Ej: Retiro para compra, Ingreso adicional...'
          },
          {
            name: 'monto',
            label: 'Monto',
            type: 'number',
            placeholder: '0',
            step: '100'
          }
        ]}
        confirmText="Agregar"
        cancelText="Cancelar"
        icon="💸"
        onConfirm={confirmarAgregarMovimiento}
        onCancel={() => setMostrarModalMovimiento(false)}
      />
    </div>
  );
};

/**
 * Modal personalizado para cerrar caja
 */
const ModalCierreCaja = ({
  isOpen,
  efectivoInicial,
  ventasEfectivo,
  efectivoEsperado,
  efectivoActual,
  diferencia,
  formatearMoneda,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-cierre-overlay" onClick={onCancel}>
      <div className="modal-cierre-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cierre-content">
          {/* Header */}
          <div className="modal-cierre-header">
            <div className="modal-cierre-icon">💰</div>
            <h2 className="modal-cierre-title">Cerrar Caja</h2>
          </div>

          {/* Resumen financiero */}
          <div className="modal-cierre-resumen">
            <div className="resumen-item">
              <span className="resumen-label">Efectivo inicial:</span>
              <span className="resumen-value">{formatearMoneda(efectivoInicial)}</span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">Ventas en efectivo:</span>
              <span className="resumen-value">{formatearMoneda(ventasEfectivo)}</span>
            </div>
            <div className="resumen-item resumen-item-highlight">
              <span className="resumen-label">Efectivo esperado:</span>
              <span className="resumen-value">{formatearMoneda(efectivoEsperado)}</span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">Efectivo actual:</span>
              <span className="resumen-value">{formatearMoneda(efectivoActual)}</span>
            </div>
            <div className={`resumen-item resumen-item-diferencia ${diferencia >= 0 ? 'positivo' : 'negativo'}`}>
              <span className="resumen-label">Diferencia:</span>
              <span className="resumen-value">{formatearMoneda(diferencia)}</span>
            </div>
          </div>

          {/* Mensaje de confirmación */}
          <p className="modal-cierre-mensaje">
            ¿Estás seguro de que deseas cerrar la caja con estos valores?
          </p>

          {/* Botones */}
          <div className="modal-cierre-buttons">
            <button
              className="modal-cierre-btn modal-cierre-btn-cancel"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              className="modal-cierre-btn modal-cierre-btn-confirm"
              onClick={onConfirm}
              autoFocus
            >
              Cerrar Caja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlCaja;
