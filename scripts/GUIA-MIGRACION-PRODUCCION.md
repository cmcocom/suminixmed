# Guía de Migración Selectiva de Datos - Producción a Desarrollo

## 📋 Resumen

Esta guía te ayudará a migrar datos desde el backup de producción (`public/backup/suminix-completo-20251027-212845.sql`) a tu base de datos de desarrollo actual, **de forma selectiva y segura**.

### ✅ Lo que hace el script:
- ✅ Crea backup automático de tu BD actual antes de migrar
- ✅ Compara esquemas y migra solo columnas que coinciden
- ✅ Prioriza datos de producción sobre datos actuales
- ✅ Respeta foreign keys (orden correcto de migración)
- ✅ Permite modo dry-run para validar antes de ejecutar

### ⚠️ Lo que NO hace:
- ❌ NO sobrescribe toda la BD (migración selectiva)
- ❌ NO migra columnas que no existen en ambas bases
- ❌ NO duplica movimientos de inventario (usa INSERT IGNORE)

---

## 🚀 Pasos para Migrar

### **Paso 1: Comparar Esquemas (RECOMENDADO)**

Antes de migrar, ejecuta la comparación de esquemas para ver qué diferencias existen:

```bash
npm run migrate:compare-schemas
```

**Esto generará un reporte en:**
```
scripts/analisis/comparacion-esquemas-[timestamp].md
```

**Revisa el reporte** para entender:
- Qué columnas existen en producción pero NO en desarrollo
- Qué columnas existen en desarrollo pero NO en producción
- Qué columnas tienen tipos diferentes

---

### **Paso 2: Ejecutar Migración en Modo DRY-RUN (OBLIGATORIO PRIMERA VEZ)**

Ejecuta la migración en modo simulación para ver qué haría sin modificar nada:

```bash
npm run migrate:dry-run
```

**Esto mostrará:**
- Qué tablas se migrarán
- Cuántos registros hay en producción
- Qué columnas se migrarán (solo las coincidentes)
- Qué columnas se omitirán (no coinciden)

**NO SE MODIFICARÁ LA BASE DE DATOS** en este paso.

---

### **Paso 3: Crear Backup Manual (OPCIONAL pero RECOMENDADO)**

Aunque el script crea backup automático, puedes hacer uno manual:

```bash
npm run migrate:backup
```

El backup se guardará en:
```
backups/desarrollo-manual-[timestamp].sql
```

---

### **Paso 4: Ejecutar Migración REAL**

Una vez validado todo con dry-run, ejecuta la migración real:

```bash
npm run migrate:execute
```

**⚠️ ADVERTENCIA:** Esto modificará tu base de datos actual.

**El script hará:**
1. Backup automático de BD actual
2. Crear BD temporal
3. Restaurar backup de producción en BD temporal
4. Migrar datos tabla por tabla
5. Eliminar BD temporal

---

## 📊 Tablas que se Migrarán

### **Fase 1: Catálogos (UPSERT - sobrescribe si existe)**
- `categorias` (12 registros)
- `unidades_medida`
- `proveedores` (4 registros)

### **Fase 2: Usuarios y Empleados (UPSERT)**
- `User` (126 usuarios)
- `empleados`
- `clientes` (202 clientes)

### **Fase 3: Inventario (UPSERT CUSTOM)**
- `Inventario` (505 productos)
  - **NOTA:** Preserva cantidad actual si difiere de producción

### **Fase 4: Movimientos (INSERT IGNORE - NO sobrescribe)**
- `entradas_inventario` (441 entradas)
- `partidas_entrada_inventario` (675 partidas)
- `salidas_inventario` (609 salidas)
- `partidas_salida_inventario` (6,915 partidas)

---

## 🔧 Opciones Avanzadas

### **Forzar ejecución sin backup automático (NO RECOMENDADO)**
```bash
npm run migrate:execute -- --skip-backup
```

### **Modo verbose (logs detallados)**
```bash
npm run migrate:execute -- --verbose
```

### **Forzar sin confirmación**
```bash
npm run migrate:execute -- --force
```

---

## 📝 Logs y Reportes

### **Logs de migración:**
```
scripts/logs/migracion-[fecha].log
```

### **Reportes de comparación:**
```
scripts/analisis/comparacion-esquemas-[timestamp].md
```

### **Backups automáticos:**
```
backups/desarrollo-pre-migracion-[timestamp].sql
```

---

