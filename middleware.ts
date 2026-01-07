import { authLimiter, generalLimiter, getRateLimitIdentifier } from "@/lib/rate-limiter";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// NO usar Prisma en middleware (Edge Runtime no soportado)
// Verificación basada SOLO en datos de sesión

export default withAuth(
   
  async function middleware(req: any) {
    const { pathname } = req.nextUrl;
    // DEBUG bypass para endpoint consolidado (solo local)
    if (process.env.DEBUG_BYPASS_CONSOLIDADO === '1' && pathname.startsWith('/api/reportes/salidas-cliente/consolidado')) {
      return NextResponse.next();
    }
    
    // 🛡️ Rate Limiting
    const userId = req.nextauth?.token?.id;
    const identifier = getRateLimitIdentifier(req, userId);
    
    // Rate limit más estricto para rutas de autenticación
    const limiter = pathname.startsWith('/api/auth') ? authLimiter : generalLimiter;
    const rateLimitResult = await limiter.check(identifier);
    
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { 
          error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      );
      
      // Headers estándar de rate limiting
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
      response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());
      
      return response;
    }
    
    // Verificar acceso para rutas del dashboard
    if (pathname.startsWith('/dashboard')) {
      const token = req.nextauth?.token;

      // 🔒 Validar que el token existe y tiene estructura válida
      if (!token || typeof token !== 'object' || !token.id) {
        const loginUrl = new URL('/login?error=sesion-invalida', req.url);
        return NextResponse.redirect(loginUrl);
      }

      // Usuario autenticado con token válido → permitir acceso
      // La verificación granular se hace en las páginas/APIs usando rbac-dynamic.ts
      const response = NextResponse.next();

      // Agregar headers de rate limiting a la respuesta
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

      return response;
    }

    // Para rutas de API sin sesión válida, devolver JSON 401 en vez de redirección
    if (pathname.startsWith('/api')) {
      const token = req.nextauth?.token;
      if (!token || typeof token !== 'object' || !token.id) {
        // Responder JSON para que clientes fetch/axios puedan manejar correctamente el 401
        const response = NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
        return response;
      }
    }
    
    const response = NextResponse.next();
    
    // Agregar headers de rate limiting
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Para rutas de API, SIEMPRE permitir que el middleware personalizado maneje la autorización
        // Esto evita redirecciones automáticas a /login que rompen las respuestas JSON
        if (req.nextUrl.pathname.startsWith('/api')) {
          return true;
        }
        
        // Para rutas de dashboard, validar token normalmente
        // 🔒 Validar que el token es válido antes de autorizar
        if (!token || typeof token !== 'object') {
          return false;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/users/:path*",
    "/api/upload/:path*",
    "/api/inventario/:path*",
    "/api/productos/:path*",
    "/api/stock-fijo/:path*",
    "/api/entidades/:path*",
    "/api/categorias/:path*",
    "/api/proveedores/:path*",
    "/api/clientes/:path*",
    "/api/salidas/:path*",
    "/api/entradas/:path*",
    "/api/solicitudes/:path*",
    "/api/reportes/:path*",
    "/api/rbac/:path*",
    "/api/auditoria/:path*",
    "/api/dashboard/:path*",
    "/api/catalogs/:path*",
    "/api/generated-reports/:path*",
    "/api/menu/:path*",
  ]
};
