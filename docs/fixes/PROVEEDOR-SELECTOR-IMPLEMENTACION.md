# Implementación de Selector de Proveedor para Productos

## Resumen de Cambios Completados

### 1. Base de Datos ✅

**Tabla `Inventario`:**
- ✅ Agregada columna `proveedor_id` (TEXT, nullable)
- ✅ Creado índice `Inventario_proveedor_id_idx` para optimizar consultas
- ✅ Se mantiene campo `proveedor` (TEXT) para compatibilidad con datos existentes

**SQL Ejecutado:**
```sql
ALTER TABLE "Inventario" ADD COLUMN "proveedor_id" TEXT;
CREATE INDEX "Inventario_proveedor_id_idx" ON "Inventario"("proveedor_id");
```

### 2. Schema de Prisma ✅

**Modelo `Inventario`:**
```prisma
model Inventario {
  // ... campos existentes ...
  proveedor     String?      // Campo original (texto libre)
  proveedor_id  String?      // Nuevo: FK a proveedores
  proveedor_rel proveedores? @relation(fields: [proveedor_id], references: [id])
  
  @@index([proveedor_id])
}
```

**Modelo `proveedores`:**
```prisma
model proveedores {
  // ... campos existentes ...
  inventarios Inventario[]  // Relación inversa
}
```

### 3. API Endpoints ✅

**POST /api/inventario** (Crear producto):
- ✅ Acepta parámetro `proveedor_id` (opcional)
- ✅ Mantiene compatibilidad con `proveedor` (texto)
- ✅ Ambos campos se guardan en la base de datos

**PUT /api/inventario/[id]** (Actualizar producto):
- ✅ Acepta parámetro `proveedor_id` (opcional)
- ✅ Mantiene compatibilidad con `proveedor` (texto)
- ✅ Ambos campos se actualizan

**GET /api/proveedores** (Listar proveedores):
- ✅ Endpoint ya existe y funciona
- ✅ Retorna proveedores activos con paginación
- ✅ Soporta búsqueda y filtros

### 4. Pendiente: Frontend ⏳

**Cambios necesarios en `/app/dashboard/productos/page.tsx`:**

1. **Agregar estado para proveedores:**
```typescript
interface Proveedor {
  id: string;
  nombre: string;
  rfc?: string;
  email?: string;
}

const [proveedores, setProveedores] = useState<Proveedor[]>([]);
```

2. **Cargar proveedores al montar componente:**
```typescript
useEffect(() => {
  const fetchProveedores = async () => {
    try {
      const response = await fetch('/api/proveedores?activo=true&limit=1000');
      if (response.ok) {
        const data = await response.json();
        setProveedores(data.proveedores || []);
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };
  fetchProveedores();
}, []);
```

3. **Modificar FormData para incluir proveedor_id:**
```typescript
interface FormData {
  // ... campos existentes ...
  proveedor: string;     // Mantener para compatibilidad
  proveedor_id: string;  // Nuevo: ID del proveedor seleccionado
}
```

4. **Reemplazar input de texto con select/combobox:**
```tsx
{/* Proveedor - Selector */}
<div>
  <label htmlFor="proveedor_id" className="block text-sm font-semibold text-gray-700 mb-2">
    Proveedor *
  </label>
  <select
    id="proveedor_id"
    name="proveedor_id"
    value={formData.proveedor_id}
    onChange={(e) => {
      const proveedorId = e.target.value;
      const proveedor = proveedores.find(p => p.id === proveedorId);
      setFormData({
        ...formData,
        proveedor_id: proveedorId,
        proveedor: proveedor?.nombre || ''
      });
    }}
    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
      formErrors.proveedor_id ? 'border-red-500' : 'border-gray-300'
    } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
    disabled={modalMode === 'view'}
  >
    <option value="">Seleccionar proveedor...</option>
    {proveedores.map(proveedor => (
      <option key={proveedor.id} value={proveedor.id}>
        {proveedor.nombre}
        {proveedor.rfc && ` - ${proveedor.rfc}`}
      </option>
    ))}
  </select>
  {formErrors.proveedor_id && (
    <p className="mt-1 text-sm text-red-600">{formErrors.proveedor_id}</p>
  )}
</div>
```

5. **Actualizar validación:**
```typescript
// Reemplazar validación de formData.proveedor con:
if (!formData.proveedor_id) {
  errors.proveedor_id = 'Debe seleccionar un proveedor';
  valid = false;
}
```

