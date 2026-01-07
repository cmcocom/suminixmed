#!/usr/bin/env node
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function probarAPI() {
  try {
    console.log('\n🧪 PROBANDO API /api/tipos-salida\n');
    
    // Simular lo que hace el hook useTiposSalida
    const tipos = await prisma.tipos_salida.findMany({
      orderBy: {
        orden: 'asc',
      },
    });

    console.log('📋 TIPOS DE SALIDA DEVUELTOS POR LA API:\n');
    console.log('═'.repeat(80));
    
    tipos.forEach(tipo => {
      console.log(`\n${tipo.nombre} (${tipo.codigo})`);
      console.log(`  ID: ${tipo.id}`);
      console.log(`  requiere_cliente: ${tipo.requiere_cliente ? '✅ true' : '❌ false'}`);
      console.log(`  requiere_destino: ${tipo.requiere_destino ? '✅ true' : '❌ false'}`);
      console.log(`  requiere_referencia: ${tipo.requiere_referencia ? '✅ true' : '❌ false'}`);
      console.log(`  activo: ${tipo.activo ? '✅ true' : '❌ false'}`);
      console.log(`  orden: ${tipo.orden}`);
    });

    console.log('\n' + '═'.repeat(80));
    
    // Específicamente "Servicios médicos"
    const serviciosMedicos = tipos.find(t => 
      t.nombre.toLowerCase().includes('servicios') && 
      t.nombre.toLowerCase().includes('medico')
    );
    
    if (serviciosMedicos) {
      console.log('\n\n🎯 VERIFICACIÓN ESPECÍFICA: "Servicios médicos"\n');
      console.log('Estado actual en la API:');
      console.log(JSON.stringify({
        id: serviciosMedicos.id,
        nombre: serviciosMedicos.nombre,
        requiere_cliente: serviciosMedicos.requiere_cliente,
        requiere_destino: serviciosMedicos.requiere_destino,
        requiere_referencia: serviciosMedicos.requiere_referencia
      }, null, 2));
      
      if (serviciosMedicos.requiere_cliente) {
        console.log('\n✅ El campo requiere_cliente está en TRUE');
        console.log('✅ El frontend DEBERÍA solicitar cliente para este tipo');
      } else {
        console.log('\n❌ El campo requiere_cliente está en FALSE');
        console.log('❌ El frontend NO solicitará cliente para este tipo');
      }
    }

    console.log('\n✅ Prueba completada\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

probarAPI();
