import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkClientes() {
  try {
    console.log('\n🔍 Analizando clientes...\n');
    
    // Contar clientes afectados
    const count = await prisma.clientes.count({
      where: {
        AND: [
          { clave: { not: null } },
          { clave: { not: '' } },
          {
            OR: [
              { rfc: null },
              { rfc: '' }
            ]
          }
        ]
      }
    });
    
    console.log(`📊 Total de clientes con clave pero sin RFC: ${count}\n`);
    
    // Contar clientes con clave que parece RFC (más de 10 caracteres)
    const conRfcEnClave = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM clientes
      WHERE LENGTH(clave) >= 12
        AND (rfc IS NULL OR rfc = '')
    `;
    
    console.log(`🎯 Clientes con clave >= 12 caracteres (posible RFC): ${conRfcEnClave[0].count}\n`);
    
    // Mostrar ejemplos
    const ejemplos = await prisma.$queryRaw`
      SELECT id, nombre, clave, rfc, LENGTH(clave) as clave_len
      FROM clientes
      WHERE LENGTH(clave) >= 12
        AND (rfc IS NULL OR rfc = '')
      LIMIT 10
    `;
    
    console.log('📋 Ejemplos de clientes con posible RFC en clave:\n');
    console.log('═'.repeat(100));
    ejemplos.forEach(c => {
      console.log(`Nombre: ${c.nombre}`);
      console.log(`Clave:  "${c.clave}" (${c.clave_len} caracteres)`);
      console.log(`RFC:    ${c.rfc || '❌ VACÍO'}`);
      console.log('─'.repeat(100));
    });
    
    console.log('\n💡 Análisis:');
    console.log(`   • Si la clave tiene 12-13 caracteres, probablemente es un RFC.`);
    console.log(`   • Un RFC válido tiene exactamente 12 caracteres (personas morales) o 13 (personas físicas).`);
    console.log(`\n✅ Se puede copiar la clave al campo RFC de forma segura.\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientes();
