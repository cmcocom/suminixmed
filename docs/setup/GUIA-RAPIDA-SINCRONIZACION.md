# 🚀 GUÍA RÁPIDA: Sistema de Sincronización Automática

## ¿Qué hace?

Cuando cambias la visibilidad de un módulo en el RBAC, **automáticamente** se sincroniza el permiso LEER:

- ✅ **Mostrar módulo** → Asigna permiso LEER
- ❌ **Ocultar módulo** → Elimina permiso LEER

## Acceso

**URL:** http://localhost:3000/dashboard/usuarios/rbac

**Usuario administrador:**
- Email: `silva@issste.com`
- Rol: ADMINISTRADOR

## Uso Básico

### 1. Toggle Individual

1. Selecciona un rol (ej: ADMINISTRADOR)
2. Haz clic en cualquier toggle 🔄
3. Observa:
   - El indicador cambia: 🔓 Activo / 🔒 Inactivo
   - Toast muestra: "✅ Permiso LEER asignado"

### 2. Sincronización Masiva

1. Haz clic en **"⚡ Sincronizar Todo"**
2. El sistema procesa TODOS los módulos
3. Muestra resumen: "5 permisos asignados, 2 revocados"

## Indicadores Visuales

| Indicador | Significado |
|-----------|-------------|
| 🔓 **Activo** (verde) | Módulo visible + con permiso LEER |
| 🔒 **Inactivo** (gris) | Módulo oculto + sin permiso LEER |

## Tooltips

Al pasar el mouse sobre el toggle:
- "Ocultar y revocar permiso LEER"
- "Mostrar y asignar permiso LEER"

## Solución de Problemas

### Los cambios no se ven reflejados

1. **Cerrar sesión**
2. **Limpiar caché:**
   - Presiona `F12`
   - Ve a `Application` → `Local Storage`
   - Click en `Clear All`
3. **Volver a iniciar sesión**

### Verificar estado actual

```bash
# Ver estado de sincronización
node test-sincronizacion-automatica.mjs

# Diagnóstico completo
node diagnosticar-problema-actual.mjs
```

## Estado Actual

```
ROL: ADMINISTRADOR
✅ Módulos visibles: 27
❌ Módulos ocultos: 7
⚠️ Inconsistencias: 0
```

## Archivos Clave

- **Endpoint:** `/app/api/rbac/roles/[id]/sync-visibility-permissions/route.ts`
- **Página:** `/app/dashboard/usuarios/rbac/page.tsx`
- **Componente:** `/app/components/rbac/SidebarControlPanel.tsx`

## Documentación Completa

- `RESUMEN-SINCRONIZACION-AUTOMATICA.md` - Resumen ejecutivo
- `IMPLEMENTACION-SINCRONIZACION-AUTOMATICA.md` - Documentación técnica completa

---

**Última actualización:** 22 de octubre de 2025  
**Estado:** ✅ Funcionando correctamente
