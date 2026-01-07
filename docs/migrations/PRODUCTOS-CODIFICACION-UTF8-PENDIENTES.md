# Productos con Problemas de Codificación UTF-8 - PENDIENTES DE CORRECCIÓN

**Fecha de Detección**: 5 de noviembre de 2025  
**Estado**: Pendiente de corrección después de migración  
**Total de productos afectados**: 11

## 🔍 Problemas Identificados

### 1. "PAALES" → Debe ser "PAÑALES" (3 productos)
```sql
-- Productos afectados:
PROD-00155 (clave: 6810034): "PAALES DE FORMA ANATOMICA CHICOS"
PROD-00156 (clave: 6810042): "PAALES DE FORMA ANATOMICA MEDIANOS"  
PROD-00157 (clave: 6810067): "PAALES PREDOBLADOS DESECHABLE. ADULTO"
```

### 2. "TAMAO" → Debe ser "TAMAÑO" (2 productos)
```sql
-- Productos afectados:
PROD-00415 (clave: 130): "LIGADURA EN FRIO HEMOLOOK TAMAO L MORADO"
PROD-00416 (clave: 131): "LIGADURA EN FRIO HEMOLOOK TAMAO XG DORADO"
```

### 3. "CUTANEO" → Debe ser "CUTÁNEO" (6 productos)
```sql
-- Productos afectados:
PROD-00348 (clave: 063): "CATETER EPICUTANEO 1 FR 1 LUMEN"
PROD-00349 (clave: 064): "CATETER EPICUTANEO 2FR 1 LUMEN"
PROD-00350 (clave: 065): "CATETER EPICUTANEO 2FR 2 LUMEN"
PROD-00351 (clave: 066): "CATETER EPICUTANEO 3FR 1 LUMEN"
PROD-00069 (clave: 1678782): "CATETER VENOSO SUBCUTANEO IMP. 5 FR"
PROD-00160 (clave: 5004750001): "PROTECTOR CUTANEO SPRAY 28 ML"
```

## 📝 Script SQL de Corrección (EJECUTAR DESPUÉS DE MIGRACIÓN)

```sql
-- CORRECCIONES DE CODIFICACIÓN UTF-8 EN PRODUCTOS
-- Ejecutar después de completar la migración

BEGIN;

-- Backup de seguridad antes de correcciones
CREATE TEMP TABLE inventario_backup_encoding AS 
SELECT id, nombre, descripcion FROM "Inventario" 
WHERE nombre ~ 'PAALES|TAMAO|CUTANEO';

-- Corrección 1: PAALES → PAÑALES
UPDATE "Inventario" 
SET nombre = REPLACE(nombre, 'PAALES', 'PAÑALES'),
    descripcion = REPLACE(descripcion, 'PAALES', 'PAÑALES')
WHERE nombre LIKE '%PAALES%' OR descripcion LIKE '%PAALES%';

-- Corrección 2: TAMAO → TAMAÑO  
UPDATE "Inventario"
SET nombre = REPLACE(nombre, 'TAMAO', 'TAMAÑO'),
    descripcion = REPLACE(descripcion, 'TAMAO', 'TAMAÑO')
WHERE nombre LIKE '%TAMAO%' OR descripcion LIKE '%TAMAO%';

-- Corrección 3: CUTANEO → CUTÁNEO
UPDATE "Inventario"
SET nombre = REPLACE(nombre, 'CUTANEO', 'CUTÁNEO'),
    descripcion = REPLACE(descripcion, 'CUTANEO', 'CUTÁNEO')
WHERE nombre LIKE '%CUTANEO%' OR descripcion LIKE '%CUTANEO%';

-- Verificación de resultados
SELECT 
    'Productos corregidos' as tipo,
    COUNT(*) as cantidad
FROM "Inventario" 
WHERE nombre ~ 'PAÑALES|TAMAÑO|CUTÁNEO'

UNION ALL

SELECT 
    'Productos pendientes' as tipo,  
    COUNT(*) as cantidad
FROM "Inventario"
WHERE nombre ~ 'PAALES|TAMAO|CUTANEO';

COMMIT;
```

## 🔄 Proceso de Validación Post-Corrección

```sql
-- Verificar que las correcciones se aplicaron correctamente
SELECT id, clave, nombre, descripcion 
FROM "Inventario" 
WHERE id IN (
    'PROD-00155', 'PROD-00156', 'PROD-00157',  -- PAÑALES
    'PROD-00415', 'PROD-00416',                -- TAMAÑO
    'PROD-00348', 'PROD-00349', 'PROD-00350', 'PROD-00351', -- CUTÁNEO
    'PROD-00069', 'PROD-00160'                 -- CUTÁNEO adicionales
)
ORDER BY id;
```

## 📋 Checklist de Ejecución

- [ ] Migración de base de datos completada
- [ ] Respaldo de productos afectados creado
- [ ] Script de corrección ejecutado
- [ ] Validación de resultados completada
- [ ] Verificación en interfaz de usuario
- [ ] Documentación actualizada

## 🎯 Impacto Esperado

**Antes de la corrección:**
- ❌ "PAALES DE FORMA ANATOMICA CHICOS"
- ❌ "LIGADURA EN FRIO HEMOLOOK TAMAO L MORADO"
- ❌ "CATETER EPICUTANEO 1 FR 1 LUMEN"

**Después de la corrección:**
- ✅ "PAÑALES DE FORMA ANATOMICA CHICOS"
- ✅ "LIGADURA EN FRIO HEMOLOOK TAMAÑO L MORADO" 
- ✅ "CATETER EPICUTÁNEO 1 FR 1 LUMEN"

---

**Nota**: Este documento debe ser revisado y ejecutado únicamente DESPUÉS de completar la migración de la base de datos para evitar que los cambios se pierdan durante el proceso de migración.