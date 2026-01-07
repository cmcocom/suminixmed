import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function importarClientes() {
  try {
    console.log('\n🚀 INICIANDO IMPORTACIÓN DE CLIENTES DESDE CSV\n');
    console.log('═'.repeat(80));

    // Leer archivo CSV
    const csvPath = '/Users/cristian/Downloads/clientes.csv';
    const fileContent = fs.readFileSync(csvPath, 'utf-8');

    // Parsear CSV - sin usar headers, leer como array
    const records: string[][] = parse(fileContent, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: true,
      bom: true,
      from_line: 2 // Saltar header
    });

    console.log(`\n📊 Total de registros en CSV: ${records.length}\n`);

    let importados = 0;
    let errores = 0;
    const erroresDetalle: string[] = [];

    // Procesar cada registro
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Limpiar y preparar datos - acceso por índice
        const clave = (record[0] || '').trim() || null;
        const nombre = (record[1] || '').trim();
        const medicoTratante = (record[2] || '').trim() || null;
        const especialidad = (record[3] || '').trim() || null;
        const localidad = (record[4] || '').trim() || null;

        // Validar que al menos tenga nombre o clave
        if (!nombre && !clave) {
          console.log(`⚠️  Fila ${i + 2}: Sin nombre ni clave, omitiendo...`);
          continue;
        }

        // Si no tiene nombre, usar la clave como nombre
        const nombreFinal = nombre || clave || `Cliente ${i + 1}`;

        // Generar ID único
        const id = `cliente_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Insertar en la base de datos
        await prisma.clientes.create({
          data: {
            id,
            clave,
            nombre: nombreFinal,
            medico_tratante: medicoTratante,
            especialidad,
            localidad,
            estado: null,
            pais: 'México',
            email: null,
            telefono: null,
            direccion: null,
            rfc: null,
            empresa: null,
            contacto: null,
            codigo_postal: null,
            imagen: null,
            activo: true,
            id_usuario: null,
            updatedAt: new Date()
          }
        });

        importados++;
        
        // Mostrar progreso cada 10 registros
        if (importados % 10 === 0) {
          console.log(`✅ Importados: ${importados} registros...`);
        }

      } catch (error) {
        errores++;
        const errorMsg = `Fila ${i + 2}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        erroresDetalle.push(errorMsg);
        console.log(`❌ ${errorMsg}`);
      }
    }

    // Resumen final
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 RESUMEN DE IMPORTACIÓN:\n');
    console.log(`✅ Registros importados exitosamente: ${importados}`);
    console.log(`❌ Errores encontrados: ${errores}`);
    console.log(`📝 Total procesado: ${importados + errores}\n`);

    if (erroresDetalle.length > 0) {
      console.log('⚠️  DETALLE DE ERRORES:\n');
      erroresDetalle.forEach(error => console.log(`   • ${error}`));
      console.log('');
    }

    // Verificar total en base de datos
    const totalEnDB = await prisma.clientes.count();
    console.log(`🗄️  Total de clientes en la base de datos: ${totalEnDB}\n`);

    // Mostrar muestra de los primeros registros importados
    const muestra = await prisma.clientes.findMany({
      take: 5,
      orderBy: { createdAt: 'asc' },
      select: {
        clave: true,
        nombre: true,
        medico_tratante: true,
        especialidad: true,
        localidad: true
      }
    });

    console.log('📋 MUESTRA DE PRIMEROS 5 REGISTROS IMPORTADOS:\n');
    muestra.forEach((c, i) => {
      console.log(`${i + 1}. ${c.nombre}`);
      if (c.clave) console.log(`   Clave: ${c.clave}`);
      if (c.medico_tratante) console.log(`   Médico: ${c.medico_tratante}`);
      if (c.especialidad) console.log(`   Especialidad: ${c.especialidad}`);
      if (c.localidad) console.log(`   Localidad: ${c.localidad}`);
      console.log('');
    });

    console.log('═'.repeat(80));
    console.log('\n✅ IMPORTACIÓN COMPLETADA EXITOSAMENTE\n');

  } catch (error) {
    console.error('\n❌ ERROR FATAL EN LA IMPORTACIÓN:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar importación
importarClientes()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
