# 🔍 ANÁLISIS CRÍTICO: Rendimiento y Escalabilidad del Sistema

**Fecha**: 25 de octubre de 2025  
**Objetivo**: Identificar problemas de rendimiento cuando el sistema maneje millones de entradas/salidas  
**Estado**: ⚠️ CRÍTICO - 18 problemas identificados que requieren atención inmediata

---

## 📊 Resumen Ejecutivo

### ✅ Aspectos Ya Optimizados (Sesión Anterior)
- ✅ GET `/api/salidas` - Paginación server-side implementada
- ✅ GET `/api/entradas` - Paginación server-side implementada
- ✅ GET `/api/reportes/salidas-cliente` - Optimizado con paginación
- ✅ GET `/api/auditoria` - Export con chunking (5K chunks, 50K max)
- ✅ GET `/api/catalogs/export` - 6 catálogos con chunking

### ⚠️ Problemas Críticos Nuevos Identificados

| Categoría | Severidad | Cantidad | Impacto en Millones de Registros |
|-----------|-----------|----------|----------------------------------|
| **Transacciones Largas** | 🔴 CRÍTICO | 2 | Bloqueos, timeouts, deadlocks |
| **Validaciones Ineficientes** | 🔴 CRÍTICO | 2 | N+1 queries antes de transacción |
| **Índices Faltantes** | 🟠 ALTO | 6 | Queries 100x más lentas |
| **Transacciones Complejas** | 🟡 MEDIO | 3 | Posibles bloqueos largos |

**TOTAL**: **13 problemas** que afectarán severamente el rendimiento con millones de registros.

**NOTA**: Se eliminaron 5 problemas relacionados con la tabla `kardex` que no existe en el esquema actual.

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. POST `/api/salidas` - Validación N+1 Antes de Transacción

**📍 Ubicación**: `app/api/salidas/route.ts:243-258`

**❌ Problema**:
```typescript
// CRÍTICO: Loop con queries individuales FUERA de la transacción
for (const partida of partidas) {
  const producto = await prisma.inventario.findUnique({
    where: { id: partida.inventarioId },
    select: { cantidad: true, descripcion: true }
  });

  if (!producto) {
    return NextResponse.json(
      { error: `Producto con ID ${partida.inventarioId} no encontrado` },
      { status: 400 }
    );
  }

  if (producto.cantidad < partida.cantidad) {
    return NextResponse.json(
      { error: `Stock insuficiente para ${producto.descripcion}` },
      { status: 400 }
    );
  }
}
```

**⚠️ Impacto**:
- **20 productos** en partidas = **20 queries individuales** antes de la transacción
- **50 productos** = **50 queries**
- **100 productos** = **100 queries**
- Con millones de productos en BD, cada query puede tardar 50-200ms
- **Tiempo total**: 20 productos × 100ms = **2 segundos** solo en validación
- **Race condition**: El stock puede cambiar entre validación y transacción

**✅ Solución**:
```typescript
// OPTIMIZADO: Una sola query con WHERE IN
const inventarioIds = partidas.map(p => p.inventarioId);
const productos = await prisma.inventario.findMany({
  where: { id: { in: inventarioIds } },
  select: { id: true, cantidad: true, descripcion: true }
});

// Crear un Map para acceso O(1)
const productosMap = new Map(productos.map(p => [p.id, p]));

// Validar en memoria (sin queries adicionales)
for (const partida of partidas) {
  const producto = productosMap.get(partida.inventarioId);
  
  if (!producto) {
    return NextResponse.json(
      { error: `Producto con ID ${partida.inventarioId} no encontrado` },
      { status: 400 }
    );
  }

  if (producto.cantidad < partida.cantidad) {
    return NextResponse.json(
      { error: `Stock insuficiente para ${producto.descripcion}` },
      { status: 400 }
    );
  }
}
```

**📈 Mejora Esperada**:
- De **N queries** a **1 query**
- De **2 segundos** a **100ms** para 20 productos
- **20x más rápido**
- Elimina race conditions

---

### 2. POST `/api/entradas` - Validación N+1 Antes de Transacción

