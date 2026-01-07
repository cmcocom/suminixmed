import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function crearControlConsecutivos() {
  console.log('\n🔧 CREACIÓN DE TABLA DE CONTROL DE CONSECUTIVOS\n');
  console.log('═'.repeat(100));
  
  try {
    // PASO 1: Crear tabla de control
    console.log('\n📋 PASO 1: Creando tabla config_claves_clientes...\n');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS config_claves_clientes (
        id SERIAL PRIMARY KEY,
        tipo_cliente VARCHAR(50) NOT NULL UNIQUE,
        prefijo VARCHAR(10) DEFAULT '',
        siguiente_numero INTEGER NOT NULL DEFAULT 1,
        longitud_clave INTEGER NOT NULL DEFAULT 3,
        descripcion TEXT,
        activo BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    
    console.log('   ✅ Tabla creada exitosamente');
    
    // PASO 2: Insertar configuraciones iniciales
    console.log('\n📊 PASO 2: Configurando tipos de cliente...\n');
    
    // Pacientes (ya hay hasta 086)
    await prisma.$executeRaw`
      INSERT INTO config_claves_clientes (tipo_cliente, prefijo, siguiente_numero, longitud_clave, descripcion)
      VALUES ('paciente', '', 87, 3, 'Pacientes y clientes individuales - claves numéricas consecutivas')
      ON CONFLICT (tipo_cliente) DO UPDATE SET
        siguiente_numero = EXCLUDED.siguiente_numero,
        descripcion = EXCLUDED.descripcion
    `;
    console.log('   ✓ Tipo "paciente" configurado (siguiente: 087)');
    
    // Empresas
    await prisma.$executeRaw`
      INSERT INTO config_claves_clientes (tipo_cliente, prefijo, siguiente_numero, longitud_clave, descripcion)
      VALUES ('empresa', 'EMP-', 1, 3, 'Empresas y clientes corporativos')
      ON CONFLICT (tipo_cliente) DO UPDATE SET
        prefijo = EXCLUDED.prefijo,
        descripcion = EXCLUDED.descripcion
    `;
    console.log('   ✓ Tipo "empresa" configurado (siguiente: EMP-001)');
    
    // Departamentos administrativos (ya hay hasta 086)
    await prisma.$executeRaw`
      INSERT INTO config_claves_clientes (tipo_cliente, prefijo, siguiente_numero, longitud_clave, descripcion)
      VALUES ('departamento', 'DEPT-', 87, 3, 'Departamentos y áreas administrativas internas')
      ON CONFLICT (tipo_cliente) DO UPDATE SET
        prefijo = EXCLUDED.prefijo,
        siguiente_numero = EXCLUDED.siguiente_numero,
        descripcion = EXCLUDED.descripcion
    `;
    console.log('   ✓ Tipo "departamento" configurado (siguiente: DEPT-087)');
    
    // Clientes con RFC como clave
    await prisma.$executeRaw`
      INSERT INTO config_claves_clientes (tipo_cliente, prefijo, siguiente_numero, longitud_clave, descripcion)
      VALUES ('rfc', '', 0, 13, 'Clientes que usan su RFC como clave - no usa consecutivo')
      ON CONFLICT (tipo_cliente) DO UPDATE SET
        descripcion = EXCLUDED.descripcion
    `;
    console.log('   ✓ Tipo "rfc" configurado (usa RFC directo, sin consecutivo)');
    
    // PASO 3: Verificar configuración
    console.log('\n📋 PASO 3: Configuración actual:\n');
    
    const configs = await prisma.$queryRaw`
      SELECT tipo_cliente, prefijo, siguiente_numero, longitud_clave, activo, descripcion
      FROM config_claves_clientes
      ORDER BY tipo_cliente
    `;
    
    console.log('   ┌─────────────────┬──────────┬───────────┬──────────┬────────┐');
    console.log('   │ Tipo Cliente    │ Prefijo  │ Siguiente │ Longitud │ Activo │');
    console.log('   ├─────────────────┼──────────┼───────────┼──────────┼────────┤');
    configs.forEach(c => {
      const tipo = c.tipo_cliente.padEnd(15);
      const prefijo = (c.prefijo || '(sin)').padEnd(8);
      const siguiente = String(c.siguiente_numero).padStart(9);
      const longitud = String(c.longitud_clave).padStart(8);
      const activo = c.activo ? '   ✓   ' : '   ✗   ';
      console.log(`   │ ${tipo} │ ${prefijo} │ ${siguiente} │ ${longitud} │ ${activo}│`);
    });
    console.log('   └─────────────────┴──────────┴───────────┴──────────┴────────┘');
    
    console.log('\n📝 Descripción de cada tipo:\n');
    configs.forEach(c => {
      console.log(`   • ${c.tipo_cliente}: ${c.descripcion}`);
    });
    
    // PASO 4: Crear índice para mejor rendimiento
    console.log('\n🔧 PASO 4: Creando índices...\n');
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_config_claves_tipo ON config_claves_clientes(tipo_cliente)
    `;
    
    console.log('   ✅ Índices creados');
    
    console.log('\n' + '═'.repeat(100));
    console.log('\n✅ SISTEMA DE CONTROL DE CONSECUTIVOS LISTO\n');
    
    return configs;
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

crearControlConsecutivos()
  .then((configs) => {
    console.log(`\n📊 Total de tipos configurados: ${configs.length}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
