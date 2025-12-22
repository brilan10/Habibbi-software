# 📤 GUÍA PARA SUBIR EL PROYECTO A GITHUB

## Pasos para subir Habibbi Café a GitHub

### 1. Verificar que Git está instalado

Abre PowerShell o CMD y ejecuta:
```bash
git --version
```

Si no está instalado, descárgalo de: https://git-scm.com/download/win

### 2. Inicializar el repositorio Git (si no existe)

```bash
cd C:\Users\yomiy\Documents\Habibbi-software
git init
```

### 3. Agregar todos los archivos al staging

```bash
git add .
```

### 4. Hacer commit de los cambios

```bash
git commit -m "Agregar comentarios detallados línea por línea en PHP y JSX"
```

### 5. Crear repositorio en GitHub

1. Ve a https://github.com
2. Haz clic en "New repository"
3. Nombre: `Habibbi-software` (o el que prefieras)
4. NO inicialices con README, .gitignore o licencia
5. Haz clic en "Create repository"

### 6. Conectar el repositorio local con GitHub

```bash
git remote add origin https://github.com/TU_USUARIO/Habibbi-software.git
```

(Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub)

### 7. Subir el código a GitHub

```bash
git branch -M main
git push -u origin main
```

### 8. Si GitHub te pide autenticación

- Usa un Personal Access Token en lugar de tu contraseña
- O configura SSH keys

---

## Comandos completos (copia y pega)

```bash
cd C:\Users\yomiy\Documents\Habibbi-software
git init
git add .
git commit -m "Agregar comentarios detallados línea por línea en PHP y JSX - Documentación completa del backend y frontend"
git remote add origin https://github.com/TU_USUARIO/Habibbi-software.git
git branch -M main
git push -u origin main
```

---

## Si ya tienes un repositorio en GitHub

Si ya tienes un repositorio creado, solo necesitas:

```bash
cd C:\Users\yomiy\Documents\Habibbi-software
git add .
git commit -m "Agregar comentarios detallados línea por línea en PHP y JSX"
git push
```

---

## Archivos modificados que se subirán

- ✅ `src/backend/controllers/RecetasController.php` - Comentado línea por línea
- ✅ `src/frontend/App.jsx` - Comentado línea por línea
- ✅ `src/frontend/views/Login.jsx` - Comentado línea por línea
- ✅ `src/frontend/index.jsx` - Comentado línea por línea
- ✅ `DOCUMENTACION_COMPLETA_BACKEND_FRONTEND.md` - Documentación completa

