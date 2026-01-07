#!/bin/bash

# Script de respaldo completo de la base de datos antes de modificaciones RBAC
# Fecha: 2025-01-20
# Propósito: Respaldar antes de eliminar roles y reorganizar permisos

echo "🔐 CREANDO RESPALDO COMPLETO DE LA BASE DE DATOS"
echo "================================================"
echo ""

# Obtener timestamp para el nombre del archivo
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups"
BACKUP_FILE="${BACKUP_DIR}/backup_antes_modificacion_rbac_${TIMESTAMP}.sql"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "📅 Fecha: $(date)"
echo "📁 Archivo de respaldo: $BACKUP_FILE"
echo ""

# Leer configuración de .env.local
if [ -f .env.local ]; then
    echo "✅ Leyendo configuración de .env.local..."
    source .env.local
else
    echo "❌ Error: Archivo .env.local no encontrado"
    exit 1
fi

# Extraer información de la DATABASE_URL
# Formato: postgresql://usuario:contraseña@host:puerto/database
DB_URL=$DATABASE_URL

# Extraer componentes
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "📊 Información de la base de datos:"
echo "   Host: $DB_HOST"
echo "   Puerto: $DB_PORT"
echo "   Base de datos: $DB_NAME"
echo "   Usuario: $DB_USER"
echo ""

# Realizar el respaldo
echo "🔄 Creando respaldo completo..."
echo ""

PGPASSWORD="$DB_PASS" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F p \
    -f "$BACKUP_FILE" \
    --verbose

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ RESPALDO CREADO EXITOSAMENTE"
    echo "================================================"
    echo ""
    
    # Mostrar tamaño del archivo
    FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "📦 Tamaño del respaldo: $FILE_SIZE"
    echo "📁 Ubicación: $BACKUP_FILE"
    echo ""
    
    # Crear respaldo adicional de solo las tablas RBAC
    RBAC_BACKUP="${BACKUP_DIR}/backup_rbac_tablas_${TIMESTAMP}.sql"
    echo "🔄 Creando respaldo adicional de tablas RBAC..."
    
    PGPASSWORD="$DB_PASS" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -F p \
        -t rbac_roles \
        -t rbac_role_permissions \
        -t rbac_user_roles \
        -t module_visibility \
        -t role_default_visibility \
        -f "$RBAC_BACKUP"
    
    if [ $? -eq 0 ]; then
        RBAC_SIZE=$(ls -lh "$RBAC_BACKUP" | awk '{print $5}')
        echo "✅ Respaldo de tablas RBAC creado: $RBAC_SIZE"
        echo "📁 Ubicación: $RBAC_BACKUP"
        echo ""
    fi
    
    # Crear snapshot de datos críticos en JSON
    echo "📸 Creando snapshot de datos RBAC en JSON..."
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const fs = require('fs');
    const prisma = new PrismaClient();
    
    (async () => {
        const snapshot = {
            timestamp: new Date().toISOString(),
            roles: await prisma.rbac_roles.findMany({
                include: {
                    rbac_role_permissions: true,
                    rbac_user_roles: {
                        include: {
                            User: {
                                select: {
                                    email: true,
                                    name: true,
                                    clave: true
                                }
                            }
                        }
                    }
                }
            }),
            moduleVisibility: await prisma.module_visibility.findMany(),
            roleDefaultVisibility: await prisma.role_default_visibility.findMany()
        };
        
        fs.writeFileSync('${BACKUP_DIR}/snapshot_rbac_${TIMESTAMP}.json', JSON.stringify(snapshot, null, 2));
        console.log('✅ Snapshot JSON creado');
        await prisma.\$disconnect();
    })();
    "
    
    echo ""
    echo "✅ TODOS LOS RESPALDOS COMPLETADOS"
    echo "================================================"
    echo ""
    echo "Archivos creados:"
    echo "  1. $BACKUP_FILE (base de datos completa)"
    echo "  2. $RBAC_BACKUP (solo tablas RBAC)"
    echo "  3. ${BACKUP_DIR}/snapshot_rbac_${TIMESTAMP}.json (snapshot JSON)"
    echo ""
    echo "🔒 Para restaurar en caso de emergencia:"
    echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
    echo ""
    
else
    echo ""
    echo "❌ ERROR AL CREAR RESPALDO"
    echo "================================================"
    echo ""
    echo "No se pudo crear el respaldo. Verifica:"
    echo "  1. pg_dump está instalado"
    echo "  2. Las credenciales en .env.local son correctas"
    echo "  3. Tienes conexión a la base de datos"
    echo ""
    exit 1
fi