**📍 Ubicación**: `app/api/entradas/route.ts:208-220`

**❌ Problema**:
```typescript
// CRÍTICO: Loop con queries individuales
for (const partida of partidas) {
  const producto = await prisma.inventario.findUnique({
    where: { id: partida.inventario_id },
    select: { id: true, descripcion: true }
  });

  if (!producto) {
    return NextResponse.json(
      { error: `Producto con ID ${partida.inventario_id} no encontrado` },
      { status: 400 }
    );
  }
}
```

**⚠️ Impacto**: Idéntico al problema #1

**✅ Solución**: Aplicar misma optimización con `WHERE IN` y Map

---

### 3. POST `/api/salidas` - Transacción con Loop de Queries Individuales

**📍 Ubicación**: `app/api/salidas/route.ts:336-450`

**❌ Problema**:
```typescript
await prisma.$transaction(async (tx) => {
  // ... crear salida ...
  
  // CRÍTICO: Loop DENTRO de la transacción
  for (let i = 0; i < partidas.length; i++) {
    const partida = partidas[i];
    
    // Query individual #1
    const productoBefore = await tx.inventario.findUnique({
      where: { id: partida.inventarioId },
      select: { /* 10+ campos */ }
    });

    // Query individual #2 - Crear partida
    await tx.partidas_salida_inventario.create({
      data: { /* ... */ }
    });

    // Query individual #3 - Actualizar stock
    await tx.inventario.update({
      where: { id: partida.inventarioId },
      data: { cantidad: productoBefore.cantidad - partida.cantidad }
    });

  }
  
  // TOTAL: 20 partidas × 3 queries = 60 queries dentro de transacción
});
```

**⚠️ Impacto**:
- **20 partidas** = **60 queries** dentro de transacción
- **50 partidas** = **150 queries**
- Con millones de registros, cada transacción puede durar **8-20 segundos**
- PostgreSQL limita transacciones largas (timeout default: 60s)
- **Bloquea filas** del inventario durante toda la transacción
- Aumenta probabilidad de **deadlocks** con transacciones concurrentes
- Sistema **inutilizable** durante salidas grandes

