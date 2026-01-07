# Solución para Error RBAC OPERADOR - Reportes de Salidas por Cliente

## Problema Identificado
El reporte "Salidas por Cliente" fallaba para usuarios OPERADOR con error 403:
- **Error**: "Acceso denegado - Permisos insuficientes"
- **Detalle**: "Requiere permiso: INVENTARIO.LEER"
- **Causa**: El componente llamaba `/api/inventario` que requiere `INVENTARIO.LEER`, pero RBAC V2 revocó este permiso para OPERADOR por seguridad.

## Solución Implementada

### 1. Endpoint Específico para Reportes
**Archivo**: `app/api/reportes/catalogos/route.ts`
- **Funcionalidad**: Provee catálogos específicos para reportes sin requerir `INVENTARIO.LEER`
- **Permisos**: Requiere `REPORTES_SALIDAS_CLIENTE.LEER` en lugar de `INVENTARIO.LEER`
- **Endpoints**:
  - `GET /api/reportes/catalogos?tipo=productos&limit=10000`
  - `GET /api/reportes/catalogos?tipo=clientes`  
  - `GET /api/reportes/catalogos?tipo=categorias`

### 2. Hook Personalizado (Opcional)
**Archivo**: `app/hooks/useCatalogosReportes.ts`
- **Funcionalidad**: Hook React para manejar catálogos de reportes
- **Estado**: Productos, clientes, categorías con loading y error handling
- **Métodos**: `cargarProductos()`, `cargarClientes()`, `cargarCategorias()`

### 3. Actualización del Componente
**Archivo**: `app/dashboard/reportes/salidas-cliente/page.tsx`
- **Cambio**: Reemplazó llamadas a endpoints que requieren `INVENTARIO.LEER`
- **Antes**: 
  - `/api/kardex/clientes`
  - `/api/categorias` 
  - `/api/inventario?limit=10000`
- **Después**:
  - `/api/reportes/catalogos?tipo=clientes`
  - `/api/reportes/catalogos?tipo=categorias`
  - `/api/reportes/catalogos?tipo=productos&limit=10000`

## Detalles Técnicos

### Esquema de Base de Datos Corregido
- **inventario**: No tiene campo `activo`, usa `estado = 'disponible'`
- **clientes**: Tiene campo `activo: Boolean`
- **categorias**: Tiene campo `activo: Boolean`

### Formato de Respuesta
```json
{
  "success": true,
  "data": [...],
  "total": 123
}
```

### Verificación de Permisos
```typescript
const hasPermission = await checkUserPermission(
  session.user.id,
  'REPORTES_SALIDAS_CLIENTE',
  'LEER'
);
```

## Pruebas Realizadas

### 1. Compilación Exitosa
- ✅ Endpoint compilado sin errores de TypeScript
- ✅ Hook personalizado sin errores de linting
- ✅ Componente actualizado exitosamente

### 2. Servidor Funcional
- ✅ Next.js 15.5.2 ejecutándose en puerto 3000
- ✅ Middleware compilado correctamente
- ✅ Conexión Prisma establecida

### 3. Pendientes de Prueba Manual
- 🔄 Login como usuario OPERADOR
- 🔄 Navegación a Dashboard > Reportes > Salidas por Cliente
- 🔄 Verificación de carga de catálogos
- 🔄 Confirmación de dropdowns con datos

## Contexto RBAC V2

### Por qué se revocó INVENTARIO.LEER para OPERADOR
Según `docs/fixes/FIX-RBAC-OPERADOR-FINAL.md`:
- **Módulo INVENTARIO** marcado como "huérfano" (no existe en menú lateral)
- **Seguridad**: OPERADOR no debe tener acceso directo a inventario completo
- **Alternativa**: Módulos específicos como `REPORTES_SALIDAS_CLIENTE` para funcionalidad controlada

### Módulos Permitidos para OPERADOR (12 total)
1. CLIENTES
2. REPORTES_SALIDAS_CLIENTE 
3. REPORTES_PRODUCTOS_VENCIMIENTO
4. REPORTES_STOCK_MINIMO
5. REPORTES_INVENTARIO_GENERAL
6. REPORTES_PRODUCTOS_SIN_MOVIMIENTO
7. REPORTES_COMPARATIVO_VENTAS
8. REPORTES_ANALISIS_CLIENTE
9. REPORTES_RESUMEN_INVENTARIO
10. SERVICIOS_MEDICOS
11. PANEL_SERVICIOS
12. DASHBOARD_OPERADOR

## Compatibilidad con Escalabilidad

### Límites Implementados
- **Productos**: Máximo 10,000 registros por llamada
- **Paginación**: Respetada en endpoint base
- **Timeout**: 45 segundos para carga de productos grandes

### Optimizaciones
- **SELECT específico**: Solo campos necesarios para UI
- **Índices**: Aprovecha índices existentes en `categoria_id`, `estado`, `activo`
- **Filtrado**: Solo registros activos/disponibles

## Archivos Modificados

1. ✅ `app/api/reportes/catalogos/route.ts` - Nuevo endpoint
2. ✅ `app/hooks/useCatalogosReportes.ts` - Nuevo hook  
3. ✅ `app/dashboard/reportes/salidas-cliente/page.tsx` - Actualizado
4. ✅ `probar-catalogos-reporte.mjs` - Script de prueba

## Próximos Pasos

1. **Prueba Manual Completa**
   - Login como OPERADOR
   - Verificar funcionamiento del reporte
   - Confirmar carga de todos los catálogos

2. **Monitoreo**
   - Verificar logs de auditoría si aplica
   - Monitorear rendimiento con grandes volúmenes
   - Validar que no hay memory leaks

3. **Documentación**
   - Actualizar guías de usuario si es necesario
   - Documentar el patrón para futuros endpoints de reportes

---
**Fecha**: 4 de noviembre de 2025  
**Estado**: Implementación completada, pendiente prueba manual  
**Responsable**: AI Assistant  
**Revisión**: Pendiente