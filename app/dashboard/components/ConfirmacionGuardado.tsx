'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface ConfirmacionGuardadoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  mensaje: string;
  detalles?: {
    label: string;
    valor: string | number;
  }[];
  loading?: boolean;
  tipo?: 'entrada' | 'salida';
}

export default function ConfirmacionGuardado({
  isOpen,
  onClose,
  onConfirm,
  title,
  mensaje,
  detalles = [],
  loading = false,
  tipo = 'entrada',
}: ConfirmacionGuardadoProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start space-x-4">
                  <div
                    className={`flex-shrink-0 rounded-full p-3 ${
                      tipo === 'entrada' ? 'bg-green-100' : 'bg-blue-100'
                    }`}
                  >
                    <CheckCircleIcon
                      className={`h-6 w-6 ${
                        tipo === 'entrada' ? 'text-green-600' : 'text-blue-600'
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {title}
                    </Dialog.Title>

                    <div className="mt-2">
                      <p className="text-sm text-gray-600">{mensaje}</p>
                    </div>

                    {detalles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {detalles.map((detalle, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {detalle.label}:
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {detalle.valor}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 flex space-x-3">
                      <button
                        type="button"
                        className="flex-1 inline-flex justify-center items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onClose}
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className={`flex-1 inline-flex justify-center items-center rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          tipo === 'entrada'
                            ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-500'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500'
                        }`}
                        onClick={onConfirm}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Confirmar y Guardar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
