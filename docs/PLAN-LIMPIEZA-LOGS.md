# Plan de Limpieza de Console.logs

## Estado Actual
- **200+ console statements** encontrados en app/
- **Categorías identificadas:**
  1. Debug logs (🔍, 📝, ✅, 📦, etc.) - ELIMINAR
  2. Info logs - CONVERTIR a logger.info()
  3. Error logs - CONVERTIR a logger.error()
  4. Endpoints de prueba - ELIMINADOS ✅

## Archivos ELIMINADOS
- ✅ `app/api/test-solicitudes/route.ts` - Endpoint de prueba
- ✅ `app/api/test-sse/route.ts` - Endpoint de prueba

## Archivos a LIMPIAR (Prioridad Alta)

### 1. SSE y Sesiones (REDUCIR logging masivamente)
- `app/api/sse/session-events/route.ts` - 22 logs → Mantener solo errors
- `app/api/auth/session-check/route.ts` - 10 logs → Eliminar todos

### 2. Frontend Debug (ELIMINAR completamente)
- `app/contexts/ModuleVisibilityContext.tsx` - 6 logs debug 🔍
- `app/components/sidebar/utils/permissions.ts` - 4 logs DEBUG REPORTES
- `app/components/debug/ModuleVisibilityDebug.tsx` - 8 logs debug

### 3. APIs Críticas (MANTENER solo errors)
- `app/api/salidas/[id]/route.ts` - 11 logs → Solo errors
- `app/api/salidas/route.ts` - 4 logs → Solo errors
- `app/api/entradas/route.ts` - 4 logs → Solo errors
- `app/api/entradas/[id]/route.ts` - 3 logs → Solo errors

### 4. Hooks Frontend (ELIMINAR debug)
- `app/dashboard/salidas/hooks/useSalidasList.ts` - 4 logs
- `app/dashboard/salidas/page.tsx` - 1 log
- `app/dashboard/entradas/page.tsx` - 1 log
- `app/dashboard/entradas/nueva/page.tsx` - 6 logs

### 5. Reportes (ELIMINAR debug consolidación)
- `app/dashboard/reportes/salidas-cliente/page.tsx` - 6 logs (mantener errors)

### 6. Debug/Migration Scripts (DEJAR como están - son debug tools)
- `app/api/debug/migrate-salidas/route.ts`
- `app/api/debug/analyze-salidas/route.ts`

### 7. Contextos (ELIMINAR logs verbosos)
- `app/contexts/UserImageContext.tsx` - 10+ logs → Solo errors críticos

### 8. RBAC (MANTENER info útil, ELIMINAR debug)
- `app/api/rbac/roles/[id]/modules/[moduleKey]/toggle/route.ts` - 2 info logs
- `app/api/rbac/roles/[id]/modules/toggle-all/route.ts` - 2 info logs
- Solo mantener logs de cambios importantes

## Estrategia de Reemplazo

### Para ELIMINAR:
```typescript
// ❌ ANTES
console.log('🔍 [DEBUG] Info temporal:', data);
console.log('[INFO] Cargando datos...');

// ✅ DESPUÉS
// Eliminar completamente
```

### Para CONVERTIR a logger:
```typescript
// ❌ ANTES
console.error('Error al obtener datos:', error);

// ✅ DESPUÉS
import { logger } from '@/lib/logger';
logger.error('Error al obtener datos', error);
```

### Para MANTENER (casos especiales):
```typescript
// ✅ MANTENER - Logs de auditoría importantes
console.log(`Contraseña cambiada para usuario ${user.email}`);

// ✅ MANTENER - Warnings de límites
console.warn(`⚠️ Exportación limitada a ${MAX_EXPORT} registros`);
```

## Logs a MANTENER
1. **Cambios de contraseña** (auth/change-password)
2. **Warnings de límites de exportación** (catalogs/export, auditoria)
3. **Errores críticos de BD o API**
4. **Logs de RBAC para módulos activados/desactivados** (info importante)

## Logs a ELIMINAR
1. **Todos los debug con emojis** (🔍, 📝, ✅, 📦, 🚨, etc.)
2. **Logs de "Fetching...", "Cargando...", "Datos recibidos..."**
3. **Stack traces duplicados** (usar solo logger.error)
4. **Logs de SSE conectando/desconectando** (demasiado verboso)
5. **Logs de sesión activa/inactiva** (innecesarios en producción)

## Próximos Pasos
1. ✅ Crear lib/logger.ts con sistema profesional
2. ✅ Eliminar endpoints de prueba
3. 🔄 Limpiar archivos críticos uno por uno
4. ⏳ Verificar que no se rompan funcionalidades
5. ⏳ Probar build de producción
6. ⏳ Verificar que solo queden logs necesarios

## Tiempo Estimado
- Limpieza manual: 2-3 horas
- Verificación: 30 minutos
- **Total: ~3 horas**
