import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInventarios() {
  console.log('🔍 Verificando inventarios físicos en la base de datos...\n');
  
  try {
    const inventarios = await prisma.inventarios_fisicos.findMany({
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        almacenes: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total de inventarios encontrados: ${inventarios.length}\n`);

    if (inventarios.length === 0) {
      console.log('❌ No hay inventarios físicos en la base de datos');
      console.log('💡 Posibles razones:');
      console.log('   1. El script de actualización no se ejecutó correctamente');
      console.log('   2. Se eliminaron los registros');
      console.log('   3. Estamos conectados a una base de datos diferente');
    } else {
      console.log('📋 Inventarios encontrados:\n');
      inventarios.forEach((inv, index) => {
        console.log(`${index + 1}. ${inv.nombre}`);
        console.log(`   ID: ${inv.id}`);
        console.log(`   Estado: ${inv.estado}`);
        console.log(`   Fecha inicio: ${inv.fecha_inicio}`);
        console.log(`   Usuario: ${inv.User?.name || inv.User?.email || 'N/A'}`);
        console.log(`   Almacén: ${inv.almacenes?.nombre || 'N/A'}`);
        console.log(`   Total productos: ${inv.total_productos}`);
        console.log(`   Total ajustes: ${inv.total_ajustes}`);
        console.log(`   Creado: ${inv.createdAt}`);
        console.log('');
      });
    }

    // Verificar también detalles
    const detalles = await prisma.inventarios_fisicos_detalle.count();
    console.log(`📝 Total de detalles de inventarios: ${detalles}`);

  } catch (error) {
    console.error('❌ Error al consultar la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInventarios();
