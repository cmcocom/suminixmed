'use client';
import { useLoginContextualMessage } from '@/hooks/useContextualMessage';
import SessionCommunicator from '@/lib/sessionCommunicator';
import { getSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clave: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // 🔧 MEJORA: Hook para obtener mensaje contextual basado en último cierre
  const { message: contextualMessage, isLoading: contextualLoading } = useLoginContextualMessage();

  // Mostrar mensaje si viene de cierre automático de sesión o errores de NextAuth
  useEffect(() => {
    const message = searchParams.get('message');
    const error = searchParams.get('error');

    // 🔧 MEJORA: Priorizar mensaje contextual sobre mensaje de URL si no hay mensaje específico
    const effectiveMessage =
      message || (contextualMessage && !contextualLoading ? contextualMessage : null);

    // Normalizar error=undefined en la URL
    if (error === 'undefined') {
      try {
        // Quitar el query param ruidoso para evitar confusión
        router.replace('/login');
      } catch {}
    }

    // Si NextAuth o el servidor enviaron un error crudo de Prisma/Turbopack
    // normalizarlo a un mensaje amigable y limpiar la URL
    if (error && error !== 'undefined') {
      const e = error.toLowerCase();
      const isPrismaRaw = e.includes('turbopack') || e.includes('prisma') || e.includes('p0001');
      const isConcurrentSpanish = e.includes('límite') && e.includes('concurrent');
      const isConcurrentCode =
        e.includes('concurrent_limit_exceeded') || e.includes('concurrent-limit-exceeded');
      if (isPrismaRaw || isConcurrentSpanish || isConcurrentCode) {
        try {
          toast.error(
            'Se alcanzó el límite de usuarios conectados simultáneamente. Intenta más tarde.',
            {
              duration: 10000,
              icon: '👥',
            }
          );
          router.replace('/login?message=concurrent_limit_exceeded');
          return;
        } catch {}
      }
    }

    // 🔧 MEJORA: Mensajes contextuales mejorados según la razón del cierre
    if (effectiveMessage === 'session_closed_other_browser') {
      toast.error('Tu sesión fue cerrada porque iniciaste sesión en otro navegador', {
        duration: 6000,
        icon: '🔒',
      });
    } else if (effectiveMessage === 'session_closed_other_device') {
      toast.error('Tu sesión fue cerrada porque iniciaste sesión en otro dispositivo', {
        duration: 6000,
        icon: '📱',
      });
    } else if (effectiveMessage === 'session_system_restart') {
      toast('El sistema se reinició recientemente. Por favor, inicia sesión nuevamente', {
        duration: 5000,
        icon: '🔄',
      });
    } else if (effectiveMessage === 'session_network_error') {
      toast.error('Tu sesión se perdió por un problema de conexión', {
        duration: 5000,
        icon: '🌐',
      });
    } else if (effectiveMessage === 'session_forced_logout') {
      toast.error('Tu sesión fue cerrada por un administrador', {
        duration: 7000,
        icon: '👮‍♂️',
      });
    } else if (effectiveMessage === 'concurrent_limit_exceeded') {
      toast.error(
        'No se pude iniciar sesión: se alcanzó el límite de usuarios conectados simultáneamente',
        {
          duration: 8000,
          icon: '👥',
        }
      );
    } else if (effectiveMessage === 'session_expired') {
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente', {
        duration: 5000,
        icon: '⏰',
      });
    } else if (error && error !== 'undefined') {
      // Manejar errores de NextAuth que llegan por URL
      if (
        error.includes('CONCURRENT_LIMIT_EXCEEDED') ||
        error.includes('límite') ||
        error.includes('concurrentes')
      ) {
        toast.error(
          'Se alcanzó el límite de usuarios conectados simultáneamente. Intenta más tarde.',
          {
            duration: 10000,
            icon: '👥',
          }
        );
        try {
          router.replace('/login?message=concurrent_limit_exceeded');
        } catch {}
      } else if (error.includes('SESSION_REGISTRATION_ERROR')) {
        toast.error('Error registrando sesión. Intenta nuevamente.', {
          duration: 8000,
          icon: '🔧',
        });
      } else if (error.includes('VALIDATION_ERROR')) {
        toast.error('Error de validación. Contacta al administrador.', {
          duration: 8000,
          icon: '⚠️',
        });
      } else if (error === 'sesion-invalida' || error === 'no-autenticado') {
        toast.error('Tu sesión ha expirado o es inválida. Por favor, inicia sesión nuevamente.', {
          duration: 6000,
          icon: '🔒',
        });
        try {
          router.replace('/login');
        } catch {}
      } else {
        toast.error(`Error de autenticación: ${error}`, {
          duration: 8000,
          icon: '❌',
        });
      }
    }
  }, [searchParams, router, contextualMessage, contextualLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // El flujo de autenticación ahora maneja todo en lib/auth.ts
      // Incluyendo: validación de contraseña → verificación de licencias y sesiones → autenticación
      const result = await signIn('credentials', {
        clave: formData.clave,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        // Manejar diferentes tipos de errores
        if (result.error === 'CredentialsSignin') {
          toast.error('Credenciales incorrectas');
        } else if (result.error.includes('desactivada')) {
          toast.error('Tu cuenta está desactivada. Contacta al administrador.', {
            duration: 6000,
          });
        } else if (
          result.error.includes('límite') ||
          result.error.includes('conectados simultáneamente')
        ) {
          // Error específico de límite de usuarios concurrentes
          toast.error(result.error, {
            duration: 10000,
            icon: '👥',
          });
        } else if (result.error.includes('entidad')) {
          toast.error('Error de configuración del sistema. Contacta al administrador.', {
            duration: 6000,
          });
        } else if (result.error.includes('sesión')) {
          // Error específico de sesión existente con opción de continuar
          toast.error(result.error, {
            duration: 8000,
          });
        } else {
          toast.error(result.error || 'Error al iniciar sesión');
        }
        return;
      }

      if (result?.ok) {
        // ✅ LOGIN EXITOSO - La validación de sesiones ya se manejó en lib/auth.ts
        // Verificar que la sesión se haya creado correctamente
        const session = await getSession();
        if (session) {
          try {
            // Marcar esta pestaña como la que acaba de iniciar sesión (5s)
            sessionStorage.setItem('just-logged-in', String(Date.now()));

            // 🔧 MEJORA: Guardar userId para mensajes contextuales futuros
            const userId = (session.user as any)?.id;
            if (userId) {
              localStorage.setItem('last-user-id', userId);
              localStorage.setItem('last-login-attempt', Date.now().toString());
            }
          } catch {}
          // Notificar que la nueva sesión está completamente establecida
          const communicator = SessionCommunicator.getInstance();
          communicator.notifyNewSessionStarting((session.user as any).id);

          toast.success('Inicio de sesión exitoso');
          router.push('/dashboard');
          router.refresh();
        } else {
          toast.error('Error al crear la sesión');
        }
      }
    } catch (error) {
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col lg:flex-row relative pb-20">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Panel Izquierdo - Branding e Información */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-white via-gray-50 to-blue-50 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0">
          <svg
            className="absolute top-0 left-0 w-full h-full opacity-5"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#3B82F6" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>

          {/* Formas geométricas sutiles */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100/30 rounded-full"></div>
          <div className="absolute bottom-32 right-16 w-24 h-24 bg-blue-200/40 rounded-lg rotate-45"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-300/20 rounded-full"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-36 py-16 text-gray-800">
          {/* Logos Institucionales */}
          <div className="mb-8 space-y-6">
            <div className="flex items-center justify-center space-x-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 shadow-lg">
                <Image
                  src="/images/Logo UA-ISSSTE.png"
                  alt="Logo UA-ISSSTE"
                  width={160}
                  height={160}
                  className="object-contain w-auto h-auto"
                />
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 shadow-lg">
                <Image
                  src="/images/Logo ISSSTE.png"
                  alt="Logo ISSSTE"
                  width={240}
                  height={240}
                  className="object-contain w-auto h-auto"
                />
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              <span className="login-title-gradient">Sistema de</span>
              <span className="block login-title-gradient">Gestión de Abasto</span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Plataforma integral para la administración eficiente
            </p>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              de recursos médicos y farmacéuticos
            </p>

            {/* Características destacadas */}
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-gray-700">Control de inventario en tiempo real</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-gray-700">Gestión segura y confiable</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className="text-gray-700">Interfaz intuitiva y moderna</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Derecho - Formulario de Login */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header del formulario para móvil */}
          <div className="text-center lg:hidden mb-8">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Image
                src="/images/Logo UA-ISSSTE.png"
                alt="Logo UA-ISSSTE"
                width={60}
                height={60}
                className="object-contain w-auto h-auto"
              />
              <Image
                src="/images/Logo ISSSTE.png"
                alt="Logo ISSSTE"
                width={60}
                height={60}
                className="object-contain w-auto h-auto"
              />
            </div>
            <h1 className="text-2xl font-bold mb-2 login-mobile-title">
              Sistema de Gestión de Abasto
            </h1>
            <p className="text-gray-600 text-sm">ISSSTE - Unidad Administrativa</p>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Bienvenido</h2>
              <p className="text-gray-600">Ingresa tus credenciales para acceder al sistema</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Clave */}
              <div className="space-y-2">
                <label htmlFor="clave" className="block text-sm font-semibold text-gray-700">
                  Clave de Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    id="clave"
                    name="clave"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.clave}
                    onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="cve-123456 o numero de empleado"
                  />
                </div>
              </div>

              {/* Campo Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Ingresa tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors duration-200"
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={loading}
                className="w-full login-submit-button py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 !text-white"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2 !text-white">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="!text-white">Iniciando sesión...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2 !text-white">
                    <svg
                      className="w-5 h-5 !text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    <span className="!text-white">Iniciar Sesión</span>
                  </div>
                )}
              </button>
            </form>

            {/* Footer del formulario */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>Conexión segura y protegida</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pie de página global */}
      <footer className="absolute bottom-0 left-0 right-0 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            {/* Copyright y derechos */}
            <div className="text-center md:text-left">
              <p className="text-xs text-gray-600">
                © 2025 Unidad C. Todos los derechos reservados.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Este sistema está protegido por las leyes de propiedad intelectual de México.
              </p>
            </div>

            {/* Powered by */}
            <div className="text-center md:text-right">
              <p className="text-xs text-gray-500">
                Desarrollado con
                <span className="font-semibold text-blue-600 mx-1">SuminixMED</span>
                por
                <span className="font-semibold text-gray-700 ml-1">Unidad C</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Plataforma especializada en gestión de abasto médico
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
