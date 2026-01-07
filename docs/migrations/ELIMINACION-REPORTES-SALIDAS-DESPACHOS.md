# Eliminación de Módulos: Salidas Consolidado y Despachos

**Fecha**: 28 de octubre de 2025  
**Tipo de cambio**: Limpieza de módulos no utilizados  
**Estado**: ✅ Completado

---

## 📋 Resumen

Se eliminaron completamente los módulos **REPORTES_SALIDAS** (Salidas Consolidado) y **DESPACHOS** del sistema SuminixMed, incluyendo todas sus dependencias y referencias en el código.

---

## 🗑️ Archivos Eliminados

### Páginas del Dashboard
1. ✅ `/app/dashboard/reportes/despachos/page.tsx` - Página de reporte de despachos
2. ✅ `/app/dashboard/reportes/salidas/page.tsx` - Página de reporte de salidas consolidado
3. ✅ Directorios vacíos limpiados automáticamente

---

## 📝 Archivos Modificados

### 1. Configuración RBAC

#### `lib/rbac-modules.ts`
**Cambio**: Eliminados 2 módulos del array SYSTEM_MODULES
```diff
- // REPORTES (4 módulos en submenú)
+ // REPORTES (2 módulos en submenú)
  { key: 'REPORTES_INVENTARIO', title: 'Inventario', category: 'reportes' },
- { key: 'REPORTES_SALIDAS', title: 'Salidas (Consolidado)', category: 'reportes' },
  { key: 'REPORTES_SALIDAS_CLIENTE', title: 'Salidas por Cliente', category: 'reportes' },
- { key: 'DESPACHOS', title: 'Despachos', category: 'reportes' },
```

#### `lib/rbac-dynamic.ts`
**Cambio**: Eliminados mapeos de rutas
```diff
  '/dashboard/reportes/inventario': 'REPORTES_INVENTARIO',
- '/dashboard/reportes/salidas': 'REPORTES_SALIDAS',
  '/dashboard/reportes/salidas-cliente': 'REPORTES_SALIDAS_CLIENTE',
- '/dashboard/reportes/despachos': 'DESPACHOS',
```

### 2. Interfaz de Usuario

#### `app/components/sidebar/constants.ts`
**Cambio**: Eliminadas 2 opciones del menú Reportes
```diff
- {
-   title: 'Salidas (Consolidado)',
-   href: '/dashboard/reportes/salidas',
-   icon: DocumentTextIcon,
-   permission: { modulo: 'REPORTES_SALIDAS', accion: 'LEER' }
- },
- {
-   title: 'Despachos',
-   href: '/dashboard/reportes/despachos',
-   icon: TruckIcon,
-   permission: { modulo: 'DESPACHOS', accion: 'LEER' }
- }
```

#### `app/contexts/module-visibility-map.ts`
**Cambio**: Eliminados mapeos de visibilidad
```diff
- // Módulos principales (6)
+ // Módulos principales (5)
- DESPACHOS: ['DESPACHOS'],
- // Reportes (4)
+ // Reportes (2)
- REPORTES_SALIDAS: ['REPORTES_SALIDAS'],
```

### 3. Panel de Control RBAC

#### `app/components/rbac/SidebarControlPanel.tsx`
**Cambio**: Eliminados módulos del panel de control
```diff
- {
-   key: 'REPORTES_SALIDAS',
-   title: 'Salidas (Consolidado)',
-   icon: '📊',
-   description: 'Reporte consolidado de salidas por producto'
- },
- {
-   key: 'DESPACHOS',
-   title: 'Despachos',
-   icon: '🚚',
-   description: 'Análisis de salidas y despachos'
- }
```

#### `app/components/rbac/SidebarControlPanel-OLD.tsx`
**Cambio**: Actualizado archivo de respaldo por consistencia

#### `app/components/rbac/types/module-structure.ts`
**Cambio**: Eliminada definición completa del módulo DESPACHOS
```diff
- {
-   key: 'DESPACHOS',
-   name: 'Despachos',
-   icon: '🚚',
-   description: 'Análisis de salidas por cliente y producto',
-   actions: [
-     { key: 'LEER', name: 'Leer', description: 'Ver reporte de despachos' },
-     { key: 'EXPORTAR', name: 'Exportar', description: 'Exportar análisis a Excel/PDF/CSV' },
-     { key: 'CONSULTAR', name: 'Consultar', description: 'Consultar estadísticas de despachos' },
-   ]
- }
```

