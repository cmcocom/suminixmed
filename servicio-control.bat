@echo off
chcp 65001 >nul
REM ============================================================================
REM SuminixMed - Control de Servicio PM2 (Menú Interactivo)
REM ============================================================================
REM Propósito: Control completo del servicio con opciones
REM Modo: Interactivo (requiere selección de usuario)
REM ============================================================================

:MENU
cls
echo.
echo  ⚙️  SuminixMed - Control de Servicio PM2
echo ==========================================
echo.

REM Verificar estado del servicio
call pm2 list | findstr "suminixmed" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  📊 Estado actual:
    call pm2 status | findstr "suminixmed\|online\|stopped"
    echo.
) else (
    echo  ❌ Servicio NO registrado en PM2
    echo.
)

echo ==========================================
echo.
echo  1. 🚀 Iniciar servicio (npm start)
echo  2. 🛑 Detener servicio
echo  3. 🔄 Reiniciar servicio
echo  4. 📊 Ver estado detallado
echo  5. 📋 Ver logs en tiempo real
echo  6. 📝 Ver últimas 50 líneas de log
echo  7. 🔧 Rebuild + Reiniciar
echo  8. 🗑️  Desinstalar servicio (quitar del arranque)
echo  9. 🚪 Salir
echo.
echo ==========================================
echo.
set /p choice=Selecciona una opción (1-9): 

if "%choice%"=="1" goto START
if "%choice%"=="2" goto STOP
if "%choice%"=="3" goto RESTART
if "%choice%"=="4" goto STATUS
if "%choice%"=="5" goto LOGS_LIVE
if "%choice%"=="6" goto LOGS_LAST
if "%choice%"=="7" goto REBUILD
if "%choice%"=="8" goto UNINSTALL
if "%choice%"=="9" exit /b 0

echo.
echo  ❌ Opción inválida. Intenta de nuevo.
timeout /t 2 >nul
goto MENU

REM ============================================================================
REM OPCIÓN 1: INICIAR SERVICIO
REM ============================================================================
:START
echo.
echo  🚀 Iniciando servicio...
echo ==========================================
echo.

REM Verificar si ya existe
call pm2 list | findstr "suminixmed" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  🔄 Servicio ya existe. Iniciando...
    call pm2 start suminixmed
) else (
    echo  📦 Creando nuevo servicio...
    
    REM Verificar que existe build
    if not exist ".next" (
        echo  ❌ ERROR: No existe build de producción (.next/)
        echo  💡 Ejecuta primero: npm run build
        echo     O usa la opción 7 (Rebuild + Reiniciar)
        pause
        goto MENU
    )
    
    REM Verificar si existe ecosystem.config.cjs
    if not exist "ecosystem.config.cjs" (
        echo  📝 Creando configuración PM2...
        (
        echo module.exports = {
        echo   apps: [{
        echo     name: 'suminixmed',
        echo     script: 'node_modules/next/dist/bin/next',
        echo     args: 'start',
        echo     cwd: process.cwd^(^),
        echo     instances: 1,
        echo     exec_mode: 'fork',
        echo     watch: false,
        echo     max_memory_restart: '500M',
        echo     env: {
        echo       NODE_ENV: 'production',
        echo       PORT: 3000
        echo     }
        echo   }]
        echo };
        ) > ecosystem.config.cjs
    )
    
    call pm2 start ecosystem.config.cjs
    call pm2 save
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo  ✅ Servicio iniciado exitosamente
) else (
    echo.
    echo  ❌ ERROR al iniciar servicio
)

echo.
timeout /t 3 >nul
goto MENU

REM ============================================================================
REM OPCIÓN 2: DETENER SERVICIO
REM ============================================================================
:STOP
echo.
echo  🛑 Deteniendo servicio...
echo ==========================================
echo.

call pm2 stop suminixmed

if %ERRORLEVEL% EQU 0 (
    echo  ✅ Servicio detenido exitosamente
) else (
    echo  ❌ ERROR al detener servicio (puede que no esté corriendo)
)

