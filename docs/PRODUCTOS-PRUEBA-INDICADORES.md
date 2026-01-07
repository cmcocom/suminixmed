# 📊 PRODUCTOS DE PRUEBA CREADOS PARA INDICADORES DEL DASHBOARD

**Fecha de creación:** 23 de octubre de 2025  
**Total de productos:** 12 productos nuevos

---

## 🔴 INDICADOR 1: PRODUCTOS AGOTADOS (2 productos)

### Producto 1: GUANTES QUIRÚRGICOS LATEX TALLA M - AGOTADO
- **Clave:** AGT-001
- **Stock actual:** 0 unidades
- **Punto de reorden:** 10 unidades
- **Cantidad mínima:** 5 unidades
- **Precio:** $150.00
- **Estado:** ⛔ AGOTADO

### Producto 2: JERINGAS DESECHABLES 10ML - AGOTADO
- **Clave:** AGT-002
- **Stock actual:** 0 unidades
- **Punto de reorden:** 20 unidades
- **Cantidad mínima:** 10 unidades
- **Precio:** $25.00
- **Estado:** ⛔ AGOTADO

---

## 🟠 INDICADOR 2: PRODUCTOS POR AGOTARSE (3 productos)

### Producto 1: ALCOHOL EN GEL 500ML - POR AGOTARSE
- **Clave:** PAG-001
- **Stock actual:** 3 unidades
- **Punto de reorden:** 10 unidades (bajo el umbral)
- **Cantidad mínima:** 5 unidades
- **Precio:** $80.00
- **Estado:** ⚠️ POR AGOTARSE

### Producto 2: CUBREBOCAS N95 - POR AGOTARSE
- **Clave:** PAG-002
- **Stock actual:** 5 unidades
- **Punto de reorden:** 15 unidades (bajo el umbral)
- **Cantidad mínima:** 10 unidades
- **Precio:** $35.00
- **Estado:** ⚠️ POR AGOTARSE

### Producto 3: TERMÓMETRO DIGITAL - POR AGOTARSE
- **Clave:** PAG-003
- **Stock actual:** 2 unidades
- **Punto de reorden:** 5 unidades (bajo el umbral)
- **Cantidad mínima:** 3 unidades
- **Precio:** $250.00
- **Estado:** ⚠️ POR AGOTARSE

---

## 🟡 INDICADOR 3: PRODUCTOS CON EXCESO DE STOCK (2 productos)

### Producto 1: GASAS ESTÉRILES 10X10 - EXCESO
- **Clave:** EXC-001
- **Stock actual:** 550 unidades
- **Cantidad máxima:** 500 unidades (excedido en 50)
- **Punto de reorden:** 50 unidades
- **Precio:** $15.00
- **Estado:** ⚠️ EXCESO DE STOCK

### Producto 2: VENDAS ELÁSTICAS 5CM - EXCESO
- **Clave:** EXC-002
- **Stock actual:** 320 unidades
- **Cantidad máxima:** 300 unidades (excedido en 20)
- **Punto de reorden:** 40 unidades
- **Precio:** $45.00
- **Estado:** ⚠️ EXCESO DE STOCK

---

## 🟠 INDICADOR 4: PRODUCTOS PRÓXIMOS A VENCER (3 lotes)

### Lote 1: SUERO FISIOLÓGICO 500ML - VENCE PRONTO
- **Clave:** PXV-001
- **Número de lote:** LOTE-PXV-001
- **Cantidad disponible:** 25 unidades
- **Fecha de vencimiento:** 12/11/2025
- **Días hasta vencer:** 20 días
- **Precio:** $65.00
- **Estado:** ⏰ VENCE EN 20 DÍAS

### Lote 2: SOLUCIÓN INYECTABLE 100ML - VENCE PRONTO
- **Clave:** PXV-002
- **Número de lote:** LOTE-PXV-002
- **Cantidad disponible:** 18 unidades
- **Fecha de vencimiento:** 17/11/2025
- **Días hasta vencer:** 25 días
- **Precio:** $95.00
- **Estado:** ⏰ VENCE EN 25 DÍAS

