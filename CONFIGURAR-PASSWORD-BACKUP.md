# 🔧 CONFIGURAR CONTRASEÑA DE POSTGRESQL

## ✅ Problema Resuelto: PostgreSQL 17 Detectado

El script ahora detecta correctamente PostgreSQL 17. Solo falta configurar la contraseña correcta.

## 📝 Pasos para Configurar

### 1. Editar el Script de Backup

Abre el archivo: `scripts\backup-automatico-diario.ps1`

### 2. Ir a la Línea 12

Busca esta línea:
```powershell
$DB_PASSWORD = "postgres"  # CAMBIAR SI ES DIFERENTE
```

### 3. Cambiar la Contraseña

Reemplaza `"postgres"` por tu contraseña real de PostgreSQL:
```powershell
$DB_PASSWORD = "TU_CONTRASEÑA_AQUI"
```

Por ejemplo, si tu contraseña es `miPassword123`:
```powershell
$DB_PASSWORD = "miPassword123"
```

### 4. Guardar el Archivo

Guarda el archivo con `Ctrl+S`

### 5. Probar Nuevamente

Ejecuta:
```
scripts\ejecutar-backup-manual.bat
```

## ✅ Resultado Esperado

Deberías ver algo como:
```
[2025-11-06 12:19:33] ✅ PostgreSQL detectado: C:\Program Files\PostgreSQL\17\bin\pg_dump.exe
[2025-11-06 12:19:33] Iniciando respaldo de base de datos: suminix
[2025-11-06 12:19:35] ✅ Respaldo completado exitosamente
[2025-11-06 12:19:35]    Tamaño: 12.45 MB
[2025-11-06 12:19:35] ✅ Integridad del backup verificada correctamente
```

## 🔐 Seguridad

**IMPORTANTE**: La contraseña queda guardada en texto plano en el archivo. 

**Alternativas más seguras:**
1. Usar archivo `.pgpass` de PostgreSQL
2. Usar variables de entorno
3. Restringir permisos del archivo (solo administrador puede leerlo)

Para ahora, lo más simple es editar la línea 12 con tu contraseña.

---

**¿No recuerdas tu contraseña de PostgreSQL?**
- Puedes cambiarla desde `pgAdmin` o `psql`
- O usa la que configuraste durante la instalación
