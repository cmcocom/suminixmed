import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkClientes() {
  try {
    console.log('🔍 Verificando claves de clientes...\n');
    
    const clientes = await prisma.clientes.findMany({
      select: {
        id: true,
        nombre: true,
        clave: true,
        empresa: true
      },
      take: 10
    });
    
    console.log(`Total de clientes encontrados: ${clientes.length}\n`);
    
    clientes.forEach((cliente, index) => {
      console.log(`${index + 1}. Cliente ID: ${cliente.id}`);
      console.log(`   Nombre: ${cliente.nombre}`);
      console.log(`   Clave: "${cliente.clave || 'NULL'}"`);
      console.log(`   Empresa: ${cliente.empresa || 'NULL'}`);
      console.log('');
    });
    
    // Verificar si hay salidas con estos clientes
    const salidas = await prisma.salidas_inventario.findMany({
      where: {
        cliente_id: {
          not: null
        }
      },
      include: {
        clientes: {
          select: {
            id: true,
            nombre: true,
            clave: true
          }
        }
      },
      take: 5
    });
    
    console.log('\n📦 Verificando salidas con clientes...\n');
    salidas.forEach((salida, index) => {
      console.log(`${index + 1}. Salida Folio: ${salida.folio}`);
      console.log(`   Cliente: ${salida.clientes?.nombre || 'Sin cliente'}`);
      console.log(`   Clave Cliente: "${salida.clientes?.clave || 'NULL'}"`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientes();
