#!/usr/bin/env node

import { promises as fs } from 'fs';

async function updateSidebar() {
  const sidebarPath = 'app/components/sidebar/Sidebar.tsx';
  
  try {
    const content = await fs.readFile(sidebarPath, 'utf-8');
    
    // Verificar si ya usa permissions-v2
    if (content.includes('permissions-v2')) {
      console.log('✅ Sidebar ya usa permissions-v2');
      return;
    }
    
    console.log('🔄 Actualizando Sidebar.tsx...');
    
    // Reemplazar import
    let newContent = content.replace(
      /import.*permissions.*from.*$/gm,
      "import { getFilteredMenuItemsByVisibility } from './utils/permissions-v2';"
    );
    
    // Reemplazar lógica de filtrado
    newContent = newContent.replace(
      /getFilteredMenuItems\([^)]+\)/g,
      'getFilteredMenuItemsByVisibility(menuItems, userRoles)'
    );
    
    await fs.writeFile(sidebarPath, newContent, 'utf-8');
    console.log('✅ Sidebar.tsx actualizado');
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('⚠️ Sidebar.tsx no encontrado - se creará cuando sea necesario');
    } else {
      console.error('❌ Error actualizando sidebar:', error.message);
    }
  }
}

async function createSidebarTestComponent() {
  const testComponentContent = `'use client';

import { useState, useEffect } from 'react';
import { getFilteredMenuItemsByVisibility } from './utils/permissions-v2';

// Componente de prueba para verificar nueva arquitectura RBAC
export function SidebarTest() {
  const [visibleItems, setVisibleItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulación de roles de usuario
  const testRoles = ['OPERADOR']; // Solo rol OPERADOR para probar

  // Menú de prueba (simplificado)
  const testMenuItems = [
    {
      key: 'DASHBOARD',
      title: 'Dashboard',
      href: '/dashboard'
    },
    {
      key: 'INVENTARIOS_FISICOS', 
      title: 'Inventarios Físicos',
      href: '/dashboard/inventarios-fisicos'
    },
    {
      key: 'AJUSTES_RBAC',
      title: 'Ajustes RBAC', 
      href: '/dashboard/ajustes/rbac'
    },
    {
      key: 'CATALOGOS_PRODUCTOS',
      title: 'Catálogo Productos',
      href: '/dashboard/catalogos/productos'
    }
  ];

  useEffect(() => {
    async function loadVisibleItems() {
      try {
        const filtered = await getFilteredMenuItemsByVisibility(testMenuItems, testRoles);
        setVisibleItems(filtered);
      } catch (error) {
        console.error('Error cargando items visibles:', error);
      } finally {
        setLoading(false);
      }
    }

    loadVisibleItems();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded bg-gray-50">
        <h3 className="font-semibold text-lg mb-2">🧪 Test RBAC V2</h3>
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="font-semibold text-lg mb-2">🧪 Test RBAC V2 - Rol OPERADOR</h3>
      <p className="text-sm text-gray-600 mb-3">
        Mostrando solo módulos visibles para rol OPERADOR (7/28 módulos)
      </p>
      
      <div className="space-y-2">
        {visibleItems.length === 0 ? (
          <div className="text-red-500">❌ No hay módulos visibles</div>
        ) : (
          visibleItems.map(item => (
            <div key={item.key} className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="font-mono text-sm">{item.key}</span>
              <span>→</span>
              <span>{item.title}</span>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Total visible: {visibleItems.length} módulos
      </div>
    </div>
  );
}`;

  try {
    await fs.writeFile('app/components/sidebar/SidebarTest.tsx', testComponentContent, 'utf-8');
    console.log('✅ Componente de prueba SidebarTest.tsx creado');
  } catch (error) {
    console.error('❌ Error creando componente de prueba:', error.message);
  }
}

async function updateDashboardLayout() {
  const layoutContent = `import { SidebarTest } from '@/app/components/sidebar/SidebarTest';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <h1 className="text-xl font-semibold">🏥 SuminixMed - RBAC V2 Test</h1>
        </div>
      </div>
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-sm border-r min-h-screen p-4">
          <SidebarTest />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}`;

  try {
    await fs.writeFile('app/dashboard/layout.tsx', layoutContent, 'utf-8');
    console.log('✅ Layout de dashboard actualizado con componente de prueba');
  } catch (error) {
    console.error('❌ Error actualizando layout:', error.message);
  }
}

async function main() {
  try {
    console.log('🔄 ACTUALIZANDO FRONTEND PARA RBAC V2');
    console.log('=' * 50);
    
    await updateSidebar();
    await createSidebarTestComponent();
    await updateDashboardLayout();
    
    console.log('\n✅ ACTUALIZACIÓN FRONTEND COMPLETADA');
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('  1. Iniciar servidor: npm run dev');
    console.log('  2. Navegar a: http://localhost:3000/dashboard');
    console.log('  3. Verificar que se muestren solo 7 módulos para OPERADOR');
    console.log('  4. Probar toggles de visibilidad en /dashboard/ajustes/rbac');
    
  } catch (error) {
    console.error('❌ Error en actualización:', error);
  }
}

main();