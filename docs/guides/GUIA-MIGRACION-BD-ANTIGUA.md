# 📚 Guía Completa: Migración de BD Antigua → Nueva Versión

**Fecha**: 26 de octubre de 2025  
**Sistema**: SuminixMed  
**Propósito**: Migrar datos de versión antigua del sistema a versión actual sin perder información

---

## 🎯 **Objetivo**

Migrar una base de datos de una versión anterior de SuminixMed a la versión actual (v0.1.0), manejando diferencias estructurales automáticamente y preservando **toda** la información.

---

## 📋 **Prerequisitos**

### 1. Archivos Necesarios
- ✅ **Backup de BD antigua** (archivo `.sql`)
- ✅ **Código fuente de versión nueva** (este repositorio)
- ✅ **PostgreSQL instalado** (versión 14+)

### 2. Información Requerida
- 📍 Ubicación del archivo backup
- 📊 Versión de la BD antigua (si la conoces)
- 🔑 Credenciales de PostgreSQL

---

## 🔀 **Estrategias de Migración**

Hay **3 opciones** dependiendo de la complejidad:

### **Opción 1: Migración Automática con Prisma** ⭐ RECOMENDADA

**Cuándo usar:**
- La BD antigua es de una versión relativamente reciente
- Las diferencias estructurales son manejables
- Quieres migración rápida y automática

**Proceso:**

```bash
# 1. Hacer backup de BD actual (por seguridad)
pg_dump -h localhost -U postgres suminix > backup-antes-migracion-$(date +%Y%m%d).sql

# 2. Restaurar backup antiguo en BD actual
psql -h localhost -U postgres -d suminix < backup-antiguo.sql

# 3. Aplicar TODAS las migraciones de Prisma
npx prisma migrate deploy

# 4. Verificar resultado
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count().then(c => console.log('Usuarios:', c));
prisma.inventario.count().then(c => console.log('Productos:', c));
"
```

**Ventajas:**
- ✅ Rápido (5-15 minutos)
- ✅ Automático
- ✅ Maneja la mayoría de cambios estructurales
- ✅ Reversible (tienes backup)

**Desventajas:**
- ⚠️ Puede fallar si hay cambios muy drásticos
- ⚠️ Menos control sobre el proceso

---

### **Opción 2: Migración Manual con Script** ⚙️ CONTROL TOTAL

**Cuándo usar:**
- Hay diferencias grandes entre versiones
- Necesitas transformar datos (ej: cambios de nombres de columnas)
- Quieres control total del proceso

**Proceso:**

```bash
# 1. Configurar el script
nano migrar-bd-antigua.mjs

# Editar CONFIG:
const CONFIG = {
  backupFile: '/ruta/completa/al/backup-antiguo.sql',
  
  dbAntigua: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'tu_password',
    database: 'suminix_antigua_temp'  # BD temporal
  },
  
  dbNueva: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'tu_password',
    database: 'suminix'  # BD destino
  }
};

# 2. Ejecutar migración
node migrar-bd-antigua.mjs
```

**Ventajas:**
- ✅ Control total
- ✅ Puedes transformar datos
- ✅ Maneja casos complejos
- ✅ Logs detallados

**Desventajas:**
- ⚠️ Requiere editar script según tu caso
- ⚠️ Más lento (puede tardar 30-60 minutos con millones de registros)

---

### **Opción 3: Migración Híbrida** 🔧 MEJOR DE AMBAS

**Cuándo usar:**
- La mayoría de tablas son compatibles
- Solo algunas tablas necesitan transformación

**Proceso:**

```bash
# 1. Migración base con Prisma
psql -h localhost -U postgres -d suminix < backup-antiguo.sql
npx prisma migrate deploy

# 2. Script personalizado SOLO para tablas problemáticas
node migrar-solo-tabla-X.mjs
```

---

## 🛠️ **Guía Paso a Paso: Opción 2 (Recomendada para máximo control)**

### **Paso 1: Preparación** (5 minutos)

```bash
# 1.1 Crear backup de BD actual (por seguridad)
pg_dump -h localhost -U postgres suminix > backup-seguridad-$(date +%Y%m%d-%H%M%S).sql

# 1.2 Verificar que el backup antiguo existe
ls -lh /ruta/al/backup-antiguo.sql

# 1.3 Copiar script de migración
cp migrar-bd-antigua.mjs migrar-bd-antigua-CUSTOMIZADO.mjs
```

### **Paso 2: Configurar Script** (10 minutos)

Editar `migrar-bd-antigua-CUSTOMIZADO.mjs`:

```javascript
// 1. Actualizar CONFIG con tus rutas
const CONFIG = {
  backupFile: '/Users/cristian/backups/suminix-antigua-20250101.sql',
  // ... resto de config
};

// 2. Ajustar función extraerDatosAntiguos() según tu estructura
async function extraerDatosAntiguos() {
  // Si tu BD antigua tiene nombres de tabla diferentes:
  const datos = {
    usuarios: await prismaAntigua.$queryRaw`SELECT * FROM "usuarios_old"`,
    productos: await prismaAntigua.$queryRaw`SELECT * FROM "productos_old"`,
    // ...
  };
  return datos;
}

// 3. Ajustar función transformarDatos() para mapear columnas
function transformarDatos(datosAntiguos) {
  const datosNuevos = {
    usuarios: datosAntiguos.usuarios.map(u => ({
      id: u.id,
      clave: u.codigo_antiguo,  // ← Mapeo de columna antigua
      nombre: u.nombre_completo,
      // ... más mapeos
    })),
  };
  return datosNuevos;
}
```

