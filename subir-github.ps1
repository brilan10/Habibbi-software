# Script para subir cambios a GitHub
# Repositorio: https://github.com/brilan10/Habibbi-software

Write-Host "Iniciando proceso de subida a GitHub..." -ForegroundColor Green

# Verificar si Git está instalado
$gitPath = $null
$possiblePaths = @(
    "C:\Program Files\Git\bin\git.exe",
    "C:\Program Files (x86)\Git\bin\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\bin\git.exe",
    "git"  # Intentar con PATH
)

foreach ($path in $possiblePaths) {
    try {
        if ($path -eq "git") {
            $result = Get-Command git -ErrorAction SilentlyContinue
            if ($result) {
                $gitPath = "git"
                break
            }
        } else {
            if (Test-Path $path) {
                $gitPath = $path
                break
            }
        }
    } catch {
        continue
    }
}

if (-not $gitPath) {
    Write-Host "ERROR: Git no esta instalado o no esta en el PATH" -ForegroundColor Red
    Write-Host "Por favor, instala Git desde: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "O ejecuta manualmente estos comandos:" -ForegroundColor Cyan
    Write-Host "  git init" -ForegroundColor White
    Write-Host "  git add ." -ForegroundColor White
    Write-Host "  git commit -m 'Agregar comentarios detallados línea por línea en PHP y JSX'" -ForegroundColor White
    Write-Host "  git remote add origin https://github.com/brilan10/Habibbi-software.git" -ForegroundColor White
    Write-Host "  git branch -M main" -ForegroundColor White
    Write-Host "  git push -u origin main" -ForegroundColor White
    exit 1
}

    Write-Host "OK: Git encontrado: $gitPath" -ForegroundColor Green
Write-Host ""

# Verificar si ya existe repositorio Git
if (Test-Path .git) {
    Write-Host "Repositorio Git ya existe" -ForegroundColor Yellow
} else {
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Cyan
    & $gitPath init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Error al inicializar repositorio" -ForegroundColor Red
        exit 1
    }
}

# Verificar remote
Write-Host "Verificando configuracion del remote..." -ForegroundColor Cyan
$remote = & $gitPath remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Agregando remote origin..." -ForegroundColor Cyan
    & $gitPath remote add origin https://github.com/brilan10/Habibbi-software.git
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Error al agregar remote" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "OK: Remote ya configurado: $remote" -ForegroundColor Green
}

# Agregar archivos
Write-Host ""
Write-Host "Agregando archivos al staging..." -ForegroundColor Cyan
& $gitPath add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Error al agregar archivos" -ForegroundColor Red
    exit 1
}

# Verificar si hay cambios para commit
$status = & $gitPath status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "INFO: No hay cambios para commitear" -ForegroundColor Yellow
    Write-Host "OK: Todo esta actualizado" -ForegroundColor Green
    exit 0
}

# Hacer commit
Write-Host ""
Write-Host "Haciendo commit..." -ForegroundColor Cyan
$commitMessage = "Agregar comentarios detallados línea por línea en PHP y JSX - Documentación completa del backend y frontend"
& $gitPath commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Error al hacer commit" -ForegroundColor Red
    exit 1
}

# Configurar branch main
Write-Host ""
Write-Host "Configurando branch main..." -ForegroundColor Cyan
& $gitPath branch -M main 2>$null

# Push
Write-Host ""
Write-Host "Subiendo cambios a GitHub..." -ForegroundColor Cyan
Write-Host "ADVERTENCIA: Si te pide autenticacion, usa un Personal Access Token" -ForegroundColor Yellow
& $gitPath push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Error al hacer push" -ForegroundColor Red
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "   1. Necesitas autenticarte (usa Personal Access Token)" -ForegroundColor White
    Write-Host "   2. El repositorio remoto tiene cambios que no tienes localmente" -ForegroundColor White
    Write-Host ""
    Write-Host "Solucion: Ejecuta manualmente:" -ForegroundColor Cyan
    Write-Host "   git pull origin main --allow-unrelated-histories" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "OK: Cambios subidos exitosamente a GitHub!" -ForegroundColor Green
Write-Host "Repositorio: https://github.com/brilan10/Habibbi-software" -ForegroundColor Cyan

