import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migracionRFCyClaves() {
  console.log('\n🔄 MIGRACIÓN DE RFC Y NORMALIZACIÓN DE CLAVES\n');
  console.log('═'.repeat(100));
  
  try {
    // PASO 1: Copiar RFC de clave al campo rfc
    console.log('\n📋 PASO 1: Copiando RFC desde clave al campo rfc...\n');
    
    const clientesConRFC = await prisma.$queryRaw`
      SELECT id, clave, nombre
      FROM clientes
      WHERE LENGTH(clave) >= 12
        AND (rfc IS NULL OR rfc = '')
    `;
    
    console.log(`   Clientes a actualizar: ${clientesConRFC.length}`);
    
    let actualizados = 0;
    for (const cliente of clientesConRFC) {
      // Limpiar RFC (quitar espacios, guiones, barras)
      const rfcLimpio = cliente.clave
        .replace(/[\s\-\/]/g, '')  // Quitar espacios, guiones, barras
        .toUpperCase()
        .substring(0, 13);  // Máximo 13 caracteres
      
      await prisma.clientes.update({
        where: { id: cliente.id },
        data: {
          rfc: rfcLimpio,
          updatedAt: new Date()
        }
      });
      
      actualizados++;
      if (actualizados % 10 === 0) {
        console.log(`   ✓ Procesados: ${actualizados}/${clientesConRFC.length}`);
      }
    }
    
    console.log(`\n   ✅ RFC copiados: ${actualizados} clientes`);
    
    // PASO 2: Verificar resultado
    console.log('\n📊 PASO 2: Verificación de RFC...\n');
    
    const verificacion = await prisma.$queryRaw`
      SELECT 
        COUNT(*) FILTER (WHERE rfc IS NOT NULL AND rfc != '') as con_rfc,
        COUNT(*) FILTER (WHERE rfc IS NULL OR rfc = '') as sin_rfc
      FROM clientes
    `;
    
    console.log(`   Clientes CON RFC: ${verificacion[0].con_rfc}`);
    console.log(`   Clientes SIN RFC: ${verificacion[0].sin_rfc}`);
    
    // PASO 3: Mostrar ejemplos
    console.log('\n📝 PASO 3: Ejemplos de clientes actualizados:\n');
    
    const ejemplos = await prisma.clientes.findMany({
      where: {
        rfc: { not: null },
        rfc: { not: '' }
      },
      select: {
        clave: true,
        nombre: true,
        rfc: true
      },
      take: 5
    });
    
    ejemplos.forEach(c => {
      console.log(`   ${c.clave.padEnd(15)} → RFC: ${c.rfc} | ${c.nombre.substring(0, 40)}`);
    });
    
    console.log('\n' + '═'.repeat(100));
    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
    
    return {
      actualizados,
      conRFC: verificacion[0].con_rfc,
      sinRFC: verificacion[0].sin_rfc
    };
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migracionRFCyClaves()
  .then((result) => {
    console.log('📊 Resumen:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
