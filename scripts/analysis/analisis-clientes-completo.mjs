import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analisisCompleto() {
  console.log('\n📊 ANÁLISIS COMPLETO DE CLIENTES Y MOVIMIENTOS\n');
  console.log('═'.repeat(100));
  
  // 1. Total de clientes
  const totalClientes = await prisma.clientes.count();
  console.log('\n1️⃣ ESTADÍSTICAS GENERALES:');
  console.log(`   Total de clientes: ${totalClientes}`);
  
  // 2. Clientes con RFC en clave
  const conRfcEnClave = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM clientes
    WHERE LENGTH(clave) >= 12
      AND (rfc IS NULL OR rfc = '')
  `;
  console.log(`   Clientes con RFC en clave (campo rfc vacío): ${conRfcEnClave[0].count}`);
  
  // 3. Clientes con clave numérica
  const numericos = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM clientes
    WHERE clave ~ '^[0-9]+$'
  `;
  console.log(`   Clientes con clave numérica: ${numericos[0].count}`);
  
  // 4. Clientes con RFC en campo rfc
  const conRfcLleno = await prisma.clientes.count({
    where: {
      rfc: { not: null },
      rfc: { not: '' }
    }
  });
  console.log(`   Clientes con RFC registrado: ${conRfcLleno}`);
  
  // 5. Salidas con cliente
  const salidasConCliente = await prisma.salidas_inventario.count({
    where: {
      cliente_id: { not: null }
    }
  });
  console.log(`   Salidas con cliente asignado: ${salidasConCliente}`);
  
  // 6. Distribución de tipos de clave
  const distribucion = await prisma.$queryRaw`
    SELECT 
      CASE 
        WHEN clave ~ '^[0-9]+$' THEN 'Numérico'
        WHEN LENGTH(clave) >= 12 THEN 'RFC (12+ chars)'
        WHEN clave LIKE 'PAC-%' THEN 'Con prefijo PAC'
        WHEN clave LIKE 'EMP-%' THEN 'Con prefijo EMP'
        ELSE 'Otro formato'
      END as tipo_clave,
      COUNT(*) as cantidad
    FROM clientes
    GROUP BY tipo_clave
    ORDER BY cantidad DESC
  `;
  
  console.log('\n2️⃣ DISTRIBUCIÓN DE FORMATOS DE CLAVE:');
  distribucion.forEach(d => {
    console.log(`   ${d.tipo_clave.padEnd(20)} → ${d.cantidad} clientes`);
  });
  
  // 7. Ejemplos de cada tipo
  console.log('\n3️⃣ EJEMPLOS DE CLIENTES POR TIPO:\n');
  
  const ejemplosNum = await prisma.$queryRaw`
    SELECT clave, nombre, rfc
    FROM clientes
    WHERE clave ~ '^[0-9]+$'
    ORDER BY CAST(clave AS INTEGER) DESC
    LIMIT 3
  `;
  console.log('   📌 Numéricos (últimos 3):');
  ejemplosNum.forEach(c => {
    console.log(`      ${c.clave} - ${c.nombre.substring(0,40)} | RFC: ${c.rfc || 'VACÍO'}`);
  });
  
  const ejemplosRFC = await prisma.$queryRaw`
    SELECT clave, nombre, rfc
    FROM clientes
    WHERE LENGTH(clave) >= 12 AND (rfc IS NULL OR rfc = '')
    LIMIT 3
  `;
  console.log('\n   📌 Con RFC en clave (primeros 3):');
  ejemplosRFC.forEach(c => {
    console.log(`      ${c.clave} - ${c.nombre.substring(0,40)}`);
  });
  
  // 8. Salidas con cliente
  const salidasEjemplo = await prisma.$queryRaw`
    SELECT s.id, s.folio, c.clave, c.nombre
    FROM salidas_inventario s
    INNER JOIN clientes c ON s.cliente_id = c.id
    LIMIT 5
  `;
  
  console.log('\n4️⃣ EJEMPLOS DE SALIDAS CON CLIENTE:');
  if (salidasEjemplo.length > 0) {
    salidasEjemplo.forEach(s => {
      console.log(`   Folio: ${s.folio || 'S/N'} → Cliente: ${s.clave} - ${s.nombre.substring(0,30)}`);
    });
  } else {
    console.log('   (No hay salidas con cliente asignado)');
  }
  
  // 9. Verificar duplicados de clave
  const duplicados = await prisma.$queryRaw`
    SELECT clave, COUNT(*) as count
    FROM clientes
    GROUP BY clave
    HAVING COUNT(*) > 1
  `;
  
  console.log(`\n5️⃣ DUPLICADOS DE CLAVE: ${duplicados.length > 0 ? '⚠️ ENCONTRADOS' : '✅ NO HAY'}`);
  if (duplicados.length > 0) {
    duplicados.forEach(d => {
      console.log(`   ⚠️  Clave "${d.clave}" repetida ${d.count} veces`);
    });
  }
  
  // 10. Verificar duplicados de RFC
  const duplicadosRFC = await prisma.$queryRaw`
    SELECT rfc, COUNT(*) as count
    FROM clientes
    WHERE rfc IS NOT NULL AND rfc != ''
    GROUP BY rfc
    HAVING COUNT(*) > 1
  `;
  
  console.log(`\n6️⃣ DUPLICADOS DE RFC: ${duplicadosRFC.length > 0 ? '⚠️ ENCONTRADOS' : '✅ NO HAY'}`);
  if (duplicadosRFC.length > 0) {
    duplicadosRFC.forEach(d => {
      console.log(`   ⚠️  RFC "${d.rfc}" repetido ${d.count} veces`);
    });
  }
  
  console.log('\n' + '═'.repeat(100));
  console.log('\n✅ Análisis completado\n');
  
  await prisma.$disconnect();
}

analisisCompleto().catch(console.error);
