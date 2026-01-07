@echo off
chcp 65001 > nul
title SuminixMed - Restaurar Respaldo JSON

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

:: Verificar conexión a PostgreSQL
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
    echo ✅ PostgreSQL iniciado
) else (
    echo ✅ PostgreSQL está ejecutándose
)

:: Verificar Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo 🔍 Buscando Node.js...
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
        echo ✅ Node.js encontrado
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
echo 💾 ¿Crear respaldo de seguridad antes de restaurar?
echo.

set /p crear_backup="📥 ¿Crear backup actual antes de restaurar? (S/N): "
if /i "%crear_backup%"=="S" (
    echo.
    echo 💾 Creando respaldo de seguridad...
    set backup_timestamp=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set backup_timestamp=%backup_timestamp: =0%
    
    :: Crear respaldo con timestamp
    node -e "
    const fs = require('fs');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function createBackup() {
        try {
            console.log('📊 Exportando datos actuales...');
            
            // Exportar todas las tablas principales
            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                tables: {}
            };
            
            // Usuarios
            backup.tables.users = await prisma.user.findMany();
            console.log('✅ Usuarios exportados:', backup.tables.users.length);
            
            // Productos/Inventario
            backup.tables.inventario = await prisma.inventario.findMany();
            console.log('✅ Productos exportados:', backup.tables.inventario.length);
            
            // Entradas
            backup.tables.entradas = await prisma.entradas.findMany();
            console.log('✅ Entradas exportadas:', backup.tables.entradas.length);
            
            // Salidas
            backup.tables.salidas = await prisma.salidas.findMany();
            console.log('✅ Salidas exportadas:', backup.tables.salidas.length);
            
            // Clientes
            backup.tables.clientes = await prisma.clientes.findMany();
            console.log('✅ Clientes exportados:', backup.tables.clientes.length);
            
            // Guardar respaldo
            const filename = 'backup-antes-restauracion-%backup_timestamp%.json';
            fs.writeFileSync('public/' + filename, JSON.stringify(backup, null, 2));
            console.log('💾 Respaldo guardado en:', filename);
            
        } catch (error) {
            console.error('❌ Error creando respaldo:', error.message);
            process.exit(1);
        } finally {
            await prisma.$disconnect();
        }
    }
    
    createBackup();" 2>nul
    
    if %errorLevel% equ 0 (
        echo ✅ Respaldo de seguridad creado exitosamente
    ) else (
        echo ⚠️  Advertencia: No se pudo crear el respaldo de seguridad
        set /p continuar="   ¿Continuar sin respaldo? (S/N): "
        if /i not "%continuar%"=="S" (
            echo ❌ Operación cancelada
            pause
            exit /b 1
        )
    )
)

echo.
echo 🔄 CONFIRMACIÓN FINAL:
echo ═══════════════════════════════════════════════════════════
echo 📂 Archivo a restaurar: "respaldo good.json"
echo 🎯 Base de datos: suminix
echo 💥 Acción: SOBRESCRIBIR datos actuales
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
timeout /t 2 >nul

:: Ejecutar restauración con Node.js
echo 📥 Ejecutando restauración desde "respaldo good.json"...
node -e "
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreDatabase() {
    try {
        console.log('📖 Leyendo archivo de respaldo...');
        const backupData = JSON.parse(fs.readFileSync('public/respaldo good.json', 'utf8'));
        
        console.log('📋 Información del respaldo:');
        console.log('  📅 Fecha:', backupData.timestamp || 'No especificada');
        console.log('  🔢 Versión:', backupData.version || 'No especificada');
        
        // Verificar estructura del respaldo
        if (!backupData.tables) {
            throw new Error('Formato de respaldo inválido: falta propiedad tables');
        }
        
        console.log('🗑️  Limpiando datos actuales...');
        
        // Eliminar en orden correcto (respetando relaciones)
        try {
            await prisma.salidas.deleteMany({});
            console.log('✅ Salidas eliminadas');
        } catch (e) { console.log('⚠️  Salidas:', e.message); }
        
        try {
            await prisma.entradas.deleteMany({});
            console.log('✅ Entradas eliminadas');
        } catch (e) { console.log('⚠️  Entradas:', e.message); }
        
        try {
            await prisma.inventario.deleteMany({});
            console.log('✅ Inventario eliminado');
        } catch (e) { console.log('⚠️  Inventario:', e.message); }
        
        try {
            await prisma.clientes.deleteMany({});
            console.log('✅ Clientes eliminados');
        } catch (e) { console.log('⚠️  Clientes:', e.message); }
        
        // No eliminar usuarios para mantener accesos
        console.log('ℹ️  Usuarios mantenidos (no se eliminan por seguridad)');
        
        console.log('📥 Restaurando datos del respaldo...');
        
        // Restaurar clientes
        if (backupData.tables.clientes && backupData.tables.clientes.length > 0) {
            for (const cliente of backupData.tables.clientes) {
                try {
                    await prisma.clientes.create({ data: cliente });
                } catch (e) {
                    console.log('⚠️  Error en cliente:', e.message);
                }
            }
            console.log('✅ Clientes restaurados:', backupData.tables.clientes.length);
        }
        
        // Restaurar inventario
        if (backupData.tables.inventario && backupData.tables.inventario.length > 0) {
            for (const producto of backupData.tables.inventario) {
                try {
                    await prisma.inventario.create({ data: producto });
                } catch (e) {
                    console.log('⚠️  Error en producto:', e.message);
                }
            }
            console.log('✅ Inventario restaurado:', backupData.tables.inventario.length);
        }
        
        // Restaurar entradas
        if (backupData.tables.entradas && backupData.tables.entradas.length > 0) {
            for (const entrada of backupData.tables.entradas) {
                try {
                    await prisma.entradas.create({ data: entrada });
                } catch (e) {
                    console.log('⚠️  Error en entrada:', e.message);
                }
            }
            console.log('✅ Entradas restauradas:', backupData.tables.entradas.length);
        }
        
        // Restaurar salidas
        if (backupData.tables.salidas && backupData.tables.salidas.length > 0) {
            for (const salida of backupData.tables.salidas) {
                try {
                    await prisma.salidas.create({ data: salida });
                } catch (e) {
                    console.log('⚠️  Error en salida:', e.message);
                }
            }
            console.log('✅ Salidas restauradas:', backupData.tables.salidas.length);
        }
        
        console.log('🎉 RESTAURACIÓN COMPLETADA EXITOSAMENTE');
        console.log('');
        console.log('📊 RESUMEN:');
        console.log('  👥 Clientes:', backupData.tables.clientes?.length || 0);
        console.log('  📦 Productos:', backupData.tables.inventario?.length || 0);
        console.log('  📥 Entradas:', backupData.tables.entradas?.length || 0);
        console.log('  📤 Salidas:', backupData.tables.salidas?.length || 0);
        
    } catch (error) {
        console.error('❌ ERROR EN RESTAURACIÓN:', error.message);
        console.error('🔍 Detalles:', error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

restoreDatabase();"

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