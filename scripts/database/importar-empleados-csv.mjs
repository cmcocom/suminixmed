import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Función para parsear CSV
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const empleados = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const empleado = {};
    
    headers.forEach((header, index) => {
      empleado[header] = values[index] || null;
    });
    
    empleados.push(empleado);
  }
  
  return empleados;
}

// Función para limpiar y normalizar datos
function limpiarDato(dato) {
  if (!dato || dato === '' || dato === 'NULL') return null;
  return dato.trim();
}

async function importarEmpleados() {
  try {
    console.log('🚀 Iniciando importación de empleados...\n');
    
    const csvPath = path.join(__dirname, '..', 'LISTA DE ENFERMEROS .csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ Archivo CSV no encontrado: ${csvPath}`);
      console.log('📁 Coloca el archivo "LISTA DE ENFERMEROS .csv" en la raíz del proyecto');
      return;
    }
    
    const empleadosCSV = parseCSV(csvPath);
    console.log(`📊 Total de empleados en CSV: ${empleadosCSV.length}\n`);
    
    let creados = 0;
    let errores = 0;
    const erroresDetalle = [];
    
    for (const emp of empleadosCSV) {
      try {
        const numeroEmpleado = limpiarDato(emp['NUM. EMPLEADO']);
        const nombre = limpiarDato(emp['NOMBRE']);
        const cargo = limpiarDato(emp['CARGO']) || 'SIN ESPECIFICAR';
        const servicio = limpiarDato(emp['SERVICIO']);
        const turno = limpiarDato(emp['TURNO']) || 'NO ESPECIFICADO';
        const correo = limpiarDato(emp['CORREO']);
        const celular = limpiarDato(emp['CELULAR']);
        
        // Validación básica
        if (!numeroEmpleado || !nombre) {
          errores++;
          erroresDetalle.push({
            numero: numeroEmpleado || 'SIN NUMERO',
            nombre: nombre || 'SIN NOMBRE',
            error: 'Falta número de empleado o nombre'
          });
          continue;
        }
        
        // Verificar si ya existe
        const existe = await prisma.empleados.findUnique({
          where: { numero_empleado: numeroEmpleado }
        });
        
        if (existe) {
          console.log(`⏭️  Empleado ${numeroEmpleado} - ${nombre} ya existe, omitiendo...`);
          continue;
        }
        
        // Crear empleado
        await prisma.empleados.create({
          data: {
            numero_empleado: numeroEmpleado,
            nombre: nombre,
            cargo: cargo,
            servicio: servicio,
            turno: turno,
            correo: correo,
            celular: celular,
            user_id: null, // Sin usuario vinculado inicialmente
            activo: true
          }
        });
        
        creados++;
        console.log(`✅ ${creados}. Creado: ${numeroEmpleado} - ${nombre}`);
        
      } catch (error) {
        errores++;
        erroresDetalle.push({
          numero: emp['NUM. EMPLEADO'] || 'SIN NUMERO',
          nombre: emp['NOMBRE'] || 'SIN NOMBRE',
          error: error.message
        });
        console.error(`❌ Error con empleado ${emp['NUM. EMPLEADO']}: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE IMPORTACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Empleados creados exitosamente: ${creados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📋 Total procesados: ${empleadosCSV.length}`);
    
    if (erroresDetalle.length > 0) {
      console.log('\n⚠️  Detalle de errores:');
      erroresDetalle.forEach((e, i) => {
        console.log(`${i + 1}. ${e.numero} - ${e.nombre}: ${e.error}`);
      });
    }
    
    console.log('\n✨ Importación completada!');
    
  } catch (error) {
    console.error('❌ Error general en la importación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
importarEmpleados();
