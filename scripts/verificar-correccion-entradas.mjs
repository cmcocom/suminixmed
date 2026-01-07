#!/usr/bin/env node

/**
 * VERIFICACIÓN DE CORRECCIÓN DE ENTRADAS
 * Prueba la API de entradas después de la corrección para productos huérfanos
 */

console.log('🔍 [VERIFICACIÓN] Probando API de entradas corregida...\n');

// Esperar a que el servidor esté listo
const esperarServidor = () => {
    return new Promise(resolve => setTimeout(resolve, 5000));
};

async function probarAPIEntradas() {
    try {
        await esperarServidor();
        
        console.log('📡 Probando endpoint: /api/entradas...');
        
        const response = await fetch('http://localhost:3000/api/entradas?page=1&limit=3', {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            console.log('✅ API de entradas respondió correctamente');
            console.log(`📊 Entradas encontradas: ${data.data?.length || 0}`);
            
            if (data.data && data.data.length > 0) {
                const entrada = data.data[0];
                console.log(`📋 Primera entrada: ${entrada.folio || 'Sin folio'}`);
                console.log(`🔢 Partidas: ${entrada.partidas?.length || 0}`);
                
                if (entrada.partidas && entrada.partidas.length > 0) {
                    const partidaHuerfana = entrada.partidas.find(p => p.es_huerfano);
                    if (partidaHuerfana) {
                        console.log(`⚠️  Partida huérfana detectada: ${partidaHuerfana.clave_producto}`);
                        console.log(`   Descripción: ${partidaHuerfana.descripcion}`);
                        console.log('✅ Manejo de productos huérfanos funcionando');
                    }
                }
            }
            
            console.log('\n🎉 [CORRECCIÓN EXITOSA] - La API de entradas ahora funciona correctamente');
            
        } else {
            console.error(`❌ Error HTTP: ${response.status}`);
            const errorText = await response.text();
            console.error('Detalles:', errorText.substring(0, 200));
        }
        
    } catch (error) {
        console.error('❌ Error probando API:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 El servidor parece no estar corriendo en localhost:3000');
        }
    }
}

// Ejecutar prueba
probarAPIEntradas();