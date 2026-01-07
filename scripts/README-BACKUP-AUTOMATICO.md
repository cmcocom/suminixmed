# Sistema de Respaldo Automático Diario - SuminixMed

Sistema automatizado de respaldo completo de la base de datos PostgreSQL que se ejecuta **diariamente a las 00:05**.

## 📋 Características

✅ **Respaldo automático diario** a las 00:05 AM  
✅ **Formato .backup** (PostgreSQL custom format comprimido)  
✅ **Verificación de integridad** automática después de cada backup  
✅ **Retención de 30 días** - elimina automáticamente backups antiguos  
✅ **Log detallado** de todas las operaciones  
✅ **Nombre descriptivo**: `backup-automatico-sistema-YYYY-MM-DD_HH-mm-ss.backup`  

## 🚀 Instalación

### Paso 1: Configurar contraseña de PostgreSQL

Edita el archivo `scripts/backup-automatico-diario.ps1` y verifica la línea 13:

```powershell
$DB_PASSWORD = "postgres"  # CAMBIAR SI ES DIFERENTE
```

Si tu contraseña de PostgreSQL es diferente a "postgres", cámbiala aquí.

**NOTA**: El script detecta automáticamente la versión de PostgreSQL instalada (12, 13, 14, 15, 16 o 17).

### Paso 2: Instalar la tarea programada

1. **Clic derecho** en `scripts/instalar-backup-automatico.bat`
2. Selecciona **"Ejecutar como administrador"**
3. Espera el mensaje de confirmación

Verás algo como:
```
========================================
INSTALACION COMPLETADA EXITOSAMENTE
========================================

Configuracion:
  Nombre tarea: SuminixMed-Backup-Diario
  Frecuencia:   Diaria a las 00:05
  Script:       C:\UA-ISSSTE\suminixmed\scripts\backup-automatico-diario.ps1
  Destino:      C:\UA-ISSSTE\suminixmed\backups
  Retencion:    30 dias
```

## 🧪 Probar el Sistema

### Opción 1: Verificar instalación

Doble clic en: `scripts/verificar-backup-automatico.bat`

Esto verificará:
- ✅ Scripts instalados correctamente
- ✅ PostgreSQL detectado
- ✅ Tarea programada activa
- ✅ Backups existentes

### Opción 2: Ejecutar backup manual

Doble clic en: `scripts/ejecutar-backup-manual.bat`

Esto ejecutará un backup inmediato para verificar que todo funciona.

### Opción 3: Forzar ejecución de la tarea programada

Abrir CMD como administrador y ejecutar:
```cmd
schtasks /Run /TN "SuminixMed-Backup-Diario"
```

### Opción 4: Ejecutar el script directamente

Abrir PowerShell y ejecutar:
```powershell
cd C:\UA-ISSSTE\suminixmed\scripts
.\backup-automatico-diario.ps1
```

## 📁 Ubicación de los Backups

Todos los backups se guardan en:
```
C:\UA-ISSSTE\suminixmed\backups\
```

Archivos generados:
- `backup-automatico-sistema-YYYY-MM-DD_HH-mm-ss.backup` - Respaldo de la BD
- `backup-automatico.log` - Log de todas las operaciones

## 📊 Verificar Estado

### Ver la tarea programada

1. Presiona `Win + R`
2. Escribe: `taskschd.msc`
3. Busca la tarea: **SuminixMed-Backup-Diario**

### Ver el log

Revisa el archivo:
```
C:\UA-ISSSTE\suminixmed\backups\backup-automatico.log
```

Contendrá algo como:
```
[2025-11-06 00:05:01] ==========================================
[2025-11-06 00:05:01] INICIO DE RESPALDO AUTOMÁTICO DIARIO
[2025-11-06 00:05:01] ==========================================
[2025-11-06 00:05:01] Iniciando respaldo de base de datos: suminix
[2025-11-06 00:05:15] ✅ Respaldo completado exitosamente
[2025-11-06 00:05:15]    Tamaño: 12.45 MB
[2025-11-06 00:05:16] ✅ Integridad del backup verificada correctamente
```

