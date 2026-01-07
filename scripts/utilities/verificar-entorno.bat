@echo off
REM ========================================
REM  Script de Verificación - SuminixMed
REM  Verifica instalación correcta del entorno
REM ========================================

echo.
echo ========================================
echo   VERIFICACION DE ENTORNO - SuminixMed
echo ========================================
echo.

REM Verificar Node.js
echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    [X] Node.js NO instalado
    echo        Descargar de: https://nodejs.org/
    set NODE_OK=0
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo    [✓] Node.js %NODE_VERSION%
    set NODE_OK=1
)
echo.

REM Verificar npm
echo [2/6] Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    [X] npm NO instalado
    set NPM_OK=0
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo    [✓] npm %NPM_VERSION%
    set NPM_OK=1
)
echo.

REM Verificar Git
echo [3/6] Verificando Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    [X] Git NO instalado
    echo        Descargar de: https://git-scm.com/download/win
    set GIT_OK=0
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo    [✓] %GIT_VERSION%
    set GIT_OK=1
)
echo.

REM Verificar PostgreSQL
echo [4/6] Verificando PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    [X] PostgreSQL NO instalado o no en PATH
    echo        Descargar de: https://www.postgresql.org/download/windows/
    echo        Agregar al PATH: C:\Program Files\PostgreSQL\17\bin
    set PG_OK=0
) else (
    for /f "tokens=*" %%i in ('psql --version') do set PG_VERSION=%%i
    echo    [✓] %PG_VERSION%
    set PG_OK=1
)
echo.

REM Verificar archivo .env.local
echo [5/6] Verificando configuracion...
if exist ".env.local" (
    echo    [✓] Archivo .env.local existe
    set ENV_OK=1
) else (
    echo    [X] Archivo .env.local NO existe
    echo        Crear desde plantilla en GUIA-SETUP-WINDOWS.md
    set ENV_OK=0
)
echo.

REM Verificar node_modules
echo [6/6] Verificando dependencias...
if exist "node_modules" (
    echo    [✓] Dependencias instaladas
    set DEPS_OK=1
) else (
    echo    [X] Dependencias NO instaladas
    echo        Ejecutar: npm install
    set DEPS_OK=0
)
echo.

echo ========================================
echo   RESUMEN
echo ========================================
echo.

if %NODE_OK%==1 if %NPM_OK%==1 if %GIT_OK%==1 if %PG_OK%==1 if %ENV_OK%==1 if %DEPS_OK%==1 (
    echo [✓✓✓] ENTORNO COMPLETO - Listo para desarrollar
    echo.
    echo Comandos disponibles:
    echo   npm run dev          - Iniciar servidor desarrollo
    echo   npx prisma studio    - Abrir Prisma Studio
    echo   git status           - Ver estado de Git
    echo.
    echo Servidor: http://localhost:3000
    echo Usuario: admin / admin123
) else (
    echo [!!!] ENTORNO INCOMPLETO - Revisar elementos faltantes
    echo.
    echo Consultar: GUIA-SETUP-WINDOWS.md
)

echo.
echo ========================================
pause
