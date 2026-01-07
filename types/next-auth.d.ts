declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      rol?: string | null
      activo?: boolean | null
      primaryRole?: string | null
      roles?: string[]
      rolesSource?: string
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    rol?: string | null
    activo?: boolean | null
    primaryRole?: string | null
    roles?: string[]
    rolesSource?: string
  }
}

// Declaraciones globales para utilitarios cliente usados sin import en varios componentes
declare const apiFetch: typeof import('@/lib/fetcher').default;
declare const api: typeof import('@/lib/fetcher').api;

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    rol?: string
    activo?: boolean
    primaryRole?: string | null
    roles?: string[]
    rolesSource?: string
  }
}

// Shim adicional para 'next-auth/next' para permitir llamadas flexibles a getServerSession
declare module 'next-auth/next' {
  // La declaración es laxa intencionalmente para evitar conflictos de firma
  export function getServerSession(...args: any[]): any;
}