echo.
timeout /t 2 >nul
goto MENU

REM ============================================================================
REM OPCIÓN 3: REINICIAR SERVICIO
REM ============================================================================
:RESTART
echo.
echo  🔄 Reiniciando servicio...
echo ==========================================
echo.

call pm2 restart suminixmed

if %ERRORLEVEL% EQU 0 (
    echo  ✅ Servicio reiniciado exitosamente
) else (
    echo  ❌ ERROR al reiniciar servicio
)

echo.
timeout /t 2 >nul
goto MENU

REM ============================================================================
REM OPCIÓN 4: VER ESTADO DETALLADO
REM ============================================================================
:STATUS
cls
echo.
echo  📊 Estado Detallado del Servicio
echo ==========================================
echo.

call pm2 status

echo.
echo  📈 Información adicional:
call pm2 info suminixmed 2>nul

echo.
echo ==========================================
pause
goto MENU

REM ============================================================================
REM OPCIÓN 5: VER LOGS EN TIEMPO REAL
REM ============================================================================
:LOGS_LIVE
cls
echo.
echo  📋 Logs en Tiempo Real
echo ==========================================
echo  💡 Presiona Ctrl+C para salir
echo ==========================================
echo.

call pm2 logs suminixmed

goto MENU

REM ============================================================================
REM OPCIÓN 6: VER ÚLTIMAS 50 LÍNEAS DE LOG
REM ============================================================================
:LOGS_LAST
cls
echo.
echo  📝 Últimas 50 Líneas de Log
echo ==========================================
echo.

call pm2 logs suminixmed --lines 50 --nostream

echo.
echo ==========================================
pause
goto MENU

REM ============================================================================
REM OPCIÓN 7: REBUILD + REINICIAR
REM ============================================================================
:REBUILD
echo.
echo  🔧 Rebuild + Reiniciar
echo ==========================================
echo.

echo [1/3] Deteniendo servicio...
call pm2 stop suminixmed >nul 2>&1

echo [2/3] Ejecutando build de producción...
echo  ⏳ Esto puede tomar 15-20 segundos...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ ERROR: Build falló
    echo  💡 Revisa los errores arriba
    pause
    goto MENU
)

echo  ✅ Build completado

echo [3/3] Reiniciando servicio...
call pm2 restart suminixmed

if %ERRORLEVEL% EQU 0 (
    echo  ✅ Servicio reiniciado con nuevo build
) else (
    echo  ❌ ERROR al reiniciar servicio
)

echo.
timeout /t 3 >nul
goto MENU

REM ============================================================================
REM OPCIÓN 8: DESINSTALAR SERVICIO
REM ============================================================================
:UNINSTALL
echo.
echo  🗑️  Desinstalar Servicio
echo ==========================================
echo.
echo  ⚠️  ADVERTENCIA: Esto eliminará:
echo     - El servicio de PM2
echo     - La configuración de arranque automático
echo     - Los logs acumulados
echo.
set /p confirm=¿Estás seguro? (S/N): 

if /i NOT "%confirm%"=="S" (
    echo.
    echo  ❌ Cancelado
    timeout /t 2 >nul
    goto MENU
)

echo.
echo [1/4] Deteniendo servicio...
call pm2 stop suminixmed >nul 2>&1

echo [2/4] Eliminando servicio de PM2...
call pm2 delete suminixmed
call pm2 save

echo [3/4] Limpiando logs...
call pm2 flush

echo [4/4] Desinstalando arranque automático...
net session >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call pm2-startup uninstall
    echo  ✅ Arranque automático desinstalado
) else (
    echo  ⚠️  Se requieren permisos de administrador para desinstalar arranque automático
    echo  💡 Ejecuta este script como administrador para completar la desinstalación
)

echo.
echo  ✅ Servicio desinstalado
echo.
timeout /t 3 >nul
goto MENU
