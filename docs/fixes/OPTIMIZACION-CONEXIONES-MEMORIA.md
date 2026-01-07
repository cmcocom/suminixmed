# Optimizaciones de Conexiones y Memoria - SuminixMed

**Fecha**: 6 de enero de 2026  
**Motivo**: Error "Too many database connections opened: FATAL: lo siento, ya tenemos demasiados clientes"

## Problema Detectado

El sistema estaba creando múltiples instancias de `PrismaClient`, agotando el pool de conexiones de PostgreSQL.

## Soluciones Implementadas

### 1. Singleton de Prisma (lib/prisma.ts)

**Archivos corregidos:**

- `lib/backup-scheduler.ts` - Cambiado de `new PrismaClient()` a `import { prisma } from './prisma'`
- `lib/helpers/claves-clientes.ts` - Cambiado de `new PrismaClient()` a `import { prisma } from '../prisma'`

**Configuración de Connection Pool:**

```typescript
const poolParams = [
  'connection_limit=10', // Máximo 10 conexiones simultáneas
  'pool_timeout=20', // 20 segundos timeout para obtener conexión
  'connect_timeout=10', // 10 segundos timeout para conectar
];
```

### 2. Sistema de Retry para Errores de Conexión

Nueva función `withRetry()` en `lib/prisma.ts`:

```typescript
// Uso:
import { withRetry } from '@/lib/prisma';

const data = await withRetry(
  () => prisma.user.findMany({ take: 10 }),
  3, // máximo 3 reintentos
  1000 // 1 segundo entre reintentos
);
```

### 3. Manejo de Errores Mejorado (lib/error-handler.ts)

Detección automática de errores de conexión:

- `DB_CONNECTION_ERROR` (503) - Error de conexión a BD
- `DB_INIT_ERROR` (503) - Error de inicialización de Prisma
- `MEMORY_ERROR` (503) - Error de memoria
- `CRITICAL_ERROR` (500) - Error crítico de Prisma

Todos los errores de conexión devuelven `retryable: true` para que el frontend pueda reintentar.

### 4. Optimización de Caché (lib/cache-manager.ts)

**Límites implementados:**

- `MAX_ENTRIES = 100` - Máximo 100 entradas en caché
- `MAX_SIZE_BYTES = 10MB` - Máximo 10MB de datos
- Limpieza automática cada 60 segundos
- Algoritmo LRU (Least Recently Used) para evicción

**Estadísticas disponibles:**

```typescript
import { cacheManager } from '@/lib/cache-manager';
console.log(cacheManager.getStats());
// { entries: 25, maxEntries: 100, sizeMB: "2.5", ... }
```

### 5. Shutdown Graceful (lib/shutdown-handler.ts)

Manejo de señales de cierre:

- `SIGTERM` - Docker, PM2, etc.
- `SIGINT` - Ctrl+C en terminal
- `uncaughtException` - Errores no capturados
- `unhandledRejection` - Promesas rechazadas

**Secuencia de cierre:**

1. Detener limpieza automática del caché
2. Limpiar caché
3. Desconectar Prisma
4. Salir del proceso

## Configuración Recomendada de PostgreSQL

Si el problema persiste, ajustar en `postgresql.conf`:

```conf
# Aumentar límite de conexiones
max_connections = 100

# Pool de conexiones
shared_buffers = 256MB
work_mem = 4MB
```

O agregar PgBouncer como connection pooler externo.

## Variables de Entorno Opcionales

```env
# Parámetros de pool en DATABASE_URL
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

## Verificación

Para verificar el estado de conexiones:

```sql
-- En PostgreSQL
SELECT count(*) FROM pg_stat_activity WHERE datname = 'nombre_bd';
```

## Archivos Modificados

1. `lib/prisma.ts` - Connection pool y retry logic
2. `lib/cache-manager.ts` - Límites de memoria y LRU
3. `lib/error-handler.ts` - Manejo de errores de conexión
4. `lib/shutdown-handler.ts` - Nuevo archivo para cleanup
5. `lib/backup-scheduler.ts` - Uso de singleton
6. `lib/helpers/claves-clientes.ts` - Uso de singleton

## Prevención Futura

### ❌ NO hacer:

```typescript
// Crear nueva instancia de Prisma
const prisma = new PrismaClient();
```

### ✅ SÍ hacer:

```typescript
// Usar el singleton global
import { prisma } from '@/lib/prisma';
```
