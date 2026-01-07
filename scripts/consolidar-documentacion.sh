#!/bin/bash

# Script de Consolidación de Documentación
# Organiza, actualiza y elimina documentación según el análisis

set -e

echo "🗂️  CONSOLIDACIÓN DE DOCUMENTACIÓN DEL PROYECTO"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fase 1: Mover archivos de implementación completada a docs/migrations/
echo -e "${BLUE}📦 FASE 1: Moviendo implementaciones completadas a docs/migrations/${NC}"
echo ""

IMPLEMENTACIONES=(
  "IMPLEMENTACION-CATALOGOS-IMPORTACION-EXPORTACION.md"
  "IMPLEMENTACION-EMPLEADOS-USUARIOS-COMPLETADA.md"
  "IMPLEMENTACION-MODULE-VISIBILITY-COMPLETADA.md"
  "IMPLEMENTACION-MODULE-VISIBILITY-ROLES-COMPLETA.md"
  "IMPLEMENTACION-MODULOS-RBAC.md"
  "IMPLEMENTACION-RBAC-PERMISOS-100-COMPLETADA.md"
  "IMPLEMENTACION-SEGURIDAD-RBAC-COMPLETADA.md"
  "REFACTORIZACION-AUDITORIA-COMPLETADA.md"
  "RESUMEN-CATALOGOS-COMPLETADO.md"
  "RESUMEN-IMPLEMENTACION-EMPLEADOS.md"
  "RESUMEN-IMPLEMENTACION-OPTIMIZACIONES.md"
  "RESUMEN-IMPLEMENTACION-RESPALDOS.md"
  "SISTEMA-EMPLEADOS-COMPLETADO.md"
  "SISTEMA-RESPALDOS-AUTOMATICOS-COMPLETADO.md"
  "SISTEMA-RESPALDOS-COMPLETADO.md"
)

for file in "${IMPLEMENTACIONES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ➜ Moviendo $file"
    mv "$file" "docs/migrations/"
  fi
done

echo ""

# Fase 2: Mover correcciones y soluciones a docs/fixes/
echo -e "${BLUE}🔧 FASE 2: Moviendo correcciones a docs/fixes/${NC}"
echo ""

CORRECCIONES=(
  "PLAN-CORRECCION-URGENTE.md"
  "PROBLEMA-CLAVE-RESUELTO.md"
  "PROBLEMA-CMCOCOM-RESUELTO.md"
  "PROBLEMA-LICENCIAS-RESUELTO.md"
  "RESUMEN-EJECUTIVO-CORRECCIONES.md"
  "RESUMEN-FINAL-CORRECCIONES.md"
  "SOLUCION-CAMBIO-IMAGEN-DEFINITIVA.md"
  "SOLUCION-CAMBIO-PASSWORD-COMPLETADA.md"
  "SOLUCION-COMPLETA-FINAL.md"
  "SOLUCION-COMPLETA-RBAC.md"
  "SOLUCION-DEFINITIVA-CAMBIO-IMAGEN.md"
  "SOLUCION-MODULE-VISIBILITY-ERROR.md"
  "SOLUCION-QUITAR-TODOS-PERMISOS.md"
  "SOLUCION-VISIBILIDAD-CONCURRENTE.md"
  "SOLUCION-VISIBILIDAD-ROL-COMPLETADA.md"
)

for file in "${CORRECCIONES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ➜ Moviendo $file"
    mv "$file" "docs/fixes/"
  fi
done

echo ""

# Fase 3: Mover análisis técnicos a docs/analysis/
echo -e "${BLUE}📊 FASE 3: Moviendo análisis a docs/analysis/${NC}"
echo ""

ANALISIS=(
  "INVESTIGACION-PROBLEMA-REAL.md"
)

for file in "${ANALISIS[@]}"; do
  if [ -f "$file" ]; then
    echo "  ➜ Moviendo $file"
    mv "$file" "docs/analysis/"
  fi
done

echo ""

# Fase 4: Mover validaciones a docs/analysis/
echo -e "${BLUE}✅ FASE 4: Moviendo validaciones a docs/analysis/${NC}"
echo ""

VALIDACIONES=(
  "RESUMEN-EJECUTIVO-VALIDACION.md"
  "RESUMEN-FINAL-VERIFICACION.md"
  "VALIDACION-FINAL-SISTEMA.md"
  "VALIDACION-SISTEMA-COMPLETA.md"
  "VALIDACION-SISTEMA-RESPALDOS.md"
  # "VERIFICACION-ACCESO-COMPLETO-DESARROLLADOR.md"  # removed per role cleanup
  "VERIFICACION-EXHAUSTIVA-FINAL.md"
  "VERIFICACION-OPTIMIZACIONES-COMPLETADA.md"
  "VERIFICACION-RECOMENDACIONES-INMEDIATAS.md"
  "VERIFICACION-UNIDADC-COMPLETADA.md"
)

for file in "${VALIDACIONES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ➜ Moviendo $file"
    mv "$file" "docs/analysis/"
  fi
done

echo ""

# Fase 5: Mover optimizaciones a docs/general/
echo -e "${BLUE}⚡ FASE 5: Moviendo optimizaciones a docs/general/${NC}"
echo ""

