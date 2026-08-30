'use client';
const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
export async function backendClientFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { ...init, signal: init.signal || AbortSignal.timeout(10_000), credentials: 'include', headers: { Accept: 'application/json', ...init.headers } });
  if (!response.ok) { const data = await response.json().catch(() => null); throw new Error(data?.message || 'No fue posible completar la operación'); }
  return response.json() as Promise<T>;
}
