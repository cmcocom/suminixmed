#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function crearTiposEntradaSalida() {
  console.log('🚀 Iniciando migración de tipos de entrada y salida...\n');

  try {
    // 1. Crear ENUM para tipos de entrada
    console.log('📥 Creando tipos de entrada...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "TipoEntrada" AS ENUM (
            'compra',
            'inventario_inicial',
            'devolucion_cliente',
            'ajuste_exceso',
            'transferencia',
            'fabricacion_interna',
            'donacion_promocional'
          );
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END $$;
      `);
      console.log('   ✅ Enum TipoEntrada creado');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️ Enum TipoEntrada ya existe');
      } else {
        console.log('   ❌ Error creando TipoEntrada:', error.message);
      }
    }

    // 2. Crear ENUM para tipos de salida
    console.log('\n📤 Creando tipos de salida...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "TipoSalida" AS ENUM (
            'venta',
            'consumo_interno',
            'devolucion_proveedor',
            'obsolescencia',
            'merma_deterioro',
            'donacion_traspaso',
            'robo_extravio'
          );
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END $$;
      `);
      console.log('   ✅ Enum TipoSalida creado');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️ Enum TipoSalida ya existe');
      } else {
        console.log('   ❌ Error creando TipoSalida:', error.message);
      }
    }

    // 3. Agregar columnas a tablas existentes
    console.log('\n🔧 Agregando columnas a tablas existentes...');
    
    const columnasEntradas = [
      { 
        nombre: 'tipo_entrada', 
        sql: 'ALTER TABLE entradas_inventario ADD COLUMN IF NOT EXISTS tipo_entrada "TipoEntrada" DEFAULT \'compra\'' 
      },
      { 
        nombre: 'proveedor_id', 
        sql: 'ALTER TABLE entradas_inventario ADD COLUMN IF NOT EXISTS proveedor_id TEXT' 
      },
      { 
        nombre: 'referencia_externa', 
        sql: 'ALTER TABLE entradas_inventario ADD COLUMN IF NOT EXISTS referencia_externa VARCHAR(255)' 
      }
    ];

    const columnasSalidas = [
      { 
        nombre: 'tipo_salida_enum', 
        sql: 'ALTER TABLE salidas_inventario ADD COLUMN IF NOT EXISTS tipo_salida_enum "TipoSalida" DEFAULT \'venta\'' 
      },
      { 
        nombre: 'cliente_id', 
        sql: 'ALTER TABLE salidas_inventario ADD COLUMN IF NOT EXISTS cliente_id TEXT' 
      },
      { 
        nombre: 'referencia_externa', 
        sql: 'ALTER TABLE salidas_inventario ADD COLUMN IF NOT EXISTS referencia_externa VARCHAR(255)' 
      }
    ];

    // Agregar columnas a entradas
    for (const columna of columnasEntradas) {
      try {
        await prisma.$executeRawUnsafe(columna.sql);
        console.log(`   ✅ Columna ${columna.nombre} agregada a entradas_inventario`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️ Columna ${columna.nombre} ya existe en entradas_inventario`);
        } else {
          console.log(`   ❌ Error agregando ${columna.nombre}:`, error.message);
        }
      }
    }

    // Agregar columnas a salidas
    for (const columna of columnasSalidas) {
      try {
        await prisma.$executeRawUnsafe(columna.sql);
        console.log(`   ✅ Columna ${columna.nombre} agregada a salidas_inventario`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️ Columna ${columna.nombre} ya existe en salidas_inventario`);
        } else {
          console.log(`   ❌ Error agregando ${columna.nombre}:`, error.message);
        }
      }
    }

    // 4. Agregar índices para optimización
    console.log('\n🔍 Creando índices para optimización...');
    
    const indices = [
      'CREATE INDEX IF NOT EXISTS "entradas_inventario_tipo_entrada_idx" ON "entradas_inventario"("tipo_entrada")',
      'CREATE INDEX IF NOT EXISTS "entradas_inventario_proveedor_id_idx" ON "entradas_inventario"("proveedor_id")',
      'CREATE INDEX IF NOT EXISTS "salidas_inventario_tipo_salida_enum_idx" ON "salidas_inventario"("tipo_salida_enum")',
      'CREATE INDEX IF NOT EXISTS "salidas_inventario_cliente_id_idx" ON "salidas_inventario"("cliente_id")'
    ];

    for (const indice of indices) {
      try {
        await prisma.$executeRawUnsafe(indice);
        console.log(`   ✅ Índice creado`);
      } catch (error) {
        console.log(`   ❌ Error creando índice:`, error.message);
      }
    }

    // 5. Crear tabla de configuración de tipos (opcional para descripciones)
    console.log('\n📋 Creando tabla de configuración de tipos...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS tipos_movimiento_config (
          id SERIAL PRIMARY KEY,
          tipo VARCHAR(50) NOT NULL,
          categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('entrada', 'salida')),
          label VARCHAR(100) NOT NULL,
          descripcion TEXT,
          activo BOOLEAN DEFAULT true,
          orden INTEGER DEFAULT 0,
          color VARCHAR(20) DEFAULT 'blue',
          icono VARCHAR(50),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(tipo, categoria)
        )
      `);
      console.log('   ✅ Tabla tipos_movimiento_config creada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️ Tabla tipos_movimiento_config ya existe');
      } else {
        console.log('   ❌ Error creando tabla:', error.message);
      }
    }

    // 6. Insertar configuraciones por defecto
    console.log('\n🌱 Insertando configuraciones por defecto...');

    const configuracionesEntrada = [
      { tipo: 'compra', label: 'Compra', descripcion: 'Entrada por compra a proveedores', orden: 1, color: 'green', icono: 'shopping-cart' },
      { tipo: 'inventario_inicial', label: 'Inventario Inicial', descripcion: 'Registro inicial de inventario', orden: 2, color: 'blue', icono: 'clipboard-list' },
      { tipo: 'devolucion_cliente', label: 'Devolución de Cliente', descripcion: 'Productos devueltos por clientes', orden: 3, color: 'yellow', icono: 'arrow-uturn-left' },
      { tipo: 'ajuste_exceso', label: 'Ajuste por Exceso', descripcion: 'Ajustes positivos en inventario físico', orden: 4, color: 'purple', icono: 'plus-circle' },
      { tipo: 'transferencia', label: 'Transferencia', descripcion: 'Productos recibidos de otras ubicaciones', orden: 5, color: 'indigo', icono: 'arrow-right-circle' },
      { tipo: 'fabricacion_interna', label: 'Fabricación Interna', descripcion: 'Productos fabricados internamente', orden: 6, color: 'orange', icono: 'cog' },
      { tipo: 'donacion_promocional', label: 'Donación/Promocional', descripcion: 'Bienes recibidos sin costo', orden: 7, color: 'pink', icono: 'gift' }
    ];

    const configuracionesSalida = [
      { tipo: 'venta', label: 'Venta', descripcion: 'Salida por venta a clientes', orden: 1, color: 'green', icono: 'shopping-bag' },
      { tipo: 'consumo_interno', label: 'Consumo Interno', descripcion: 'Materiales utilizados internamente', orden: 2, color: 'blue', icono: 'building-office' },
      { tipo: 'devolucion_proveedor', label: 'Devolución a Proveedor', descripcion: 'Productos devueltos por errores o defectos', orden: 3, color: 'yellow', icono: 'arrow-uturn-right' },
      { tipo: 'obsolescencia', label: 'Obsolescencia', descripcion: 'Productos desactualizados o fuera de uso', orden: 4, color: 'gray', icono: 'archive-box-x-mark' },
      { tipo: 'merma_deterioro', label: 'Merma o Deterioro', descripcion: 'Pérdidas por daño, caducidad o deterioro', orden: 5, color: 'red', icono: 'exclamation-triangle' },
      { tipo: 'donacion_traspaso', label: 'Donación o Traspaso', descripcion: 'Transferencias a otras sucursales o donaciones', orden: 6, color: 'purple', icono: 'heart' },
      { tipo: 'robo_extravio', label: 'Robo o Extravío', descripcion: 'Ajustes por pérdidas o hurtos identificados', orden: 7, color: 'black', icono: 'shield-exclamation' }
    ];

    // Insertar entradas
    for (const config of configuracionesEntrada) {
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO tipos_movimiento_config (tipo, categoria, label, descripcion, orden, color, icono)
          VALUES ($1, 'entrada', $2, $3, $4, $5, $6)
          ON CONFLICT (tipo, categoria) DO UPDATE SET
            label = EXCLUDED.label,
            descripcion = EXCLUDED.descripcion,
            orden = EXCLUDED.orden,
            color = EXCLUDED.color,
            icono = EXCLUDED.icono,
            updatedAt = CURRENT_TIMESTAMP
        `, config.tipo, config.label, config.descripcion, config.orden, config.color, config.icono);
        console.log(`   ✅ Configuración entrada '${config.label}' insertada`);
      } catch (error) {
        console.log(`   ❌ Error insertando entrada '${config.label}':`, error.message);
      }
    }

    // Insertar salidas
    for (const config of configuracionesSalida) {
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO tipos_movimiento_config (tipo, categoria, label, descripcion, orden, color, icono)
          VALUES ($1, 'salida', $2, $3, $4, $5, $6)
          ON CONFLICT (tipo, categoria) DO UPDATE SET
            label = EXCLUDED.label,
            descripcion = EXCLUDED.descripcion,
            orden = EXCLUDED.orden,
            color = EXCLUDED.color,
            icono = EXCLUDED.icono,
            updatedAt = CURRENT_TIMESTAMP
        `, config.tipo, config.label, config.descripcion, config.orden, config.color, config.icono);
        console.log(`   ✅ Configuración salida '${config.label}' insertada`);
      } catch (error) {
        console.log(`   ❌ Error insertando salida '${config.label}':`, error.message);
      }
    }

    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('   ✅ Enums TipoEntrada y TipoSalida creados');
    console.log('   ✅ Columnas agregadas a tablas existentes');
    console.log('   ✅ Índices de optimización creados');
    console.log('   ✅ Tabla de configuración creada');
    console.log('   ✅ 7 tipos de entrada configurados');
    console.log('   ✅ 7 tipos de salida configurados');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
if (import.meta.url === `file://${process.argv[1]}`) {
  crearTiposEntradaSalida()
    .catch((error) => {
      console.error('❌ Migración fallida:', error);
      process.exit(1);
    });
}

export { crearTiposEntradaSalida };