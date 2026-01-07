// 📋 MIGRACIÓN INVERSA V2 - FASE 2: EVOLUCIÓN ESTRUCTURAL
// ================================================================
// Aplicar mejoras del esquema de producción a la base evolucionada

import pkg from 'pg';
const { Client } = pkg;

class EsquemaEvolucionador {
  constructor() {
    // Usar la misma contraseña para ambas conexiones
    const password = process.env.PGPASSWORD || 'siminixmed123';
    
    this.clientEvolucionado = new Client({
      host: 'localhost',
      user: 'postgres',
      password,
      database: 'suminix_evolucionado',
    });

    this.clientProduccion = new Client({
      host: 'localhost', 
      user: 'postgres',
      password,
      database: 'suminixmed',
    });
  }

  async conectar() {
    console.log('🔗 Conectando a ambas bases de datos...');
    await this.clientEvolucionado.connect();
    await this.clientProduccion.connect();
    console.log('✅ Conexiones establecidas');
  }

  async desconectar() {
    await this.clientEvolucionado.end();
    await this.clientProduccion.end();
    console.log('🔌 Conexiones cerradas');
  }

  // 1. Analizar diferencias estructurales entre esquemas
  async analizarDiferenciasEstructurales() {
    console.log('\n📊 ANÁLISIS DE DIFERENCIAS ESTRUCTURALES');
    console.log('='.repeat(60));

    try {
      // Comparar columnas nuevas en producción vs evolucionado
      const columnasProduccion = await this.clientProduccion.query(`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `);

      const columnasEvolucionado = await this.clientEvolucionado.query(`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `);

      // Crear mapas para comparación
      const mapProduccion = new Map();
      const mapEvolucionado = new Map();

      columnasProduccion.rows.forEach(col => {
        const key = `${col.table_name}.${col.column_name}`;
        mapProduccion.set(key, col);
      });

      columnasEvolucionado.rows.forEach(col => {
        const key = `${col.table_name}.${col.column_name}`;
        mapEvolucionado.set(key, col);
      });

      // Encontrar columnas que están en producción pero no en evolucionado
      const columnasNuevas = [];
      const tablasNuevas = new Set();

      for (const [key, col] of mapProduccion) {
        if (!mapEvolucionado.has(key)) {
          columnasNuevas.push(col);
          tablasNuevas.add(col.table_name);
        }
      }

      console.log(`\n🆕 COLUMNAS NUEVAS EN PRODUCCIÓN (${columnasNuevas.length}):`);
      if (columnasNuevas.length > 0) {
        const gruposPorTabla = {};
        columnasNuevas.forEach(col => {
          if (!gruposPorTabla[col.table_name]) {
            gruposPorTabla[col.table_name] = [];
          }
          gruposPorTabla[col.table_name].push(col);
        });

        Object.keys(gruposPorTabla).forEach(tabla => {
          console.log(`\n  📋 ${tabla}:`);
          gruposPorTabla[tabla].forEach(col => {
            console.log(`    + ${col.column_name} (${col.data_type})`);
          });
        });
      } else {
        console.log('   ✅ No hay columnas nuevas que agregar');
      }

      // Analizar índices nuevos
      const indicesProduccion = await this.clientProduccion.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `);

      const indicesEvolucionado = await this.clientEvolucionado.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `);

      const indicesEvolucionadoSet = new Set(
        indicesEvolucionado.rows.map(idx => `${idx.tablename}.${idx.indexname}`)
      );

      const indicesNuevos = indicesProduccion.rows.filter(idx => 
        !indicesEvolucionadoSet.has(`${idx.tablename}.${idx.indexname}`)
      );

      console.log(`\n🔍 ÍNDICES NUEVOS EN PRODUCCIÓN (${indicesNuevos.length}):`);
      if (indicesNuevos.length > 0) {
        indicesNuevos.forEach(idx => {
          console.log(`  + ${idx.tablename}.${idx.indexname}`);
        });
      } else {
        console.log('   ✅ No hay índices nuevos que agregar');
      }

      return {
        columnasNuevas,
        indicesNuevos,
        tablasAfectadas: Array.from(tablasNuevas)
      };

    } catch (error) {
      console.error('❌ Error analizando diferencias:', error.message);
      throw error;
    }
  }

  // 2. Aplicar mejoras estructurales del esquema
  async aplicarMejorasEstructurales(diferencias) {
    console.log('\n🔧 APLICANDO MEJORAS ESTRUCTURALES');
    console.log('='.repeat(60));

    try {
      // Comenzar transacción
      await this.clientEvolucionado.query('BEGIN');

      let cambiosAplicados = 0;

      // Agregar columnas nuevas
      if (diferencias.columnasNuevas.length > 0) {
        console.log('\n➕ Agregando columnas nuevas...');
        
        const gruposPorTabla = {};
        diferencias.columnasNuevas.forEach(col => {
          if (!gruposPorTabla[col.table_name]) {
            gruposPorTabla[col.table_name] = [];
          }
          gruposPorTabla[col.table_name].push(col);
        });

        for (const tabla of Object.keys(gruposPorTabla)) {
          console.log(`\n  📋 Procesando tabla: ${tabla}`);
          
          for (const col of gruposPorTabla[tabla]) {
            try {
              let alterQuery = `ALTER TABLE "${tabla}" ADD COLUMN "${col.column_name}" ${col.data_type}`;
              
              if (col.is_nullable === 'NO') {
                // Para columnas NOT NULL, necesitamos un valor por defecto temporal
                if (col.column_default) {
                  alterQuery += ` DEFAULT ${col.column_default}`;
                } else {
                  // Agregar valor por defecto según el tipo
                  if (col.data_type.includes('varchar') || col.data_type.includes('text')) {
                    alterQuery += " DEFAULT ''";
                  } else if (col.data_type.includes('int') || col.data_type.includes('numeric')) {
                    alterQuery += ' DEFAULT 0';
                  } else if (col.data_type.includes('boolean')) {
                    alterQuery += ' DEFAULT false';
                  } else if (col.data_type.includes('timestamp')) {
                    alterQuery += ' DEFAULT CURRENT_TIMESTAMP';
                  }
                }
                alterQuery += ' NOT NULL';
              }

              await this.clientEvolucionado.query(alterQuery);
              console.log(`    ✅ + ${col.column_name} (${col.data_type})`);
              cambiosAplicados++;

            } catch (error) {
              if (error.message.includes('ya existe')) {
                console.log(`    ⚠️  ${col.column_name} ya existe, omitiendo`);
              } else {
                console.log(`    ❌ Error agregando ${col.column_name}: ${error.message}`);
              }
            }
          }
        }
      }

      // Crear índices nuevos
      if (diferencias.indicesNuevos.length > 0) {
        console.log('\n🔍 Creando índices nuevos...');
        
        for (const indice of diferencias.indicesNuevos) {
          try {
            await this.clientEvolucionado.query(indice.indexdef);
            console.log(`    ✅ + ${indice.indexname}`);
            cambiosAplicados++;
          } catch (error) {
            if (error.message.includes('ya existe')) {
              console.log(`    ⚠️  ${indice.indexname} ya existe, omitiendo`);
            } else {
              console.log(`    ❌ Error creando ${indice.indexname}: ${error.message}`);
            }
          }
        }
      }

      // Confirmar cambios
      await this.clientEvolucionado.query('COMMIT');

      console.log(`\n✅ EVOLUCIÓN ESTRUCTURAL COMPLETADA`);
      console.log(`   📊 Cambios aplicados: ${cambiosAplicados}`);
      
      return { cambiosAplicados, exito: true };

    } catch (error) {
      await this.clientEvolucionado.query('ROLLBACK');
      console.error('❌ Error aplicando mejoras estructurales:', error.message);
      throw error;
    }
  }

  // 3. Verificar integridad después de evolución
  async verificarIntegridad() {
    console.log('\n🔍 VERIFICACIÓN DE INTEGRIDAD POST-EVOLUCIÓN');
    console.log('='.repeat(60));

    try {
      // Verificar conteos principales
      const verificaciones = [
        'SELECT count(*) as inventario FROM "Inventario"',
        'SELECT count(*) as usuarios FROM "User"', 
        'SELECT count(*) as clientes FROM clientes',
        'SELECT count(*) as entradas FROM entradas_inventario',
        'SELECT count(*) as salidas FROM salidas_inventario',
        'SELECT count(*) as rbac_roles FROM rbac_roles',
        'SELECT count(*) as rbac_permisos FROM rbac_permissions'
      ];

      const resultados = {};
      for (const query of verificaciones) {
        const result = await this.clientEvolucionado.query(query);
        const tabla = Object.keys(result.rows[0])[0];
        resultados[tabla] = result.rows[0][tabla];
      }

      console.log('\n📊 CONTEOS DE VERIFICACIÓN:');
      Object.keys(resultados).forEach(tabla => {
        console.log(`   ${tabla.padEnd(15)}: ${resultados[tabla].toString().padStart(6)}`);
      });

      // Verificar estructura de tablas críticas
      const tablasCriticas = [
        '"Inventario"', '"User"', 'clientes', 'rbac_roles', 'rbac_permissions'
      ];

      console.log('\n🏗️  ESTRUCTURA DE TABLAS CRÍTICAS:');
      for (const tabla of tablasCriticas) {
        try {
          const result = await this.clientEvolucionado.query(`
            SELECT count(*) as columnas 
            FROM information_schema.columns 
            WHERE table_name = ${tabla.replace(/"/g, "'")} AND table_schema = 'public'
          `);
          console.log(`   ${tabla.padEnd(15)}: ${result.rows[0].columnas} columnas`);
        } catch {
          console.log(`   ${tabla.padEnd(15)}: ❌ Error verificando`);
        }
      }

      return { resultados, exito: true };

    } catch (error) {
      console.error('❌ Error en verificación de integridad:', error.message);
      throw error;
    }
  }

  // Proceso principal
  async ejecutarFase2() {
    console.log('🚀 INICIANDO FASE 2: EVOLUCIÓN ESTRUCTURAL');
    console.log('='.repeat(70));
    console.log('Objetivo: Aplicar mejoras estructurales de producción a la base evolucionada');
    console.log('');

    try {
      await this.conectar();

      // Paso 1: Analizar diferencias
      const diferencias = await this.analizarDiferenciasEstructurales();

      // Paso 2: Aplicar mejoras estructurales
      if (diferencias.columnasNuevas.length > 0 || diferencias.indicesNuevos.length > 0) {
        const resultado = await this.aplicarMejorasEstructurales(diferencias);
        
        // Paso 3: Verificar integridad
        await this.verificarIntegridad();

        console.log('\n🎉 FASE 2 COMPLETADA CON ÉXITO');
        console.log('📋 Próximo paso: Ejecutar Fase 3 (Migración RBAC V2)');
        
        return resultado;
      } else {
        console.log('\n✅ No se detectaron diferencias estructurales significativas');
        console.log('📋 Continuando a Fase 3 (Migración RBAC V2)');
        
        return { cambiosAplicados: 0, exito: true };
      }

    } catch (error) {
      console.error('\n💥 ERROR EN FASE 2:', error.message);
      throw error;
    } finally {
      await this.desconectar();
    }
  }
}

// Ejecutar si es llamado directamente
const evolucionador = new EsquemaEvolucionador();

evolucionador.ejecutarFase2()
  .then(resultado => {
    console.log('\n✅ Fase 2 ejecutada exitosamente');
    console.log('📊 Resultado:', resultado);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error en ejecución:', error.message);
    process.exit(1);
  });

export default EsquemaEvolucionador;