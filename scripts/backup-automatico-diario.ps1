# Script de Respaldo Automático Diario - SuminixMed
# Ejecuta respaldo completo de PostgreSQL a las 00:05 diariamente
# Autor: Sistema Automatizado
# Fecha: 2025-11-06

# =====================================================
# CONFIGURACIÓN
# =====================================================

$DB_NAME = "suminix"
$DB_USER = "postgres"
# SEGURIDAD: Usar variable de entorno para la contraseña
$DB_PASSWORD = $env:DB_PASSWORD
if (-not $DB_PASSWORD) {
    Write-Host "ERROR: Variable de entorno DB_PASSWORD no definida."
    Write-Host "Definir con: `$env:DB_PASSWORD = 'tu-contraseña'"
    exit 1
}
$BACKUP_DIR = "C:\UA-ISSSTE\suminixmed\backups"
$LOG_FILE = "$BACKUP_DIR\backup-automatico.log"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BACKUP_FILE = "$BACKUP_DIR\backup-automatico-sistema-$TIMESTAMP.backup"

# Retención: mantener backups de los últimos 30 días
$RETENTION_DAYS = 30

# =====================================================
# FUNCIÓN DE LOG
# =====================================================

function Write-Log {
    param([string]$Message)
    $LogMessage = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LOG_FILE -Value $LogMessage
}

# =====================================================
# DETECCIÓN DE POSTGRESQL
# =====================================================

# Detectar automáticamente la versión de PostgreSQL instalada
$PG_VERSIONS = @("17", "16", "15", "14", "13", "12")
$PG_DUMP_PATH = $null
$PG_RESTORE_PATH = $null

foreach ($version in $PG_VERSIONS) {
    $testPath = "C:\Program Files\PostgreSQL\$version\bin\pg_dump.exe"
    if (Test-Path $testPath) {
        $PG_DUMP_PATH = $testPath
        $PG_RESTORE_PATH = "C:\Program Files\PostgreSQL\$version\bin\pg_restore.exe"
        break
    }
}

# =====================================================
# INICIO DEL RESPALDO
# =====================================================

Write-Log "=========================================="
Write-Log "INICIO DE RESPALDO AUTOMÁTICO DIARIO"
Write-Log "=========================================="

# Verificar que PostgreSQL está instalado
if (-not $PG_DUMP_PATH) {
    Write-Log "❌ ERROR CRÍTICO: No se encontró pg_dump.exe"
    Write-Log "   Instale PostgreSQL o verifique la ruta de instalación"
    Write-Log "   Versiones buscadas: 17, 16, 15, 14, 13, 12"
    exit 1
}

Write-Log "✅ PostgreSQL detectado: $PG_DUMP_PATH"

# Verificar que existe la carpeta de backups
if (!(Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    Write-Log "Creada carpeta de backups: $BACKUP_DIR"
}

# =====================================================
# EJECUTAR PG_DUMP
# =====================================================

Write-Log "Iniciando respaldo de base de datos: $DB_NAME"
Write-Log "Archivo destino: $BACKUP_FILE"

try {
    # Configurar contraseña de PostgreSQL
    $env:PGPASSWORD = $DB_PASSWORD
    
    # Ejecutar pg_dump con formato custom (comprimido)
    & $PG_DUMP_PATH `
        -U $DB_USER `
        -d $DB_NAME `
        -F c `
        -b `
        -v `
        -f $BACKUP_FILE `
        2>&1 | ForEach-Object { Write-Log $_ }
    
    if ($LASTEXITCODE -eq 0) {
        # Verificar tamaño del backup
        $FileInfo = Get-Item $BACKUP_FILE
        $FileSizeMB = [math]::Round($FileInfo.Length / 1MB, 2)
        
        Write-Log "✅ Respaldo completado exitosamente"
        Write-Log "   Tamaño: $FileSizeMB MB"
        Write-Log "   Ruta: $BACKUP_FILE"
        
        # Verificar integridad del backup
        Write-Log "Verificando integridad del backup..."
        
        & $PG_RESTORE_PATH `
            --list $BACKUP_FILE `
            2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Integridad del backup verificada correctamente"
        } else {
            Write-Log "⚠️ ADVERTENCIA: No se pudo verificar la integridad del backup"
        }
        
    } else {
        Write-Log "❌ ERROR: Falló el respaldo de la base de datos"
        Write-Log "   Código de salida: $LASTEXITCODE"
        exit 1
    }
    
} catch {
    Write-Log "❌ ERROR CRÍTICO durante el respaldo: $_"
    exit 1
}

# =====================================================
# LIMPIEZA DE BACKUPS ANTIGUOS
# =====================================================

Write-Log "Limpiando backups antiguos (> $RETENTION_DAYS días)..."

try {
    $CutoffDate = (Get-Date).AddDays(-$RETENTION_DAYS)
    $OldBackups = Get-ChildItem -Path $BACKUP_DIR -Filter "backup-automatico-sistema-*.backup" | 
                  Where-Object { $_.LastWriteTime -lt $CutoffDate }
    
    if ($OldBackups) {
        foreach ($OldBackup in $OldBackups) {
            Remove-Item $OldBackup.FullName -Force
            Write-Log "🗑️  Eliminado backup antiguo: $($OldBackup.Name)"
        }
        Write-Log "✅ Limpieza completada: $($OldBackups.Count) archivo(s) eliminado(s)"
    } else {
        Write-Log "✅ No hay backups antiguos para eliminar"
    }
    
} catch {
    Write-Log "⚠️ ADVERTENCIA: Error durante la limpieza de backups antiguos: $_"
    # No es crítico, continuar
}

# =====================================================
# RESUMEN FINAL
# =====================================================

Write-Log "=========================================="
Write-Log "RESPALDO COMPLETADO EXITOSAMENTE"
Write-Log "=========================================="

# Mostrar estadísticas
$AllBackups = Get-ChildItem -Path $BACKUP_DIR -Filter "backup-automatico-sistema-*.backup"
$TotalBackups = $AllBackups.Count
$TotalSizeGB = [math]::Round(($AllBackups | Measure-Object -Property Length -Sum).Sum / 1GB, 2)

Write-Log "Estadísticas actuales:"
Write-Log "  Total de backups automáticos: $TotalBackups"
Write-Log "  Espacio total utilizado: $TotalSizeGB GB"
Write-Log "  Último backup: $BACKUP_FILE"

Write-Log ""
Write-Log "Próximo respaldo programado: Mañana a las 00:05"

exit 0
