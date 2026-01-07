#!/bin/bash

# Script para reemplazar instancias incorrectas de PrismaClient con el singleton

echo "🔧 Corrigiendo instancias duplicadas de PrismaClient..."

# Lista de archivos a corregir
archivos=(
  "app/api/tipos-entrada/[id]/route.ts"
  "app/api/tipos-entrada/route.ts"
  "app/api/productos/analisis-stock/route.ts"
  "app/api/catalogs/import/route.ts"
  "app/api/catalogs/export/route.ts"
  "app/api/tipos-salida/route.ts"
  "app/api/tipos-salida/[id]/route.ts"
  "app/api/rbac/users/[id]/roles/route.ts"
  "app/api/rbac/users/[id]/permissions/route.ts"
)

for archivo in "${archivos[@]}"; do
  if [ -f "$archivo" ]; then
    echo "  📝 Procesando: $archivo"
    
    # Reemplazar la importación y declaración
    sed -i '' \
      -e 's/import { PrismaClient } from .@prisma\/client.;/import { prisma } from '\''@\/lib\/prisma'\'';/g' \
      -e '/^const prisma = new PrismaClient();/d' \
      "$archivo"
    
    # Eliminar finally con $disconnect
    # Nota: Esto es más complejo con sed, lo haremos manualmente si es necesario
    
    echo "  ✅ Corregido: $archivo"
  else
    echo "  ⚠️  No encontrado: $archivo"
  fi
done

echo ""
echo "✨ ¡Corrección completada!"
echo "📋 Archivos procesados: ${#archivos[@]}"
echo ""
echo "⚠️  IMPORTANTE: Verifica manualmente y elimina bloques 'finally { prisma.\$disconnect() }'"
