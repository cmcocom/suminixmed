# 📖 GUÍA RÁPIDA - SISTEMA RESTAURADO

**Sistema:** SuminixMed - Sistema de Gestión de Inventario Médico  
**Fecha de restauración:** 17 de octubre de 2025  
**Estado:** ✅ OPERATIVO

---

## 🚀 INICIO RÁPIDO

### Verificar que todo funciona

```bash
# Validación rápida del sistema
./scripts/validar-sistema.sh
```

Esto mostrará:
- ✅ Estado de conexión a PostgreSQL
- 📊 Conteo de todos los registros
- 💾 Información del último backup

---

## 📊 DATOS DISPONIBLES

El sistema contiene **3,766 registros** restaurados:

| Categoría | Cantidad |
|-----------|----------|
| Productos | 505 |
| Usuarios | 126 |
| Clientes | 199 |
| Entradas | 413 |
| Salidas | 154 |
| Empleados | 123 |
| Almacenes | 1 |
| Proveedores | 4 |

---

## 🛠️ SCRIPTS ÚTILES

### 1. Validación Rápida
```bash
./scripts/validar-sistema.sh
```
Verifica que la base de datos esté funcionando correctamente.

### 2. Resumen Completo
```bash
node scripts/resumen-final-completo.mjs
```
Muestra estadísticas detalladas de todos los datos.

### 3. Verificación de Integridad
```bash
node scripts/verificar-integridad-completa.mjs
```
Ejecuta una verificación profunda de integridad referencial.

### 4. Crear Nuevo Backup
```bash
./scripts/crear-backup-post-restauracion.sh
```
Genera un nuevo backup comprimido de la base de datos.

---

## 💾 GESTIÓN DE BACKUPS

### Backup Actual

El backup más reciente está en:
```
backups/suminix_backup_post_restauracion_20251017_055741.sql.gz
```

- **Tamaño:** 165 KB (comprimido)
- **Contiene:** 3,785 registros totales
- **Integridad:** ✅ Verificada

### Restaurar desde Backup

Si necesitas restaurar la base de datos:

```bash
# 1. Descomprimir y restaurar (usar variable de entorno para contraseña)
gunzip -c backups/suminix_backup_post_restauracion_20251017_055741.sql.gz | \
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U postgres -d suminix
```

> ⚠️ **Seguridad:** Nunca hardcodear contraseñas. Usar variables de entorno.

### Crear Backup Manual

```bash
# Ejecutar el script de backup
./scripts/crear-backup-post-restauracion.sh
```

Esto creará un nuevo archivo en `backups/` con:
- Fecha y hora en el nombre
- Compresión automática
- Verificación de integridad

---

## 📁 DOCUMENTACIÓN DISPONIBLE

| Documento | Descripción |
|-----------|-------------|
| **RESUMEN-EJECUTIVO.md** | 📄 Resumen general del sistema |
| **INFORME-FINAL-VERIFICACION-Y-BACKUP.md** | 📊 Informe completo de verificación |
| **RESTAURACION-HISTORIAL-COMPLETA.md** | 📝 Detalle de Fase 1 (historial) |
| **RESTAURACION-CATALOGOS-COMPLETA.md** | 📝 Detalle de Fase 2 (catálogos) |
| **GUIA-RAPIDA.md** | 📖 Este documento |

---

## 🔍 CONSULTAS COMUNES

> **Nota de seguridad:** En todos los ejemplos, usar `PGPASSWORD="${DB_PASSWORD}"` donde `DB_PASSWORD` es una variable de entorno configurada previamente.

### Verificar Stock de un Producto

```bash
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U postgres -d suminix -c \
"SELECT clave, descripcion, cantidad FROM \"Inventario\" WHERE clave = '018';"
```

### Ver Últimas Entradas

```bash
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U postgres -d suminix -c \
"SELECT id, motivo, estado, fecha_creacion FROM entradas_inventario 
 ORDER BY fecha_creacion DESC LIMIT 10;"
```

### Ver Últimas Salidas

```bash
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U postgres -d suminix -c \
"SELECT id, motivo, estado, fecha_creacion FROM salidas_inventario 
 ORDER BY fecha_creacion DESC LIMIT 10;"
```

### Ver Empleados

```bash
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U postgres -d suminix -c \
"SELECT numero_empleado, nombre, cargo, activo FROM empleados LIMIT 10;"
```

---

## ⚙️ MANTENIMIENTO

### Backups Automáticos (Recomendado)

Agregar a crontab para backup diario a las 2:00 AM:

```bash
# Editar crontab
crontab -e

# Agregar esta línea
0 2 * * * cd /Users/cristian/www/suminixmed && ./scripts/crear-backup-post-restauracion.sh >> logs/backup.log 2>&1
```

### Limpiar Backups Antiguos

Para mantener solo los últimos 7 días:

```bash
find backups/ -name "suminix_backup_*.sql.gz" -mtime +7 -delete
```

### Verificar Espacio en Disco

```bash
du -sh backups/
df -h .
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error de Conexión a PostgreSQL

```bash
# Verificar que PostgreSQL esté corriendo
brew services list | grep postgresql

# Iniciar PostgreSQL si está detenido
brew services start postgresql
```

### Verificar Integridad de la Base de Datos

```bash
# Ejecutar verificación completa
node scripts/verificar-integridad-completa.mjs
```

Esto verificará:
- ✅ Integridad referencial
- ✅ Datos huérfanos
- ✅ Referencias válidas
- ✅ Fechas correctas

### Base de Datos Corrupta

Si hay problemas graves, restaurar desde el backup:

```bash
# 1. Crear backup de seguridad del estado actual
./scripts/crear-backup-post-restauracion.sh

# 2. Restaurar desde backup conocido bueno
gunzip -c backups/suminix_backup_post_restauracion_20251017_055741.sql.gz | \
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U postgres -d suminix
```

---

## 📞 INFORMACIÓN ADICIONAL

### Conexión a la Base de Datos

```
Host:     localhost
Puerto:   5432
Usuario:  postgres
Base:     suminix
```

### Estadísticas Clave

- **Stock total:** 333,388 unidades
- **Movimientos totales:** 567 (413 entradas + 154 salidas)
- **Usuarios activos:** 126
- **Empleados vinculados:** 123/123 (100%)

---

## ✅ CHECKLIST POST-RESTAURACIÓN

- [x] Base de datos restaurada
- [x] Integridad verificada
- [x] Backup creado
- [x] Documentación generada
- [x] Scripts de validación disponibles
- [ ] Backups automáticos configurados (recomendado)
- [ ] Monitoreo de espacio en disco (recomendado)
- [ ] Revisar 15 salidas con fecha futura

---

## 🎯 PRÓXIMOS PASOS

1. **Configurar backups automáticos** (ver sección Mantenimiento)
2. **Revisar las 15 salidas con fecha futura**
3. **Programar limpieza de backups antiguos**
4. **Considerar almacenamiento externo para backups**

---

**✅ SISTEMA LISTO PARA USO EN PRODUCCIÓN**

Para más detalles, consulta la documentación completa en los archivos `.md` de la raíz del proyecto.

---

**Última actualización:** 17 de octubre de 2025  
**Versión:** 1.0