### 4. Scripts de Sincronización

#### `scripts/sync-rbac-modules.mjs`
**Cambio**: Eliminados módulos del script de sincronización
```diff
- // Reportes (4)
+ // Reportes (2)
- { key: 'REPORTES_SALIDAS', title: 'Salidas (Consolidado)', category: 'reportes' },
- { key: 'DESPACHOS', title: 'Despachos', category: 'reportes' },
```

---

## ✅ Módulos Conservados (NO Eliminados)

Los siguientes módulos relacionados se mantienen intactos:

1. **SALIDAS** - Módulo operacional de gestión de salidas de inventario
   - Ruta: `/dashboard/salidas`
   - APIs: `/api/salidas/*`
   - Funcionalidad completa preservada

2. **REPORTES_SALIDAS_CLIENTE** - Reporte de salidas por cliente
   - Ruta: `/dashboard/reportes/salidas-cliente`
   - API: `/api/reportes/salidas-cliente`
   - Funcionalidad completa preservada

3. **REPORTES_INVENTARIO** - Reporte de inventario
   - Ruta: `/dashboard/reportes/inventario`
   - Funcionalidad completa preservada

---

## 🔍 Verificación de Eliminación

### Comando de Verificación
```bash
grep -r "REPORTES_SALIDAS\|DESPACHOS" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --include="*.jsx" --include="*.mjs" \
  app/ lib/ scripts/ 2>/dev/null | \
  grep -v "REPORTES_SALIDAS_CLIENTE"
```

### Resultado
✅ Solo quedan referencias en archivos de documentación (`.md`) y backups (`.backup`, `-OLD.tsx`)

---

## 🎯 Impacto en Base de Datos

**IMPORTANTE**: Los cambios NO afectan directamente la base de datos.

### Registros en BD que podrían quedar huérfanos:
- Permisos en `rbac_permissions` con módulos `REPORTES_SALIDAS` o `DESPACHOS`
- Asignaciones en `rbac_role_permissions` vinculadas a esos permisos
- Configuraciones de visibilidad en `module_visibility` (si existen)

### Recomendación:
Los registros huérfanos en BD pueden:
1. **Dejarse** - Se volverán inactivos automáticamente al no estar en `SYSTEM_MODULES`
2. **Eliminarse manualmente** - Desde el panel de RBAC en `/dashboard/usuarios/rbac`
3. **Limpiarse con script** - Crear script de limpieza de permisos huérfanos (opcional)

**Acción sugerida**: Dejar que el sistema RBAC dinámico maneje los permisos. Los módulos no existentes simplemente no aparecerán en la UI.

---

## 📊 Resumen de Cambios

| Tipo de Cambio | Cantidad |
|----------------|----------|
| Páginas eliminadas | 2 |
| Directorios eliminados | 2 |
| Archivos de configuración modificados | 7 |
| Módulos RBAC eliminados | 2 |
| Opciones de menú eliminadas | 2 |
| Mapeos de rutas eliminados | 2 |

---

## ⚠️ Notas Importantes

1. **No se eliminaron APIs**: No existían APIs específicas para estos reportes, usaban `/api/salidas` genérica
2. **Módulo SALIDAS intacto**: El módulo operacional de salidas NO fue tocado
3. **Sin cambios en BD**: La eliminación es solo en código, no requiere migración
4. **Reversible**: Los archivos eliminados están en git history si se necesitan recuperar

---

## 🚀 Próximos Pasos

1. **Probar acceso al sistema** - Verificar que el menú de reportes funcione correctamente
2. **Verificar permisos** - Comprobar que los permisos de usuarios no muestren los módulos eliminados
3. **Limpiar BD (opcional)** - Si se desea, eliminar permisos huérfanos manualmente desde RBAC UI
4. **Actualizar documentación** - Revisar `docs/` si hay menciones a estos reportes

---

## 📚 Referencias

- **Guía RBAC**: `docs/guides/DONDE-SE-APLICAN-PERMISOS.md`
- **Instrucciones Copilot**: `.github/copilot-instructions.md`
- **Configuración módulos**: `lib/rbac-modules.ts`
- **Sistema RBAC dinámico**: `lib/rbac-dynamic.ts`

---

**Cambio realizado por**: GitHub Copilot  
**Solicitado por**: Usuario  
**Motivo**: Eliminación de módulos no utilizados para simplificar el sistema
