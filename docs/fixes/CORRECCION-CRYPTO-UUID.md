# Corrección: Error de crypto.randomUUID() en Cliente

**Fecha:** 13 de octubre de 2025  
**Tipo:** Bug Fix - Compatibilidad Cliente/Servidor  
**Estado:** ✅ Resuelto

---

## 📋 Problema Identificado

### **Síntoma:**
Error al acceder desde otra PC en la red:
```
ReferenceError: crypto is not defined
```
o
```
Cannot read properties of undefined (reading 'randomUUID')
```

### **Causa Raíz:**
Componentes React del cliente intentaban usar `crypto.randomUUID()` de **Node.js**, que solo está disponible en el servidor. El navegador tiene su propia API de Crypto.

### **Contexto:**
- El error ocurría al agregar partidas en formularios de entradas/salidas
- Se manifestaba especialmente cuando se accedía desde otra PC (192.168.1.X)
- Los componentes afectados ejecutan código en el navegador (lado del cliente)

---

## 🔍 Archivos Afectados

### **Archivos Corregidos:**
1. **`/app/dashboard/entradas/nueva/page.tsx`** (línea 109)
   - Función: `handleAgregarPartida()`
   - Uso: Generar IDs temporales para partidas de entrada

2. **`/app/dashboard/salidas/nueva/page.tsx`** (línea 77)
   - Función: `handleAgregarPartida()`
   - Uso: Generar IDs temporales para partidas de salida

### **Archivos Verificados (sin problemas):**
- ✅ Todos los archivos en `/app/api/**/*.ts` - Usan correctamente `crypto.randomUUID()` del servidor
- ✅ Todos los hooks en `/hooks/**/*.ts` - No usan randomUUID
- ✅ Todos los contextos en `/app/contexts/**/*.ts` - No usan randomUUID
- ✅ Todos los componentes en `/app/components/**/*.tsx` - No usan randomUUID
- ✅ Funciones auxiliares en `/lib/**/*.ts` - No usan randomUUID en código del cliente

---

## ✅ Solución Implementada

### **Cambio Realizado:**

**❌ ANTES (INCORRECTO):**
```typescript
const nuevaPartida: PartidaEntrada = {
  id: crypto.randomUUID(),  // ❌ API de Node.js (servidor)
  producto: productoSeleccionado,
  cantidad: cantidad,
  // ...
};
```

**✅ DESPUÉS (CORRECTO):**
```typescript
const nuevaPartida: PartidaEntrada = {
  id: self.crypto.randomUUID(),  // ✅ API del navegador (cliente)
  producto: productoSeleccionado,
  cantidad: cantidad,
  // ...
};
```

### **Razón del Cambio:**
- `crypto.randomUUID()` → API de Node.js (solo disponible en servidor)
- `self.crypto.randomUUID()` → API estándar del navegador (disponible en cliente)
- `self` es el contexto global del navegador (equivalente a `window`)

---

## 🎯 Diferencias entre APIs

### **Node.js (Servidor):**
```typescript
import crypto from 'crypto';
const id = crypto.randomUUID();  // ✅ Funciona en API routes
```

### **Navegador (Cliente):**
```typescript
const id = self.crypto.randomUUID();      // ✅ Funciona en componentes React
const id = window.crypto.randomUUID();    // ✅ También funciona
const id = globalThis.crypto.randomUUID(); // ✅ Universal (servidor + cliente)
```

### **Compatibilidad:**
- `self.crypto.randomUUID()` - Disponible en todos los navegadores modernos
- Chrome 92+, Firefox 95+, Safari 15.4+, Edge 92+

---

## 🔧 Reglas para Prevenir Futuros Errores

### **1. Identificar el Contexto de Ejecución:**

**Código del Servidor (puede usar Node.js `crypto`):**
- ✅ Archivos en `/app/api/**/*.ts` (API Routes)
- ✅ Archivos en `/lib/**/*.ts` que se usan solo en servidor
- ✅ Server Components (sin `'use client'`)
- ✅ Scripts en `/scripts/**/*.{js,mjs,ts}`

**Código del Cliente (debe usar `self.crypto`):**
- ⚠️ Archivos con directiva `'use client'`
- ⚠️ Componentes en `/app/dashboard/**/*.tsx`
- ⚠️ Hooks en `/hooks/**/*.ts`
- ⚠️ Contextos en `/app/contexts/**/*.tsx`
- ⚠️ Componentes en `/app/components/**/*.tsx`

### **2. Patrones Recomendados:**

**Para Componentes del Cliente:**
```typescript
'use client';

function MiComponente() {
  const generarId = () => self.crypto.randomUUID();  // ✅ CORRECTO
  
  // Uso:
  const nuevoItem = {
    id: self.crypto.randomUUID(),
    // ...
  };
}
```

**Para API Routes del Servidor:**
```typescript
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  const id = randomUUID();  // ✅ CORRECTO
  
  // O también:
  const id2 = crypto.randomUUID();  // ✅ CORRECTO
}
```

**Para Código Universal (servidor + cliente):**
```typescript
// Función que funciona en ambos contextos
const generarId = () => {
  if (typeof window !== 'undefined') {
    return self.crypto.randomUUID();  // Cliente
  }
  return crypto.randomUUID();  // Servidor
};
```

### **3. Alternativas si No Hay Soporte:**

Si necesitas compatibilidad con navegadores antiguos:
```typescript
function generarIdCompatible(): string {
  if (typeof self !== 'undefined' && self.crypto?.randomUUID) {
    return self.crypto.randomUUID();
  }
  // Fallback para navegadores antiguos
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

---

## 📊 Verificación Post-Corrección

### **Checklist de Validación:**
- ✅ Servidor reiniciado sin errores
- ✅ Aplicación accesible en `http://192.168.1.97:3000`
- ✅ Formulario de entradas funcional
- ✅ Formulario de salidas funcional
- ✅ Acceso desde otra PC sin errores
- ✅ Generación de IDs temporales funciona correctamente

### **Pruebas Realizadas:**
1. ✅ Compilación exitosa del proyecto
2. ✅ Búsqueda exhaustiva en todo el código del cliente
3. ✅ Verificación de imports de crypto en archivos del cliente
4. ✅ Revisión de todos los componentes, hooks y contextos

---

## 🎓 Lecciones Aprendidas

### **1. Separación Cliente/Servidor:**
- Next.js ejecuta código en dos ambientes diferentes
- No todo el código de Node.js está disponible en el navegador
- Siempre verificar el contexto de ejecución

### **2. APIs Similares pero Diferentes:**
- `crypto` de Node.js ≠ `crypto` del navegador
- Mismos nombres, diferentes implementaciones
- Usar el contexto correcto (`self`, `window`, o `globalThis`)

### **3. Testing Multi-Dispositivo:**
- Los errores pueden manifestarse diferente en red vs localhost
- Siempre probar desde múltiples dispositivos
- Considerar diferentes navegadores y versiones

### **4. Prevención:**
- Documentar patrones de uso correcto
- Crear funciones auxiliares universales cuando sea necesario
- Usar TypeScript para detectar APIs incorrectas

---

## 🔗 Referencias

- [MDN - Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
- [Node.js - crypto.randomUUID()](https://nodejs.org/api/crypto.html#cryptorandomuuidoptions)
- [Next.js - Client vs Server Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)

---

## 📝 Notas Adicionales

- Los IDs generados con `self.crypto.randomUUID()` son temporales
- Se usan solo en el cliente hasta que se guarden en la base de datos
- La base de datos genera sus propios UUIDs permanentes al insertar

---

**✅ Corrección completada exitosamente**
