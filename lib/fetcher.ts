// Utilidad centralizada para llamadas fetch a la API interna
// - Por defecto incluye cookies (credentials: 'include')
// - Soporta timeout y helpers get/post/put/delete
export type PF = RequestInit;

// Incrementar el timeout por defecto para operaciones que pueden tardar (peticiones de dashboard)
const DEFAULT_TIMEOUT = 15000; // ms

function withTimeout<T>(
  p: Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT,
  input?: RequestInfo
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      const err = new Error(`TimeoutError: ${String(input ?? '')}`);
      // marcar el nombre para permitir detección por "err.name === 'TimeoutError'"
      err.name = 'TimeoutError';
      reject(err);
    }, timeoutMs);
    p.then((r) => {
      clearTimeout(t);
      resolve(r);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function apiFetch(input: RequestInfo, init?: RequestInit, timeoutMs?: number) {
  const merged: RequestInit = {
    credentials: 'include',
    headers: { Accept: 'application/json', ...(init?.headers || {}) },
    ...init,
  };

  // Use fetch with timeout wrapper
  const raw = withTimeout(fetch(input, merged), timeoutMs ?? DEFAULT_TIMEOUT, input);
  const res = await raw;
  return res;
}

export const api = {
  get: (url: string, init?: RequestInit) => apiFetch(url, { method: 'GET', ...init }),
  post: (url: string, body?: any, init?: RequestInit) =>
    apiFetch(url, {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    }),
  put: (url: string, body?: any, init?: RequestInit) =>
    apiFetch(url, {
      method: 'PUT',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    }),
  del: (url: string, init?: RequestInit) => apiFetch(url, { method: 'DELETE', ...init }),
  form: (url: string, formData: FormData, init?: RequestInit) =>
    apiFetch(url, { method: 'POST', body: formData, ...init }),
};

export default apiFetch;
