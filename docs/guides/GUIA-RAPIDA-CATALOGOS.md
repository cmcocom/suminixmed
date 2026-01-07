# 🚀 Guía Rápida: Importar/Exportar Catálogos

## 📍 Ubicación
**Menú:** Ajustes → Gestión de Catálogos

---

## 📥 IMPORTAR

### Paso 1: Seleccionar Catálogo
Click en la tarjeta del catálogo que deseas importar:
- 📦 Categorías
- 👥 Proveedores
- 👥 Empleados
- 📦 Clientes
- 📦 Productos

### Paso 2: Descargar Plantilla

**Opción A: Plantilla Vacía** 📄
- Solo encabezados
- Para llenar manualmente
- Campos con * son obligatorios

**Opción B: Con Ejemplos** 📝
- Encabezados + datos de ejemplo
- Para ver formato correcto

### Paso 3: Llenar CSV

1. Abrir en Excel o Google Sheets
2. **Campos con * son OBLIGATORIOS**
3. No modificar nombres de columnas
4. Guardar como CSV (separado por comas)

### Paso 4: Importar

1. Click en **⬆️ Seleccionar archivo CSV**
2. Elegir tu archivo
3. Esperar proceso

### Paso 5: Revisar Resultado

**✅ Éxito:**
```
✓ Se importaron 15 categorías correctamente
```

**❌ Errores:**
```
✗ Línea 5: El email no tiene un formato válido
✗ Línea 8: El número de empleado "EMP-001" ya existe
```

---

## 📤 EXPORTAR

### Opción 1: Exportar Datos Existentes

1. Seleccionar catálogo
2. Click en **⬇️ Exportar catálogo completo**
3. Archivo descarga automáticamente
4. Formato: `{catalogo}-{fecha}.csv`

**Usa para:**
- Respaldo de datos
- Editar en Excel y re-importar
- Migrar a otro sistema

---

## 📋 CAMPOS OBLIGATORIOS POR CATÁLOGO

### Categorías
- ✅ `*nombre` - Obligatorio, único

### Proveedores
- ✅ `*nombre` - Obligatorio
- ⚠️ `email` - Opcional pero único si se proporciona
- ⚠️ `rfc` - Opcional pero único si se proporciona

### Empleados
- ✅ `*numero_empleado` - Obligatorio, único
- ✅ `*nombre` - Obligatorio
- ✅ `*cargo` - Obligatorio
- ✅ `*turno` - Obligatorio (Matutino/Vespertino/Nocturno/Mixto)

### Clientes
- ✅ `*nombre` - Obligatorio
- ✅ `*email` - Obligatorio, único

### Productos
- ✅ `*nombre` - Obligatorio

---

## ⚠️ ERRORES COMUNES

### Error: "El nombre es requerido"
**Solución:** Llenar la columna marcada con *

### Error: "El email no tiene un formato válido"
**Solución:** Usar formato: usuario@dominio.com

### Error: "Ya existe"
**Solución:** Cambiar el valor duplicado (email, RFC, número empleado)

### Error: "El turno debe ser..."
**Solución:** Usar exactamente: Matutino, Vespertino, Nocturno o Mixto

### Error: "Archivo CSV inválido"
**Solución:** 
- Guardar como CSV separado por comas
- Usar codificación UTF-8
- No modificar nombres de columnas

---

## 💡 TIPS

### ✅ HACER:
- Usar plantillas proporcionadas
- Respetar nombres de columnas
- Llenar campos obligatorios (*)
- Revisar formato de email
- Guardar como CSV UTF-8

### ❌ NO HACER:
- Modificar nombres de columnas
- Dejar vacíos campos obligatorios
- Usar formatos de email inválidos
- Duplicar valores únicos

---

## 📞 SOPORTE

Si encuentras problemas:
1. Revisa el mensaje de error
2. Verifica el número de línea indicado
3. Compara con la plantilla de ejemplo
4. Corrige y vuelve a intentar

---

**¡Listo para usar!** 🎉