**✅ Solución**:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Obtener TODOS los productos de una vez
  const inventarioIds = partidas.map(p => p.inventarioId);
  const productosActuales = await tx.inventario.findMany({
    where: { id: { in: inventarioIds } },
    select: { id: true, descripcion: true, cantidad: true, /* ... */ }
  });
  
  const productosMap = new Map(productosActuales.map(p => [p.id, p]));
  
  // 2. Preparar datos para operaciones batch
  const partidasData = [];
  const inventarioUpdates = [];
  const kardexMovimientos = [];
  
  for (let i = 0; i < partidas.length; i++) {
    const partida = partidas[i];
    const productoBefore = productosMap.get(partida.inventarioId);
    
    partidasData.push({
      id: `partida_salida_${Date.now()}_${i}`,
      salida_id: salida.id,
      inventario_id: partida.inventarioId,
      cantidad: partida.cantidad,
      precio: partida.precio,
      orden: i
    });
    
    inventarioUpdates.push(
      tx.inventario.update({
        where: { id: partida.inventarioId },
        data: { cantidad: { decrement: partida.cantidad } }
      })
    );
    
    kardexMovimientos.push({
      id: `kardex_${Date.now()}_${i}`,
      tipo_movimiento: 'SALIDA',
      inventario_id: partida.inventarioId,
      cantidad: partida.cantidad,
      /* ... */
    });
  }
  
  // 3. Ejecutar operaciones batch en paralelo
  await Promise.all([
    tx.partidas_salida_inventario.createMany({ data: partidasData }),
    ...inventarioUpdates // Ejecutar updates en paralelo
  ]);
});
```

**📈 Mejora Esperada**:
- De **60 queries secuenciales** a **~4 queries batch paralelas**
- De **15-20 segundos** a **1-2 segundos** para 20 partidas
- **8-10x más rápido**
- Reduce tiempo de bloqueo de filas
- Minimiza riesgo de deadlocks

---

### 4. POST `/api/entradas` - Transacción con Loop de Queries Individuales

**📍 Ubicación**: `app/api/entradas/route.ts:317-410`

**❌ Problema**: Idéntico al problema #3

**⚠️ Impacto**:
- Mismos problemas de rendimiento
- Transacciones largas bloqueando inventario
- Posibles deadlocks con entradas concurrentes

**✅ Solución**: Aplicar misma optimización batch con `createMany` y `Promise.all`

---

## 🟠 PROBLEMAS DE ALTO IMPACTO

### 5. Índice Faltante: `entradas_inventario(tipo_entrada_id)`

**❌ Problema**: Filtros por tipo de entrada hacen **table scan completo**

**📍 Ubicación**: `prisma/schema.prisma:322-352`

**Queries afectadas**:
```typescript
// Reportes que filtran por tipo
await prisma.entradas_inventario.findMany({
  where: { tipo_entrada_id: 'tipo_xyz' }
});
```

**⚠️ Impacto con 10M de entradas**:
- Sin índice: **Escanea 10,000,000 filas** completas
- Con índice: **Usa B-tree**, solo lee filas coincidentes
- **Diferencia**: 10s vs 50ms = **200x más rápido**

**✅ Solución**:
```prisma
model entradas_inventario {
  // ... campos existentes ...
  
  @@index([tipo_entrada_id])  // AGREGAR
  @@index([almacen_id])
  @@index([estado])
  @@index([fecha_creacion])
}
```

---

### 6. Índice Faltante: `salidas_inventario(tipo_salida_id)`

**❌ Problema**: Idéntico al #5 pero para salidas

**✅ Solución**:
```prisma
model salidas_inventario {
  // ... campos existentes ...
  
  @@index([tipo_salida_id])  // AGREGAR
  @@index([cliente_id])
  @@index([estado])
}
```

---

### 7. Índice Faltante Compuesto: `salidas_inventario(cliente_id, fecha_creacion)`

**❌ Problema**: Reportes por cliente + rango de fechas hacen scan completo

**📍 Query Afectado**:
```typescript
// app/api/reportes/salidas-cliente/route.ts
await prisma.salidas_inventario.findMany({
  where: {
    cliente_id: clienteId,
    fecha_creacion: {
      gte: fechaInicio,
      lte: fechaFin
    }
  }
});
```

**⚠️ Impacto**:
- PostgreSQL puede usar índice de `cliente_id` o `fecha_creacion`, pero **NO ambos**
- Sin índice compuesto: Filtra por cliente (1000 salidas) y luego **escanea 1000 filas** para filtrar fechas
- Con índice compuesto: **Acceso directo** a salidas del cliente en ese rango

**✅ Solución**:
```prisma
model salidas_inventario {
  // ... campos existentes ...
  
  @@index([cliente_id, fecha_creacion])  // AGREGAR índice compuesto
  @@index([fecha_creacion, cliente_id])  // OPCIONAL: orden inverso para otros queries
}
```

**📈 Mejora**: **50-100x más rápido** en reportes filtrados

---

### 8. Índice Faltante Compuesto: `entradas_inventario(proveedor_id, fecha_creacion)`

**❌ Problema**: Idéntico al #7 pero para entradas por proveedor

**✅ Solución**:
```prisma
model entradas_inventario {
  // ... campos existentes ...
  
  @@index([proveedor_id, fecha_creacion])  // AGREGAR
}
```

---

### 9. Índice Faltante: `partidas_salida_inventario(salida_id, inventario_id)`

**❌ Problema**: JOINs y agregaciones en reportes son lentos

**📍 Query Afectado**:
```typescript
// Reportes que agrupan productos por salida
await prisma.partidas_salida_inventario.groupBy({
  by: ['inventario_id', 'salida_id'],
  _sum: { cantidad: true }
});
```

**✅ Solución**:
```prisma
model partidas_salida_inventario {
  // ... campos existentes ...
  
  @@index([salida_id, inventario_id])  // AGREGAR
}
```

---

### 10. Índice Faltante: `partidas_entrada_inventario(entrada_id, inventario_id)`

**❌ Problema**: Idéntico al #9 pero para entradas

**✅ Solución**:
```prisma
model partidas_entrada_inventario {
  // ... campos existentes ...
  
  @@index([entrada_id, inventario_id])  // AGREGAR
}
```

---

### 11. GET `/api/dashboard/stats` - Múltiples `count()` Sin Cache

**📍 Ubicación**: `app/api/dashboard/stats/route.ts:18-39`

**❌ Problema**:
```typescript
// Fallback: 9 queries count() cada vez que se carga el dashboard
dashboardStats = {
  total_users: await prisma.user.count(),
  active_users: await prisma.user.count({ where: { activo: true } }),
  inactive_users: await prisma.user.count({ where: { activo: false } }),
  total_inventory: await prisma.inventario.count(),
  low_stock_items: await prisma.inventario.count({ where: { cantidad: { lte: 10 } } }),
  total_categories: await prisma.categorias.count(),
  active_categories: await prisma.categorias.count({ where: { activo: true } }),
  total_clients: await prisma.clientes.count({ where: { activo: true } }),
  active_sessions_count: await prisma.active_sessions.count({ /* ... */ })
};
```

**⚠️ Impacto**:
- Con 10M de registros en inventario, cada `count()` tarda **2-5 segundos**
- Dashboard se carga **cada 30 segundos** por cada usuario
- 10 usuarios concurrentes = **90 queries count()** cada 30s
- **Sobrecarga masiva** en base de datos

**✅ Solución 1 - Cache en Redis** (RECOMENDADO):
```typescript
import { redis } from '@/lib/redis'; // Implementar Redis

