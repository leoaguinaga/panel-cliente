import { headers } from 'next/headers';

const baseUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
export class BackendApiError extends Error { constructor(public readonly status: number, message: string) { super(message); } }
export async function backendFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const requestHeaders = await headers();
  const response = await fetch(`${baseUrl}${path}`, { ...init, signal: init.signal || AbortSignal.timeout(10_000), headers: { Accept: 'application/json', Cookie: requestHeaders.get('cookie') || '', ...init.headers }, cache: 'no-store' });
  if (!response.ok) { const data = await response.json().catch(() => null); throw new BackendApiError(response.status, data?.message || 'No fue posible completar la operación'); }
  return response.json() as Promise<T>;
}
