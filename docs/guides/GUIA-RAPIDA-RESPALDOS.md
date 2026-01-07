# Guía Rápida: Sistema de Respaldos de Base de Datos

## 🎯 Acceso al Sistema

**Ruta:** Dashboard → Ajustes → Respaldos de Base de Datos

**URL directa:** `/dashboard/ajustes/respaldos`

**Permiso requerido:** `AJUSTES.GESTIONAR_RESPALDOS`

---

## 📝 Crear un Respaldo

1. **Acceder** a la página de respaldos
2. **Escribir** una descripción (opcional pero recomendado)
   - Ejemplo: "Respaldo antes de actualización del sistema"
3. **Clic** en botón "Crear Respaldo"
4. **Esperar** confirmación (notificación verde)
5. El nuevo respaldo aparece en la lista automáticamente

**Tiempo estimado:** 5-30 segundos (depende del tamaño de la BD)

---

## 💾 Descargar un Respaldo

1. **Localizar** el respaldo en la lista
2. **Clic** en botón "Descargar" (⬇️)
3. El archivo `.sql` se descarga a tu computadora

**Formato del archivo:** `backup-2025-01-08T10-30-00.sql`

**Uso del archivo:** Puedes usarlo con herramientas como pgAdmin, DBeaver, o la línea de comandos de PostgreSQL

---

## 🔄 Restaurar un Respaldo

### ⚠️ IMPORTANTE - Leer antes de continuar:

- ❌ **NUNCA restaurar en producción sin crear un respaldo actual primero**
- ❌ La restauración **ELIMINA TODA la base de datos actual**
- ❌ Todos los usuarios serán desconectados
- ❌ Los cambios realizados después del respaldo **SE PERDERÁN**

### Pasos:

1. **Crear** un respaldo de la BD actual (por seguridad)
2. **Localizar** el respaldo que deseas restaurar
3. **Clic** en botón "Restaurar" (🔄)
4. **Leer** las advertencias en el modal
5. **Confirmar** la restauración
6. **Esperar** (proceso automático, puede tardar 1-2 minutos)
7. La página se recargará automáticamente

**Proceso automático:**
- Termina todas las conexiones a la BD
- Elimina la base de datos actual
- Crea una nueva base de datos
- Restaura el contenido del archivo .sql

---

## 🗑️ Eliminar un Respaldo

1. **Localizar** el respaldo a eliminar
2. **Clic** en botón "Eliminar" (🗑️)
3. **Confirmar** la acción
4. El respaldo desaparece de la lista

**Nota:** Esta acción **NO se puede deshacer**

---

## 📊 Información Mostrada

### Panel Superior (Tarjetas)

- **Nombre de la BD:** Nombre de la base de datos activa
- **Tamaño:** Espacio ocupado en disco (en MB)
- **Tablas:** Número total de tablas en la BD
- **Conexiones:** Usuarios conectados actualmente

### Lista de Respaldos

Cada respaldo muestra:

- **Nombre del archivo:** Identificador único del respaldo
- **Fecha y hora:** Cuándo se creó el respaldo
- **Tamaño:** Espacio que ocupa el archivo
- **Tablas:** Cuántas tablas se respaldaron
- **Creado por:** Usuario que creó el respaldo
- **Descripción:** Nota personalizada del respaldo

---

## ✅ Buenas Prácticas

### Cuándo crear respaldos:

1. **Antes de actualizaciones** del sistema
2. **Antes de cambios importantes** en la estructura de datos
3. **Regularmente** (diario/semanal según criticidad)
4. **Antes de restaurar** otro respaldo (por seguridad)
5. **Después de migraciones** de datos importantes

### Nombres descriptivos:

- ✅ "Respaldo pre-actualización 2.0"
- ✅ "Antes de migrar productos"
- ✅ "Estado estable - 8 Enero 2025"
- ❌ "backup 1"
- ❌ "test"

### Gestión de espacio:

- Elimina respaldos antiguos que ya no necesites
- Descarga respaldos importantes a almacenamiento externo
- Considera mantener solo los últimos 30 días

---

## 🚨 En Caso de Error

### "No se pudo crear el respaldo"

**Posibles causas:**
- PostgreSQL no está corriendo
- Sin permisos en directorio /backups/
- Espacio en disco insuficiente

**Solución:**
1. Verifica que PostgreSQL esté activo
2. Contacta al administrador del sistema

### "Error al restaurar"

**Posibles causas:**
- Archivo de respaldo corrupto
- Conexiones activas no terminadas

**Solución:**
1. Descarga el archivo y verifica que no esté vacío
2. Reinicia el servidor Next.js
3. Intenta nuevamente

### "No aparecen los respaldos"

**Posibles causas:**
- Directorio /backups/ vacío
- Sin permisos de lectura

**Solución:**
1. Verifica que existan archivos .sql en /backups/
2. Contacta al administrador del sistema

---

## 🔐 Seguridad

- ✅ Solo usuarios con permiso `GESTIONAR_RESPALDOS` pueden acceder
- ✅ Todos los respaldos incluyen nombre del usuario que los creó
- ✅ Los archivos de respaldo NO se suben a Git (están en .gitignore)
- ✅ Se requiere autenticación para todas las operaciones

---

## 📋 Casos de Uso Comunes

### Caso 1: Actualización del Sistema

```
1. Crear respaldo → "Pre-actualización v2.0"
2. Realizar actualización del sistema
3. Si hay problemas → Restaurar respaldo
4. Si todo va bien → Mantener respaldo por 30 días
```

### Caso 2: Migración de Datos

```
1. Crear respaldo → "Antes de migrar empleados"
2. Ejecutar script de migración
3. Verificar datos migrados
4. Si hay errores → Restaurar y corregir script
5. Si todo OK → Crear nuevo respaldo "Post-migración exitosa"
```

### Caso 3: Recuperación de Datos Eliminados

```
1. Identificar cuándo se eliminaron los datos
2. Buscar respaldo anterior a esa fecha
3. Descargar respaldo para revisión
4. Si necesario → Restaurar respaldo completo
5. Crear nuevo respaldo del estado actual
```

### Caso 4: Pruebas de Desarrollo

```
1. Crear respaldo → "Estado base para pruebas"
2. Realizar pruebas/cambios
3. Revisar resultados
4. Restaurar estado base
5. Repetir con diferentes configuraciones
```

---

## 🎯 Checklist de Mantenimiento

### Semanal

- [ ] Revisar lista de respaldos
- [ ] Eliminar respaldos obsoletos
- [ ] Verificar espacio en disco

### Mensual

- [ ] Descargar respaldos importantes
- [ ] Probar restauración en ambiente de desarrollo
- [ ] Documentar estado del sistema

### Antes de Producción

- [ ] Crear respaldo con descripción clara
- [ ] Descargar respaldo localmente
- [ ] Verificar que el respaldo se creó correctamente
- [ ] Tener plan de rollback listo

---

## 📞 Contacto

Para problemas o dudas:

1. Revisar esta guía
2. Consultar `SISTEMA-RESPALDOS-COMPLETADO.md` (documentación técnica)
3. Contactar al equipo de desarrollo

---

**Versión:** 1.0.0  
**Última actualización:** 8 de Enero de 2025