### Ver backups existentes

Ejecutar en PowerShell:
```powershell
Get-ChildItem C:\UA-ISSSTE\suminixmed\backups\backup-automatico-sistema-*.backup | 
    Select-Object Name, Length, LastWriteTime
```

## 🔄 Restaurar un Backup

Si necesitas restaurar la base de datos desde un backup automático:

```cmd
pg_restore -U postgres -d suminix -c -v C:\UA-ISSSTE\suminixmed\backups\backup-automatico-sistema-YYYY-MM-DD_HH-mm-ss.backup
```

Reemplaza `YYYY-MM-DD_HH-mm-ss` por la fecha del backup que quieras restaurar.

## ⚙️ Configuración Avanzada

### Cambiar horario de ejecución

Edita `scripts/instalar-backup-automatico.bat`, línea 68:
```batch
/ST 00:05 ^     REM Cambiar 00:05 por la hora deseada (formato 24h)
```

Luego vuelve a ejecutar el script de instalación.

### Cambiar retención (días)

Edita `scripts/backup-automatico-diario.ps1`, línea 18:
```powershell
$RETENTION_DAYS = 30  # Cambiar por el número de días deseado
```

### Cambiar ubicación de backups

Edita `scripts/backup-automatico-diario.ps1`, línea 14:
```powershell
$BACKUP_DIR = "C:\UA-ISSSTE\suminixmed\backups"  # Cambiar ruta
```

También actualiza la ruta en `scripts/instalar-backup-automatico.bat`, línea 33.

## 🗑️ Desinstalar

Si necesitas desactivar el sistema de backups automáticos:

1. **Clic derecho** en `scripts/desinstalar-backup-automatico.bat`
2. Selecciona **"Ejecutar como administrador"**

**NOTA**: Los backups existentes NO se eliminan, solo se desactiva la tarea programada.

## 📝 Notas Importantes

### Seguridad
- La contraseña de PostgreSQL está **hardcodeada** en el script PowerShell
- Los backups NO están encriptados
- Solo usuarios con acceso al servidor pueden verlos

### Espacio en Disco
- Cada backup ocupa aproximadamente 10-50 MB (depende del tamaño de tu BD)
- Con retención de 30 días: ~300 MB - 1.5 GB de espacio necesario
- Los backups antiguos se eliminan automáticamente

### Rendimiento
- El backup se ejecuta a las 00:05 para minimizar impacto
- Duración estimada: 5-30 segundos (depende del tamaño de BD)
- NO afecta el funcionamiento del sistema durante el respaldo

## 🔍 Solución de Problemas

### El backup no se ejecuta

1. Verifica que la tarea existe:
   ```cmd
   schtasks /Query /TN "SuminixMed-Backup-Diario"
   ```

2. Verifica el último resultado:
   ```cmd
   schtasks /Query /TN "SuminixMed-Backup-Diario" /V /FO LIST
   ```

3. Ejecuta manualmente para ver errores:
   ```cmd
   scripts\ejecutar-backup-manual.bat
   ```

### Error de permisos

Asegúrate de que:
- La tarea se instaló como ADMINISTRADOR
- El usuario SYSTEM tiene permisos en la carpeta `backups/`

### Error de conexión a PostgreSQL

Verifica:
- PostgreSQL está corriendo: `services.msc` → busca "postgresql"
- Usuario y contraseña correctos en el script PowerShell
- El path de `pg_dump.exe` es correcto (línea 51 del script PowerShell)

### No se eliminan backups antiguos

- Verifica que los nombres de archivo sigan el formato: `backup-automatico-sistema-*.backup`
- Revisa el log para ver mensajes de limpieza
- Los backups manuales o con otros nombres NO se eliminan automáticamente

## 📞 Soporte

Para problemas o mejoras, revisar:
- Log: `backups/backup-automatico.log`
- Programador de tareas: `taskschd.msc`
- Estado de PostgreSQL: `services.msc`

---

**Versión**: 1.0  
**Última actualización**: 2025-11-06  
**Sistema**: SuminixMed - Gestión Médica
