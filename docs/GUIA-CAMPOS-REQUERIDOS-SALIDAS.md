# Guía: Campos Requeridos en Salidas de Inventario

**Fecha**: 9 de octubre de 2025  
**Característica**: Campos condicionales según tipo de salida

---

## 📋 Descripción General

El sistema permite configurar **qué tipos de salida requieren campos adicionales** como cliente o referencia externa. Esto es útil para casos como:

- **Servicios Médicos**: Requieren identificar al cliente/paciente
- **Ventas a Cliente**: Requieren identificar al comprador
- **Ajustes de Inventario**: No requieren cliente ni referencia
- **Devoluciones**: Pueden requerir número de referencia

---

## 🎯 Funcionamiento

### 1. Configuración en Tipos de Salida

**Ubicación**: Dashboard → Catálogos → Tipos de Salida

**URL**: `http://localhost:3000/dashboard/catalogos/tipos-salida`

#### Campos de Configuración

Cada tipo de salida tiene dos checkboxes:

```
✅ Requiere Cliente
   ├─ Si está marcado: El campo "Cliente" será obligatorio en la salida
   └─ Si no está marcado: El campo "Cliente" no aparecerá

✅ Requiere Referencia Externa
   ├─ Si está marcado: El campo "Referencia/Folio" será obligatorio
   └─ Si no está marcado: El campo "Referencia/Folio" no aparecerá
```

#### Ejemplo de Configuración

| Tipo de Salida | Requiere Cliente | Requiere Referencia |
|----------------|------------------|---------------------|
| Servicios Médicos Prestados | ✅ Sí | ✅ Sí |
| Venta a Cliente | ✅ Sí | ⬜ No |
| Ajuste de Inventario | ⬜ No | ⬜ No |
| Devolución a Proveedor | ⬜ No | ✅ Sí |

---

## 🔧 Cómo Configurar un Tipo de Salida

### Paso 1: Acceder a la Gestión de Tipos

1. Ve al Dashboard
2. Entra a **Catálogos**
3. Selecciona **Tipos de Salida**

### Paso 2: Crear o Editar un Tipo

#### Para Crear uno Nuevo:

1. Click en **"➕ Nuevo Tipo de Salida"**
2. Llena el formulario:
   ```
   Código: SRV-MED
   Nombre: Servicios Médicos Prestados
   Descripción: Salida de material utilizado en servicios médicos
   Orden: 1
   Estado: Activo
   
   ✅ Requiere Cliente (marcado)
   ✅ Requiere Referencia Externa (marcado)
   ```
3. Click en **"Crear Tipo de Salida"**

#### Para Editar uno Existente:

1. Busca el tipo de salida en la tabla
2. Click en el botón **"✏️ Editar"**
3. Modifica los checkboxes según necesites:
   - **Marca** el checkbox para hacer el campo **obligatorio**
   - **Desmarca** el checkbox para **ocultar** el campo
4. Click en **"Actualizar Tipo de Salida"**

---

## 💡 Ejemplo: Configurar "Servicios Médicos"

### Caso de Uso

> Cuando se registra una salida de material por servicios médicos prestados, **SIEMPRE** se debe:
> 1. Indicar a qué **cliente/paciente** se prestó el servicio
> 2. Incluir un **número de folio** o referencia del servicio

### Configuración

```yaml
Tipo de Salida:
  codigo: "SRV-MED"
  nombre: "Servicios Médicos Prestados"
  descripcion: "Material utilizado en atención médica a pacientes"
  orden: 1
  activo: true
  requiere_cliente: true        # ✅ Cliente obligatorio
  requiere_referencia: true     # ✅ Referencia obligatoria
```

### Resultado en la Página de Salidas

Cuando el usuario seleccione "Servicios Médicos Prestados", verá:

```
┌─────────────────────────────────────────────────────────┐
│ Tipo de Salida *                                        │
│ [Servicios Médicos Prestados ▼]                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Cliente *                                                │
│ (Requerido para Servicios Médicos Prestados)           │
│ [Seleccione un cliente ▼]                              │
│   - Juan Pérez - Hospital General                       │
│   - María López - Clínica Santa Fe                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Referencia/Folio Externo *                              │
│ (Número de orden, folio, etc.)                          │
│ [________________________]                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Comportamiento Dinámico

### Campos Condicionales

La página de salidas **muestra u oculta campos automáticamente**:

#### Si `requiere_cliente = true`:
```tsx
// ✅ Campo de Cliente aparece
<div>
  <label>Cliente *</label>
  <select required>
    <option>Seleccione un cliente</option>
    {/* Lista de clientes */}
  </select>
