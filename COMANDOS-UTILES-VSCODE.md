# 🛠️ Comandos Útiles VS Code - Solución Rápida

**Referencia rápida de comandos para resolver problemas comunes**

---

## 🔧 Comandos de Teclado (macOS)

### Comandos Esenciales de Rendimiento

| Comando | Atajo | Cuándo Usar |
|---------|-------|-------------|
| **Recargar Ventana** | `Cmd+R` o `Cmd+Shift+P` → "Reload Window" | Terminal lento, editor no responde |
| **Reiniciar TS Server** | `Cmd+Shift+P` → "TypeScript: Restart TS Server" | IntelliSense no funciona, errores TS falsos |
| **Limpiar Historial Terminal** | `Cmd+K` (en terminal) | Terminal lleno de texto |
| **Cerrar Todas las Pestañas** | `Cmd+K` + `W` | Demasiados archivos abiertos |
| **Abrir Proceso Explorer** | `Cmd+Shift+P` → "Open Process Explorer" | Ver qué consume memoria/CPU |
| **Ver Extensiones Activas** | `Cmd+Shift+P` → "Show Running Extensions" | Identificar extensiones lentas |

---

## 🚨 Problemas Comunes y Soluciones

### 1. **Terminal se reinicia constantemente**

```bash
# Verificar configuración
echo $VSCODE_SHELL_INTEGRATION_TIMEOUT
# Debe mostrar: 30000

# Si no aparece, revisar .zshrc:
cat ~/.zshrc | grep -A5 "TERM_PROGRAM"

# Debe tener:
if [[ "$TERM_PROGRAM" == "vscode" ]]; then
  export VSCODE_SHELL_INTEGRATION_TIMEOUT=30000
fi
```

**Solución Rápida:**
- `Cmd+Shift+P` → "Developer: Reload Window"
- O cerrar y abrir nuevo terminal: `Ctrl+Shift+` `

---

### 2. **VS Code se congela al abrir archivos grandes**

**Método 1: Abrir sin extensiones**
```bash
# Desde terminal:
code --disable-extensions archivo-grande.sql
```

**Método 2: Aumentar límite temporalmente**
- `Cmd+,` → Buscar "large files"
- Cambiar `files.maxMemoryForLargeFilesMB` a `8192`

**Método 3: Usar editor externo**
```bash
# Para archivos >1GB, mejor usar:
less archivo-grande.log
# O
vim archivo-grande.sql
```

---

### 3. **TypeScript Server usa demasiada RAM/CPU**

**Paso 1: Reiniciar servidor**
- `Cmd+Shift+P` → "TypeScript: Restart TS Server"

**Paso 2: Ver diagnósticos**
- `Cmd+Shift+P` → "TypeScript: Open TS Server Log"

**Paso 3: Limpiar caché**
```bash
rm -rf ~/Library/Application\ Support/Code/User/globalStorage/typescript*
```

**Paso 4: Reducir memoria si persiste**
```json
// En settings.json
{
  "typescript.tsserver.maxTsServerMemory": 2048  // Reducir a 2GB
}
```

---

### 4. **Extensiones consumen muchos recursos**

**Ver uso de recursos:**
- `Cmd+Shift+P` → "Developer: Show Running Extensions"

**Desactivar extensión temporalmente:**
- `Cmd+Shift+P` → "Extensions: Show Installed Extensions"
- Click en extensión → "Disable"

**Extensiones comunes problemáticas:**
- Auto formatters en archivos grandes (Prettier)
- Linters agresivos (ESLint en modo `onType`)
- Temas complejos con animaciones
- IntelliCode en proyectos grandes

---

### 5. **Búsqueda de archivos muy lenta**

**Configurar exclusiones:**
```json
{
  "search.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/.next": true,
    "**/dist": true,
    "**/build": true,
    "**/*.log": true
  }
}
```

**Usar búsqueda con filtros:**
- `Cmd+Shift+F` → Búsqueda global
- En "files to exclude": `**/node_modules, **/.next, **/dist`

---

### 6. **Git muy lento en el editor**

```json
{
  "git.autofetch": false,           // No hacer fetch automático
  "git.decorations.enabled": true,  // Mantener decoraciones
  "git.autorefresh": false          // Desactivar refresh automático
}
```

**Refrescar manualmente cuando necesites:**
- `Cmd+Shift+P` → "Git: Refresh"

---

### 7. **Copilot satura el terminal con respuestas largas**

```json
{
  "github.copilot.chat.verbosity": "minimal",
  "github.copilot.enable": {
    "*": true,
    "plaintext": false,
    "markdown": false  // Opcional: desactivar en Markdown
  }
}
```

---

## 🔍 Comandos de Diagnóstico

### Ver logs del sistema

**Terminal:**
- `Cmd+Shift+P` → "Terminal: Show Terminal Logs"

**Extension Host:**
- `Cmd+Shift+P` → "Developer: Show Logs" → "Extension Host"

**Output:**
- `Cmd+Shift+U` → Ver panel de salida
- Seleccionar "TypeScript", "ESLint", etc.

---

### Verificar rendimiento de inicio

```bash
# Desde terminal externa:
code --status

# Dentro de VS Code:
# Cmd+Shift+P → "Developer: Startup Performance"
```

---

### Ver uso de memoria

**Process Explorer:**
- `Cmd+Shift+P` → "Developer: Open Process Explorer"
- Muestra CPU/RAM por proceso

**Herramientas de macOS:**
```bash
# Monitor de actividad
open -a "Activity Monitor"

