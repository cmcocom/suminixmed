# 🔍 Diagnóstico: Reporte de Salidas por Cliente - Datos Incompletos

**Fecha**: 5 de noviembre de 2025  
**Problema**: El reporte de salidas por cliente no muestra información completa en períodos largos  
**Áreas afectadas**: Agrupación por cliente y por categorías  

## 📊 Análisis Realizado

### 1. **Verificación de Datos en Base**
- **Total salidas**: 10,558 registros
- **Clientes únicos**: 114 clientes  
- **Productos únicos**: 333 productos
- **Período de datos**: 9 oct 2025 - 4 nov 2025
- **Total unidades**: 257,995 unidades

### 2. **Verificación de Queries SQL**
✅ **Los queries están funcionando correctamente**:
- Query agrupado por cliente: 1,850 registros (en 51ms)
- Query agrupado por categoría: 333 registros (en 38ms)  
- Query sin agrupar: 10,558 registros (en 10ms)
- Performance excelente, sin problemas de timeout

### 3. **Verificación de Endpoint API**
✅ **El endpoint principal está bien estructurado**:
- Timeout extendido: 45 segundos
- Sin límites artificiales en el código
- Procesamiento de datos correcto

## 🐛 Posibles Causas del Problema

### **Causa #1: Problema de Filtros de Fecha**
El usuario puede estar aplicando filtros de fecha que no abarcan todos los datos.

**Verificación necesaria**:
```sql
-- Verificar rangos de fechas reales en el sistema
SELECT 
    MIN(fecha_creacion) as primera_salida,
    MAX(fecha_creacion) as ultima_salida,
    DATE_PART('day', MAX(fecha_creacion) - MIN(fecha_creacion)) as dias_span
FROM salidas_inventario;
```

### **Causa #2: Frontend Limitando Resultados**
Aunque no se encontraron límites explícitos en el código, puede haber:
- Paginación no visible
- Límites en el renderizado
- Problemas de memoria en el navegador

### **Causa #3: Filtros Adicionales Aplicados**
El reporte puede estar aplicando filtros que no son evidentes:
- Estados de salida específicos
- Tipos de salida
- Estados de productos

### **Causa #4: Comparación Incorrecta**
El usuario está comparando con el "filtro de salidas" (módulo de movimientos). Las diferencias pueden ser:
- El módulo de salidas muestra datos sin agrupar
- El reporte agrupa por cliente/producto
- Diferentes períodos de consulta

## 🔧 Soluciones Propuestas

### **Solución Inmediata: Agregar Logs de Debug**

Modificar el endpoint para incluir información de debug:

```typescript
// En /api/reportes/salidas-cliente/consolidado/route.ts
console.log('[CONSOLIDADO] Parámetros recibidos:', {
  fechaInicio, fechaFin, clienteId, categoriaId, productoId, agruparPor
});

console.log('[CONSOLIDADO] Filas SQL devueltas:', rows.length);
console.log('[CONSOLIDADO] Resultado final:', resultado.length, 'grupos');
```

### **Solución de Verificación: Endpoint de Comparación**

Crear un endpoint que compare directamente:

```typescript
// GET /api/reportes/salidas-cliente/compare
// Devolver tanto datos agrupados como sin agrupar para comparación
```

### **Solución de Transparencia: Mostrar Contadores**

Agregar en el frontend:
- Total de registros encontrados
- Período exacto consultado  
- Filtros aplicados
- Tiempo de respuesta

```tsx
// En el componente del reporte
<div className="bg-blue-50 p-4 rounded mb-4">
  <h3>Información de Consulta</h3>
  <p>Período: {filtros.fechaInicio} a {filtros.fechaFin}</p>
  <p>Total encontrados: {datosConsolidados.length} {agruparPor}</p>
  <p>Última actualización: {new Date().toLocaleTimeString()}</p>
</div>
```

## 🧪 Plan de Testing

### **Paso 1: Verificar Datos Base**
```sql
-- Contar registros por período
SELECT 
    DATE(fecha_creacion) as fecha,
    COUNT(*) as salidas_dia
FROM salidas_inventario 
WHERE fecha_creacion >= '2025-10-01'
GROUP BY DATE(fecha_creacion)
ORDER BY fecha;
```

### **Paso 2: Comparar Módulos**
1. Abrir módulo de "Movimientos > Salidas"
2. Aplicar mismo filtro de fechas
3. Contar registros manualmente
4. Comparar con reporte agrupado

### **Paso 3: Test de Períodos**
- Período corto (1 día): Verificar coincidencia exacta
- Período medio (1 semana): Verificar agrupación
- Período largo (1 mes): Verificar completitud

### **Paso 4: Verificar Navegador**
- Revisar Console del navegador para errores
- Verificar Network tab para respuesta completa
- Comprobar si hay timeouts de cliente

## 📋 Preguntas para el Usuario

1. **¿En qué período exacto estás viendo el problema?**
   - Fechas específicas de inicio y fin
   
2. **¿Cuántos registros vez en el reporte vs. en movimientos?**
   - Números específicos para comparar

3. **¿El problema ocurre en todos los tipos de agrupación?**
   - Por cliente, por categoría, por producto

4. **¿Hay algún mensaje de error en la consola del navegador?**
   - F12 > Console > ¿hay errores?

5. **¿Cuánto tiempo tarda en cargar el reporte?**
   - ¿Se ve el timeout de 45 segundos?

## 🎯 Próximos Pasos

1. ✅ **Análisis SQL completado** - Los datos están correctos
2. 📋 **Implementar logs de debug** - Para visibilidad completa  
3. 🧪 **Testing con usuario** - Replicar problema exacto
4. 🔧 **Corrección específica** - Basada en hallazgos

---

**Conclusión**: Los datos y queries están correctos. El problema es más probable que esté en:
- Filtros de fecha incorrectos
- Comparación con datos diferentes  
- Problema de visualización en frontend
- Configuración específica del usuario

**Recomendación**: Implementar logs de debug y hacer testing directo con el usuario para identificar el problema específico.