async function getDashboardStats() {
  const CACHE_KEY = 'dashboard:stats';
  const CACHE_TTL = 300; // 5 minutos
  
  // Intentar cache
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }
  
  // Calcular stats
  const stats = {
    total_users: await prisma.user.count(),
    // ... resto ...
  };
  
  // Guardar en cache
  await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(stats));
  
  return NextResponse.json(stats);
}
```

**✅ Solución 2 - Tabla de Estadísticas Pre-calculadas**:
```sql
-- Crear tabla de stats
CREATE TABLE dashboard_stats_cache (
  id SERIAL PRIMARY KEY,
  stat_key VARCHAR(50) UNIQUE,
  stat_value BIGINT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger que actualiza stats cuando cambian datos
CREATE OR REPLACE FUNCTION update_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar contadores relevantes
  UPDATE dashboard_stats_cache 
  SET stat_value = (SELECT COUNT(*) FROM inventario),
      updated_at = NOW()
  WHERE stat_key = 'total_inventory';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stats
AFTER INSERT OR DELETE OR UPDATE ON inventario
FOR EACH STATEMENT EXECUTE FUNCTION update_dashboard_stats();
```

**📈 Mejora Esperada**:
- De **9 queries × 3s = 27s** a **1 query × 50ms = 50ms**
- **540x más rápido**
- Reduce carga en BD en **99%**

---

### 12. DELETE `/api/salidas/[id]` - Transacción de Reversión Compleja

**📍 Ubicación**: `app/api/salidas/[id]/route.ts:321-450`

**❌ Problema**:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Obtener salida con partidas
  const salida = await tx.salidas_inventario.findUnique({
    where: { id },
    include: { partidas_salida_inventario: true }
  });
  
  // 2. Loop: revertir stock para cada partida
  for (const partida of salida.partidas_salida_inventario) {
    const producto = await tx.inventario.findUnique({
      where: { id: partida.inventario_id }
    });
    
    await tx.inventario.update({
      where: { id: partida.inventario_id },
      data: { cantidad: producto.cantidad + partida.cantidad }
    });
  }
  
  // 3. Eliminar partidas
  await tx.partidas_salida_inventario.deleteMany({
    where: { salida_id: id }
  });
  
  // 4. Eliminar salida
  await tx.salidas_inventario.delete({
    where: { id }
  });
});
```

**⚠️ Impacto**:
- 50 partidas = **50 × 2 queries** (findUnique + update) + 2 deletes = **102 queries**
- Transacción puede durar **10-20 segundos**
- Bloquea inventario durante toda la operación

**✅ Solución**:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Obtener partidas
  const partidas = await tx.partidas_salida_inventario.findMany({
    where: { salida_id: id },
    select: { inventario_id: true, cantidad: true }
  });
  
  // 2. Batch updates usando Promise.all
  const updates = partidas.map(partida =>
    tx.inventario.update({
      where: { id: partida.inventario_id },
      data: { cantidad: { increment: partida.cantidad } }
    })
  );
  
  await Promise.all([
    ...updates,
    tx.partidas_salida_inventario.deleteMany({ where: { salida_id: id } }),
    tx.salidas_inventario.delete({ where: { id } })
  ]);
});
```

**📈 Mejora**: De **102 queries** a **4 queries**, **25x más rápido**

---

### 13. DELETE `/api/entradas/[id]` - Transacción de Reversión Compleja

**📍 Ubicación**: `app/api/entradas/[id]/route.ts:295-400`

**❌ Problema**: Idéntico al #12

**✅ Solución**: Aplicar misma optimización batch

---

## 📋 RESUMEN DE ÍNDICES FALTANTES

### Índices Simples a Agregar (4)
```prisma
// entradas_inventario
@@index([tipo_entrada_id])

