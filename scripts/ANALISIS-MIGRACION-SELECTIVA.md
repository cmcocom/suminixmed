# Análisis de Migración Selectiva de Datos - Producción a Desarrollo

## 📋 Resumen Ejecutivo

**Fecha:** 27 de octubre de 2025  
**Objetivo:** Migrar datos de producción a base de datos de desarrollo de forma selectiva  
**Backup Producción:** `public/backup/suminix-completo-20251027-212845.sql` (8.18 MB)  
**Estrategia:** Migración selectiva por columnas con prioridad a datos de producción

---

## 🎯 Datos a Migrar (Prioridad)

### 1️⃣ **CATÁLOGOS BASE** (Alta Prioridad)
| Tabla | Registros Prod | Columnas Clave | Estrategia |
|-------|----------------|----------------|------------|
| `categorias` | 12 | id, nombre, descripcion, activo | UPSERT completo |
| `unidades_medida` | N/A | id, nombre, simbolo, activo | UPSERT completo |
| `proveedores` | 4 | id, nombre, rfc, contacto, email, telefono, direccion | UPSERT completo |

### 2️⃣ **USUARIOS Y EMPLEADOS** (Alta Prioridad)
| Tabla | Registros Prod | Columnas Clave | Estrategia |
|-------|----------------|----------------|------------|
| `User` | 126 | id, clave, name, email, password, activo, is_system_user | UPSERT (excluir sessions) |
| `empleados` | N/A | id, user_id, numero_empleado, nombre, cargo, servicio | UPSERT completo |

### 3️⃣ **CLIENTES** (Alta Prioridad)
| Tabla | Registros Prod | Columnas Clave | Estrategia |
|-------|----------------|----------------|------------|
| `clientes` | 202 | id, nombre, email, telefono, rfc, empresa, medico_tratante, especialidad | UPSERT completo |

### 4️⃣ **PRODUCTOS E INVENTARIO** (Crítico)
| Tabla | Registros Prod | Columnas Clave | Estrategia |
|-------|----------------|----------------|------------|
| `Inventario` | 505 | id, nombre, descripcion, categoria_id, cantidad, precio, unidad_medida_id, clave, clave2 | UPSERT (preservar cantidad actual si difiere) |

### 5️⃣ **MOVIMIENTOS DE INVENTARIO** (Crítico - Histórico)
| Tabla | Registros Prod | Columnas Clave | Estrategia |
|-------|----------------|----------------|------------|
| `entradas_inventario` | 441 | id, folio, fecha_entrada, motivo, total, estado | INSERT IGNORE duplicados |
| `salidas_inventario` | 609 | id, folio, fecha_salida, motivo_salida, total | INSERT IGNORE duplicados |
| `partidas_entrada_inventario` | 675 | id, entrada_inventario_id, producto_id, cantidad, precio_unitario | INSERT IGNORE duplicados |
| `partidas_salida_inventario` | 6,915 | id, salida_inventario_id, producto_id, cantidad | INSERT IGNORE duplicados |

---

## ⚠️ PROBLEMAS POTENCIALES DETECTADOS

### 🔴 **Diferencias de Esquema entre Producción y Desarrollo**

El esquema actual (desarrollo) tiene **columnas nuevas** que la producción NO tiene:

#### **Tabla: `Inventario`**
```prisma
// Columnas que pueden NO existir en producción:
- cantidad_maxima          Int       @default(0)
- cantidad_minima          Int       @default(0)
- dias_reabastecimiento    Int       @default(7)
- punto_reorden            Int       @default(0)
- ubicacion_general        String?
- clave                    String?   @unique
- clave2                   String?   @unique
```

#### **Tabla: `clientes`**
```prisma
// Columnas que pueden NO existir en producción:
- medico_tratante          String?
- especialidad             String?
- localidad                String?
- estado                   String?
- pais                     String?
- codigo_postal            String?
- clave                    String?
```

#### **Tabla: `User`**
```prisma
// Columnas que pueden NO existir en producción:
- is_system_user           Boolean   @default(false)
- clave                    String    @unique
- telefono                 String?
```

### 🟡 **Relaciones y Dependencias**

**Orden de importación CRÍTICO** (por foreign keys):
1. `categorias`
2. `unidades_medida`
3. `proveedores`
4. `User` (sin dependencias)
5. `empleados` (depende de User)
6. `clientes` (puede depender de User si `id_usuario` está poblado)
7. `Inventario` (depende de categorias, unidades_medida)
8. `entradas_inventario` (depende de User)
9. `partidas_entrada_inventario` (depende de entradas_inventario, Inventario)
10. `salidas_inventario` (depende de User, clientes)
11. `partidas_salida_inventario` (depende de salidas_inventario, Inventario)

---

## 🛠️ ESTRATEGIA DE MIGRACIÓN RECOMENDADA

