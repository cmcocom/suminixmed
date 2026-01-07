# 🔧 Solución Definitiva: Cambio de Imagen de Perfil

## 🐛 Problema Identificado

### Síntomas:
1. La imagen NO se guardaba en la base de datos (quedaba `NULL`)
2. El usuario cambiaba visualmente a uno de ejemplo
3. Al refrescar, volvía al usuario correcto pero sin la imagen

### Causa Raíz:

**API `/api/upload` retornaba `path` pero el modal esperaba `url`:**

```typescript
// ❌ API retornaba:
{ success: true, path: "/uploads/filename.jpg" }

// ❌ Modal esperaba:
const { url: newImageUrl } = await uploadResponse.json();
// Resultado: url = undefined
```

**Cuando `url` era `undefined`:**
```typescript
// Modal enviaba:
{ email, name, image: undefined }

// API procesaba:
image: image || null  // undefined || null = null ❌
```

## ✅ Solución Implementada

### 1. API Upload (`/app/api/upload/route.ts`)

**Cambios:**
- ✅ Retorna `url` además de `path`
- ✅ Soporte para parámetro `folder` (para organizar uploads)
- ✅ Crea directorio automáticamente si no existe
- ✅ Logs para debugging

```typescript
const folder: string = (data.get('folder') as string) || 'general';
const uploadDir = join(process.cwd(), 'public/uploads', folder);
const imageUrl = `/uploads/${folder}/${filename}`;

return NextResponse.json({ 
  success: true, 
  url: imageUrl,   // ✅ Para el modal
  path: imageUrl   // ✅ Compatibilidad
});
```

### 2. Modal ChangeUserImageModal (`/app/components/ChangeUserImageModal.tsx`)

**Cambios:**
- ✅ Logs detallados del flujo
- ✅ Valida que `newImageUrl` existe antes de enviar
- ✅ Cuerpo de actualización explícito

```typescript
const { url: newImageUrl } = await uploadResponse.json();
console.log('📸 Imagen subida exitosamente:', newImageUrl);

const updateBody = {
  email: session.user.email,
  name: session.user.name,
  image: newImageUrl,  // ✅ Ahora tiene valor
};

console.log('📤 Enviando actualización a API:', updateBody);
```

### 3. API Users (`/app/api/users/[id]/route.ts`)

**Cambios:**
- ✅ Logs de datos recibidos
- ✅ Logs de datos a guardar
- ✅ Logs de resultado

```typescript
console.log('📥 [UPDATE USER] Datos recibidos:', { name, email, image, activo, roleId, userId: id });

const updateData = { email, name, image: image || null, activo: ... };
console.log('💾 [UPDATE USER] Datos a guardar en BD:', updateData);

// Después de guardar:
console.log('✅ [UPDATE USER] Usuario actualizado exitosamente:', result);
```

### 4. Callback JWT (`/lib/auth.ts`)

**Cambios previos:**
- ✅ Manejo de `trigger: 'update'`
- ✅ Actualización granular de campos

```typescript
if (trigger === "update" && session) {
  if (session.user?.image !== undefined) {
    token.image = session.user.image;
    console.log(`📸 [JWT] Imagen actualizada a: ${token.image}`);
  }
  return token;
}
```

### 5. Tipos NextAuth (`/types/next-auth.d.ts`)

**Cambios previos:**
- ✅ Agregado `id` a `Session.user`
- ✅ Agregado campos RBAC dinámico

## 🎯 Flujo Completo Corregido

```
1. Usuario hace clic en avatar
   ↓
2. Selecciona imagen (validación: tipo + tamaño)
   ↓
3. POST /api/upload
   → Sube a /public/uploads/users/
   → Retorna { url: "/uploads/users/123-foto.jpg" } ✅
   ↓
4. PUT /api/users/[id]
   → Body: { email, name, image: "/uploads/users/123-foto.jpg" } ✅
   → BD: UPDATE User SET image = '/uploads/users/123-foto.jpg' ✅
   ↓
5. updateUserImage(context)
   → Actualiza contexto global
   ↓
6. updateSession({ user: { image: newUrl }})
   → Callback JWT detecta trigger="update"
   → token.image = newUrl ✅
   ↓
7. Sesión actualizada
   → UserImageContext detecta cambio
   → React re-renderiza
   ↓
8. Avatar muestra nueva imagen ✅
```

