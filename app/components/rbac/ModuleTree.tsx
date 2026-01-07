'use client';

import { useState } from 'react';
import { ModuleStructure, getModuleTreeWithPermissions } from './types/module-structure';

interface ModuleInfo {
  key: string;
  name: string;
  icon: string;
  description: string;
  permissions: Array<{
    id: string;
    name: string;
    description: string | null;
    module: string;
    action: string;
    assigned: boolean;
  }>;
  permissionCount: number;
  assignedCount: number;
  visible?: boolean; // Agregamos el estado de visibilidad
}

interface ModuleTreeProps {
  modules: ModuleInfo[];
  selectedModule: ModuleInfo | null;
  onModuleSelect: (module: ModuleInfo) => void;
  onModuleVisibilityToggle?: (moduleKey: string, visible: boolean) => void; // Nueva función para toggle de visibilidad
  moduleVisibility?: Record<string, boolean>; // Estado de visibilidad de módulos
  loading?: boolean;
  collapsed?: boolean;
  selectedRole?: { name: string } | null;
}

interface ModuleItemProps {
  module: ModuleStructure;
  level: number;
  onModuleSelect: (moduleKey: string) => void;
  onModuleVisibilityToggle?: (moduleKey: string, visible: boolean) => void;
  selectedModuleKey: string | null;
  permissions: Array<{
    id: string;
    name: string;
    description: string | null;
    module: string;
    action: string;
    assigned: boolean;
  }>;
  moduleVisibility?: Record<string, boolean>; // Mapa de visibilidad de módulos
}

