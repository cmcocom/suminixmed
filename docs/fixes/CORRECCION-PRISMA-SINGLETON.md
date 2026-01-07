# 🔧 Corrección Crítica: Instancias Duplicadas de PrismaClient

**Fecha**: 28 de octubre de 2025  
**Problema**: Los indicadores del dashboard no mostraban datos  
**Causa raíz**: Múltiples instancias de PrismaClient causando cierre de conexiones

## 🔴 Problema Detectado

### Síntomas
- ✅ Dashboard cargaba correctamente
- ❌ Los 5 indicadores de stock mostraban "0" o "..."
- ❌ Logs mostraban: `Error [PrismaClientUnknownRequestError]: Response from the Engine was empty`

### Causa Raíz
Múltiples archivos estaban creando instancias independientes de PrismaClient en lugar de usar el singleton:

```typescript
// ❌ INCORRECTO - 10 archivos lo hacían así
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Y al final cerraban la conexión globalmente
} finally {
  await prisma.$disconnect(); // ❌ Cierra conexión para TODOS
}
```

Esto causaba que cuando un endpoint llamaba a `prisma.$disconnect()`, cerraba la conexión compartida, dejando a otros endpoints sin respuesta.

## ✅ Solución Implementada

### Archivos Corregidos (10 total)

1. **app/api/indicadores/productos-stock/route.ts** ✅
   - Removido: `new PrismaClient()`
   - Removido: 2 bloques `finally { prisma.$disconnect() }`
   - Agregado: `import { prisma } from '@/lib/prisma'`

2. **app/api/tipos-entrada/[id]/route.ts** ✅
3. **app/api/tipos-entrada/route.ts** ✅
4. **app/api/productos/analisis-stock/route.ts** ✅
5. **app/api/catalogs/import/route.ts** ✅
6. **app/api/catalogs/export/route.ts** ✅
7. **app/api/tipos-salida/route.ts** ✅
8. **app/api/tipos-salida/[id]/route.ts** ✅
9. **app/api/rbac/users/[id]/roles/route.ts** ✅
10. **app/api/rbac/users/[id]/permissions/route.ts** ✅

### Patrón Correcto

```typescript
// ✅ CORRECTO - Usar siempre el singleton
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.inventario.findMany(...);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
  // ✅ NO llamar prisma.$disconnect() - el singleton lo maneja
}
```

## 🛠️ Proceso de Corrección

### 1. Detección
```bash
# Encontrar todas las instancias duplicadas
grep -r "new PrismaClient()" app/api/
# Resultado: 10 archivos afectados
```

### 2. Corrección Automatizada
Se creó script `scripts/fix-prisma-instances.sh`:

```bash
#!/bin/bash
# Reemplaza automáticamente las instancias duplicadas
for archivo in "${archivos[@]}"; do
  sed -i '' \
    -e 's/import { PrismaClient } from .@prisma\/client.;/import { prisma } from '\''@\/lib\/prisma'\'';/g' \
    -e '/^const prisma = new PrismaClient();/d' \
    "$archivo"
done
```

### 3. Corrección Manual
Se eliminaron manualmente los bloques `finally { prisma.$disconnect() }` de:
- `app/api/indicadores/productos-stock/route.ts` (2 bloques)
- `app/api/catalogs/import/route.ts` (1 bloque)
- `app/api/catalogs/export/route.ts` (1 bloque)

## 📊 Impacto

### Antes de la Corrección
```
❌ Indicadores dashboard: 0 datos
❌ Error en logs: "Response from the Engine was empty"
❌ Conexiones cerradas inesperadamente
❌ 10 archivos con instancias duplicadas
```

### Después de la Corrección
```
✅ Indicadores dashboard: Funcionando correctamente
✅ Sin errores de Prisma en logs
✅ Conexiones estables y compartidas
✅ 0 archivos con instancias duplicadas
✅ Pool de conexiones gestionado correctamente
```

## 📝 Reglas de Desarrollo

### ⚠️ NUNCA Hacer

1. ❌ **NO crear instancias nuevas de PrismaClient**:
   ```typescript
   const prisma = new PrismaClient(); // ❌ NUNCA
   ```

2. ❌ **NO llamar `prisma.$disconnect()` en API routes**:
   ```typescript
   } finally {
     await prisma.$disconnect(); // ❌ NUNCA
   }
   ```

3. ❌ **NO importar directamente de `@prisma/client`** (excepto para tipos):
   ```typescript
   import { PrismaClient } from '@prisma/client'; // ❌ SOLO PARA TIPOS
   ```

### ✅ SIEMPRE Hacer

1. ✅ **Usar el singleton de `@/lib/prisma`**:
   ```typescript
   import { prisma } from '@/lib/prisma'; // ✅ CORRECTO
   ```

2. ✅ **Dejar que el singleton maneje las conexiones**:
   ```typescript
   export async function GET(request: NextRequest) {
     try {
       const data = await prisma.model.findMany();
       return NextResponse.json(data);
     } catch (error) {
       return NextResponse.json({ error }, { status: 500 });
     }
     // ✅ Sin finally, sin $disconnect
   }
   ```

3. ✅ **Importar tipos de Prisma si es necesario**:
   ```typescript
   import { prisma } from '@/lib/prisma';
   import type { Inventario } from '@prisma/client'; // ✅ SOLO TIPOS
   ```

## 🔍 Verificación

### Comando para Verificar
```bash
# Asegurarse de que NO haya instancias duplicadas
grep -r "new PrismaClient()" app/api/
# Resultado esperado: Sin coincidencias

# Asegurarse de que NO haya $disconnect
grep -r "prisma.\$disconnect()" app/api/
# Resultado esperado: Sin coincidencias
```

### Test Manual
1. Iniciar servidor: `npm run dev`
2. Abrir dashboard: http://localhost:3000/dashboard
3. Verificar que los 5 indicadores muestren números correctos
4. Revisar logs: NO debe haber errores de Prisma

## 📚 Contexto Técnico

### ¿Por Qué un Singleton?

El singleton en `lib/prisma.ts` garantiza:

1. **Una sola instancia**: Evita múltiples conexiones
2. **Pool compartido**: Optimiza uso de conexiones PostgreSQL
3. **Hot Reload seguro**: En desarrollo, reutiliza conexión existente
4. **Gestión automática**: Next.js cierra conexiones al terminar

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### ¿Por Qué NO Llamar `$disconnect()`?

- En serverless/Edge, Next.js maneja el ciclo de vida
- Llamar `$disconnect()` cierra conexión para TODOS los endpoints
- El singleton se auto-gestiona basado en referencias
- Solo es necesario en scripts standalone (migrations, seeds)

## 🎯 Resultado Final

**Estado**: ✅ RESUELTO COMPLETAMENTE

- ✅ 10 archivos corregidos
- ✅ 0 instancias duplicadas restantes
- ✅ 0 llamadas a `$disconnect()` en APIs
- ✅ Indicadores del dashboard funcionando
- ✅ Conexiones de BD estables
- ✅ Logs limpios sin errores de Prisma

---

**Documentado por**: AI Assistant  
**Revisado**: Pendiente  
**Prioridad**: CRÍTICA ⚠️  
**Tipo**: Bug Fix / Optimización
