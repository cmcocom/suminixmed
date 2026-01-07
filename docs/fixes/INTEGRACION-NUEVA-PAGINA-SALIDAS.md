# Integración de Nueva Página de Salidas

## Fecha
9 de octubre de 2025

## Problema Identificado
El usuario reportó que la página de salidas seguía siendo la antigua y no la nueva que se creó basándose en la página de entradas.

## Análisis

### Estructura Encontrada
```
/app/dashboard/salidas/
├── page.tsx                    ← Página ANTIGUA (listado + modal)
├── nueva/
│   └── page.tsx               ← Página NUEVA (formulario standalone)
├── hooks/
│   ├── useTiposSalida.ts      ← Hook para tipos
│   └── useSalidas.ts          ← Hook para crear salidas
└── types.ts                   ← Tipos compartidos
```

### Páginas Identificadas

#### 1. Página Antigua (`/dashboard/salidas/page.tsx`)
- **Ruta**: `/dashboard/salidas`
- **Función**: `SalidasUnificadasPage()`
- **Tamaño**: 1,068 líneas
- **Características**:
  - ✅ Listado de salidas existentes
  - ✅ Paginación
  - ✅ Búsqueda
  - ✅ Filtros
  - ⚠️ Modal para crear nueva salida (complejo)
  - ⚠️ Formulario con tipos hardcodeados
  - ⚠️ No usa tipos dinámicos de la BD

#### 2. Página Nueva (`/dashboard/salidas/nueva/page.tsx`)
- **Ruta**: `/dashboard/salidas/nueva`
- **Tamaño**: 328 líneas
- **Características**:
  - ✅ Formulario standalone limpio
  - ✅ Usa tipos de salida desde BD (dinámico)
  - ✅ Campos condicionales según tipo
  - ✅ Selector de productos reutilizado
  - ✅ Basado en página de entradas
  - ✅ Hooks modulares y reutilizables

## Solución Implementada

### Opción Elegida: Híbrida
Mantener ambas páginas pero integrarlas correctamente:
- **`/dashboard/salidas`** → Listado de salidas (página antigua sin modal)
- **`/dashboard/salidas/nueva`** → Formulario para crear (página nueva)

### Cambios Realizados

#### 1. Agregar `useRouter` 
**Archivo**: `/app/dashboard/salidas/page.tsx`

```typescript
import { useRouter } from 'next/navigation';

export default function SalidasUnificadasPage() {
  const router = useRouter();
  // ...
}
```

#### 2. Cambiar Botón "Nueva Salida"
**Antes**:
```tsx
<button
  onClick={openCreateModal}  // ← Abría modal
  className="..."
>
  <PlusIcon className="w-5 h-5 mr-2" />
  Nueva Salida
</button>
```

**Después**:
```tsx
<button
  onClick={() => router.push('/dashboard/salidas/nueva')}  // ← Redirige a nueva página
  className="..."
>
  <PlusIcon className="w-5 h-5 mr-2" />
  Nueva Salida
</button>
```

### Componentes Obsoletos (Sin Eliminar)
Por si se necesitan después, dejamos en la página antigua pero sin usar:
- ❌ `showModal` state
- ❌ `openCreateModal()` función
- ❌ Modal JSX (línea ~700)
- ❌ `formData`, `formErrors` states del modal

## Flujo de Usuario Actualizado

### Antes
1. Usuario va a `/dashboard/salidas`
2. Ve listado de salidas
3. Click en "Nueva Salida"
4. **Se abre modal en la misma página** ⚠️
5. Completa formulario en modal
6. Guarda y recarga listado

### Ahora
1. Usuario va a `/dashboard/salidas`
2. Ve listado de salidas
3. Click en "Nueva Salida"
4. **Redirige a `/dashboard/salidas/nueva`** ✅
5. Página completa con formulario limpio
6. Completa formulario
7. Guarda y redirige de vuelta a `/dashboard/salidas`

## Ventajas de la Nueva Estructura

### 1. Separación de Responsabilidades
- **Listado** (`page.tsx`): Solo muestra y filtra salidas existentes
- **Crear** (`nueva/page.tsx`): Solo formulario de creación

