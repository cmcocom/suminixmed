# 🚀 SuminixMed - Scripts Finales (Solo Desarrollo)

## 📋 Scripts Disponibles

### **⭐ Principal**
- `🚀-INICIO-RAPIDO.bat` - Menu principal
- `scripts\suminix-control.bat` - Control maestro

### **🔧 Funcionales**
- `scripts\iniciar-servicio.bat` - Iniciar (sin ventana)
- `scripts\iniciar-optimizado.bat` - Iniciar optimizado
- `scripts\detener-desatendido.bat` - Detener servidor
- `scripts\config-auto-desatendido.bat` - Autostart Windows

### **🛠️ Utilitarios**
- `scripts\check.bat` - Verificar BD
- `scripts\restore.bat` - Restaurar backup
- `scripts\setup-windows.bat` - Configuración inicial

## 🎯 **Decisión Técnica**

**USAMOS SOLO `npm run dev`** porque:
- ✅ Funciona sin errores de compilación
- ✅ Hot reload para desarrollo
- ✅ No requiere build problemático
- ✅ Adecuado para uso interno/desarrollo

## 💡 **Para Producción Real**
En el futuro, cuando se corrijan los errores de TypeScript:
- Agregar `scripts\iniciar-produccion.bat` (npm run build + start)
- Usar autostart con build completo

**Por ahora: Desarrollo optimizado es suficiente** ✅