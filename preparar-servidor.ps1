# Script para preparar archivos para subir nueva version al servidor
# Elimina archivos innecesarios y copia los archivos necesarios

$servidorPath = "C:\Users\Yomiyo\Desktop\habibbi-servidor-ml-final"
$proyectoPath = "D:\Projects\Habibbi\habibbi-software"

Write-Host "Preparando nueva version para el servidor..." -ForegroundColor Green

# 1. Eliminar archivos innecesarios del servidor
Write-Host ""
Write-Host "Eliminando archivos innecesarios..." -ForegroundColor Yellow

$archivosAEliminar = @(
    "$servidorPath\*.txt",
    "$servidorPath\*.sql",
    "$servidorPath\bundle.js",
    "$servidorPath\index.html",
    "$servidorPath\verificar_servidor.php"
)

foreach ($patron in $archivosAEliminar) {
    Get-ChildItem -Path $patron -ErrorAction SilentlyContinue | Remove-Item -Force
    Write-Host "  Eliminado: $patron" -ForegroundColor Gray
}

# 2. Crear carpeta dist si no existe
if (-not (Test-Path "$servidorPath\dist")) {
    New-Item -ItemType Directory -Path "$servidorPath\dist" -Force | Out-Null
}

# 3. Copiar frontend compilado
Write-Host ""
Write-Host "Copiando frontend compilado..." -ForegroundColor Yellow
Copy-Item "$proyectoPath\dist\bundle.js" -Destination "$servidorPath\dist\bundle.js" -Force
Copy-Item "$proyectoPath\dist\index.html" -Destination "$servidorPath\dist\index.html" -Force
Write-Host "  Frontend copiado a dist/" -ForegroundColor Gray

# 4. Copiar backend completo (solo archivos necesarios)
Write-Host ""
Write-Host "Copiando backend..." -ForegroundColor Yellow

# Crear estructura de directorios
$directoriosBackend = @(
    "$servidorPath\config",
    "$servidorPath\controllers",
    "$servidorPath\ml"
)

foreach ($dir in $directoriosBackend) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Copiar index.php principal
Copy-Item "$proyectoPath\src\backend\index.php" -Destination "$servidorPath\index.php" -Force

# Copiar config
Copy-Item "$proyectoPath\src\backend\config\database.php" -Destination "$servidorPath\config\database.php" -Force

# Copiar todos los controllers
Get-ChildItem "$proyectoPath\src\backend\controllers\*.php" | Copy-Item -Destination "$servidorPath\controllers\" -Force

# Copiar ML
Get-ChildItem "$proyectoPath\src\backend\ml\*.php" | Copy-Item -Destination "$servidorPath\ml\" -Force

Write-Host "  Backend copiado" -ForegroundColor Gray

# 5. Verificar que database.php tenga produccion primero
Write-Host ""
Write-Host "Verificando configuracion de base de datos..." -ForegroundColor Yellow
$dbContent = Get-Content "$servidorPath\config\database.php" -Raw
if ($dbContent -match "produccion") {
    Write-Host "  Configuracion de produccion encontrada" -ForegroundColor Green
} else {
    Write-Host "  Revisar configuracion en database.php" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Archivos preparados para subir al servidor!" -ForegroundColor Green
Write-Host ""
Write-Host "Resumen de archivos:" -ForegroundColor Cyan
Write-Host "  Frontend: dist/bundle.js, dist/index.html" -ForegroundColor Gray
Write-Host "  Backend: index.php, config/, controllers/, ml/" -ForegroundColor Gray