### **Fase 1: PREPARACIÓN** ✅
1. ✅ **Backup completo de BD actual** (desarrollo)
   ```bash
   pg_dump -h localhost -p 5432 -U postgres -d suminix \
     -f backups/desarrollo-pre-migracion-$(date +%Y%m%d-%H%M%S).sql
   ```

2. ✅ **Crear base de datos temporal** para extracción
   ```bash
   createdb -U postgres suminix_produccion_temp
   ```

3. ✅ **Restaurar backup de producción en BD temporal**
   ```bash
   psql -U postgres -d suminix_produccion_temp \
     -f public/backup/suminix-completo-20251027-212845.sql
   ```

### **Fase 2: ANÁLISIS DE ESQUEMA** 🔍
4. **Comparar esquemas** entre `suminix_produccion_temp` y `suminix` (actual)
   ```bash
   # Script que compara columnas de cada tabla
   npm run scripts:compare-schemas
   ```

5. **Generar mapeo automático** de columnas coincidentes

### **Fase 3: MIGRACIÓN SELECTIVA** 🚀
6. **Ejecutar script de migración** tabla por tabla
   - Usa solo columnas que existen en AMBAS bases
   - Prioridad a datos de producción (ON CONFLICT UPDATE)
   - Validar foreign keys antes de insertar

7. **Validar integridad** post-migración
   - Verificar conteos de registros
   - Validar foreign keys
   - Probar queries principales

### **Fase 4: LIMPIEZA** 🧹
8. **Eliminar BD temporal** de producción
   ```bash
   dropdb -U postgres suminix_produccion_temp
   ```

---

## 📝 SCRIPT DE MIGRACIÓN PROPUESTO

### **Características del Script:**
- ✅ Detecta automáticamente columnas coincidentes
- ✅ Maneja diferencias de esquema sin errores
- ✅ Prioriza datos de producción sobre desarrollo
- ✅ Respeta foreign keys (orden correcto)
- ✅ Genera logs detallados de migración
- ✅ Permite rollback con backup automático
- ✅ Modo dry-run para validar antes de ejecutar

### **Tablas a Migrar (en orden):**
```javascript
const TABLAS_MIGRACION = [
  // Catálogos base (sin dependencias)
  { nombre: 'categorias', modo: 'UPSERT' },
  { nombre: 'unidades_medida', modo: 'UPSERT' },
  { nombre: 'proveedores', modo: 'UPSERT' },
  
  // Usuarios
  { nombre: 'User', modo: 'UPSERT', excluir: ['Session', 'Account'] },
  { nombre: 'empleados', modo: 'UPSERT' },
  { nombre: 'clientes', modo: 'UPSERT' },
  
  // Inventario
  { nombre: 'Inventario', modo: 'UPSERT_CUSTOM', 
    nota: 'Preservar cantidad actual si difiere' },
  
  // Movimientos (histórico - no sobrescribir)
  { nombre: 'entradas_inventario', modo: 'INSERT_IGNORE' },
  { nombre: 'partidas_entrada_inventario', modo: 'INSERT_IGNORE' },
  { nombre: 'salidas_inventario', modo: 'INSERT_IGNORE' },
  { nombre: 'partidas_salida_inventario', modo: 'INSERT_IGNORE' },
];
```

---

## ⚙️ CONFIGURACIÓN RECOMENDADA

### **Variables de entorno necesarias:**
```env
# BD Actual (desarrollo)
DATABASE_URL="postgresql://postgres:password@localhost:5432/suminix"

# BD Producción Temporal
DATABASE_URL_PROD_TEMP="postgresql://postgres:password@localhost:5432/suminix_produccion_temp"

# Opciones de migración
MIGRACION_DRY_RUN=false
MIGRACION_BACKUP_AUTO=true
MIGRACION_LOG_LEVEL=verbose
```

---

## 🎯 PRÓXIMOS PASOS

1. **Revisar este análisis** y validar tablas a migrar
2. **Ejecutar script de comparación de esquemas** (próximo a crear)
3. **Validar con dry-run** antes de migración real
4. **Ejecutar migración** en horario de baja actividad
5. **Validar resultados** con queries de verificación
6. **Documentar discrepancias** encontradas

---

## 📞 NOTAS IMPORTANTES

- ⚠️ **NO ejecutar en horario laboral** (riesgo de downtime)
- ⚠️ **Siempre hacer backup** antes de migración
- ⚠️ **Probar en dry-run** primero
- ⚠️ **Validar foreign keys** después de cada tabla
- ⚠️ **Monitorear espacio en disco** (BD temporal requiere ~8MB adicionales)

---

**Creado:** 27 de octubre de 2025  
**Autor:** Sistema de Migración SuminixMed  
**Versión:** 1.0
