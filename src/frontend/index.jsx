import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('🚀 Iniciando aplicación React...');
console.log('📦 React versión:', React.version);
console.log('🌐 Navegador:', navigator.userAgent);

// Función async para inicializar React
async function iniciarReact() {
  // Verificar que el elemento root existe antes de renderizar
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('❌ Error: No se encontró el elemento con id="root" en el HTML');
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #c33;">❌ Error Crítico</h1>
        <p>No se encontró el elemento root. Verifica que el archivo HTML tenga: &lt;div id="root"&gt;&lt;/div&gt;</p>
      </div>
    `;
    return;
  }

  console.log('✅ Elemento root encontrado');
  console.log('📝 Contenido actual del root:', rootElement.innerHTML);
  
  // LIMPIAR COMPLETAMENTE el contenido del root
  rootElement.innerHTML = '';
  rootElement.textContent = '';
  console.log('✅ Contenido del root limpiado completamente');
  
  // Punto de entrada principal de React
  try {
    console.log('🔄 Creando root de React...');
    const root = ReactDOM.createRoot(rootElement);
    console.log('✅ Root de React creado');
    
    console.log('🔄 Renderizando componente App...');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✅ React aplicación iniciada correctamente');
    console.log('✅ Componente App renderizado');
    
  } catch (error) {
    console.error('❌ Error al iniciar React:', error);
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Stack trace:', error.stack);
    mostrarErrorEnPantalla(rootElement, error);
  }
}

function mostrarErrorEnPantalla(rootElement, error) {
  rootElement.innerHTML = `
    <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif; background: #fee; border: 2px solid #c33; border-radius: 8px; margin: 2rem;">
      <h1 style="color: #c33;">❌ Error al Cargar la Aplicación</h1>
      <p style="color: #5a4a3a; font-weight: bold;">${error.message || 'Error desconocido'}</p>
      <details style="margin-top: 1rem; text-align: left;">
        <summary style="cursor: pointer; color: #8C6A4F;">Ver detalles técnicos</summary>
        <pre style="background: #fff; padding: 1rem; border-radius: 4px; overflow: auto; max-height: 200px; font-size: 12px; margin-top: 0.5rem;">${error.stack || 'No hay stack trace disponible'}</pre>
      </details>
      <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #8C6A4F; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
        🔄 Recargar Página
      </button>
    </div>
  `;
}

// Iniciar React
iniciarReact().catch(error => {
  console.error('❌ Error fatal al iniciar React:', error);
});