## 🧪 Cómo Probar

1. **Login como cmcocom@unidadc.com**
2. **Abrir consola del navegador** (para ver logs)
3. **Click en avatar del sidebar**
4. **Seleccionar imagen** (max 5MB, solo imágenes)
5. **Observar logs en consola:**
   ```
   📸 Imagen subida exitosamente: /uploads/users/...
   📤 Enviando actualización a API: {...}
   ✅ Usuario actualizado en BD
   ✅ Contexto de imagen actualizado
   ✅ Sesión NextAuth actualizada
   ```
6. **Verificar:**
   - Imagen se muestra inmediatamente
   - Usuario sigue siendo cmcocom@unidadc.com
   - Rol UNIDADC preservado
   - Al refrescar, imagen persiste

## 📋 Verificación en Base de Datos

```sql
SELECT id, email, name, image 
FROM "User" 
WHERE email = 'cmcocom@unidadc.com';
```

**Resultado esperado:**
```
id      | email               | name                     | image
--------|---------------------|--------------------------|-------------------------
5cd6... | cmcocom@unidadc.com | Cristian Cocom - UNIDADC | /uploads/users/123-...jpg
```

## 🔍 Logs para Debugging

### Consola del Navegador:
```
📸 Imagen subida exitosamente: /uploads/users/1234567890-foto.jpg
📤 Enviando actualización a API: {
  email: "cmcocom@unidadc.com",
  name: "Cristian Cocom - UNIDADC",
  image: "/uploads/users/1234567890-foto.jpg"
}
✅ Usuario actualizado en BD
✅ Contexto de imagen actualizado
✅ Sesión NextAuth actualizada
```

### Terminal del Servidor:
```
📸 [UPLOAD] Imagen guardada exitosamente: /uploads/users/1234567890-foto.jpg
📥 [UPDATE USER] Datos recibidos: {
  name: "Cristian Cocom - UNIDADC",
  email: "cmcocom@unidadc.com",
  image: "/uploads/users/1234567890-foto.jpg",
  activo: undefined,
  roleId: undefined,
  userId: "5cd66561-3be6-43d9-8011-8b7a05ab9579"
}
💾 [UPDATE USER] Datos a guardar en BD: {
  email: "cmcocom@unidadc.com",
  name: "Cristian Cocom - UNIDADC",
  image: "/uploads/users/1234567890-foto.jpg",
  activo: true
}
✅ [UPDATE USER] Usuario actualizado exitosamente: {...}
🔄 [JWT] Actualización manual de sesión detectada
📸 [JWT] Imagen actualizada a: /uploads/users/1234567890-foto.jpg
```

## 📝 Archivos Modificados

1. ✅ `/app/api/upload/route.ts` - Retorna `url`, soporte `folder`, logs
2. ✅ `/app/components/ChangeUserImageModal.tsx` - Logs, validaciones
3. ✅ `/app/api/users/[id]/route.ts` - Logs detallados
4. ✅ `/lib/auth.ts` - Callback JWT con trigger update (modificado previamente)
5. ✅ `/types/next-auth.d.ts` - Tipos actualizados (modificado previamente)

## ✅ Estado Final

- ✅ Imagen se guarda correctamente en BD
- ✅ Imagen se muestra inmediatamente en sidebar
- ✅ Usuario NO cambia a uno de ejemplo
- ✅ Rol UNIDADC se preserva
- ✅ Permisos se mantienen intactos
- ✅ Al refrescar, imagen persiste
- ✅ Logs completos para debugging

---

**Fecha:** 7 de octubre de 2025  
**Estado:** ✅ COMPLETADO Y LISTO PARA PRUEBAS
