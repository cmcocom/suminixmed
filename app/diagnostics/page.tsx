'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import apiFetch from '@/lib/fetcher';

export default function DiagnosticPage() {
  const { data: session, status } = useSession();
  const [tests, setTests] = useState<Record<string, string>>({});

  useEffect(() => {
    const runDiagnostics = async () => {
      const newTests: Record<string, string> = {};

      try {
        // Test 1: Session status
        newTests['Session Status'] = status;

        // Test 2: Session data
        newTests['Session Data'] = session ? 'Present' : 'Null';

        // Test 3: CSRF endpoint
        try {
          const csrfResponse = await apiFetch('/api/auth/csrf');
          newTests['CSRF Endpoint'] = csrfResponse.ok ? 'OK' : 'FAILED';
        } catch (error) {
          newTests['CSRF Endpoint'] = 'ERROR';
        }

        // Test 4: Providers endpoint
        try {
          const providersResponse = await apiFetch('/api/auth/providers');
          newTests['Providers Endpoint'] = providersResponse.ok ? 'OK' : 'FAILED';
        } catch (error) {
          newTests['Providers Endpoint'] = 'ERROR';
        }

        // Test 5: Session endpoint
        try {
          const sessionResponse = await apiFetch('/api/auth/session');
          newTests['Session Endpoint'] = sessionResponse.ok ? 'OK' : 'FAILED';
        } catch (error) {
          newTests['Session Endpoint'] = 'ERROR';
        }

        setTests(newTests);
      } catch (error) {
        console.error('Error en diagnósticos:', error);
      }
    };

    runDiagnostics();
  }, [session, status]);

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Diagnóstico de NextAuth</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado de la Sesión</h2>
          <div className="space-y-2">
            <p>
              <strong>Status:</strong> {status}
            </p>
            <p>
              <strong>Usuario:</strong> {session?.user?.email || 'No autenticado'}
            </p>
            <p>
              <strong>Nombre:</strong> {session?.user?.name || 'N/A'}
            </p>
            <p>
              <strong>ID:</strong> {(session?.user as any)?.id || 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pruebas de API</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(tests).map(([test, result]) => (
              <div key={test} className="border rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{test}</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      result === 'OK' || result === 'Present' || result === 'authenticated'
                        ? 'bg-green-100 text-green-800'
                        : result === 'loading'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Ir a Login
          </a>
          <a
            href="/dashboard"
            className="inline-block bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 ml-4"
          >
            Ir al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