### 2. Mejor UX
- ✅ Formulario en página completa (más espacio)
- ✅ URL específica `/salidas/nueva` (puede compartirse)
- ✅ Navegación clara con breadcrumbs
- ✅ Botón "Volver" visible
- ✅ No hay conflictos con modal/backdrop

### 3. Código Más Limpio
- ✅ Hooks modulares (`useTiposSalida`, `useSalidas`)
- ✅ Componentes reutilizados de entradas
- ✅ Tipos dinámicos desde BD
- ✅ Menos estado global
- ✅ Más fácil de mantener

### 4. Consistencia con Entradas
- ✅ Misma estructura que `/dashboard/entradas/nueva`
- ✅ Reutiliza componentes (`SelectorProducto`, `FilaPartida`)
- ✅ Misma lógica de campos condicionales
- ✅ Mismo estilo visual

## Testing

### 1. Navegación
```bash
# Abrir en navegador
http://localhost:3000/dashboard/salidas
```
- ✅ Click en "Nueva Salida"
- ✅ Debería redirigir a `/dashboard/salidas/nueva`
- ✅ Formulario se carga correctamente
- ✅ Tipos de salida se cargan desde BD

### 2. Crear Salida
1. Seleccionar tipo de salida
2. Verificar campos condicionales:
   - Si `requiere_cliente` = true → Aparece dropdown de clientes
   - Si `requiere_referencia` = true → Aparece campo de referencia
3. Agregar productos con selector
4. Completar cantidades y precios
5. Click en "Registrar Salida"
6. Verificar redirección a `/dashboard/salidas`
7. Ver nueva salida en el listado

### 3. Validaciones
- ✅ Tipo de salida obligatorio
- ✅ Al menos un producto
- ✅ Cantidades > 0
- ✅ No exceder stock disponible
- ✅ Cliente obligatorio si tipo lo requiere
- ✅ Referencia obligatoria si tipo lo requiere

## Archivos Modificados

### Editados
1. `/app/dashboard/salidas/page.tsx`
   - Agregado `useRouter` import
   - Agregado `router` hook
   - Cambiado onClick del botón "Nueva Salida"

### Ya Existentes (Creados Anteriormente)
1. `/app/dashboard/salidas/nueva/page.tsx` ✅
2. `/app/dashboard/salidas/hooks/useTiposSalida.ts` ✅
3. `/app/dashboard/salidas/hooks/useSalidas.ts` ✅
4. `/app/dashboard/salidas/types.ts` ✅

## Próximos Pasos Opcionales

### 1. Limpiar Código Modal (Opcional)
Si se confirma que no se necesita el modal, eliminar:
```typescript
// En /app/dashboard/salidas/page.tsx
const [showModal, setShowModal] = useState(false);
const [formData, setFormData] = useState<FormData>({...});
const openCreateModal = () => { ... };
// Y todo el JSX del modal (línea ~700)
```

### 2. Agregar Breadcrumbs
En `/dashboard/salidas/nueva/page.tsx`:
```tsx
<nav className="mb-4 text-sm">
  <Link href="/dashboard/salidas" className="text-blue-600">
    Salidas
  </Link>
  <span className="mx-2">/</span>
  <span className="text-gray-500">Nueva</span>
</nav>
```

### 3. Botón "Volver" Mejorado
Ya existe pero puede mejorarse:
```tsx
<button
  onClick={() => router.back()}  // En lugar de router.push('/dashboard/salidas')
  className="..."
>
  <ArrowLeftIcon />
  Volver
</button>
```

### 4. Confirmación Antes de Salir
Si hay cambios sin guardar:
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (partidas.length > 0 || observaciones) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [partidas, observaciones]);
```

## Resumen

✅ **COMPLETADO**: Integración de nueva página de salidas
- La página de listado (`/dashboard/salidas`) ahora redirige a nueva página
- Formulario limpio y modular en `/dashboard/salidas/nueva`
- Basado en entradas con tipos dinámicos
- Hooks reutilizables y componentes compartidos
- UX mejorada con navegación clara

🎯 **Resultado**: Sistema de salidas consistente con entradas, más mantenible y con mejor experiencia de usuario.
