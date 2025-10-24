import React, { useState, useEffect } from 'react';
import '../styles/ControlCaja.css';

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
    const efectivoInicialInput = prompt('Ingrese el efectivo inicial de la caja:');
    const efectivoInicialNum = parseFloat(efectivoInicialInput) || 0;
    
    if (efectivoInicialNum < 0) {
      alert('El efectivo inicial no puede ser negativo');
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
    
    alert(`Caja abierta con ${formatearMoneda(efectivoInicialNum)}`);
  };

  // Función para cerrar caja
  const cerrarCaja = () => {
    if (!cajaAbierta) {
      alert('La caja no está abierta');
      return;
    }

    const efectivoEsperado = efectivoInicial + ventasEfectivo;
    const diferencia = efectivoActual - efectivoEsperado;
    
    const confirmacion = confirm(
      `¿Cerrar caja?\n\n` +
      `Efectivo inicial: ${formatearMoneda(efectivoInicial)}\n` +
      `Ventas en efectivo: ${formatearMoneda(ventasEfectivo)}\n` +
      `Efectivo esperado: ${formatearMoneda(efectivoEsperado)}\n` +
      `Efectivo actual: ${formatearMoneda(efectivoActual)}\n` +
      `Diferencia: ${formatearMoneda(diferencia)}`
    );

    if (confirmacion) {
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
      
      alert(`Caja cerrada. Diferencia: ${formatearMoneda(diferencia)}`);
    }
  };

  // Función para agregar movimiento manual
  const agregarMovimiento = () => {
    const descripcion = prompt('Descripción del movimiento:');
    const monto = parseFloat(prompt('Monto (positivo para ingreso, negativo para egreso):'));
    
    if (!descripcion || isNaN(monto)) {
      alert('Datos inválidos');
      return;
    }

    const nuevoMovimiento = {
      id: Date.now(),
      tipo: monto > 0 ? 'ingreso' : 'egreso',
      descripcion: descripcion,
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

    alert(`Movimiento agregado: ${formatearMoneda(monto)}`);
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
                
                alert(`Venta en efectivo agregada: $${monto.toLocaleString()} CLP`);
                forzarActualizacion();
              } else {
                alert('⚠️ La caja debe estar abierta para registrar ventas');
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
                
                alert(`Venta con tarjeta agregada: $${monto.toLocaleString()} CLP`);
                forzarActualizacion();
              } else {
                alert('⚠️ La caja debe estar abierta para registrar ventas');
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
    </div>
  );
};

export default ControlCaja;
