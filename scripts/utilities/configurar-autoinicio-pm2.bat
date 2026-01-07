@echo off
REM ================================================================
REM  CONFIGURAR AUTO-INICIO PM2 CON WINDOWS
REM ================================================================
REM
REM  IMPORTANTE: Este script debe ejecutarse como ADMINISTRADOR
REM
REM  Lo que hace:
REM    1. Instala el servicio de PM2 en Windows
REM    2. Configura SuminixMed para iniciar automáticamente
REM       cuando Windows arranque
REM
REM  Uso:
REM    1. Click derecho en este archivo
REM    2. Seleccionar "Ejecutar como administrador"
REM    3. Esperar confirmación
REM
REM ================================================================

title Configurar Auto-Inicio PM2 - REQUIERE ADMIN

REM Verificar si se está ejecutando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ================================================================
    echo  ⚠️  ERROR: Se requieren privilegios de Administrador
    echo ================================================================
    echo.
    echo  Por favor, ejecuta este archivo como Administrador:
    echo.
    echo    1. Click derecho en configurar-autoinicio-pm2.bat
    echo    2. Seleccionar "Ejecutar como administrador"
    echo.
    echo ================================================================
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

echo.
echo ================================================================
echo  CONFIGURAR AUTO-INICIO PM2 CON WINDOWS
echo ================================================================
echo.
echo  Instalando servicio PM2 en Windows...
echo.

REM Instalar el servicio de PM2
call pm2-startup install

if %errorLevel% equ 0 (
    echo.
    echo  ✅ Servicio PM2 instalado correctamente
    echo.
    echo  Guardando configuración actual...
    call pm2 save --force
    
    if %errorLevel% equ 0 (
        echo.
        echo ================================================================
        echo  ✅ AUTO-INICIO CONFIGURADO EXITOSAMENTE
        echo ================================================================
        echo.
        echo  SuminixMed se iniciará automáticamente cuando Windows arranque
        echo.
        echo  Procesos configurados:
        call pm2 list
        echo.
        echo  Para verificar después de reiniciar:
        echo    - pm2 status
        echo    - pm2 logs suminixmed
        echo.
        echo ================================================================
    ) else (
        echo.
        echo  ❌ Error al guardar la configuración PM2
    )
) else (
    echo.
    echo  ❌ Error al instalar el servicio PM2
    echo.
    echo  Verifica que pm2-windows-startup esté instalado:
    echo    npm list -g pm2-windows-startup
    echo.
    echo  Si no está instalado:
    echo    npm install -g pm2-windows-startup
)

echo.
echo ================================================================
echo.
pause