## ⚠️ Problemas Comunes y Soluciones

### **Error: "Base de datos temporal ya existe"**
```bash
# Eliminar manualmente
psql -U postgres -c "DROP DATABASE IF EXISTS suminix_produccion_temp"
```

### **Error: "Extensión dblink no disponible"**
```bash
# Instalar extensión en PostgreSQL
psql -U postgres -d suminix -c "CREATE EXTENSION IF NOT EXISTS dblink"
```

### **Error: "Archivo de backup no encontrado"**
Verifica que exista:
```bash
ls -lh public/backup/suminix-completo-20251027-212845.sql
```

### **Error: "Sin permisos para crear BD"**
Asegúrate de tener permisos de superusuario en PostgreSQL.

---

## 🔍 Validación Post-Migración

Después de migrar, valida los datos:

### **1. Verificar conteos de registros**
```sql
SELECT 
  'User' as tabla, COUNT(*) as total FROM "User"
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'Inventario', COUNT(*) FROM "Inventario"
UNION ALL
SELECT 'entradas_inventario', COUNT(*) FROM entradas_inventario
UNION ALL
SELECT 'salidas_inventario', COUNT(*) FROM salidas_inventario;
```

### **2. Verificar foreign keys**
```sql
-- Clientes sin usuario válido
SELECT COUNT(*) FROM clientes 
WHERE id_usuario IS NOT NULL 
AND id_usuario NOT IN (SELECT id FROM "User");

-- Productos sin categoría válida
SELECT COUNT(*) FROM "Inventario" 
WHERE categoria_id IS NOT NULL 
AND categoria_id NOT IN (SELECT id FROM categorias);
```

### **3. Verificar datos críticos**
```sql
-- Productos con inventario
SELECT COUNT(*) FROM "Inventario" WHERE cantidad > 0;

-- Movimientos del último mes
SELECT COUNT(*) FROM salidas_inventario 
WHERE fecha_salida >= CURRENT_DATE - INTERVAL '30 days';
```

---

## 🎯 Estrategias de Migración por Tabla

### **UPSERT (sobrescribe si existe)**
Usado en: `categorias`, `proveedores`, `User`, `empleados`, `clientes`

**Comportamiento:**
```sql
INSERT INTO tabla (columnas...) VALUES (valores...)
ON CONFLICT (id) DO UPDATE SET columnas = nuevos_valores
```
- Si el registro existe (mismo ID), se actualiza
- Si no existe, se inserta
- **Los datos de producción PREVALECEN**

### **UPSERT_CUSTOM (preserva campos específicos)**
Usado en: `Inventario`

**Comportamiento especial:**
```sql
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  precio = EXCLUDED.precio,
  -- ... otros campos ...
  cantidad = CASE 
    WHEN Inventario.cantidad != EXCLUDED.cantidad 
    THEN Inventario.cantidad  -- Preserva cantidad actual
    ELSE EXCLUDED.cantidad 
  END
```
- Actualiza metadatos del producto (nombre, precio, etc.)
- **Preserva la cantidad actual** si difiere de producción

### **INSERT IGNORE (no sobrescribe)**
Usado en: `entradas_inventario`, `salidas_inventario`, `partidas_*`

**Comportamiento:**
```sql
INSERT INTO tabla (columnas...) VALUES (valores...)
ON CONFLICT (id) DO NOTHING
```
- Si el registro existe, NO hace nada
- Solo inserta registros nuevos
- Útil para movimientos históricos

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en `scripts/logs/`
2. Ejecuta `npm run migrate:compare-schemas` para ver diferencias
3. Ejecuta `npm run migrate:dry-run` para simular sin cambios
4. Verifica que el backup de producción esté en la ruta correcta

---

## ✅ Checklist Pre-Migración

Antes de ejecutar la migración real:

- [ ] Ejecuté `npm run migrate:compare-schemas` y revisé el reporte
- [ ] Ejecuté `npm run migrate:dry-run` y validé la salida
- [ ] Tengo backup manual de la BD actual (opcional pero recomendado)
- [ ] Verifiqué que el backup de producción existe
- [ ] Tengo permisos de superusuario en PostgreSQL
- [ ] Entiendo qué tablas se migrarán y cómo
- [ ] Tengo espacio suficiente en disco (~8MB para BD temporal)

---

**Fecha de creación:** 27 de octubre de 2025  
**Versión:** 1.0  
**Autor:** Sistema SuminixMed
