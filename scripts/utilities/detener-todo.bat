@echo off
chcp 65001 >nul
REM ============================================================================
REM SuminixMed - Detener TODO (Emergencia)
REM ============================================================================
REM Propósito: Matar TODOS los procesos relacionados sin preguntas
REM Modo: Desatendido (ejecución inmediata)
REM Uso: Cuando nada más funciona o necesitas detener todo rápido
REM ============================================================================

echo.
echo  🛑 SuminixMed - Detener TODO (Emergencia)
echo ==========================================
echo  ⚠️  MODO EMERGENCIA - Deteniendo todo sin confirmación
echo ==========================================
echo.

echo [1/6] Deteniendo PM2 completamente...
call pm2 kill >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  ✅ PM2 detenido
) else (
    echo  ℹ️  PM2 no estaba corriendo o no está instalado
)

echo.
echo [2/6] Matando todos los procesos Node.js...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  ✅ Procesos Node.js terminados
) else (
    echo  ℹ️  No hay procesos Node.js corriendo
)

echo.
echo [3/6] Matando todos los procesos NPM...
taskkill /F /IM npm.cmd >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  ✅ Procesos NPM terminados
) else (
    echo  ℹ️  No hay procesos NPM corriendo
)

echo.
echo [4/6] Liberando puerto 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo  🔓 Matando proceso en puerto 3000 (PID: %%a^)
    taskkill /F /PID %%a >nul 2>&1
)
echo  ✅ Puerto 3000 liberado

echo.
echo [5/6] Limpiando procesos PowerShell relacionados...
tasklist | findstr /I "powershell" | findstr /I "suminix" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=2" %%a in ('tasklist ^| findstr /I "powershell"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    echo  ✅ Procesos PowerShell limpiados
) else (
    echo  ℹ️  No hay procesos PowerShell relacionados
)

echo.
echo [6/6] Verificando que todo esté detenido...
timeout /t 1 >nul

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  ⚠️  ADVERTENCIA: Aún hay algo escuchando en puerto 3000
    echo  💡 Puede ser otro proceso no relacionado con SuminixMed
    echo.
    echo  Procesos en puerto 3000:
    netstat -ano | findstr ":3000" | findstr "LISTENING"
) else (
    echo  ✅ Puerto 3000 completamente libre
)

tasklist | findstr /I "node.exe" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  ⚠️  ADVERTENCIA: Aún hay procesos Node.js corriendo
    echo  💡 Pueden ser de otras aplicaciones
) else (
    echo  ✅ No hay procesos Node.js corriendo
)

echo.
echo ==========================================
echo  ✅ PROCESO DE DETENCIÓN COMPLETADO
echo ==========================================
echo.
echo  📊 Resumen:
echo     - PM2: Detenido
echo     - Node.js: Terminado
echo     - NPM: Terminado
echo     - Puerto 3000: Liberado
echo.
echo  💡 Para reiniciar:
echo     - Usa: servicio-control.bat
echo     - O ejecuta: pm2 start suminixmed
echo.
echo  🔍 Para verificar:
echo     - pm2 status (si PM2 está instalado)
echo     - netstat -ano ^| findstr ":3000"
echo     - tasklist ^| findstr "node.exe"
echo.
echo ==========================================

timeout /t 5 >nul
