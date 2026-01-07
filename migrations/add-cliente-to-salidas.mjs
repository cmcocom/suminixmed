#!/usr/bin/env node

/**
 * Migración: Agregar campo cliente_id a salidas_inventario
 * 
 * SEGURIDAD:
 * - Campo es NULLABLE: los registros existentes no se verán afectados
 * - Operación NO destructiva: solo agrega columna
 * - Registros existentes tendrán cliente_id = NULL (válido)
 * 
 * Ejecutar: node migrations/add-cliente-to-salidas.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando migración: Agregar cliente_id a salidas_inventario...\n');

  try {
    // 1. Verificar que la tabla clientes existe
    console.log('1️⃣ Verificando tabla clientes...');
    const clientesCount = await prisma.clientes.count();
    console.log(`   ✅ Tabla clientes existe con ${clientesCount} registros\n`);

    // 2. Verificar registros actuales en salidas
    const salidasCount = await prisma.salidas_inventario.count();
    console.log(`2️⃣ Registros actuales en salidas_inventario: ${salidasCount}\n`);

    // 3. Agregar columna cliente_id (NULLABLE - SEGURO)
    console.log('3️⃣ Agregando columna cliente_id a salidas_inventario...');
    await prisma.$executeRaw`
      ALTER TABLE salidas_inventario 
      ADD COLUMN IF NOT EXISTS cliente_id VARCHAR(255)
    `;
    console.log('   ✅ Columna cliente_id agregada (nullable)\n');

    // 4. Agregar foreign key con ON DELETE SET NULL (seguro)    console.log('4️⃣ Agregando foreign key constraint...');
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'salidas_inventario_cliente_id_fkey'
        ) THEN
          ALTER TABLE salidas_inventario
          ADD CONSTRAINT salidas_inventario_cliente_id_fkey
          FOREIGN KEY (cliente_id) 
          REFERENCES clientes(id) 
          ON DELETE SET NULL;
        END IF;
      END $$;
    `;
    console.log('   ✅ Foreign key agregada con ON DELETE SET NULL\n');

    // 5. Crear índice para mejorar performance en búsquedas
    console.log('5️⃣ Creando índice en cliente_id...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS salidas_inventario_cliente_id_idx 
      ON salidas_inventario(cliente_id)
    `;
    console.log('   ✅ Índice creado\n');

    // 6. Verificación final
    console.log('6️⃣ Verificación final...');
    const salidasDespues = await prisma.salidas_inventario.count();
    
    if (salidasDespues === salidasCount) {
      console.log(`   ✅ Todos los registros preservados: ${salidasDespues}/${salidasCount}\n`);
    } else {
      throw new Error(`❌ ERROR: Se perdieron registros! Antes: ${salidasCount}, Después: ${salidasDespues}`);
    }

    // 7. Mostrar estadísticas
    const conCliente = await prisma.salidas_inventario.count({
      where: { cliente_id: { not: null } }
    });
    const sinCliente = await prisma.salidas_inventario.count({
      where: { cliente_id: null }
    });

    console.log('📊 Estadísticas finales:');
    console.log(`   • Salidas con cliente: ${conCliente}`);
    console.log(`   • Salidas sin cliente: ${sinCliente}`);
    console.log(`   • Total: ${salidasDespues}\n`);

    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('💡 Los registros existentes tienen cliente_id = NULL (esto es correcto)');
    console.log('💡 Nuevas salidas pueden asignar un cliente opcionalmente\n');

  } catch (error) {
    console.error('\n❌ Error durante la migración:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