### **Paso 3: Ejecutar Migración** (Variable)

```bash
# Ejecutar con logs detallados
node migrar-bd-antigua-CUSTOMIZADO.mjs 2>&1 | tee migracion-$(date +%Y%m%d-%H%M%S).log

# Verás progreso en tiempo real:
# 📦 Paso 1: Restaurando backup antiguo en BD temporal...
# ✅ Backup antiguo restaurado en BD temporal
# 
# 📊 Paso 2: Extrayendo datos de BD antigua...
# ✅ Datos extraídos:
#    - 126 usuarios
#    - 505 productos
#    ...
```

### **Paso 4: Validación** (10 minutos)

```bash
# 4.1 Verificar conteos
psql -h localhost -U postgres -d suminix -c "
SELECT 
  'usuarios' as tabla, COUNT(*) as total FROM \"User\"
UNION ALL
SELECT 'productos', COUNT(*) FROM \"Inventario\"
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'proveedores', COUNT(*) FROM proveedores;
"

# 4.2 Verificar datos críticos
psql -h localhost -U postgres -d suminix -c "
SELECT id, clave, nombre, rol 
FROM \"User\" 
WHERE clave = 'TU_USUARIO'
LIMIT 1;
"

# 4.3 Probar login
npm run dev

# Ir a http://localhost:3000 e intentar iniciar sesión
```

### **Paso 5: Limpieza** (5 minutos)

```bash
# 5.1 Eliminar BD temporal (ya no se necesita)
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS suminix_antigua_temp"

# 5.2 Crear backup de BD migrada
pg_dump -h localhost -U postgres suminix > backup-post-migracion-$(date +%Y%m%d-%H%M%S).sql

# 5.3 Limpiar cache de Next.js
rm -rf .next
npx prisma generate
```

---

## 🔍 **Casos Especiales y Soluciones**

### **Caso 1: Columnas con Nombre Diferente**

**Problema:** En BD antigua la columna se llamaba `codigo`, ahora es `clave`

**Solución:**
```javascript
// En transformarDatos()
usuarios: datosAntiguos.usuarios.map(u => ({
  ...u,
  clave: u.codigo,  // Mapear columna antigua → nueva
  codigo: undefined // Eliminar columna antigua
}))
```

### **Caso 2: Columnas Nuevas que No Existen en BD Antigua**

**Problema:** BD nueva tiene columna `telefono` que no existía antes

**Solución:**
```javascript
// En transformarDatos()
clientes: datosAntiguos.clientes.map(c => ({
  ...c,
  telefono: null,  // Valor por defecto para columna nueva
  email: c.correo || null  // Con fallback
}))
```

### **Caso 3: Tablas Nuevas que No Existen en BD Antigua**

**Problema:** BD nueva tiene tabla `unidades_medida` que antes no existía

**Solución:**
```javascript
// Después de insertar datos, agregar registros por defecto
await prismaNueva.unidades_medida.createMany({
  data: [
    { id: '...', nombre: 'Pieza', abreviatura: 'pza' },
    { id: '...', nombre: 'Caja', abreviatura: 'cja' },
    // ... más unidades
  ]
});
```

### **Caso 4: Tipos de Dato Incompatibles**

**Problema:** BD antigua tenía `cantidad` como `INTEGER`, ahora es `DECIMAL`

**Solución:**
```javascript
// En transformarDatos()
productos: datosAntiguos.productos.map(p => ({
  ...p,
  cantidad: parseFloat(p.cantidad) || 0  // Convertir a decimal
}))
```

### **Caso 5: Foreign Keys Rotas**

**Problema:** Producto referencia `proveedor_id` que ya no existe

**Solución:**
```javascript
// Crear proveedor genérico ANTES de insertar productos
await prismaNueva.proveedores.create({
  data: {
    id: 'PROVEEDOR_GENERICO',
    nombre: 'Proveedor No Especificado',
    // ... más campos
  }
});

// Luego mapear productos huérfanos
productos: datosAntiguos.productos.map(p => ({
  ...p,
  proveedor_id: p.proveedor_id || 'PROVEEDOR_GENERICO'
}))
```

---

## ⚠️ **Problemas Comunes y Soluciones**

### Error: "relation does not exist"

**Causa:** BD antigua usa nombres de tabla diferentes

**Solución:**
```bash
# Ver nombres reales de tablas en backup
grep "CREATE TABLE" backup-antiguo.sql

# Actualizar queries en extraerDatosAntiguos()
```

### Error: "violates foreign key constraint"

**Causa:** Intentando insertar registro que referencia ID inexistente

