#!/bin/bash

# Script de limpieza de archivos innecesarios del proyecto
# Creado: 22 de octubre de 2025

set -e

echo "🧹 Iniciando limpieza del proyecto..."
echo ""

# Crear carpeta de archivo temporal
ARCHIVE_DIR="archivo-temporal-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$ARCHIVE_DIR"

echo "📦 Los archivos se moverán a: $ARCHIVE_DIR"
echo ""

# Contador
COUNT=0

# 1. Mover archivos .md de documentación de tareas (excepto README.md y GUIA-RAPIDA.md)
echo "📄 Moviendo archivos de documentación de tareas completadas..."
for file in *.md; do
    if [ -f "$file" ] && [ "$file" != "README.md" ] && [ "$file" != "GUIA-RAPIDA.md" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        COUNT=$((COUNT + 1))
    fi
done

# 2. Mover scripts temporales de análisis en la raíz (*.mjs, *.cjs, *.js)
echo "🔧 Moviendo scripts de análisis temporales..."
for ext in mjs cjs js; do
    for file in *.$ext; do
        if [ -f "$file" ]; then
            mv "$file" "$ARCHIVE_DIR/"
            COUNT=$((COUNT + 1))
        fi
    done
done

# 3. Mover archivos SQL en la raíz
echo "💾 Moviendo archivos SQL temporales..."
for file in *.sql; do
    if [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        COUNT=$((COUNT + 1))
    fi
done

# 4. Mover archivos .txt de análisis
echo "📝 Moviendo archivos de texto de análisis..."
for file in *.txt; do
    if [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        COUNT=$((COUNT + 1))
    fi
done

# 5. Mover archivos .json de respaldo
echo "📋 Moviendo archivos JSON de respaldo..."
for file in *.json; do
    if [ -f "$file" ] && [ "$file" != "package.json" ] && [ "$file" != "package-lock.json" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        COUNT=$((COUNT + 1))
    fi
done

# 6. Mover archivos .sh temporales (excepto este script)
echo "⚙️  Moviendo scripts shell temporales..."
for file in *.sh; do
    if [ -f "$file" ] && [ "$file" != "limpiar-proyecto.sh" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        COUNT=$((COUNT + 1))
    fi
done

# 7. Mover carpetas de respaldo y archivos temporales
echo "📁 Moviendo carpetas temporales..."
TEMP_DIRS=(
    "backup_cleanup"
    "backups"
    "docs_archive"
    "scripts_archive"
    "test-data"
    "migration-package"
    "suminixmed-simple"
    "downloads"
    "logs"
    "pruebas"
)

for dir in "${TEMP_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        mv "$dir" "$ARCHIVE_DIR/"
        echo "  ✓ Movido: $dir/"
    fi
done

echo ""
echo "✅ Limpieza completada!"
echo "📊 Total de archivos/carpetas movidos: $COUNT+"
echo ""
echo "📦 Los archivos están en: $ARCHIVE_DIR"
echo "   Puedes revisar y eliminar esta carpeta cuando estés seguro."
echo ""
echo "💡 Archivos que permanecen:"
echo "   ✓ README.md"
echo "   ✓ GUIA-RAPIDA.md"
echo "   ✓ package.json y package-lock.json"
echo "   ✓ Carpetas principales: app/, lib/, prisma/, public/, scripts/, types/"
echo "   ✓ Archivos de configuración: .env, tsconfig.json, next.config.ts, etc."
echo ""