# Ver procesos de VS Code
ps aux | grep "Code"
```

---

## 📊 Comandos de Mantenimiento

### Limpiar cachés

```bash
# TypeScript
rm -rf ~/Library/Application\ Support/Code/User/globalStorage/typescript*

# Workspace storage (workspaces antiguos)
find ~/Library/Application\ Support/Code/User/workspaceStorage -type d -mtime +30 -exec rm -rf {} +

# ESLint
rm -rf ~/Library/Application\ Support/Code/User/globalStorage/*eslint*

# Cache general de VS Code
rm -rf ~/Library/Caches/com.microsoft.VSCode*
```

---

### Actualizar VS Code y extensiones

```bash
# Actualizar VS Code
code --update

# Listar extensiones instaladas
code --list-extensions

# Actualizar todas las extensiones
code --list-extensions | xargs -L 1 code --install-extension

# Desinstalar extensión
code --uninstall-extension publisher.extension-name
```

---

### Backup de configuración

```bash
# Backup completo
cp -r ~/Library/Application\ Support/Code/User ~/Desktop/vscode-backup-$(date +%Y%m%d)

# Backup solo settings
cp ~/Library/Application\ Support/Code/User/settings.json ~/Desktop/settings-backup.json

# Backup extensiones
code --list-extensions > ~/Desktop/extensions-backup.txt
```

---

## ⚡ Tips de Productividad

### 1. **Cerrar archivos no usados automáticamente**

```json
{
  "workbench.editor.limit.enabled": true,
  "workbench.editor.limit.value": 10,  // Máximo 10 archivos abiertos
  "workbench.editor.limit.perEditorGroup": true
}
```

---

### 2. **Deshabilitar preview de archivos**

```json
{
  "workbench.editor.enablePreview": false  // Siempre abrir en nueva pestaña
}
```

---

### 3. **Optimizar IntelliSense**

```json
{
  "editor.quickSuggestions": {
    "other": true,
    "comments": false,      // No en comentarios
    "strings": false        // No en strings
  },
  "editor.suggestOnTriggerCharacters": true,
  "editor.acceptSuggestionOnCommitCharacter": false  // No aceptar con ;
}
```

---

### 4. **Formatear solo código modificado**

```json
{
  "editor.formatOnSave": true,
  "editor.formatOnSaveMode": "modificationsIfAvailable"  // Solo modificaciones
}
```

---

## 🎯 Configuraciones por Tipo de Archivo

### SQL (grandes queries)

```json
{
  "[sql]": {
    "editor.defaultFormatter": null,
    "editor.formatOnSave": false,
    "editor.wordWrap": "on",
    "editor.minimap.enabled": false
  }
}
```

---

### Logs (archivos grandes)

```json
{
  "[log]": {
    "editor.wordWrap": "off",
    "editor.minimap.enabled": false,
    "editor.lineNumbers": "off",
    "editor.renderWhitespace": "none"
  }
}
```

---

### JSON (grandes datos)

```json
{
  "[json]": {
    "editor.defaultFormatter": "vscode.json-language-features",
    "editor.formatOnSave": false,  // No formatear automáticamente
    "editor.quickSuggestions": {
      "strings": false
    }
  }
}
```

---

### TypeScript/JavaScript (proyectos grandes)

```json
{
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit"
    }
  }
}
```

---

## 🚀 Atajos de Teclado Adicionales

| Acción | Atajo |
|--------|-------|
| Abrir terminal nuevo | `Ctrl+Shift+` ` |
| Dividir terminal | `Cmd+\` (en terminal) |
| Cambiar entre terminales | `Cmd+↑/↓` (en terminal) |
| Matar terminal | `Cmd+Shift+P` → "Terminal: Kill Active" |
| Limpiar terminal | `Cmd+K` (en terminal) |
| Scroll en terminal | `Cmd+↑/↓` |
| Copiar selección terminal | `Cmd+C` |
| Pegar en terminal | `Cmd+V` |

---

## 📚 Recursos de Ayuda

**Documentación Oficial:**
- VS Code Performance: https://code.visualstudio.com/docs/getstarted/settings
- Terminal Docs: https://code.visualstudio.com/docs/terminal/basics
- TypeScript Performance: https://github.com/microsoft/TypeScript/wiki/Performance

**Herramientas de Diagnóstico:**
- Process Explorer: `Cmd+Shift+P` → "Open Process Explorer"
- Running Extensions: `Cmd+Shift+P` → "Show Running Extensions"
- Startup Performance: `Cmd+Shift+P` → "Startup Performance"

**Logs Importantes:**
- Extension Host: `~/Library/Application Support/Code/logs/*/exthost.log`
- Main Process: `~/Library/Application Support/Code/logs/*/main.log`
- Renderer: `~/Library/Application Support/Code/logs/*/renderer.log`

---

## ✅ Checklist de Rendimiento Diario

- [ ] Cerrar archivos no usados (`Cmd+K W`)
- [ ] Máximo 10-15 archivos abiertos
- [ ] Limpiar terminal (`Cmd+K` en terminal)
- [ ] Verificar extensiones activas (si está lento)
- [ ] Reiniciar TS Server si IntelliSense falla
- [ ] Recargar ventana si el editor no responde

**Semanal:**
- [ ] Limpiar caché de TypeScript
- [ ] Actualizar extensiones
- [ ] Revisar uso de memoria (Process Explorer)

**Mensual:**
- [ ] Actualizar VS Code
- [ ] Limpiar workspace storage antiguo
- [ ] Backup de configuración

---

**Última actualización:** 25 de octubre de 2025  
**Sistema:** macOS 26.1 con 8GB RAM  
**Estado:** ✅ Guía completa de comandos útiles
