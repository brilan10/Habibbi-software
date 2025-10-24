const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Script para subir archivos a GitHub usando la API
 * Requiere un token de GitHub con permisos de repositorio
 */

// Configuración
const GITHUB_TOKEN = 'TU_TOKEN_AQUI'; // Necesitas crear un token en GitHub
const REPO_OWNER = 'brilan10';
const REPO_NAME = 'Habibbi-software';
const BRANCH = 'main';

// Función para hacer peticiones a la API de GitHub
function githubRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Habibbi-Software-Uploader',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Función para obtener el SHA del archivo actual
async function getFileSHA(filePath) {
  try {
    const response = await githubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`);
    return response.data.sha;
  } catch (error) {
    return null; // Archivo no existe
  }
}

// Función para subir un archivo
async function uploadFile(filePath, content) {
  try {
    const sha = await getFileSHA(filePath);
    const base64Content = Buffer.from(content).toString('base64');
    
    const data = {
      message: `Update ${filePath}`,
      content: base64Content,
      branch: BRANCH
    };

    if (sha) {
      data.sha = sha;
    }

    const endpoint = `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
    const method = sha ? 'PUT' : 'POST';
    
    const response = await githubRequest(endpoint, method, data);
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ ${filePath} subido correctamente`);
      return true;
    } else {
      console.log(`❌ Error subiendo ${filePath}:`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error subiendo ${filePath}:`, error.message);
    return false;
  }
}

// Función para recorrer directorios recursivamente
function getAllFiles(dirPath, basePath = '') {
  const files = [];
  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const relativePath = path.join(basePath, item);

    if (fs.statSync(fullPath).isDirectory()) {
      // Ignorar node_modules y otros directorios
      if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
        files.push(...getAllFiles(fullPath, relativePath));
      }
    } else {
      // Ignorar archivos específicos
      if (!item.startsWith('.') || item === '.gitignore') {
        files.push(relativePath);
      }
    }
  });

  return files;
}

// Función principal
async function uploadProject() {
  console.log('🚀 Iniciando subida del proyecto Habibbi Software a GitHub...\n');

  // Verificar que existe el token
  if (GITHUB_TOKEN === 'TU_TOKEN_AQUI') {
    console.log('❌ Error: Necesitas configurar tu token de GitHub');
    console.log('📝 Instrucciones:');
    console.log('1. Ve a https://github.com/settings/tokens');
    console.log('2. Crea un nuevo token con permisos de repositorio');
    console.log('3. Reemplaza "TU_TOKEN_AQUI" en este archivo con tu token');
    return;
  }

  try {
    // Obtener todos los archivos del proyecto
    const projectPath = __dirname;
    const files = getAllFiles(projectPath);

    console.log(`📁 Encontrados ${files.length} archivos para subir\n`);

    let successCount = 0;
    let errorCount = 0;

    // Subir cada archivo
    for (const file of files) {
      try {
        const fullPath = path.join(projectPath, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        const success = await uploadFile(file, content);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }

        // Pequeña pausa para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`❌ Error procesando ${file}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Resumen de la subida:');
    console.log(`✅ Archivos subidos correctamente: ${successCount}`);
    console.log(`❌ Archivos con errores: ${errorCount}`);
    console.log(`📁 Total de archivos procesados: ${files.length}`);

    if (successCount > 0) {
      console.log('\n🎉 ¡Proyecto subido exitosamente a GitHub!');
      console.log(`🔗 Repositorio: https://github.com/${REPO_OWNER}/${REPO_NAME}`);
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  uploadProject();
}

module.exports = { uploadProject };
