import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { deriveUserRoles } from './rbac/derive-user-roles';
import { registerActiveSession, removeAllUserSessions } from './sessionTracker';
import { validateUserLogin } from './userLicense';
import { logger } from './logger';

/**
 * Actualiza el token con datos de la BD
 */
async function updateTokenFromDB(token: any): Promise<any> {
  if (!token.id) {
    logger.error('[AUTH] Token sin ID en update trigger');
    return token;
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id: token.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      activo: true,
    },
  });

  if (updatedUser) {
    token.email = updatedUser.email;
    token.name = updatedUser.name;
    token.image = updatedUser.image;
    token.activo = updatedUser.activo;
  }
  return token;
}

/**
 * Actualiza el token con datos de la sesión proporcionada
 */
function updateTokenFromSession(token: any, session: any): any {
  if (session?.user?.image !== undefined) token.image = session.user.image;
  if (session?.user?.name !== undefined) token.name = session.user.name;
  if (session?.user?.email !== undefined) token.email = session.user.email;
  return token;
}

/**
 * Inicializa el token con datos del usuario autenticado
 */
function initializeTokenFromUser(token: any, user: any): any {
  const effectivePrimary = user.primaryRole || null;
  token.id = user.id;
  token.email = user.email || null;
  token.name = user.name || null;
  token.image = user.image || null;
  token.primaryRole = effectivePrimary;
  token.roles = user.roles || (effectivePrimary ? [effectivePrimary] : []);
  token.rolesSource = user.rolesSource || 'unknown';
  token.activo = user.activo ?? true;
  return token;
}

/**
 * Deriva roles del usuario si no existen en el token
 */
