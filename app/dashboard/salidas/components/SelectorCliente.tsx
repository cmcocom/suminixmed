'use client';

import { api } from '@/lib/fetcher';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Cliente } from '../types';

interface SelectorClienteProps {
  onSelect: (cliente: Cliente) => void;
  value?: Cliente | null;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const SelectorCliente = forwardRef<HTMLInputElement, SelectorClienteProps>(
  ({ onSelect, value, disabled = false, onKeyDown }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const itemsRef = useRef<(HTMLButtonElement | null)[]>([]); // Refs para los elementos de la lista

    // Exponer el input ref al componente padre
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false); // Flag para saber si el usuario está buscando
    const [selectedIndex, setSelectedIndex] = useState(0); // Índice del cliente seleccionado con teclado

    // Efecto para hacer scroll automático al elemento seleccionado
    useEffect(() => {
      if (selectedIndex >= 0 && itemsRef.current[selectedIndex]) {
        itemsRef.current[selectedIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }, [selectedIndex]);

    useEffect(() => {
      // Solo buscar si el usuario está en modo búsqueda (no cuando hay un valor seleccionado)
      if (!isSearching || searchTerm.length < 2) {
        setClientes([]);
        setShowDropdown(false);
        return;
      }

      const timer = setTimeout(async () => {
        try {
          setLoading(true);
          const response = await api.get(
            `/api/clientes/buscar?q=${encodeURIComponent(searchTerm)}`
          );

          if (response.ok) {
            const data = await response.json();
            setClientes(data.clientes || []);
            setShowDropdown(true);
            setSelectedIndex(0); // Resetear a la primera opción
          }
        } catch (error) {
          console.error('Error buscando clientes:', error);
          setClientes([]);
        } finally {
          setLoading(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    }, [searchTerm, isSearching]);

    const handleSelect = (cliente: Cliente) => {
      onSelect(cliente);
      setSearchTerm('');
      setClientes([]);
      setShowDropdown(false);
      setIsSearching(false); // Salir del modo búsqueda
    };

    const handleClear = () => {
      onSelect(null as any);
      setSearchTerm('');
      setClientes([]);
      setShowDropdown(false);
      setIsSearching(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchTerm(newValue);

      // Si hay un cliente seleccionado y el usuario empieza a escribir, limpiar la selección
      if (value) {
        handleClear();
      }

      // Activar modo búsqueda
      setIsSearching(true);
    };

    const handleInputFocus = () => {
      // Si hay un cliente seleccionado, no activar búsqueda al hacer focus
      if (!value) {
        setIsSearching(true);
      }
    };

    // Mostrar el cliente seleccionado o el término de búsqueda
    const displayValue =
      value && !isSearching
        ? `${value.clave ? `${value.clave} - ` : ''}${value.nombre}`
        : searchTerm;

    // Handler de teclado para navegación con flechas
    const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Navegación con flechas ↑↓
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (showDropdown && clientes.length > 0) {
          setSelectedIndex((prev) => (prev + 1) % clientes.length);
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (showDropdown && clientes.length > 0) {
          setSelectedIndex((prev) => (prev - 1 + clientes.length) % clientes.length);
        }
        return;
      }

      // Enter selecciona el cliente resaltado
      if (e.key === 'Enter') {
        e.preventDefault();
        if (showDropdown && clientes.length > 0) {
          handleSelect(clientes[selectedIndex]);
          return;
        }
      }

      // Escape cierra el dropdown
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(0);
        return;
      }

      // Llamar al handler del padre si existe (para navegación entre campos)
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    return (
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDownInternal}
            placeholder="Buscar cliente por clave o nombre..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={disabled}
          />

          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Limpiar selección"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {loading && isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {showDropdown && isSearching && clientes.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {clientes.map((cliente, index) => (
              <button
                key={cliente.id}
                ref={(el) => {
                  itemsRef.current[index] = el;
                  return undefined;
                }}
                onClick={() => handleSelect(cliente)}
                type="button"
                className={`w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-100 focus:outline-none border-b border-gray-100 last:border-0 transition-colors ${
                  index === selectedIndex ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {index === selectedIndex && <span className="text-blue-500">▶</span>}
                      <div className="font-medium text-gray-900">{cliente.nombre}</div>
                    </div>
                    {cliente.clave && (
                      <div className="text-sm text-blue-600 ml-6">Clave: {cliente.clave}</div>
                    )}
                    {cliente.medico_tratante && (
                      <div className="text-xs text-gray-500 ml-6">
                        {cliente.medico_tratante}
                        {cliente.especialidad && ` • ${cliente.especialidad}`}
                      </div>
                    )}
                    {cliente.localidad && (
                      <div className="text-xs text-gray-400 ml-6">📍 {cliente.localidad}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown &&
          isSearching &&
          searchTerm.length >= 2 &&
          clientes.length === 0 &&
          !loading && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
              No se encontraron clientes
            </div>
          )}

        {/* Indicador de navegación con teclado */}
        {showDropdown && clientes.length > 0 && (
          <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
              ↑↓
            </kbd>
            <span>Navegar</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
              Enter
            </kbd>
            <span>Seleccionar</span>
          </div>
        )}
      </div>
    );
  }
);

SelectorCliente.displayName = 'SelectorCliente';

export default SelectorCliente;
