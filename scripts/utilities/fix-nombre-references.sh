#!/bin/bash

# Script para corregir referencias a 'nombre' en selects de Inventario

echo "🔧 Corrigiendo referencias a 'nombre' en archivos TypeScript..."

# Archivos a corregir
files=$(find app/api -name "*.ts" -exec grep -l "nombre: true" {} \;)

count=0
for file in $files; do
    # Solo procesar archivos que tienen referencias a inventario/producto
    if grep -q "inventario\|producto" "$file"; then
        echo "  ✓ Procesando: $file"
        # Crear backup
        cp "$file" "$file.bak"
        # Remover 'nombre: true,' cuando está antes de descripcion
        sed -i '' '/nombre: true,/d' "$file"
        # Remover 'nombre: true' cuando está solo
        sed -i '' 's/nombre: true/descripcion: true/g' "$file"
        count=$((count + 1))
    fi
done

echo ""
echo "✅ $count archivos procesados"
echo ""
echo "Para revertir los cambios, ejecuta:"
echo "find app/api -name '*.ts.bak' -exec sh -c 'mv \"\$1\" \"\${1%.bak}\"' _ {} \;"
