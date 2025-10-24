const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

/**
 * Script para crear un paquete del proyecto para subir a GitHub
 */

function createProjectPackage() {
  console.log('📦 Creando paquete del proyecto Habibbi Software...\n');

  // Crear archivo ZIP del proyecto
  const output = fs.createWriteStream('habibbi-software.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log('✅ Paquete creado exitosamente!');
    console.log(`📁 Archivo: habibbi-software.zip (${archive.pointer()} bytes)`);
    console.log('\n📋 Instrucciones para subir a GitHub:');
    console.log('1. Ve a https://github.com/brilan10/Habibbi-software');
    console.log('2. Haz clic en "uploading an existing file"');
    console.log('3. Arrastra el archivo habibbi-software.zip');
    console.log('4. GitHub extraerá automáticamente los archivos');
    console.log('5. Haz commit con el mensaje "Initial commit"');
  });

  archive.on('error', (err) => {
    console.log('❌ Error creando el paquete:', err);
  });

  archive.pipe(output);

  // Agregar archivos del proyecto
  const projectPath = __dirname;
  
  // Archivos principales
  const mainFiles = [
    'package.json',
    'webpack.config.js',
    '.babelrc',
    '.gitignore',
    'README.md',
    'LICENSE',
    'INFORME_INTERFACES.md'
  ];

  mainFiles.forEach(file => {
    if (fs.existsSync(path.join(projectPath, file))) {
      archive.file(path.join(projectPath, file), { name: file });
      console.log(`📄 Agregando: ${file}`);
    }
  });

  // Agregar directorios
  const directories = ['src', 'public', 'database', 'backend'];
  
  directories.forEach(dir => {
    const dirPath = path.join(projectPath, dir);
    if (fs.existsSync(dirPath)) {
      archive.directory(dirPath, dir);
      console.log(`📁 Agregando directorio: ${dir}`);
    }
  });

  // Finalizar el archivo
  archive.finalize();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createProjectPackage();
}

module.exports = { createProjectPackage };
