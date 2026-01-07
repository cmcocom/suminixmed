#!/bin/bash

# Script de respaldo completo de la base de datos PostgreSQL
# Fecha: 17 de octubre de 2025

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Iniciando respaldo de base de datos...${NC}"

# Crear directorio de respaldos si no existe
mkdir -p backups

# Obtener timestamp para el nombre del archivo
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backups/suminixmed_backup_${TIMESTAMP}.sql"
BACKUP_FILE_COMPRESSED="backups/suminixmed_backup_${TIMESTAMP}.sql.gz"

# Extraer datos de conexión del .env.local
if [ -f .env.local ]; then
    echo -e "${BLUE}📋 Leyendo configuración de .env.local...${NC}"
    
    # Extraer DATABASE_URL
    DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ No se encontró DATABASE_URL en .env.local${NC}"
        exit 1
    fi
    
    # Parsear la URL de conexión
    # Formato: postgresql://user:password@host:port/database
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    echo -e "${GREEN}✓ Configuración detectada:${NC}"
    echo -e "  Host: ${DB_HOST}"
    echo -e "  Puerto: ${DB_PORT}"
    echo -e "  Base de datos: ${DB_NAME}"
    echo -e "  Usuario: ${DB_USER}"
    
else
    echo -e "${RED}❌ No se encontró el archivo .env.local${NC}"
    exit 1
fi

# Realizar el respaldo
echo -e "${BLUE}💾 Creando respaldo...${NC}"

export PGPASSWORD=$DB_PASS

pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    --clean \
    --if-exists \
    --create \
    --verbose \
    --format=plain \
    --file=$BACKUP_FILE

# Verificar si el respaldo fue exitoso
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Respaldo creado exitosamente${NC}"
    
    # Comprimir el respaldo
    echo -e "${BLUE}🗜️  Comprimiendo respaldo...${NC}"
    gzip $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Respaldo comprimido exitosamente${NC}"
        
        # Obtener tamaño del archivo
        FILE_SIZE=$(du -h $BACKUP_FILE_COMPRESSED | cut -f1)
        
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✅ RESPALDO COMPLETADO${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "📁 Archivo: ${BACKUP_FILE_COMPRESSED}"
        echo -e "📊 Tamaño: ${FILE_SIZE}"
        echo -e "🕐 Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        # Listar últimos 5 respaldos
        echo -e "\n${BLUE}📂 Últimos respaldos:${NC}"
        ls -lht backups/suminixmed_backup_*.sql.gz 2>/dev/null | head -5
        
    else
        echo -e "${RED}❌ Error al comprimir el respaldo${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Error al crear el respaldo${NC}"
    exit 1
fi

# Limpiar variable de entorno
unset PGPASSWORD

echo -e "\n${GREEN}🎉 Proceso completado${NC}"
