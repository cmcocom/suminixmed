-- Script SQL para crear usuario UNIDADC con acceso total
-- Ejecutar con: psql -U usuario -d suminix -f prisma/seed-usuario.sql

BEGIN;

-- 1. Limpiar datos previos del usuario si existen
DELETE FROM rbac_user_roles WHERE user_id IN (SELECT id FROM "User" WHERE email = 'cmcocom@unidadc.com');
DELETE FROM "User" WHERE email = 'cmcocom@unidadc.com';
DELETE FROM rbac_roles WHERE name = 'UNIDADC';

-- 2. Crear usuario UNIDADC
-- Password hasheado: Issste2025! (bcrypt hash de "Issste2025!")
INSERT INTO "User" (
  id,
  clave,
  email,
  password,
  name,
  "activo",
  "is_system_user",
  "emailVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  '5cd66561-3be6-43d9-8011-8b7a05ab9579',
  'cve-888963',
  'cmcocom@unidadc.com',
  '$2a$10$LMkRJZAdpYfi4pEbdHlsmOjwuQScd8CLNK6MK/eTuaeEMj5lc2WEu',  -- Issste2025!
  'Cristian Cocom - UNIDADC',
  true,
  true,
  NOW(),
  NOW(),
  NOW()
);

-- 3. Crear rol UNIDADC
INSERT INTO rbac_roles (
  id,
  name,
  description,
  is_active,
  created_by,
  created_at,
  updated_at
) VALUES (
  'rol-unidadc',
  'UNIDADC',
  'Supervisor con acceso completo - 100%',
  true,
  (SELECT id FROM "User" WHERE email = 'cmcocom@unidadc.com'),
  NOW(),
  NOW()
);

-- 4. Asignar rol al usuario
INSERT INTO rbac_user_roles (
  id,
  user_id,
  role_id,
  assigned_by,
  assigned_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM "User" WHERE email = 'cmcocom@unidadc.com'),
  'rol-unidadc',
  (SELECT id FROM "User" WHERE email = 'cmcocom@unidadc.com'),
  NOW()
);

-- 5. Mostrar resultado
SELECT 
  u.email as "Email",
  u.name as "Nombre",
  r.name as "Rol"
FROM "User" u
JOIN rbac_user_roles ur ON u.id = ur.user_id
JOIN rbac_roles r ON ur.role_id = r.id
WHERE u.email = 'cmcocom@unidadc.com';

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ Usuario creado exitosamente
-- 📧 Email:    cmcocom@unidadc.com
-- 🔑 Clave:    cve-888963
-- 🔒 Password: Issste2025!
-- 👤 Rol:      UNIDADC (Acceso Total 100%)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
