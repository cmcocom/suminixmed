# 🎯 INICIO RÁPIDO - Sistema de Backup Automático

## Para el Usuario (3 pasos simples)

### 1️⃣ Verificar que todo está listo
```
Doble clic en: scripts\verificar-backup-automatico.bat
```

### 2️⃣ Instalar el sistema de backup automático
```
Clic derecho en: scripts\instalar-backup-automatico.bat
Seleccionar: "Ejecutar como administrador"
```

### 3️⃣ Probar que funciona
```
Doble clic en: scripts\ejecutar-backup-manual.bat
```

**¡LISTO!** Desde ahora tendrás un backup completo todos los días a las 00:05 AM

---

## ¿Qué hace el sistema?

✅ Respaldo COMPLETO de toda la base de datos `suminix`  
✅ Se ejecuta AUTOMÁTICAMENTE todos los días a las 00:05  
✅ Guarda en: `C:\UA-ISSSTE\suminixmed\backups\`  
✅ Nombre del archivo: `backup-automatico-sistema-YYYY-MM-DD_HH-mm-ss.backup`  
✅ Mantiene backups de los últimos 30 días (borra los antiguos automáticamente)  
✅ Verifica que cada backup esté íntegro  
✅ Registra todo en un log: `backups\backup-automatico.log`  

---

## Restaurar un backup

Si algo sale mal y necesitas restaurar:

```cmd
pg_restore -U postgres -d suminix -c -v C:\UA-ISSSTE\suminixmed\backups\backup-automatico-sistema-2025-11-06_00-05-00.backup
```

(Cambia la fecha por el backup que quieras restaurar)

---

## Ver el estado

Para verificar que todo está funcionando:

```
Doble clic en: scripts\verificar-backup-automatico.bat
```

O revisar el log:
```
Abrir: backups\backup-automatico.log
```

---

## Desinstalar (si alguna vez lo necesitas)

```
Clic derecho en: scripts\desinstalar-backup-automatico.bat
Seleccionar: "Ejecutar como administrador"
```

**NOTA**: Los backups NO se borran, solo se desactiva la tarea automática.

---

## 📋 Archivos del sistema

- `scripts/backup-automatico-diario.ps1` - Script principal que hace el backup
- `scripts/instalar-backup-automatico.bat` - Instala la tarea programada
- `scripts/desinstalar-backup-automatico.bat` - Desinstala la tarea programada
- `scripts/ejecutar-backup-manual.bat` - Ejecuta un backup ahora mismo
- `scripts/verificar-backup-automatico.bat` - Verifica que todo esté OK
- `scripts/README-BACKUP-AUTOMATICO.md` - Documentación completa

---

**¿Dudas?** Lee el README completo: `scripts/README-BACKUP-AUTOMATICO.md`
