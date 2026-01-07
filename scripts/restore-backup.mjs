// restore-backup.mjs - Script para restaurar respaldo JSON
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreDatabase() {
    try {
        console.log('📖 Leyendo archivo de respaldo...');
        const backupData = JSON.parse(fs.readFileSync('public/respaldo good.json', 'utf8'));
        
        console.log('📋 Información del respaldo:');
        console.log('  📅 Fecha:', backupData.metadata?.fecha_respaldo || backupData.timestamp || 'No especificada');
        console.log('  🔢 Versión:', backupData.metadata?.version || backupData.version || 'No especificada');
        console.log('  📄 Descripción:', backupData.metadata?.descripcion || 'Sin descripción');
        
        // Verificar estructura del respaldo - soportar ambos formatos
        const datos = backupData.datos || backupData.tables;
        if (!datos) {
            throw new Error('Formato de respaldo inválido: falta propiedad datos o tables');
        }
        
        console.log('🗑️  Limpiando datos actuales...');
        
        // Eliminar en orden correcto (respetando relaciones)
        try {
            await prisma.salidas.deleteMany({});
            console.log('✅ Salidas eliminadas');
        } catch (e) { 
            console.log('⚠️  Salidas:', e.message); 
        }
        
        try {
            await prisma.entradas.deleteMany({});
            console.log('✅ Entradas eliminadas');
        } catch (e) { 
            console.log('⚠️  Entradas:', e.message); 
        }
        
        try {
            await prisma.inventario.deleteMany({});
            console.log('✅ Inventario eliminado');
        } catch (e) { 
            console.log('⚠️  Inventario:', e.message); 
        }
        
        try {
            await prisma.clientes.deleteMany({});
            console.log('✅ Clientes eliminados');
        } catch (e) { 
            console.log('⚠️  Clientes:', e.message); 
        }
        
        // No eliminar usuarios para mantener accesos
        console.log('ℹ️  Usuarios mantenidos (no se eliminan por seguridad)');
        
        console.log('📥 Restaurando datos del respaldo...');
        
        // Restaurar usuarios (opcional - solo si no existen)
        if (datos.users && datos.users.length > 0) {
            let usersCount = 0;
            for (const user of datos.users) {
                try {
                    // Verificar si el usuario ya existe
                    const existingUser = await prisma.user.findUnique({ 
                        where: { email: user.email } 
                    });
                    
                    if (!existingUser) {
                        await prisma.user.create({ data: user });
                        usersCount++;
                    }
                } catch (e) {
                    console.log('⚠️  Error en usuario:', e.message.substring(0, 100));
                }
            }
            console.log('✅ Usuarios restaurados:', usersCount, 'de', datos.users.length);
        }
        
        // Restaurar clientes
        if (datos.clientes && datos.clientes.length > 0) {
            let clientesCount = 0;
            for (const cliente of datos.clientes) {
                try {
                    await prisma.clientes.create({ data: cliente });
                    clientesCount++;
                } catch (e) {
                    console.log('⚠️  Error en cliente:', e.message.substring(0, 100));
                }
            }
            console.log('✅ Clientes restaurados:', clientesCount, 'de', datos.clientes.length);
        }
        
        // Restaurar inventario
        if (datos.inventario && datos.inventario.length > 0) {
            let inventarioCount = 0;
            for (const producto of datos.inventario) {
                try {
                    await prisma.inventario.create({ data: producto });
                    inventarioCount++;
                } catch (e) {
                    console.log('⚠️  Error en producto:', e.message.substring(0, 100));
                }
            }
            console.log('✅ Inventario restaurado:', inventarioCount, 'de', datos.inventario.length);
        }
        
        // Restaurar entradas
        if (datos.entradas && datos.entradas.length > 0) {
            let entradasCount = 0;
            for (const entrada of datos.entradas) {
                try {
                    await prisma.entradas.create({ data: entrada });
                    entradasCount++;
                } catch (e) {
                    console.log('⚠️  Error en entrada:', e.message.substring(0, 100));
                }
            }
            console.log('✅ Entradas restauradas:', entradasCount, 'de', datos.entradas.length);
        }
        
        // Restaurar salidas
        if (datos.salidas && datos.salidas.length > 0) {
            let salidasCount = 0;
            for (const salida of datos.salidas) {
                try {
                    await prisma.salidas.create({ data: salida });
                    salidasCount++;
                } catch (e) {
                    console.log('⚠️  Error en salida:', e.message.substring(0, 100));
                }
            }
            console.log('✅ Salidas restauradas:', salidasCount, 'de', datos.salidas.length);
        }
        
        console.log('🎉 RESTAURACIÓN COMPLETADA EXITOSAMENTE');
        console.log('');
        console.log('📊 RESUMEN:');
        console.log('  � Usuarios:', datos.users?.length || 0);
        console.log('  �👥 Clientes:', datos.clientes?.length || 0);
        console.log('  📦 Productos:', datos.inventario?.length || 0);
        console.log('  📥 Entradas:', datos.entradas?.length || 0);
        console.log('  📤 Salidas:', datos.salidas?.length || 0);
        
    } catch (error) {
        console.error('❌ ERROR EN RESTAURACIÓN:', error.message);
        console.error('🔍 Detalles:', error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

restoreDatabase();