async function deriveRolesIfMissing(token: any): Promise<any> {
  const hasRoles = token.roles && Array.isArray(token.roles) && token.roles.length > 0;
  if (token?.id && !hasRoles) {
    const derived = await deriveUserRoles(token.id);
    if (derived.roles && derived.roles.length > 0) {
      token.primaryRole = derived.primaryRole;
      token.roles = derived.roles;
      token.rolesSource = derived.source;
    }
  }
  return token;
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 horas
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        clave: { label: 'Clave', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.clave || !credentials?.password) {
          return null;
        }

        try {
          // 1. PASO 1: Verificar que el usuario existe por CLAVE
          const user = await prisma.user.findUnique({
            where: { clave: credentials.clave },
            include: { empleados: true },
          });

          if (!user || !user.password) {
            return null;
          }

          // 2. PASO 2: Validar contraseña ANTES de cualquier otra validación
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          // 3. PASO 3: Validar estado del usuario y licencias DESPUÉS de validar contraseña
          const loginValidation = await validateUserLogin(user.id);

          if (!loginValidation.canLogin) {
            const errorMessage = loginValidation.message || 'Error de validación de login';
            const error = new Error(errorMessage);
            error.name = loginValidation.code || 'VALIDATION_ERROR';
            throw error;
          }

          // 3.5. PASO 3.5: Registrar sesión activa preventivamente
          await removeAllUserSessions(user.id);

          // OPTIMIZACIÓN: Eliminar delay innecesario
          // Las notificaciones SSE funcionan correctamente sin esperar

          const sessionResult = await registerActiveSession(user.id, 'default');

          if (!sessionResult.success) {
            const errorMessage = sessionResult.message || 'Error registrando sesión activa';
            const error = new Error(errorMessage);
            error.name = sessionResult.error || 'SESSION_REGISTRATION_ERROR';
            throw error;
          }

          // 4. PASO 4: Usuario autenticado exitosamente - Derivar roles RBAC
          const derived = await deriveUserRoles(user.id);

          return {
            id: user.id,
            clave: user.clave,
            email: user.email,
            name: user.name || '',
            image: user.image || '',
            primaryRole: derived.primaryRole,
            roles: derived.roles,
            rolesSource: derived.source,
            activo: user.activo, // estado activo
            esEmpleado: !!user.empleados, // si es empleado
          };
        } catch (error) {
          // Si es un error de validación específico, pasarlo al frontend
          if (error instanceof Error && error.message) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }: { url: any; baseUrl: any }) {
      // Crítico: manejo explícito de redirección
      // - Si es ruta relativa, anexarla a baseUrl
      // - Si es URL absoluta y su origen coincide con baseUrl, permitir
      // - Permitir también URLs en entornos de desarrollo/local (localhost, 127.0.0.1)
      try {
        if (typeof url === 'string' && url.startsWith('/')) return `${baseUrl}${url}`;

        const parsed = new URL(url);
        // Si la URL comparte origen con baseUrl, permitirla
        if (parsed.origin === baseUrl) return url;

        // Permitir orígenes de desarrollo comunes (localhost / 127.0.0.1)
        const devAllowed = [
          'http://localhost',
          'https://localhost',
          'http://127.0.0.1',
          'https://127.0.0.1',
        ];
        if (devAllowed.some((prefix) => parsed.origin.startsWith(prefix))) {
          // Solo permitir en entornos de desarrollo para evitar open-redirects en producción
          if (process.env.NODE_ENV === 'development') return url;
        }

        // Por defecto, usar baseUrl para seguridad
        return baseUrl;
      } catch (e) {
        // Si no se puede parsear la URL, usar ruta segura por defecto
        logger.debug('[AUTH] Error parseando URL de redirección:', e instanceof Error ? e.message : 'Error desconocido');
        return baseUrl;
      }
    },

    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: any;
      user?: any;
      trigger?: string;
      session?: any;
    }) {
      // Validar que el token existe y es un objeto válido
      if (!token || typeof token !== 'object') {
        logger.error('[AUTH] Token inválido o corrupto detectado');
        return {};
      }

      // Manejar actualizaciones manuales de sesión
      if (trigger === 'update') {
        const hasSessionData = session && Object.keys(session).length > 0;
        if (!hasSessionData) {
          try {
            return await updateTokenFromDB(token);
          } catch (error) {
            logger.error('[AUTH] Error actualizando usuario en JWT:', error);
            return token;
          }
        }
        return updateTokenFromSession(token, session);
      }

      // Inicializar token con datos del usuario
      if (user) {
        return initializeTokenFromUser(token, user);
      }

      // Derivar roles si faltan
      try {
        return await deriveRolesIfMissing(token);
      } catch (err) {
        logger.error('[AUTH] Error derivando roles en JWT:', err);
        return token;
      }
    },

    async session({ session, token }: { session: any; token: any }) {
      // Validar que session y token existen y son objetos válidos
      if (!session || typeof session !== 'object') {
        logger.error('[AUTH] Session inválida detectada');
        return { user: {} };
      }

      if (!token || typeof token !== 'object') {
        logger.error('[AUTH] Token inválido en session callback');
        return session;
      }

      // Validar que el token tiene ID
      if (!token.id) {
        logger.error('[AUTH] Token sin ID válido en session callback');
        return { user: {} };
      }

      // Incluir datos del usuario en la sesión
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email || null;
        session.user.name = token.name || null;
        session.user.image = token.image || null;
        session.user.primaryRole = token.primaryRole || 'OPERADOR';
        session.user.roles = Array.isArray(token.roles) ? token.roles : [];
        session.user.rolesSource = token.rolesSource || 'unknown';
        session.user.activo = token.activo ?? true;
      }
      return session;
    },
  },

  events: {
    async signIn() {
      // Sesión activa ya registrada en el provider authorize
    },
    async session() {
      // Evento crítico para tracking
    },

    async signOut({ token }: { token: any }) {
      try {
        if (token?.id) {
          await removeAllUserSessions(token.id);
        }
      } catch (e) {
        logger.debug('[AUTH] Error en signOut:', e instanceof Error ? e.message : 'Error desconocido');
      }
    },
  },
};