**Solución:**
```javascript
// Insertar en orden correcto:
// 1. Tablas padre (sin foreign keys)
// 2. Tablas hijas (con foreign keys)

// Orden correcto:
await insertarUsuarios();
await insertarCategorias();
await insertarProveedores();
await insertarProductos();  // ← Depende de categorías y proveedores
```

### Error: "duplicate key value violates unique constraint"

**Causa:** Intentando insertar registro con ID que ya existe

**Solución:**
```javascript
// Usar upsert() en lugar de create()
await prismaNueva.inventario.upsert({
  where: { id: producto.id },
  update: producto,  // Si existe, actualizar
  create: producto   // Si no existe, crear
});
```

### Error: Out of Memory (OOM)

**Causa:** Intentando cargar millones de registros en memoria

**Solución:**
```javascript
// Procesar en lotes (batches)
const BATCH_SIZE = 1000;

for (let i = 0; i < datosAntiguos.productos.length; i += BATCH_SIZE) {
  const batch = datosAntiguos.productos.slice(i, i + BATCH_SIZE);
  
  await prismaNueva.inventario.createMany({
    data: batch,
    skipDuplicates: true
  });
  
  console.log(`Procesados ${i + batch.length} de ${datosAntiguos.productos.length}`);
}
```

---

## 📊 **Estimación de Tiempos**

| Cantidad de Registros | Opción 1 (Prisma) | Opción 2 (Script) |
|----------------------|-------------------|-------------------|
| < 10,000 | 2-5 min | 5-10 min |
| 10,000 - 100,000 | 5-15 min | 10-30 min |
| 100,000 - 1M | 15-30 min | 30-60 min |
| > 1M | 30-60 min | 1-3 horas |

**Factores que afectan el tiempo:**
- Cantidad de tablas
- Cantidad de relaciones (foreign keys)
- Complejidad de transformaciones
- Velocidad del disco

---

## ✅ **Checklist de Validación Post-Migración**

Después de migrar, verificar:

- [ ] **Usuarios**: Puedes iniciar sesión con tu usuario
- [ ] **Productos**: Todos los productos visibles en inventario
- [ ] **Clientes**: Listado completo de clientes
- [ ] **Proveedores**: Proveedores activos presentes
- [ ] **Entradas**: Historial de entradas intacto
- [ ] **Salidas**: Historial de salidas intacto
- [ ] **Lotes**: Lotes de productos (si aplica)
- [ ] **Permisos**: Roles y permisos funcionando
- [ ] **Auditoría**: Tabla `audit_log` tiene registros
- [ ] **Respaldos**: Sistema de backups configurado
- [ ] **Dashboard**: Estadísticas se muestran correctamente
- [ ] **Reportes**: Reportes generan datos correctos

```bash
# Script de validación rápida
psql -h localhost -U postgres -d suminix << EOF
SELECT 
  'User' as tabla, COUNT(*) as registros FROM "User"
UNION ALL SELECT 'Inventario', COUNT(*) FROM "Inventario"
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL SELECT 'proveedores', COUNT(*) FROM proveedores
UNION ALL SELECT 'entradas_inventario', COUNT(*) FROM entradas_inventario
UNION ALL SELECT 'salidas_inventario', COUNT(*) FROM salidas_inventario
UNION ALL SELECT 'audit_log', COUNT(*) FROM audit_log;
EOF
```

---

## 🚨 **Plan de Rollback (Por Si Algo Sale Mal)**

Si la migración falla:

```bash
# 1. Detener aplicación
# Ctrl+C en terminal donde corre npm run dev

# 2. Restaurar backup de seguridad
psql -h localhost -U postgres -c "DROP DATABASE suminix"
psql -h localhost -U postgres -c "CREATE DATABASE suminix"
psql -h localhost -U postgres -d suminix -f backup-seguridad-20251026.sql

# 3. Limpiar cache
rm -rf .next
npx prisma generate

# 4. Reiniciar aplicación
npm run dev
```

---

## 📝 **Recomendaciones Finales**

1. **SIEMPRE hacer backup antes de migrar**
   ```bash
   pg_dump suminix > backup-pre-migracion-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Probar en entorno local primero**
   - Nunca migrar directamente en producción
   - Hacer prueba en copia de BD

3. **Validar datos críticos manualmente**
   - Verificar productos más importantes
   - Verificar usuarios administradores
   - Verificar movimientos recientes

4. **Documentar cambios realizados**
   - Qué se transformó
   - Qué se agregó con valores por defecto
   - Qué se eliminó (si algo)

5. **Crear nuevo backup después de migrar**
   ```bash
   pg_dump suminix > backup-post-migracion-$(date +%Y%m%d-%H%M%S).sql
   ```

---

## 📞 **¿Necesitas Ayuda?**

Si encuentras problemas específicos:

1. **Revisa los logs** del script de migración
2. **Verifica estructura** de BD antigua:
   ```bash
   psql -d suminix_antigua_temp -c "\d+ nombre_tabla"
   ```
3. **Compara con estructura nueva**:
   ```bash
   npx prisma db pull  # Genera schema.prisma de BD actual
   ```

---

**Última actualización**: 26 de octubre de 2025  
**Versión**: 1.0.0  
**Mantenedor**: Equipo SuminixMed
