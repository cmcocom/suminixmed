#!/bin/bash

# Script para bloquear/desbloquear CSS en SuminixMed
# Uso: ./scripts/css-control.sh [block|unblock]

PROJECT_ROOT="/Users/cristian/www/suminixmed"
GLOBALS_CSS="$PROJECT_ROOT/app/globals.css"
GLOBALS_BACKUP="$PROJECT_ROOT/app/globals.css.backup"
GLOBALS_BLOCKED="$PROJECT_ROOT/app/globals.css.blocked"

case "$1" in
  block)
    echo "🚫 Bloqueando CSS..."
    
    # Backup del archivo actual
    cp "$GLOBALS_CSS" "$GLOBALS_BACKUP"
    
    # Crear versión sin CSS (solo imports mínimos)
    cat > "$GLOBALS_BLOCKED" << 'EOF'
/* =========================================
   CSS BLOQUEADO TEMPORALMENTE PARA PRUEBAS
   ========================================= */

/* NO Tailwind CSS - desactivado para pruebas */
/* @import "tailwindcss"; */

:root {
  --background: #ffffff;
  --foreground: #171717;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
  margin: 20px;
  padding: 20px;
}

/* Estilos mínimos para que la página sea legible */
* {
  box-sizing: border-box;
}

h1, h2, h3, h4, h5, h6 {
  margin-top: 1em;
  margin-bottom: 0.5em;
}

p {
  margin: 0.5em 0;
}

button {
  padding: 8px 16px;
  margin: 4px;
  cursor: pointer;
}

input, select, textarea {
  padding: 8px;
  margin: 4px;
  border: 1px solid #ccc;
}
EOF
    
    # Reemplazar el archivo actual con la versión bloqueada
    cp "$GLOBALS_BLOCKED" "$GLOBALS_CSS"
    
    echo "✅ CSS bloqueado. Backup guardado en: $GLOBALS_BACKUP"
    echo "⚠️  Reinicia el servidor para ver los cambios"
    ;;
    
  unblock)
    echo "🔓 Desbloqueando CSS..."
    
    if [ -f "$GLOBALS_BACKUP" ]; then
      cp "$GLOBALS_BACKUP" "$GLOBALS_CSS"
      echo "✅ CSS restaurado desde el backup"
      echo "⚠️  Reinicia el servidor para ver los cambios"
    else
      echo "❌ No se encontró el archivo de backup: $GLOBALS_BACKUP"
      exit 1
    fi
    ;;
    
  status)
    echo "📊 Estado del CSS:"
    if grep -q "CSS BLOQUEADO" "$GLOBALS_CSS" 2>/dev/null; then
      echo "🚫 CSS está BLOQUEADO"
    else
      echo "✅ CSS está ACTIVO"
    fi
    
    if [ -f "$GLOBALS_BACKUP" ]; then
      echo "💾 Backup disponible: $GLOBALS_BACKUP"
    else
      echo "⚠️  No hay backup disponible"
    fi
    ;;
    
  *)
    echo "Uso: $0 {block|unblock|status}"
    echo ""
    echo "Comandos:"
    echo "  block    - Bloquea todo el CSS (desactiva Tailwind y estilos personalizados)"
    echo "  unblock  - Restaura el CSS desde el backup"
    echo "  status   - Muestra el estado actual del CSS"
    exit 1
    ;;
esac
