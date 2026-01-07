import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración: Sistema de Folios para Entradas y Salidas');
  console.log('='.repeat(70));

  try {
    // 1. Crear tabla de configuración de folios
    console.log('\n📋 Paso 1: Creando tabla de configuración de folios...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS config_folios (
          id SERIAL PRIMARY KEY,
          tipo VARCHAR(20) NOT NULL UNIQUE CHECK (tipo IN ('entrada', 'salida')),
          serie_actual VARCHAR(10) DEFAULT '',
          proximo_folio INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT proximo_folio_positivo CHECK (proximo_folio > 0)
        )
      `);
      console.log('   ✅ Tabla config_folios creada exitosamente');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('   ⚠️  Tabla config_folios ya existe');
      } else {
        throw error;
      }
    }

    // 2. Inicializar configuración de folios
    console.log('\n📋 Paso 2: Inicializando configuración de folios...');
    try {
      // Insertar configuración para entradas
      await prisma.$executeRawUnsafe(`
        INSERT INTO config_folios (tipo, serie_actual, proximo_folio)
        VALUES ('entrada', '', 1)
        ON CONFLICT (tipo) DO NOTHING
      `);
      console.log('   ✅ Configuración de folios para ENTRADAS inicializada');

      // Insertar configuración para salidas
      await prisma.$executeRawUnsafe(`
        INSERT INTO config_folios (tipo, serie_actual, proximo_folio)
        VALUES ('salida', '', 1)
        ON CONFLICT (tipo) DO NOTHING
      `);
      console.log('   ✅ Configuración de folios para SALIDAS inicializada');
    } catch (error) {
      console.log('   ⚠️  Configuración ya existe, continuando...');
    }

    // 3. Agregar campos serie y folio a entradas_inventario
    console.log('\n📋 Paso 3: Agregando campos a tabla entradas_inventario...');
    
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE entradas_inventario 
        ADD COLUMN IF NOT EXISTS serie VARCHAR(10) DEFAULT ''
      `);
      console.log('   ✅ Campo "serie" agregado a entradas_inventario');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('   ⚠️  Campo "serie" ya existe en entradas_inventario');
      } else {
        throw error;
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE entradas_inventario 
        ADD COLUMN IF NOT EXISTS folio INTEGER
      `);
      console.log('   ✅ Campo "folio" agregado a entradas_inventario');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('   ⚠️  Campo "folio" ya existe en entradas_inventario');
      } else {
        throw error;
      }
    }

    // 4. Agregar campos serie y folio a salidas_inventario
    console.log('\n📋 Paso 4: Agregando campos a tabla salidas_inventario...');
    
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE salidas_inventario 
        ADD COLUMN IF NOT EXISTS serie VARCHAR(10) DEFAULT ''
      `);
      console.log('   ✅ Campo "serie" agregado a salidas_inventario');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('   ⚠️  Campo "serie" ya existe en salidas_inventario');
      } else {
        throw error;
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE salidas_inventario 
        ADD COLUMN IF NOT EXISTS folio INTEGER
      `);
      console.log('   ✅ Campo "folio" agregado a salidas_inventario');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('   ⚠️  Campo "folio" ya existe en salidas_inventario');
      } else {
        throw error;
      }
    }

    // 5. Asignar folios a entradas existentes
    console.log('\n📋 Paso 5: Asignando folios a entradas existentes...');
    
    // Contar entradas sin folio
    const entradasSinFolio = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM entradas_inventario 
      WHERE folio IS NULL
    `;
    const countEntradas = Number(entradasSinFolio[0].count);
    
    if (countEntradas > 0) {
      console.log(`   📊 Encontradas ${countEntradas} entradas sin folio`);
      
      // Obtener todas las entradas ordenadas por fecha de creación
      const entradas = await prisma.$queryRaw`
        SELECT id, "createdAt"
        FROM entradas_inventario
        WHERE folio IS NULL
        ORDER BY "createdAt" ASC
      `;
      
      // Asignar folios consecutivos
      let folioActual = 1;
      for (const entrada of entradas) {
        await prisma.$executeRawUnsafe(`
          UPDATE entradas_inventario 
          SET serie = '', folio = ${folioActual}
          WHERE id = '${entrada.id}'
        `);
        folioActual++;
      }
      
      console.log(`   ✅ Asignados folios 1-${folioActual - 1} a entradas existentes`);
      
      // Actualizar el próximo folio en la configuración
      await prisma.$executeRawUnsafe(`
        UPDATE config_folios 
        SET proximo_folio = ${folioActual}
        WHERE tipo = 'entrada'
      `);
      console.log(`   ✅ Próximo folio para entradas configurado: ${folioActual}`);
    } else {
      console.log('   ℹ️  No hay entradas sin folio');
    }

    // 6. Asignar folios a salidas existentes
    console.log('\n📋 Paso 6: Asignando folios a salidas existentes...');
    
    // Contar salidas sin folio
    const salidasSinFolio = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM salidas_inventario 
      WHERE folio IS NULL
    `;
    const countSalidas = Number(salidasSinFolio[0].count);
    
    if (countSalidas > 0) {
      console.log(`   📊 Encontradas ${countSalidas} salidas sin folio`);
      
      // Obtener todas las salidas ordenadas por fecha de creación
      const salidas = await prisma.$queryRaw`
        SELECT id, "createdAt"
        FROM salidas_inventario
        WHERE folio IS NULL
        ORDER BY "createdAt" ASC
      `;
      
      // Asignar folios consecutivos
      let folioActual = 1;
      for (const salida of salidas) {
        await prisma.$executeRawUnsafe(`
          UPDATE salidas_inventario 
          SET serie = '', folio = ${folioActual}
          WHERE id = '${salida.id}'
        `);
        folioActual++;
      }
      
      console.log(`   ✅ Asignados folios 1-${folioActual - 1} a salidas existentes`);
      
      // Actualizar el próximo folio en la configuración
      await prisma.$executeRawUnsafe(`
        UPDATE config_folios 
        SET proximo_folio = ${folioActual}
        WHERE tipo = 'salida'
      `);
      console.log(`   ✅ Próximo folio para salidas configurado: ${folioActual}`);
    } else {
      console.log('   ℹ️  No hay salidas sin folio');
    }

    // 7. Crear índices para optimización
    console.log('\n📋 Paso 7: Creando índices...');
    
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_entradas_folio 
        ON entradas_inventario(folio)
      `);
      console.log('   ✅ Índice creado en entradas_inventario(folio)');
    } catch (error) {
      console.log('   ⚠️  Índice ya existe en entradas_inventario(folio)');
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_entradas_serie_folio 
        ON entradas_inventario(serie, folio)
      `);
      console.log('   ✅ Índice creado en entradas_inventario(serie, folio)');
    } catch (error) {
      console.log('   ⚠️  Índice ya existe en entradas_inventario(serie, folio)');
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_salidas_folio 
        ON salidas_inventario(folio)
      `);
      console.log('   ✅ Índice creado en salidas_inventario(folio)');
    } catch (error) {
      console.log('   ⚠️  Índice ya existe en salidas_inventario(folio)');
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_salidas_serie_folio 
        ON salidas_inventario(serie, folio)
      `);
      console.log('   ✅ Índice creado en salidas_inventario(serie, folio)');
    } catch (error) {
      console.log('   ⚠️  Índice ya existe en salidas_inventario(serie, folio)');
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('   ✅ Tabla config_folios creada');
    console.log('   ✅ Configuración inicial para entradas y salidas');
    console.log('   ✅ Campos serie y folio agregados a entradas_inventario');
    console.log('   ✅ Campos serie y folio agregados a salidas_inventario');
    console.log(`   ✅ Folios asignados a ${countEntradas} entradas existentes`);
    console.log(`   ✅ Folios asignados a ${countSalidas} salidas existentes`);
    console.log('   ✅ Índices de optimización creados');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Actualizar schema.prisma con los nuevos campos');
    console.log('   2. Ejecutar: npx prisma generate');
    console.log('   3. Actualizar APIs para usar el sistema de folios');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
