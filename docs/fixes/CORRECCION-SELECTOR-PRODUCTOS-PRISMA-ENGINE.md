# Corrección: Selector de Productos - Error de Conexión Prisma

## ❌ Problema

El selector de productos en la página de entradas dejó de funcionar. Al buscar productos, no se mostraban resultados.

## 🔍 Diagnóstico

### Error en Logs del Servidor

```
Error buscando productos: Error [PrismaClientUnknownRequestError]: 
Invalid `prisma.inventario.findMany()` invocation

Engine is not yet connected.
Backtrace [...]
```

### Causa Raíz

El motor de Prisma (Prisma Engine) perdió la conexión con la base de datos. Este es un problema común que puede ocurrir por:

1. **Hot Module Replacement (HMR)** de Turbopack que recarga módulos sin reconectar Prisma
2. **Conexiones inactivas** que se cierran por timeout
3. **Actualizaciones de código** que reinician el servidor parcialmente

### Síntomas Observados

- ✅ El servidor Next.js estaba corriendo normalmente
- ✅ La autenticación funcionaba correctamente
- ❌ Todos los endpoints de Prisma fallaban con "Engine is not yet connected"
- ❌ El selector de productos no devolvía resultados
- ❌ Otras funcionalidades de base de datos también fallaban

## ✅ Solución

### Reinicio del Servidor

La solución es reiniciar completamente el servidor de desarrollo para restablecer la conexión de Prisma:

```bash
# 1. Detener el servidor
pkill -f "next dev"

# 2. Reiniciar el servidor
npm run dev
```

### ¿Por Qué Funciona?

Al reiniciar el servidor:
1. Prisma Client se reinicializa completamente
2. Se establece una nueva conexión con PostgreSQL
3. El motor de Prisma se reconecta correctamente

## 🔧 Endpoint Afectado

**Archivo**: `/app/api/inventario/buscar/route.ts`

El endpoint realiza búsqueda de productos con:

```typescript
const productos = await prisma.inventario.findMany({
  where: {
    OR: [
      { clave: { contains: query, mode: 'insensitive' } },
      { clave2: { contains: query, mode: 'insensitive' } },
      { descripcion: { contains: query, mode: 'insensitive' } }
    ]
  },
  select: {
    id: true,
    clave: true,
    clave2: true,
    descripcion: true,
    precio: true,
    cantidad: true,
    estado: true
  },
  take: 20,
  orderBy: { descripcion: 'asc' }
});
```

## 📊 Otros Endpoints Afectados

Cuando Prisma Engine pierde la conexión, **TODOS** los endpoints que usan Prisma fallan:

- `/api/inventario/buscar` - Búsqueda de productos
- `/api/salidas/pendientes` - Solicitudes pendientes
- `/api/productos` - Lista de productos
- `/api/proveedores` - Lista de proveedores
- `/api/ordenes-compra` - Órdenes de compra
- `/api/entradas` - Entradas de inventario
- `/api/auth/session-check` - Verificación de sesión
- Y cualquier otro endpoint que use `prisma.*`

## 🚨 Prevención Futura

### Señales de Alerta

Si ves estos errores en los logs del servidor, necesitas reiniciar:

- ✘ `Engine is not yet connected`
- ✘ `PrismaClientUnknownRequestError`
- ✘ Múltiples endpoints fallando simultáneamente

### Buenas Prácticas

1. **Reinicia el servidor** cuando veas errores de Prisma Engine
2. **No intentes hacer cambios en el código** - el problema es de conexión, no de código
3. **Monitorea los logs** del servidor para detectar cuándo Prisma se desconecta
4. Si el problema persiste, considera usar **Prisma Accelerate** para conexiones más estables

## 📝 Verificación

Después de reiniciar, verifica que el selector funcione:

1. Ir a `/dashboard/entradas/nueva`
2. Escribir en el campo de búsqueda de productos
3. Verificar que aparezcan resultados
4. Confirmar que el formato es: **Descripción (principal)** / **Clave | Stock (pequeño)**

## 🔄 Estado Actual

- ✅ Servidor reiniciado
- ✅ Motor de Prisma reconectado
- ✅ Conexión a PostgreSQL establecida
- ✅ Selector de productos funcional

---

**Fecha**: 9 de octubre de 2025  
**Tipo**: Error de Conexión  
**Estado**: ✅ Resuelto  
**Solución**: Reinicio del servidor de desarrollo
