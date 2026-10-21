export async function supportFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend/support${path}`, { ...init, cache: 'no-store', signal: AbortSignal.timeout(60000) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(Array.isArray(data?.message) ? data.message.join('. ') : data?.message || data?.error || 'No pudimos completar la operación. Intenta nuevamente.');
  return data as T;
}
export const supportJson = (method: string, data: unknown) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
