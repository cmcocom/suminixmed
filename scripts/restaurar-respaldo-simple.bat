@echo off
chcp 65001 > nul
title SuminixMed - Restaurar Respaldo JSON (Simplificado)

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║        📥 RESTAURAR RESPALDO DE BASE DE DATOS            ║
echo ║               respaldo good.json                          ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

:: Verificar que el archivo de respaldo existe
if not exist "public\respaldo good.json" (
    echo ❌ Error: No se encontró el archivo "respaldo good.json" en la carpeta public
    echo 📍 Ubicación esperada: %cd%\public\respaldo good.json
    pause
    exit /b 1
)

echo ✅ Archivo de respaldo encontrado: "public\respaldo good.json"

:: Verificar PostgreSQL
echo 🔍 Verificando PostgreSQL...
tasklist /FI "IMAGENAME eq postgres.exe" 2>NUL | find /I /N "postgres.exe">NUL
if %errorLevel% neq 0 (
    echo ❌ PostgreSQL no está ejecutándose
    echo 🚀 Intentando iniciar PostgreSQL...
    net start postgresql-x64-17 2>nul
    if %errorLevel% neq 0 (
        echo ❌ No se pudo iniciar PostgreSQL automáticamente
        echo 📋 Inicia PostgreSQL manualmente y vuelve a ejecutar este script
        pause
        exit /b 1
    )
) else (
    echo ✅ PostgreSQL está ejecutándose
)

:: Verificar Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    ) else (
        echo ❌ Node.js no encontrado
        pause
        exit /b 1
    )
)

echo.
echo ⚠️  ADVERTENCIA IMPORTANTE:
echo ═══════════════════════════════════════════════════════════
echo 🔥 Esta operación SOBRESCRIBIRÁ todos los datos actuales
echo 📊 Se perderán los cambios realizados después del respaldo
echo 💾 Los usuarios NO se eliminarán (por seguridad)
echo.

set /p confirmar="⚠️  ¿CONFIRMAS la restauración? (escriba SI para continuar): "
if not "%confirmar%"=="SI" (
    echo ❌ Operación cancelada por el usuario
    pause
    exit /b 0
)

echo.
echo 🚀 INICIANDO RESTAURACIÓN...
echo ═══════════════════════════════════════════════════════════

:: Detener servidor si está ejecutándose
echo 🛑 Deteniendo servidor SuminixMed...
taskkill /F /IM node.exe 2>nul
timeout /t 3 >nul

:: Ejecutar restauración
echo 📥 Ejecutando restauración desde "respaldo good.json"...
node scripts\restore-backup.mjs

if %errorLevel% equ 0 (
    echo.
    echo ✅ RESTAURACIÓN COMPLETADA EXITOSAMENTE
    echo ═══════════════════════════════════════════════════════════
    echo 📊 Base de datos restaurada desde "respaldo good.json"
    echo 🔄 Los datos han sido recuperados correctamente
    echo.
    
    set /p iniciar="🚀 ¿Iniciar servidor SuminixMed ahora? (S/N): "
    if /i "%iniciar%"=="S" (
        echo 🚀 Iniciando servidor...
        start "" "%~dp0iniciar-servicio.bat"
        echo ✅ Servidor iniciado en segundo plano
    )
    
) else (
    echo.
    echo ❌ ERROR EN LA RESTAURACIÓN
    echo ═══════════════════════════════════════════════════════════
    echo 🔍 Revisa los mensajes de error anteriores
    echo 📞 Si el problema persiste, contacta al soporte técnico
)

echo.
echo 📋 RESTAURACIÓN FINALIZADA
pause