OPTIMIZACIONES=(
  "OPTIMIZACIONES-RENDIMIENTO-COMPLETADAS.md"
  "OPTIMIZACIONES-RESPALDOS-AVANZADAS.md"
  "README-OPTIMIZACIONES.md"
  "RESUMEN-OPTIMIZACIONES-RECOMENDADAS.md"
  "RESUMEN-VISUAL-OPTIMIZACIONES.md"
  "INDICES-COMPUESTOS-IMPLEMENTADOS.md"
  "INDICE-DUPLICADO-ELIMINADO.md"
)

for file in "${OPTIMIZACIONES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ➜ Moviendo $file"
    mv "$file" "docs/general/"
  fi
done

echo ""

# Fase 6: Mover actualizaciones a docs/migrations/
echo -e "${BLUE}🔄 FASE 6: Moviendo actualizaciones a docs/migrations/${NC}"
echo ""

ACTUALIZACIONES=(
  "RESUMEN-ACTUALIZACION-USUARIOS.md"
  "USUARIO-CRISTIAN-COCOM-CREADO.md"
  "RESUMEN-RECOMENDACIONES-INMEDIATAS.md"
)

for file in "${ACTUALIZACIONES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ➜ Moviendo $file"
    mv "$file" "docs/migrations/"
  fi
done

echo ""

# Fase 7: Archivar documentación temporal/obsoleta
echo -e "${BLUE}📦 FASE 7: Archivando documentación temporal${NC}"
echo ""

# Crear directorio de archivo si no existe
mkdir -p docs/archive/temporal

TEMPORALES=(
  "EJECUTAR-AHORA.md"
  "RESULTADO-DEPURACION.md"
  "propuesta-rbac-dinamico.md"
  "test-logout-flow.md"
)

for file in "${TEMPORALES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ➜ Archivando $file"
    mv "$file" "docs/archive/temporal/"
  fi
done

echo ""

# Fase 8: Mover archivos de docs raíz a subcarpetas apropiadas
echo -e "${BLUE}📂 FASE 8: Reorganizando docs raíz${NC}"
echo ""

# Mover a general
if [ -f "docs/REESTRUCTURACION_RBAC.md" ]; then
  echo "  ➜ Moviendo REESTRUCTURACION_RBAC.md a migrations/"
  mv "docs/REESTRUCTURACION_RBAC.md" "docs/migrations/"
fi

if [ -f "docs/gestion-imagenes.md" ]; then
  echo "  ➜ Moviendo gestion-imagenes.md a guides/"
  mv "docs/gestion-imagenes.md" "docs/guides/"
fi

if [ -f "docs/auditoria-informe.md" ]; then
  echo "  ➜ Moviendo auditoria-informe.md a analysis/"
  mv "docs/auditoria-informe.md" "docs/analysis/"
fi

if [ -f "docs/seguridad-estado.md" ]; then
  echo "  ➜ Moviendo seguridad-estado.md a analysis/"
  mv "docs/seguridad-estado.md" "docs/analysis/"
fi

if [ -f "docs/sistema-seeding-completado.md" ]; then
  echo "  ➜ Moviendo sistema-seeding-completado.md a migrations/"
  mv "docs/sistema-seeding-completado.md" "docs/migrations/"
fi

if [ -f "docs/sistema-sesiones-automatico.md" ]; then
  echo "  ➜ Moviendo sistema-sesiones-automatico.md a migrations/"
  mv "docs/sistema-sesiones-automatico.md" "docs/migrations/"
fi

if [ -f "docs/sistema-usuarios-conectados-final.md" ]; then
  echo "  ➜ Moviendo sistema-usuarios-conectados-final.md a migrations/"
  mv "docs/sistema-usuarios-conectados-final.md" "docs/migrations/"
fi

if [ -f "docs/validacion-sesiones-concurrentes.md" ]; then
  echo "  ➜ Moviendo validacion-sesiones-concurrentes.md a analysis/"
  mv "docs/validacion-sesiones-concurrentes.md" "docs/analysis/"
fi

echo ""

# Resumen
echo -e "${GREEN}✅ CONSOLIDACIÓN COMPLETADA${NC}"
echo ""
echo "Archivos restantes en raíz:"
ls -1 *.md 2>/dev/null | wc -l
echo ""
echo "Estructura de docs/:"
echo "  📁 guides/: $(ls -1 docs/guides/*.md 2>/dev/null | wc -l) archivos"
echo "  📁 fixes/: $(ls -1 docs/fixes/*.md 2>/dev/null | wc -l) archivos"
echo "  📁 migrations/: $(ls -1 docs/migrations/*.md 2>/dev/null | wc -l) archivos"
echo "  📁 analysis/: $(ls -1 docs/analysis/*.md 2>/dev/null | wc -l) archivos"
echo "  📁 general/: $(ls -1 docs/general/*.md 2>/dev/null | wc -l) archivos"
echo "  📁 archive/temporal/: $(ls -1 docs/archive/temporal/*.md 2>/dev/null | wc -l) archivos"
echo ""
echo -e "${YELLOW}📝 Próximo paso: Ejecutar crear-documentacion-faltante.sh${NC}"