</div>
```

#### Si `requiere_cliente = false`:
```tsx
// ❌ Campo de Cliente NO aparece
// (completamente oculto del formulario)
```

#### Si `requiere_referencia = true`:
```tsx
// ✅ Campo de Referencia aparece
<div>
  <label>Referencia/Folio Externo *</label>
  <input type="text" required />
</div>
```

#### Si `requiere_referencia = false`:
```tsx
// ❌ Campo de Referencia NO aparece
// (completamente oculto del formulario)
```

---

## 📊 Tabla de Decisión

| Tipo de Salida | ¿Requiere Cliente? | ¿Requiere Referencia? | Campos Visibles |
|----------------|--------------------|-----------------------|-----------------|
| Servicios Médicos | ✅ Sí | ✅ Sí | Cliente + Referencia |
| Venta a Cliente | ✅ Sí | ⬜ No | Solo Cliente |
| Ajuste Inventario | ⬜ No | ⬜ No | Ninguno extra |
| Devolución | ⬜ No | ✅ Sí | Solo Referencia |

---

## 🔍 Código Relevante

### Base de Datos (Prisma Schema)

```prisma
model tipos_salida {
  id                    String    @id @default(uuid())
  codigo                String    @unique
  nombre                String
  descripcion           String?
  activo                Boolean   @default(true)
  orden                 Int       @default(0)
  
  // ⭐ Campos que controlan los requisitos
  requiere_cliente      Boolean   @default(false)  // ✅ Campo clave
  requiere_referencia   Boolean   @default(false)  // ✅ Campo clave
  
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  @@index([requiere_cliente])
}
```

### Página de Gestión (tipos-salida/page.tsx)

```tsx
// Checkboxes de configuración
<div>
  <label className="flex items-center space-x-2 cursor-pointer">
    <input
      type="checkbox"
      checked={formData.requiere_cliente}
      onChange={(e) => setFormData({ 
        ...formData, 
        requiere_cliente: e.target.checked 
      })}
      className="w-4 h-4 text-blue-600"
    />
    <span>Requiere Cliente</span>
  </label>
  <p className="text-xs text-gray-500 ml-6">
    Marcar si este tipo de salida requiere seleccionar un cliente
  </p>
</div>

<div>
  <label className="flex items-center space-x-2 cursor-pointer">
    <input
      type="checkbox"
      checked={formData.requiere_referencia}
      onChange={(e) => setFormData({ 
        ...formData, 
        requiere_referencia: e.target.checked 
      })}
      className="w-4 h-4 text-blue-600"
    />
    <span>Requiere Referencia Externa</span>
  </label>
  <p className="text-xs text-gray-500 ml-6">
    Marcar si requiere número de referencia u orden
  </p>
</div>
```

### Página de Salidas (salidas/page.tsx)

```tsx
// Campo de Cliente (solo si requiere_cliente = true)
{tipoActual?.requiere_cliente && (
  <div className="col-span-full">
    <label>
      Cliente *
      <span className="text-xs text-gray-500 ml-2">
        (Requerido para {tipoActual.nombre})
      </span>
    </label>
    <select
      value={clienteId}
      onChange={(e) => setClienteId(e.target.value)}
      required
    >
      <option value="">Seleccione un cliente</option>
      {clientes.map((cli) => (
        <option key={cli.id} value={cli.id}>
          {cli.nombre}
        </option>
      ))}
    </select>
  </div>
)}