function ModuleItem({
  module,
  level,
  onModuleSelect,
  onModuleVisibilityToggle,
  selectedModuleKey,
  permissions,
  moduleVisibility = {},
}: ModuleItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const modulePermissions = permissions.filter((p) => p.module === module.key);
  const permissionCount = modulePermissions.length;
  const assignedCount = modulePermissions.filter((p) => p.assigned).length;
  const isVisible = moduleVisibility[module.key] ?? true; // Por defecto visible

  const hasChildren = module.children && module.children.length > 0;
  const isSelected = selectedModuleKey === module.key;

  const getProgressColor = (assigned: number, total: number) => {
    const percentage = total > 0 ? (assigned / total) * 100 : 0;

    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  const getProgressPercentage = (assigned: number, total: number) => {
    return total > 0 ? Math.round((assigned / total) * 100) : 0;
  };

  const progressPercentage = getProgressPercentage(assignedCount, permissionCount);

  const getIndentationClass = (level: number) => {
    const indentMap: { [key: number]: string } = {
      0: 'pl-3',
      1: 'pl-7',
      2: 'pl-11',
      3: 'pl-15',
      4: 'pl-19',
    };
    return indentMap[level] || 'pl-3';
  };

  return (
    <div className="w-full">
      {/* Header del módulo */}
      <div
        className={`
          w-full p-2 cursor-pointer transition-all duration-200 border-l-4
          ${
            isSelected
              ? 'bg-blue-50 border-l-blue-500'
              : 'bg-white hover:bg-gray-50 border-l-transparent'
          }
          ${level > 0 ? 'ml-2 border border-gray-200 rounded-lg' : 'border-b border-gray-200'}
        `}
      >
        <div className={`flex items-center justify-between ${getIndentationClass(level)}`}>
          <div
            className="flex items-center space-x-2 flex-1"
            onClick={() => onModuleSelect(module.key)}
          >
            {/* Botón de expandir/contraer */}
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-0.5 rounded hover:bg-gray-200 transition-colors"
                title={isExpanded ? 'Contraer' : 'Expandir'}
              >
                {isExpanded ? (
                  <svg
                    className="w-3 h-3 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3 h-3 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            )}

            {/* Icono y nombre */}
            <div className="flex items-center space-x-1.5">
              <span className="text-sm">{module.icon}</span>
              <div className="min-w-0">
                <h4
                  className={`font-medium ${level === 0 ? 'text-gray-900' : 'text-gray-700'} text-xs truncate`}
                >
                  {module.name}
                </h4>
                <p className="text-xs text-gray-500 truncate" title={module.description}>
                  {module.description}
                </p>
              </div>
            </div>
          </div>

          {/* Controles del lado derecho */}
          <div className="flex items-center space-x-2 ml-2">
            {/* Control de visibilidad en menú lateral */}
            <div className="flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onModuleVisibilityToggle?.(module.key, !isVisible);
                }}
                className={`
                  relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1
                  ${isVisible ? 'bg-green-600' : 'bg-gray-300'}
                `}
                title={`${isVisible ? 'Ocultar' : 'Mostrar'} en menú lateral`}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${isVisible ? 'translate-x-3' : 'translate-x-0'}
                  `}
                />
              </button>
              <span className="ml-1 text-xs text-gray-500" title="Visibilidad en menú">
                {isVisible ? '👁️' : '🙈'}
              </span>
            </div>

            {/* Estadísticas de permisos */}
            {permissionCount > 0 && (
              <div className="flex items-center space-x-1">
                {/* Contador de permisos */}
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-900">
                    {assignedCount}/{permissionCount}
                  </div>
                </div>

                {/* Barra de progreso circular pequeña */}
                <div className="relative w-4 h-4">
                  <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="stroke-gray-200"
                      strokeWidth="6"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`${getProgressColor(assignedCount, permissionCount).replace('bg-', 'stroke-')}`}
                      strokeWidth="6"
                      strokeDasharray={`${progressPercentage}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700">{progressPercentage}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submódulos */}
      {hasChildren && isExpanded && (
        <div className="space-y-0.5">
          {module.children!.map((child) => (
            <ModuleItem
              key={child.key}
              module={child}
              level={level + 1}
              onModuleSelect={onModuleSelect}
              onModuleVisibilityToggle={onModuleVisibilityToggle}
              selectedModuleKey={selectedModuleKey}
              permissions={permissions}
              moduleVisibility={moduleVisibility}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ModuleTree({
  modules,
  selectedModule,
  onModuleSelect,
  onModuleVisibilityToggle,
  moduleVisibility: externalModuleVisibility,
  loading = false,
  collapsed = false,
  selectedRole = null,
}: ModuleTreeProps) {
  // Convertir la estructura antigua a la nueva estructura jerárquica
  const allPermissions = modules.flatMap((m) => m.permissions);
  const moduleStructure = getModuleTreeWithPermissions(allPermissions);

  // Usar la visibilidad externa si está disponible, sino crear mapa local
  const moduleVisibility =
    externalModuleVisibility ||
    modules.reduce(
      (acc, module) => {
        acc[module.key] = module.visible ?? true;
        return acc;
      },
      {} as Record<string, boolean>
    );

  const handleModuleSelect = (moduleKey: string) => {
    // Encontrar el módulo en la estructura antigua para mantener compatibilidad
    const foundModule = modules.find((m) => m.key === moduleKey);
    if (foundModule && onModuleSelect) {
      onModuleSelect(foundModule);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  // Si está colapsado, mostrar solo un resumen
  if (collapsed) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500">
          <div className="text-2xl mb-2">🏗️</div>
          <div className="text-sm font-medium">Módulos</div>
          <div className="text-xs">{modules.length} disponibles</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Área de contenido con scroll */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p>Cargando módulos...</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-8 text-gray-500 p-4">
            <div className="text-4xl mb-2">📁</div>
            <p>
              {selectedRole
                ? `Sin módulos para el rol ${selectedRole.name}`
                : 'No hay módulos disponibles'}
            </p>
            {selectedRole && (
              <p className="text-sm text-gray-400 mt-1">Selecciona otro rol para ver sus módulos</p>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-0.5">
              {moduleStructure.map((moduleItem) => (
                <ModuleItem
                  key={moduleItem.key}
                  module={moduleItem}
                  level={0}
                  onModuleSelect={handleModuleSelect}
                  onModuleVisibilityToggle={onModuleVisibilityToggle}
                  selectedModuleKey={selectedModule?.key || null}
                  permissions={allPermissions}
                  moduleVisibility={moduleVisibility}
                />
              ))}
            </div>

            {/* Resumen al final */}
            {modules.length > 0 && (
              <div className="m-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div className="font-medium mb-1">Resumen:</div>
                  <div>• {modules.length} módulos disponibles</div>
                  <div>
                    • {modules.reduce((acc, m) => acc + m.permissionCount, 0)} permisos totales
                  </div>
                  <div>
                    • {modules.reduce((acc, m) => acc + m.assignedCount, 0)} permisos asignados
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
