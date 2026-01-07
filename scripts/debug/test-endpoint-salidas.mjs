// Test específico del endpoint de reportes
// Archivo: test-endpoint-salidas.mjs

async function testEndpointSalidas() {
  console.log('=== Test del Endpoint de Salidas por Cliente ===\n');

  try {
    const baseUrl = 'http://localhost:3000';
    
    // Test 1: Período corto
    console.log('1. TEST PERÍODO CORTO (5 días):');
    const params1 = new URLSearchParams({
      fechaInicio: '2025-11-01',
      fechaFin: '2025-11-05',
      agruparPor: 'cliente'
    });
    
    const start1 = Date.now();
    const response1 = await fetch(`${baseUrl}/api/reportes/salidas-cliente/consolidado?${params1}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Simular cookies de sesión (esto normalmente se maneja automáticamente)
      }
    });
    const end1 = Date.now();
    
    if (!response1.ok) {
      console.log(`Error en período corto: ${response1.status} - ${response1.statusText}`);
      const errorText = await response1.text();
      console.log('Error details:', errorText);
    } else {
      const data1 = await response1.json();
      console.log(`Tiempo de respuesta: ${end1 - start1}ms`);
      console.log(`Registros devueltos: ${data1.data?.length || 0}`);
      console.log(`Estructura de respuesta:`, {
        success: data1.success,
        agruparPor: data1.agruparPor,
        dataType: typeof data1.data,
        isArray: Array.isArray(data1.data)
      });
      
      if (data1.data && data1.data.length > 0) {
        console.log('Primer registro:', JSON.stringify(data1.data[0], null, 2));
      }
    }

    console.log('\n');

    // Test 2: Período largo (todo 2025)
    console.log('2. TEST PERÍODO LARGO (todo 2025):');
    const params2 = new URLSearchParams({
      fechaInicio: '2025-01-01',
      fechaFin: '2025-12-31',
      agruparPor: 'cliente'
    });
    
    const start2 = Date.now();
    const response2 = await fetch(`${baseUrl}/api/reportes/salidas-cliente/consolidado?${params2}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const end2 = Date.now();
    
    if (!response2.ok) {
      console.log(`Error en período largo: ${response2.status} - ${response2.statusText}`);
      const errorText = await response2.text();
      console.log('Error details:', errorText);
    } else {
      const data2 = await response2.json();
      console.log(`Tiempo de respuesta: ${end2 - start2}ms`);
      console.log(`Registros devueltos: ${data2.data?.length || 0}`);
      
      if (data2.data && data2.data.length > 0) {
        console.log('Primer registro período largo:', JSON.stringify(data2.data[0], null, 2));
        console.log('Total productos en primer cliente:', data2.data[0].productos?.length || 0);
        console.log('Total unidades en primer cliente:', data2.data[0].total_unidades || 0);
      }
    }

    console.log('\n');

    // Test 3: Agrupado por categoría
    console.log('3. TEST AGRUPADO POR CATEGORÍA (período largo):');
    const params3 = new URLSearchParams({
      fechaInicio: '2025-01-01',
      fechaFin: '2025-12-31',
      agruparPor: 'categoria'
    });
    
    const start3 = Date.now();
    const response3 = await fetch(`${baseUrl}/api/reportes/salidas-cliente/consolidado?${params3}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const end3 = Date.now();
    
    if (!response3.ok) {
      console.log(`Error en agrupación por categoría: ${response3.status} - ${response3.statusText}`);
      const errorText = await response3.text();
      console.log('Error details:', errorText);
    } else {
      const data3 = await response3.json();
      console.log(`Tiempo de respuesta: ${end3 - start3}ms`);
      console.log(`Registros devueltos: ${data3.data?.length || 0}`);
      
      if (data3.data && data3.data.length > 0) {
        console.log('Primer registro por categoría:', JSON.stringify(data3.data[0], null, 2));
        console.log('Total productos en primera categoría:', data3.data[0].productos?.length || 0);
      }
    }

    console.log('\n=== TEST COMPLETADO ===');

  } catch (error) {
    console.error('ERROR durante el test del endpoint:', error);
  }
}

testEndpointSalidas();