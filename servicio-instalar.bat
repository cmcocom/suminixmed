@echo off
chcp 65001 >nul
REM ============================================================================
REM SuminixMed - Instalación de Servicio PM2 (Desatendido)
REM ============================================================================
REM Propósito: Configurar PM2 como servicio de Windows e iniciar automáticamente
REM Modo: Producción (npm run start)
REM Ejecución: Desatendida (sin intervención del usuario)
REM ============================================================================

echo.
echo  🚀 SuminixMed - Instalación de Servicio
echo ==========================================
echo.

REM Verificar privilegios de administrador
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ ERROR: Este script requiere privilegios de administrador
    echo.
    echo  💡 Cómo ejecutar:
    echo     1. Haz clic derecho en este archivo
    echo     2. Selecciona "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo [1/8] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ ERROR: Node.js no está instalado o no está en PATH
    echo  💡 Instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo  ✅ Node.js detectado: %NODE_VERSION%

echo.
echo [2/8] Verificando PostgreSQL...
sc query postgresql-x64-17 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ⚠️  PostgreSQL no detectado como servicio
    echo  💡 Asegúrate de que PostgreSQL esté instalado y corriendo
)

echo.
echo [3/8] Verificando build de producción...
if not exist ".next" (
    echo  🔨 Build no encontrado. Ejecutando npm run build...
    echo  ⏳ Esto puede tomar 15-20 segundos...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo  ❌ ERROR: Build de producción falló
        echo  💡 Revisa los errores arriba y corrige antes de continuar
        pause
        exit /b 1
    )
    echo  ✅ Build completado exitosamente
) else (
    echo  ✅ Build de producción encontrado (.next/)
)

echo.
echo [4/8] Instalando PM2 globalmente...
call npm list -g pm2 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  📦 PM2 no encontrado. Instalando...
    call npm install -g pm2
    if %ERRORLEVEL% NEQ 0 (
        echo  ❌ ERROR: No se pudo instalar PM2
        pause
        exit /b 1
    )
    echo  ✅ PM2 instalado
) else (
    echo  ✅ PM2 ya está instalado
)

echo.
echo [5/8] Instalando PM2 Windows Startup...
call npm list -g pm2-windows-startup >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  📦 Instalando pm2-windows-startup...
    call npm install -g pm2-windows-startup
    if %ERRORLEVEL% NEQ 0 (
        echo  ❌ ERROR: No se pudo instalar pm2-windows-startup
        pause
        exit /b 1
    )
    echo  ✅ pm2-windows-startup instalado
) else (
    echo  ✅ pm2-windows-startup ya está instalado
)

echo.
echo [6/8] Configurando PM2 como servicio de Windows...
call pm2-startup install
if %ERRORLEVEL% NEQ 0 (
    echo  ⚠️  Advertencia: pm2-startup install retornó código de error
    echo  💡 El servicio puede funcionar de todas formas
)

echo.
echo [6/6] Deteniendo instancias previas...
call pm2 delete suminixmed >nul 2>&1

echo.
echo [7/8] Creando configuración PM2...
REM Crear archivo de configuración PM2 para Windows
(
echo module.exports = {
echo   apps: [{
echo     name: 'suminixmed',
echo     script: 'node_modules/next/dist/bin/next',
echo     args: 'start',
echo     cwd: '%CD%',
echo     instances: 1,
echo     exec_mode: 'fork',
echo     watch: false,
echo     max_memory_restart: '500M',
echo     env: {
echo       NODE_ENV: 'production',
echo       PORT: 3000
echo     },
echo     error_file: 'logs/pm2-error.log',
echo     out_file: 'logs/pm2-out.log',
echo     log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
echo   }]
echo };
) > ecosystem.config.cjs

echo  ✅ Archivo ecosystem.config.cjs creado

echo.
echo [8/8] Iniciando aplicación con PM2...
call pm2 start ecosystem.config.cjs
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ ERROR: No se pudo iniciar la aplicación
    pause
    exit /b 1
)

echo  💾 Guardando configuración de PM2...
call pm2 save

echo.
echo ============================================================================
echo  ✅ INSTALACIÓN COMPLETADA EXITOSAMENTE
echo ============================================================================
echo.
echo  📊 Estado del servicio:
call pm2 status
echo.
echo  🌐 Acceso a la aplicación:
echo     - URL configurada en .env.local (NEXTAUTH_URL)
echo     - Revisa el archivo .env.local para ver la URL exacta
echo.
echo  💡 Comandos útiles:
echo     pm2 status              - Ver estado del servicio
echo     pm2 logs suminixmed     - Ver logs en tiempo real
echo     pm2 restart suminixmed  - Reiniciar servicio
echo     pm2 stop suminixmed     - Detener servicio
echo.
echo  🔧 Control: Usa servicio-control.bat para gestionar el servicio
echo.
echo  ⚙️  El servicio se iniciará automáticamente cuando arranque Windows
echo ============================================================================
echo.
pause