// Campo de Referencia (solo si requiere_referencia = true)
{tipoActual?.requiere_referencia && (
  <div className="col-span-full">
    <label>
      Referencia/Folio Externo *
      <span className="text-xs text-gray-500 ml-2">
        (Número de orden, folio, etc.)
      </span>
    </label>
    <input
      type="text"
      value={referenciaExterna}
      onChange={(e) => setReferenciaExterna(e.target.value)}
      required
    />
  </div>
)}
```

---

## 📁 Archivos Involucrados

| Archivo | Descripción |
|---------|-------------|
| `/prisma/schema.prisma` | Define campos `requiere_cliente` y `requiere_referencia` |
| `/prisma/migrations/20251009_add_requiere_campos_tipos/migration.sql` | Migración que agregó los campos |
| `/app/dashboard/catalogos/tipos-salida/page.tsx` | Página de gestión con checkboxes |
| `/app/api/tipos-salida/route.ts` | API GET/POST que maneja los campos |
| `/app/api/tipos-salida/[id]/route.ts` | API PUT/DELETE para actualizar |
| `/app/dashboard/salidas/page.tsx` | Página que muestra campos condicionalmente |
| `/app/dashboard/salidas/types.ts` | Interface TypeScript con los campos |

---

## ✅ Checklist de Configuración

Para configurar correctamente un tipo de salida que requiere cliente:

- [ ] Acceder a Dashboard → Catálogos → Tipos de Salida
- [ ] Crear nuevo tipo o editar existente
- [ ] Completar datos básicos (código, nombre, descripción)
- [ ] ✅ Marcar checkbox **"Requiere Cliente"**
- [ ] ✅ Marcar checkbox **"Requiere Referencia Externa"** (si aplica)
- [ ] Guardar cambios
- [ ] Verificar en página de Salidas que aparezcan los campos

---

## 🎯 Casos de Uso Comunes

### Caso 1: Servicios Médicos (Requiere ambos)

```yaml
Configuración:
  requiere_cliente: true
  requiere_referencia: true

Resultado:
  - Campo "Cliente" aparece y es obligatorio
  - Campo "Referencia" aparece y es obligatorio
  
Uso:
  - Se registra el paciente que recibió el servicio
  - Se captura el folio de la orden médica
```

### Caso 2: Venta a Cliente (Solo requiere cliente)

```yaml
Configuración:
  requiere_cliente: true
  requiere_referencia: false

Resultado:
  - Campo "Cliente" aparece y es obligatorio
  - Campo "Referencia" NO aparece
  
Uso:
  - Se registra el cliente que compró
  - No se necesita referencia adicional
```

### Caso 3: Ajuste de Inventario (No requiere nada)

```yaml
Configuración:
  requiere_cliente: false
  requiere_referencia: false

Resultado:
  - Campo "Cliente" NO aparece
  - Campo "Referencia" NO aparece
  
Uso:
  - Solo se registra el motivo del ajuste
  - No se asocia a ningún cliente
```

### Caso 4: Devolución (Solo requiere referencia)

```yaml
Configuración:
  requiere_cliente: false
  requiere_referencia: true

Resultado:
  - Campo "Cliente" NO aparece
  - Campo "Referencia" aparece y es obligatorio
  
Uso:
  - No se asocia a cliente
  - Se captura el número de orden de compra o devolución
```

---

## 🚀 Resumen Rápido

### ¿Cómo indicar que una salida requiere cliente?

1. **Ve a**: Dashboard → Catálogos → Tipos de Salida
2. **Edita** el tipo de salida (ej: "Servicios Médicos Prestados")
3. **Marca** el checkbox ✅ **"Requiere Cliente"**
4. **Guarda** los cambios
5. **Prueba**: Al crear una nueva salida de ese tipo, el campo cliente aparecerá obligatorio

### ¿Cómo quitar el requisito de cliente?

1. **Ve a**: Dashboard → Catálogos → Tipos de Salida
2. **Edita** el tipo de salida
3. **Desmarca** el checkbox ⬜ **"Requiere Cliente"**
4. **Guarda** los cambios
5. El campo cliente dejará de aparecer en salidas de ese tipo

---

## 📞 Soporte

Si tienes dudas sobre:
- **Configuración de tipos**: Revisa esta guía en la sección "Cómo Configurar"
- **Campos no aparecen**: Verifica que el checkbox esté marcado y que hayas guardado los cambios
- **Errores al guardar**: Contacta al administrador del sistema

---

**Última actualización**: 9 de octubre de 2025  
**Versión**: 1.0
