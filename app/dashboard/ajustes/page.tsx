'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ProtectedPage from '@/app/components/ProtectedPage';
import {
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ChevronRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { TipoRol } from '@/lib/tipo-rol';

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  rol?: TipoRol;
}

interface AjusteOption {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  requiresDeveloperOrAdmin?: boolean;
}

const AJUSTE_OPTIONS: AjusteOption[] = [
  {
    title: 'Gestión de Entidades',
    description: 'Configurar información de la empresa y entidades del sistema',
    icon: BuildingOfficeIcon,
    href: '/dashboard/ajustes/entidades',
  },
  {
    title: 'Auditoría del Sistema',
    description: 'Consultar y exportar logs de auditoría del sistema',
    icon: ClockIcon,
    href: '/dashboard/auditoria',
    requiresDeveloperOrAdmin: true,
  },
  {
    title: 'Generador de Reportes',
    description: 'Crear reportes dinámicos personalizados para el sistema',
    icon: ClipboardDocumentListIcon,
    href: '/dashboard/ajustes/generador-reportes',
    requiresDeveloperOrAdmin: true,
  },
];

export default function AjustesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [availableOptions, setAvailableOptions] = useState<AjusteOption[]>([]);

  useEffect(() => {
    if (session?.user) {
      const userRole = (session.user as ExtendedUser).rol;
      const isDeveloperOrAdmin = userRole === TipoRol.UNIDADC || userRole === TipoRol.ADMINISTRADOR;

      const filteredOptions = AJUSTE_OPTIONS.filter((option) => {
        if (option.requiresDeveloperOrAdmin) {
          return isDeveloperOrAdmin;
        }
        return true;
      });

      setAvailableOptions(filteredOptions);

      // Si solo hay una opción disponible, redirigir automáticamente
      if (filteredOptions.length === 1) {
        router.replace(filteredOptions[0].href);
      }
    }
  }, [session, router]);

  const handleOptionClick = (href: string) => {
    router.push(href);
  };

  return (
    <ProtectedPage requiredPermission={{ modulo: 'AJUSTES', accion: 'LEER' }}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cog6ToothIcon className="w-7 h-7 text-blue-600" />
            Configuración del Sistema
          </h1>
          <p className="text-gray-600 mt-1">Gestiona las configuraciones generales del sistema</p>
        </div>

        {/* Options Grid */}
        {availableOptions.length > 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={index}
                  onClick={() => handleOptionClick(option.href)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <IconComponent className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{option.title}</h3>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{option.description}</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando opciones de configuración...</p>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