### Lote 3: MEDICAMENTO ANTIBIÓTICO - VENCE PRONTO
- **Clave:** PXV-003
- **Número de lote:** LOTE-PXV-003
- **Cantidad disponible:** 12 unidades
- **Fecha de vencimiento:** 2/11/2025
- **Días hasta vencer:** 10 días
- **Precio:** $180.00
- **Estado:** 🚨 VENCE EN 10 DÍAS (CRÍTICO)

---

## 🔴 INDICADOR 5: PRODUCTOS VENCIDOS (2 lotes)

### Lote 1: ANALGÉSICO CADUCADO - VENCIDO
- **Clave:** VEN-001
- **Número de lote:** LOTE-VEN-001
- **Cantidad disponible:** 8 unidades
- **Fecha de vencimiento:** 13/10/2025
- **Días vencido:** 10 días
- **Precio:** $120.00
- **Estado:** ❌ VENCIDO HACE 10 DÍAS

### Lote 2: JARABE PARA TOS - VENCIDO
- **Clave:** VEN-002
- **Número de lote:** LOTE-VEN-002
- **Cantidad disponible:** 5 unidades
- **Fecha de vencimiento:** 23/9/2025
- **Días vencido:** 30 días
- **Precio:** $85.00
- **Estado:** ❌ VENCIDO HACE 30 DÍAS

---

## 📊 RESUMEN DE CONTADORES EN DASHBOARD

| Indicador | Cantidad | Estado |
|-----------|----------|--------|
| 🔴 Productos Agotados | 79 | Incluye 2 nuevos + existentes |
| 🟠 Productos Por Agotarse | 10 | Incluye 3 nuevos + existentes |
| 🟡 Productos Exceso Stock | 12 | Incluye 2 nuevos + existentes |
| 🟠 Próximos a Vencer | 4 lotes | Incluye 3 nuevos + 1 previo |
| 🔴 Productos Vencidos | 2 lotes | 2 lotes nuevos |

---

## 🎯 VERIFICACIÓN EN DASHBOARD

### Accede a: http://localhost:3000/dashboard

**Verifica que cada indicador muestre:**

1. **Productos Agotados (79)**
   - Click en el indicador debe mostrar modal
   - Modal debe listar productos con cantidad = 0
   - NO debe mostrar precios ✅

2. **Productos Por Agotarse (10)**
   - Click en el indicador debe mostrar modal
   - Modal debe listar productos bajo punto de reorden
   - NO debe mostrar precios ✅

3. **Productos con Exceso (12)**
   - Click en el indicador debe mostrar modal
   - Modal debe listar productos que exceden cantidad máxima
   - NO debe mostrar precios ✅

4. **Productos Próximos a Vencer (4)**
   - Click en el indicador debe mostrar modal
   - Modal debe mostrar: Producto, Lote, Fecha Vencimiento, Días restantes
   - NO debe mostrar precios ✅

5. **Productos Vencidos (2)**
   - Click en el indicador debe mostrar modal
   - Modal debe mostrar productos ya vencidos con stock disponible
   - Badge "Acción inmediata requerida"
   - NO debe mostrar precios ✅

---

## 📝 NOTAS IMPORTANTES

1. **Todos los modales han sido limpiados** y ya no muestran información de precios
2. Los productos se crearon con claves únicas para fácil identificación (AGT-*, PAG-*, EXC-*, PXV-*, VEN-*)
3. Los lotes próximos a vencer están distribuidos en diferentes rangos (10, 20, 25 días)
4. Los lotes vencidos tienen diferentes días de caducidad (10 y 30 días atrás)
5. Cada categoría tiene 2-3 productos para mostrar variedad sin sobrecargar

---

## 🗑️ LIMPIEZA DE DATOS DE PRUEBA

Si necesitas eliminar estos productos de prueba, ejecuta:

```sql
DELETE FROM Inventario WHERE clave IN (
  'AGT-001', 'AGT-002',
  'PAG-001', 'PAG-002', 'PAG-003',
  'EXC-001', 'EXC-002',
  'PXV-001', 'PXV-002', 'PXV-003',
  'VEN-001', 'VEN-002'
);
```

O usa el script: `node limpiar-datos-prueba.mjs` (si existe)

---

✅ **SISTEMA COMPLETAMENTE POBLADO Y LISTO PARA DEMOSTRACIÓN**
