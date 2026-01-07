#!/usr/bin/env bash

# Script para crear respaldo de seguridad de la BD suminix antes de eliminar restored
echo "🔒 CREANDO RESPALDO DE SEGURIDAD DE SUMINIX..."
echo "Fecha: $(date)"
echo "Base de datos: suminix"
echo "=" * 60

# Crear directorio de respaldos si no existe
mkdir -p ./backups

# Nombre del archivo con timestamp
BACKUP_FILE="./backups/backup-suminix-antes-eliminar-restored-$(date +%Y-%m-%d_%H-%M-%S).backup"

echo "📁 Archivo de respaldo: $BACKUP_FILE"

# Crear respaldo con pg_dump
pg_dump -h localhost -p 5432 -U postgres -d suminix -F c -b -v -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ RESPALDO CREADO EXITOSAMENTE"
    echo "📊 Información del respaldo:"
    ls -lh "$BACKUP_FILE"
    
    echo ""
    echo "🗄️ VERIFICANDO CONTENIDO DEL RESPALDO..."
    pg_restore --list "$BACKUP_FILE" | head -20
    
    echo ""
    echo "🎉 RESPALDO COMPLETADO"
    echo "   • Archivo: $BACKUP_FILE"
    echo "   • Tamaño: $(du -h "$BACKUP_FILE" | cut -f1)"
    echo "   • BD respaldada: suminix"
    
else
    echo "❌ ERROR AL CREAR RESPALDO"
    echo "Verifica:"
    echo "   • PostgreSQL esté ejecutándose"
    echo "   • Credenciales correctas"
    echo "   • BD suminix exista"
fi

echo ""
echo "📋 PRÓXIMO PASO:"
echo "   Una vez verificado el respaldo, puedes eliminar 'restored_suminix_20251027_backup'"