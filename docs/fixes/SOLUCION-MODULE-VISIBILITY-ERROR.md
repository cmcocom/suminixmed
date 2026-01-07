# ✅ SOLUCIÓN: Error "Failed to update module visibility"

## 🔍 **Diagnóstico del Problema**

El error ocurría porque el endpoint `/api/rbac/modules/[moduleKey]/visibility` estaba validando permisos que **no existían** en el sistema:

- ❌ `RBAC.ADMINISTRAR_PERMISOS` (inexistente)
- ❌ `RBAC.CONSULTAR` (inexistente)

Esto causaba que la petición PUT fallara con **status 403 (No autorizado)**, haciendo que el módulo se ocultara momentáneamente pero se volviera a mostrar inmediatamente debido al manejo de errores en el contexto.

## 🔧 **Correcciones Aplicadas**

### 1. **Actualización de Validaciones de Permisos**

**Archivo**: `/app/api/rbac/modules/[moduleKey]/visibility/route.ts`

**Antes**:
```typescript
const permitido = tienePermisoUser(session.user, 'RBAC', 'ADMINISTRAR_PERMISOS') || 
                  tienePermisoUser(session.user, 'RBAC', 'CONSULTAR');
```

**Después**:
```typescript
const permitido = tienePermisoUser(session.user, 'RBAC', 'ASIGNAR_PERMISOS') || 
                  tienePermisoUser(session.user, 'RBAC', 'ROLES_LEER') ||
                  tienePermisoUser(session.user, 'RBAC', 'PERMISOS_LEER');
```

### 2. **Mejora en Manejo de Errores**

**Archivo**: `/app/contexts/ModuleVisibilityContext.tsx`

**Antes**:
```typescript
if (!response.ok) throw new Error('Failed to update module visibility');
```

**Después**:
```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error(`Failed to update module visibility. Status: ${response.status}, Response: ${errorText}`);
  throw new Error(`Failed to update module visibility: ${response.status} ${errorText}`);
}
```

## ✅ **Permisos Válidos Identificados**

Los siguientes permisos **SÍ existen** en el sistema y permiten acceso a Module Visibility:

- ✅ `RBAC.ASIGNAR_PERMISOS` - Asignar y revocar permisos a roles
- ✅ `RBAC.ROLES_LEER` - Consultar roles del sistema  
- ✅ `RBAC.PERMISOS_LEER` - Consultar permisos del sistema

## 👥 **Usuarios con Acceso Confirmado**

Los siguientes usuarios ahora pueden usar la funcionalidad:

- ✅ **cmcocom@unidadc.com** (Cristian Cocom) - Rol: DESARROLLADOR
- ✅ **miguel@unidadc.com** (Miguel Ángel) - Rol: DESARROLLADOR

Ambos tienen todos los permisos RBAC necesarios.

## 🎯 **Funcionalidad Esperada**

Con estas correcciones:

1. **✅ Sin errores 403**: Los usuarios con permisos RBAC válidos ya no reciben "No autorizado"
2. **✅ Persistencia correcta**: Los cambios de visibilidad se guardan en la base de datos
3. **✅ Sin reversión**: Los módulos permanecen ocultos/visibles según la configuración
4. **✅ Mejor debugging**: Los errores ahora muestran código de estado y respuesta detallada

## 🔄 **Flujo Corregido**

1. Usuario cambia visibilidad en página RBAC
2. Se envía PUT a `/api/rbac/modules/[moduleKey]/visibility`
3. **Validación exitosa** con permisos existentes (ASIGNAR_PERMISOS/ROLES_LEER/PERMISOS_LEER)
4. Se guarda en base de datos (tabla `module_visibility`)
5. Contexto se actualiza con nueva configuración
6. UI refleja el cambio persistentemente

## 🚀 **Estado Actual**

- **✅ Servidor**: Corriendo en http://localhost:3000
- **✅ Permisos**: Validaciones corregidas con permisos existentes
- **✅ Error Handling**: Mejorado para debugging
- **✅ Base de Datos**: Sistema de persistencia funcionando
- **✅ Usuarios**: Desarrolladores tienen acceso confirmado

**La funcionalidad de Module Visibility ahora debería funcionar correctamente sin errores 403 ni reversiones inesperadas.**