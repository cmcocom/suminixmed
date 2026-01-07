import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const clientesAdministrativos = [
  'ASISTENTE DE LA DIRECCION',
  'TRASLADOS',
  'FARMACIA ( UAM )',
  'COORDINACION DE AUX Y DX',
  'TRABAJO SOCIAL',
  'MANTENIMIENTO',
  'CONSULTA EXTERNA TURNO MATUTINO',
  'CONSULTA EXTERNA TURNO VESPERTINO',
  'MEDICINA DEL TRABAJO',
  'COORDINACION DE ENFERMERIA',
  'ARCHIVO CLINICO'
];

async function agregarClientesAdministrativos() {
  try {
    console.log('\n🏥 Agregando Clientes Administrativos/Departamentos\n');
    console.log('═'.repeat(80));
    
    let consecutivo = 76;
    const clientesCreados = [];
    
    for (const nombre of clientesAdministrativos) {
      const clave = String(consecutivo).padStart(3, '0');
      const id = `cliente_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Verificar si ya existe un cliente con este nombre
      const existente = await prisma.clientes.findFirst({
        where: { nombre: nombre }
      });
      
      if (existente) {
        console.log(`⚠️  Ya existe: ${nombre} (clave: ${existente.clave})`);
        consecutivo++;
        continue;
      }
      
      // Crear el cliente
      const cliente = await prisma.clientes.create({
        data: {
          id: id,
          clave: clave,
          nombre: nombre,
          activo: true,
          updatedAt: new Date(),
          email: null,
          telefono: null,
          direccion: null,
          rfc: null,
          empresa: null,
          contacto: null,
          codigo_postal: null,
          medico_tratante: null,
          especialidad: null,
          localidad: null,
          estado: null,
          pais: 'México',
          imagen: null,
          id_usuario: null
        }
      });
      
      clientesCreados.push({
        clave: clave,
        nombre: nombre,
        id: cliente.id
      });
      
      console.log(`✅ Creado: ${clave} - ${nombre}`);
      consecutivo++;
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 RESUMEN DE LA OPERACIÓN:\n');
    console.log(`Total de clientes a crear: ${clientesAdministrativos.length}`);
    console.log(`Clientes creados exitosamente: ${clientesCreados.length}`);
    console.log(`Clientes omitidos (ya existían): ${clientesAdministrativos.length - clientesCreados.length}`);
    console.log(`Próximo consecutivo disponible: ${consecutivo}`);
    
    if (clientesCreados.length > 0) {
      console.log('\n📋 Clientes creados:');
      console.log('─'.repeat(80));
      clientesCreados.forEach(c => {
        console.log(`   ${c.clave} - ${c.nombre}`);
      });
    }
    
    console.log('\n✅ Proceso completado exitosamente.\n');
    
  } catch (error) {
    console.error('\n❌ Error durante la creación de clientes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
agregarClientesAdministrativos()
  .then(() => {
    console.log('🎉 Script finalizado correctamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