// salidas_inventario
@@index([tipo_salida_id])

// partidas_entrada_inventario
@@index([entrada_id, inventario_id])  // Compuesto

// partidas_salida_inventario
@@index([salida_id, inventario_id])  // Compuesto
```

### Índices Compuestos a Agregar (2)
```prisma
// salidas_inventario
@@index([cliente_id, fecha_creacion])

// entradas_inventario
@@index([proveedor_id, fecha_creacion])
```

**TOTAL**: **6 índices nuevos**

---

## 🎯 PLAN DE ACCIÓN PRIORIZADO

### PRIORIDAD 1 - CRÍTICO (Semana 1)

#### 1.1 Optimizar Validaciones N+1
- [ ] **Tarea 1.1**: Optimizar validación en POST `/api/salidas` (Problema #1)
- [ ] **Tarea 1.2**: Optimizar validación en POST `/api/entradas` (Problema #2)
- **Tiempo estimado**: 2 horas
- **Impacto**: 20x mejora en tiempo de validación

#### 1.2 Optimizar Transacciones de Creación
- [ ] **Tarea 2.1**: Refactorizar POST `/api/salidas` con batch operations (Problema #3)
- [ ] **Tarea 2.2**: Refactorizar POST `/api/entradas` con batch operations (Problema #4)
- **Tiempo estimado**: 6 horas
- **Impacto**: 10-15x mejora, elimina bloqueos largos

#### 1.3 Agregar Índices Críticos
- [ ] **Tarea 3.1**: Agregar índice `salidas_inventario(cliente_id, fecha_creacion)`
- [ ] **Tarea 3.2**: Agregar índice `entradas_inventario(proveedor_id, fecha_creacion)`
- **Tiempo estimado**: 1 hora + tiempo de creación de índices (puede tardar horas con millones de filas)
- **Impacto**: 50-200x mejora en reportes

### PRIORIDAD 2 - ALTO (Semana 2)

#### 2.1 Completar Índices Faltantes
- [ ] **Tarea 4.1**: Agregar 4 índices restantes (ver sección "Resumen de Índices")
- **Tiempo estimado**: 1 hora + tiempo de creación
- **Impacto**: 20-100x mejora en queries específicos

#### 2.2 Implementar Cache en Dashboard
- [ ] **Tarea 5.1**: Implementar Redis para cache de stats (Problema #13)
- [ ] **Tarea 5.2**: O implementar tabla de stats pre-calculadas
- **Tiempo estimado**: 4 horas
- **Impacto**: 540x mejora en carga de dashboard

### PRIORIDAD 3 - MEDIO (Semana 3)

#### 3.1 Optimizar Transacciones de Eliminación
- [ ] **Tarea 6.1**: Refactorizar DELETE `/api/salidas/[id]` (Problema #14)
- [ ] **Tarea 6.2**: Refactorizar DELETE `/api/entradas/[id]` (Problema #15)
- **Tiempo estimado**: 3 horas
- **Impacto**: 25x mejora en eliminaciones

---

## 📊 IMPACTO TOTAL ESPERADO

### Antes de Optimizaciones
```
Crear salida con 20 productos:
- Validación: 2,000ms (20 queries)
- Transacción: 20,000ms (80 queries secuenciales)
- TOTAL: 22 segundos

