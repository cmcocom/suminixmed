# Fix: Error "Engine is not yet connected" en Prisma

## 🔍 Problema Identificado

El error ocurría al intentar iniciar sesión:

```
Invalid `prisma.user.findUnique()` invocation:
Engine is not yet connected.
```

## ✅ Solución Implementada

### 1. Conexión Explícita en `lib/prisma.ts`

Se modificó el archivo para:
- Crear una conexión explícita al inicializar el módulo
- Usar una Promise global para evitar múltiples conexiones simultáneas
- Exportar función `ensurePrismaConnection()` para asegurar conexión antes de operaciones críticas

**Cambios:**
```typescript
// Conectar explícitamente al inicializar
if (!globalThis.prismaConnected) {
  globalThis.prismaConnected = prisma.$connect()
    .then(() => {
      console.log('[PRISMA] ✅ Conexión establecida exitosamente');
    })
    .catch((err) => {
      console.error('[PRISMA] ❌ Error conectando a la base de datos:', err);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });
}

// Función para asegurar conexión
export async function ensurePrismaConnection() {
  if (globalThis.prismaConnected) {
    await globalThis.prismaConnected;
  }
}
```

### 2. Uso de `ensurePrismaConnection()` en Autenticación

Se actualizó `lib/auth.ts` para asegurar la conexión antes de consultas:

```typescript
import { prisma, ensurePrismaConnection } from "./prisma";

// En el método authorize:
async authorize(credentials) {
  try {
    // Asegurar que Prisma esté conectado antes de consultas
    await ensurePrismaConnection();
    
    // Continuar con la autenticación...
    const user = await prisma.user.findUnique({
      where: { clave: credentials.clave },
      // ...
    });
  }
}
```

## 🧪 Verificación

### Script de Prueba

Se creó `test-db-connection.mjs` para verificar la conexión:

```bash
node test-db-connection.mjs
```

**Resultado esperado:**
```
✅ Conexión establecida
✅ Query exitosa: X usuarios en la base de datos
✅ findUnique exitoso
✅ Conexión activa y funcional
```

### Prueba Manual

1. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev:local
   ```

2. **Verificar logs en consola:**
   Buscar el mensaje: `[PRISMA] ✅ Conexión establecida exitosamente`

3. **Intentar iniciar sesión:**
   - Ir a http://localhost:3000/login
   - Ingresar credenciales válidas
   - Verificar que la autenticación funciona sin errores

## 📋 Archivos Modificados

1. **`lib/prisma.ts`** - Conexión explícita y función de aseguramiento
2. **`lib/auth.ts`** - Uso de `ensurePrismaConnection()` antes de consultas
3. **`test-db-connection.mjs`** - Script de prueba de conexión (nuevo)

## ⚡ Beneficios de Esta Solución

1. **Prevención de race conditions**: La conexión se establece una sola vez
2. **Manejo de errores mejorado**: Logs claros en desarrollo y producción
3. **Verificación explícita**: Función reutilizable para asegurar conexión
4. **Sin impacto en rendimiento**: La conexión se reutiliza (no se reconecta cada vez)
5. **Compatibilidad con hot reload**: En desarrollo no sale del proceso en error

## 🔍 Diagnóstico Adicional

Si el problema persiste:

1. **Verificar PostgreSQL:**
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. **Verificar variables de entorno:**
   ```bash
   cat .env.local | grep DATABASE_URL
   ```

3. **Regenerar cliente Prisma:**
   ```bash
   npx prisma generate
   ```

4. **Verificar logs del servidor:**
   Buscar mensajes que contengan `[PRISMA]` o `[AUTH]`

## 📝 Notas Técnicas

- La conexión de Prisma es lazy por defecto (se conecta en la primera query)
- NextAuth puede ejecutar múltiples callbacks simultáneamente
- La solución asegura que la conexión esté lista antes de cualquier query
- En producción, un fallo de conexión termina el proceso inmediatamente
- En desarrollo, permite hot reload sin reiniciar el servidor

## 🎯 Próximos Pasos

1. Monitorear logs en producción para verificar que no hay errores de conexión
2. Considerar agregar retry logic para conexiones fallidas
3. Implementar health check endpoint que verifique estado de Prisma
4. Agregar métricas de latencia de conexión a BD

---

**Fecha de implementación:** 28 de octubre de 2025  
**Estado:** ✅ Implementado y probado  
**Impacto:** Alto - Resuelve problema crítico de autenticación