6. **Actualizar funciones de crear/editar producto:**
```typescript
// En handleCreateProducto y handleEditProducto
const productData = {
  // ... otros campos ...
  proveedor: formData.proveedor,
  proveedor_id: formData.proveedor_id
};
```

### 5. Mejoras Adicionales Sugeridas

**Opción A: Selector con búsqueda (react-select):**
```bash
npm install react-select
```

```tsx
import Select from 'react-select';

<Select
  options={proveedores.map(p => ({
    value: p.id,
    label: `${p.nombre}${p.rfc ? ` - ${p.rfc}` : ''}`
  }))}
  value={proveedores.find(p => p.id === formData.proveedor_id) 
    ? { value: formData.proveedor_id, label: formData.proveedor }
    : null}
  onChange={(option) => {
    setFormData({
      ...formData,
      proveedor_id: option?.value || '',
      proveedor: option?.label.split(' - ')[0] || ''
    });
  }}
  isClearable
  isSearchable
  placeholder="Buscar proveedor..."
  noOptionsMessage={() => "No se encontraron proveedores"}
/>
```

**Opción B: Combobox nativo con datalist:**
```tsx
<input
  list="proveedores-list"
  id="proveedor"
  value={formData.proveedor}
  onChange={(e) => {
    const nombre = e.target.value;
    const proveedor = proveedores.find(p => p.nombre === nombre);
    setFormData({
      ...formData,
      proveedor: nombre,
      proveedor_id: proveedor?.id || ''
    });
  }}
  className="w-full px-4 py-3 border rounded-lg"
  placeholder="Buscar o escribir proveedor..."
/>
<datalist id="proveedores-list">
  {proveedores.map(p => (
    <option key={p.id} value={p.nombre}>
      {p.rfc && `RFC: ${p.rfc}`}
    </option>
  ))}
</datalist>
```

### 6. Migración de Datos Existentes (Opcional)

**Script para migrar proveedores de texto a tabla:**

```sql
-- 1. Insertar proveedores únicos desde Inventario
INSERT INTO proveedores (id, nombre, activo, "createdAt", "updatedAt")
SELECT 
  'prov_' || MD5(LOWER(TRIM(proveedor)))::text,
  TRIM(proveedor),
  true,
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT proveedor
  FROM "Inventario"
  WHERE proveedor IS NOT NULL 
    AND proveedor != ''
) AS unique_proveedores
ON CONFLICT (nombre) DO NOTHING;

-- 2. Actualizar Inventario con IDs de proveedores
UPDATE "Inventario" i
SET proveedor_id = p.id
FROM proveedores p
WHERE LOWER(TRIM(i.proveedor)) = LOWER(TRIM(p.nombre))
  AND i.proveedor IS NOT NULL
  AND i.proveedor != '';
```

### 7. Testing

**Casos de prueba:**
- [ ] Crear producto con proveedor seleccionado del dropdown
- [ ] Editar producto y cambiar proveedor
- [ ] Verificar que se guarden tanto `proveedor` como `proveedor_id`
- [ ] Validar que productos existentes sigan mostrando proveedor (texto)
- [ ] Probar búsqueda de productos por proveedor
- [ ] Verificar filtros y ordenamiento con nuevo campo

### 8. Estado Actual

✅ **Completado:**
- Cambios en base de datos (columna + índice)
- Schema de Prisma actualizado con relaciones
- Cliente de Prisma regenerado
- API endpoints actualizados (POST y PUT)
- Verificación de API de proveedores existente

⏳ **Pendiente:**
- Actualizar frontend con selector de proveedores
- Agregar estado y carga de proveedores
- Reemplazar input de texto con selector
- Actualizar validaciones del formulario
- Testing de funcionalidad completa
- (Opcional) Migrar datos existentes

## Próximos Pasos

1. **Implementar cambios en el frontend** según lo documentado arriba
2. **Probar creación de productos** con el nuevo selector
3. **Verificar edición** de productos existentes
4. **(Opcional) Ejecutar script de migración** para datos históricos
5. **Validar** que todo funcione correctamente

## Notas Importantes

- Se mantiene compatibilidad con campo `proveedor` (texto) para productos existentes
- El campo `proveedor_id` es opcional, permite transición gradual
- La relación en Prisma permite consultas optimizadas: `include: { proveedor_rel: true }`
- El índice mejora performance en búsquedas y joins