Reporte salidas por cliente (1 mes):
- Sin índices: 10,000ms (full scan)
- TOTAL: 10 segundos

Dashboard stats:
- 9 queries count(): 27,000ms
- TOTAL: 27 segundos
```

### Después de Optimizaciones
```
Crear salida con 20 productos:
- Validación: 100ms (1 query batch)
- Transacción: 1,500ms (5 queries batch paralelas)
- TOTAL: 1.6 segundos (13x más rápido)

Reporte salidas por cliente (1 mes):
- Con índice compuesto: 50ms
- TOTAL: 50ms (200x más rápido)

Dashboard stats (con cache):
- 1 query desde cache: 50ms
- TOTAL: 50ms (540x más rápido)
```

### Mejora Global Estimada
- **Operaciones críticas**: **10-200x más rápidas**
- **Reducción de bloqueos**: **95%**
- **Reducción de carga en BD**: **90%**
- **Capacidad de escala**: De **miles** a **millones** de registros

---

## 🔧 COMANDOS DE MIGRACIÓN

### Crear Migración para Índices
```bash
# 1. Editar prisma/schema.prisma y agregar índices
# 2. Crear migración
npx prisma migrate dev --name agregar_indices_rendimiento

# 3. En producción (¡CUIDADO! puede tardar horas)
npx prisma migrate deploy
```

### Monitorear Progreso de Creación de Índices
```sql
-- En PostgreSQL
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Ver progreso de índices creándose
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE query LIKE '%CREATE INDEX%';
```

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### 1. Creación de Índices en Producción
- Con **millones de filas**, crear índices puede tardar **horas**
- Usa `CREATE INDEX CONCURRENTLY` para evitar bloqueos:
  ```sql
  CREATE INDEX CONCURRENTLY idx_kardex_inventario_fecha 
  ON kardex(inventario_id, fecha_movimiento);
  ```
- **Planifica ventanas de mantenimiento** para índices grandes

### 2. Tamaño de Índices
- Cada índice consume espacio en disco
- Con 10M de registros, cada índice puede ocupar **500MB - 2GB**
- Monitorea espacio disponible antes de crear índices

### 3. Testing Exhaustivo
- **NUNCA** aplicar estas optimizaciones directamente en producción
- Probar en entorno de desarrollo con datos de volumen similar
- Validar que transacciones batch funcionan correctamente
- Verificar que no hay regresiones en funcionalidad

### 4. Rollback Plan
- Antes de optimizar, hacer backup completo de BD
- Documentar queries originales para posible rollback
- Tener plan de reversión si algo falla

---

## 📚 RECURSOS ADICIONALES

### Documentación Relacionada
- `docs/guides/GUIA-RAPIDA.md` - Guía rápida del sistema
- `docs/fixes/OPTIMIZACION-ENDPOINTS-CRITICOS-COMPLETADA.md` - Optimizaciones anteriores
- `lib/timezone-utils.ts` - Utilidades de fecha/hora
- `lib/audit-system.ts` - Sistema de auditoría

### Próximos Pasos Recomendados
1. Revisar este documento con el equipo técnico
2. Priorizar tareas según impacto y recursos
3. Crear entorno de pruebas con volumen de datos real
4. Implementar monitoreo de rendimiento antes de optimizar
5. Ejecutar plan de acción por fases

---

**Fin del Análisis**  
**Próxima Acción Recomendada**: Implementar Prioridad 1 - Optimizar validaciones N+1 y transacciones de creación
