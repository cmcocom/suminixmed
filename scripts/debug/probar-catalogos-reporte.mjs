/**
 * Script para probar el nuevo endpoint /api/reportes/catalogos
 * Verificar que OPERADOR puede acceder a los catálogos del reporte
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function probarEndpointCatalogos() {
  console.log('=== PROBANDO ENDPOINT /api/reportes/catalogos ===\n');

  // Simular login (normalmente esto se haría en el navegador)
  console.log('⚠️  NOTA: Para probar completamente, necesitas estar logueado como OPERADOR en el navegador');
  console.log('Probando endpoints directamente...\n');

  const tipos = ['productos', 'clientes', 'categorias'];
  
  for (const tipo of tipos) {
    try {
      console.log(`📡 Probando: /api/reportes/catalogos?tipo=${tipo}`);
      
      const response = await fetch(`${BASE_URL}/api/reportes/catalogos?tipo=${tipo}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Respuesta exitosa:`);
        console.log(`      - success: ${data.success}`);
        console.log(`      - total registros: ${data.total || data.data?.length || 0}`);
        
        if (data.data && data.data.length > 0) {
          console.log(`      - primer registro:`, JSON.stringify(data.data[0], null, 2));
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ Error de red: ${error.message}`);
      console.log('');
    }
  }

  console.log('\n=== INSTRUCCIONES PARA PRUEBA COMPLETA ===');
  console.log('1. Abre http://localhost:3000 en tu navegador');
  console.log('2. Inicia sesión como usuario OPERADOR');
  console.log('3. Ve a Dashboard > Reportes > Salidas por Cliente');
  console.log('4. Verifica que los catálogos se cargan correctamente');
  console.log('5. Los dropdowns de Cliente, Categoría y Producto deben tener datos');
}

// Ejecutar prueba
probarEndpointCatalogos().catch(console.error);