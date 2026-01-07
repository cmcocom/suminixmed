import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function insertSampleData() {
  try {
    console.log('🔄 Insertando datos de ejemplo en la base de datos...\n');

    // 1. Crear categorías si no existen
    console.log('📁 Creando categorías...');
    const categoriaFCB = await prisma.categorias.upsert({
      where: { nombre: 'Farmacia de Control Básico' },
      update: {},
      create: {
        id: 'cat-fcb-001',
        nombre: 'Farmacia de Control Básico',
        descripcion: 'Productos farmacéuticos de control básico',
        activo: true,
        updatedAt: new Date()
      }
    });

    const categoriaDCB = await prisma.categorias.upsert({
      where: { nombre: 'Dispositivos de Control Básico' },
      update: {},
      create: {
        id: 'cat-dcb-001',
        nombre: 'Dispositivos de Control Básico',
        descripcion: 'Dispositivos médicos de control básico',
        activo: true,
        updatedAt: new Date()
      }
    });

    console.log('✅ Categorías creadas');

    // 2. Crear proveedor de ejemplo
    console.log('\n🏢 Creando proveedor...');
    const proveedor = await prisma.proveedores.upsert({
      where: { id: 'prov-001' },
      update: {},
      create: {
        id: 'prov-001',
        nombre: 'Proveedor Médico SA de CV',
        rfc: 'PME123456789',
        telefono: '5555555555',
        email: 'contacto@proveedor.com',
        direccion: 'Av. Principal #123',
        activo: true,
        updatedAt: new Date()
      }
    });

    console.log('✅ Proveedor creado');

    // 3. Crear productos de ejemplo
    console.log('\n📦 Creando productos...');
    const productos = [
      {
        id: 'prod-001',
        clave: 'MED001',
        descripcion: 'Paracetamol 500mg Tabletas',
        categoria: 'FCB',
        categoria_id: categoriaFCB.id,
        cantidad: 150,
        precio: 2.50,
        cantidad_minima: 50,
        cantidad_maxima: 300,
        punto_reorden: 75,
        estado: 'disponible',
        nombre: 'Paracetamol 500mg Tabletas',
        fechaIngreso: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'prod-002',
        clave: 'MED002',
        descripcion: 'Ibuprofeno 400mg Cápsulas',
        categoria: 'FCB',
        categoria_id: categoriaFCB.id,
        cantidad: 200,
        precio: 3.75,
        cantidad_minima: 80,
        cantidad_maxima: 400,
        punto_reorden: 100,
        estado: 'disponible',
        nombre: 'Ibuprofeno 400mg Cápsulas',
        fechaIngreso: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'prod-003',
        clave: 'DEV001',
        descripcion: 'Termómetro Digital',
        categoria: 'DCB',
        categoria_id: categoriaDCB.id,
        cantidad: 45,
        precio: 125.00,
        cantidad_minima: 20,
        cantidad_maxima: 100,
        punto_reorden: 30,
        estado: 'disponible',
        nombre: 'Termómetro Digital',
        fechaIngreso: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'prod-004',
        clave: 'DEV002',
        descripcion: 'Baumanómetro Aneroide',
        categoria: 'DCB',
        categoria_id: categoriaDCB.id,
        cantidad: 30,
        precio: 350.00,
        cantidad_minima: 15,
        cantidad_maxima: 60,
        punto_reorden: 20,
        estado: 'disponible',
        nombre: 'Baumanómetro Aneroide',
        fechaIngreso: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'prod-005',
        clave: 'MED003',
        descripcion: 'Amoxicilina 500mg Cápsulas',
        categoria: 'FCB',
        categoria_id: categoriaFCB.id,
        cantidad: 180,
        precio: 4.25,
        cantidad_minima: 75,
        cantidad_maxima: 350,
        punto_reorden: 100,
        estado: 'disponible',
        nombre: 'Amoxicilina 500mg Cápsulas',
        fechaIngreso: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const prod of productos) {
      await prisma.inventario.upsert({
        where: { id: prod.id },
        update: prod,
        create: prod
      });
      console.log(`   ✓ ${prod.descripcion}`);
    }

    console.log('✅ 5 productos creados');

    // 4. Verificar totales
    console.log('\n📊 Resumen:');
    const totalCategorias = await prisma.categorias.count();
    const totalProveedores = await prisma.proveedores.count();
    const totalProductos = await prisma.inventario.count();

    console.log(`   Categorías: ${totalCategorias}`);
    console.log(`   Proveedores: ${totalProveedores}`);
    console.log(`   Productos: ${totalProductos}`);

    console.log('\n✅ Datos de ejemplo insertados exitosamente');
    console.log('\n💡 Ahora puedes:');
    console.log('   1. Crear entradas de inventario con proveedor');
    console.log('   2. Crear salidas de inventario');
    console.log('   3. Probar la nueva página de productos');
    console.log('   4. Verificar que NO aparece el campo proveedor en productos');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

insertSampleData();
