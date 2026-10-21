/** Demos creadas en el servidor de cada producto (contrato /demos). Llamadas desde el navegador. */

export type DemoProvisionStatus = 'PENDING' | 'READY' | 'FAILED' | 'EXPIRED' | 'CLAIMED' | 'DELETED';

export type ProvisionedDemo = {
  id: string;
  companyName: string;
  provisionStatus: DemoProvisionStatus;
  provisionError: string | null;
  template: string | null;
  slug: string | null;
  publicUrl: string | null;
  panelUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
  /** Tras entregarla: el administrador del restaurante. */
  contactName: string | null;
  contactEmail: string | null;
};

export type DemoTemplate = { key: string; name: string; description: string; dishCount?: number };

export type LeadDemoOptions = {
  enabled: boolean;
  product: { id: string; name: string } | null;
  templates: DemoTemplate[];
  templatesError: string | null;
  defaults: { businessName: string; days: number };
  demo: ProvisionedDemo | null;
  canDelete: boolean;
};

export type SlugAvailability = {
  slug: string;
  valid: boolean;
  available: boolean;
  reason: 'invalid' | 'reserved' | 'taken' | null;
};

export type DemoApiConnection = {
  productId: string;
  connected: boolean;
  url: string | null;
  remoteProduct: string | null;
  checkedAt: string | null;
};

export const DEMO_DURATIONS = [15, 30, 60] as const;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend${path}`, { ...init, headers: { 'Content-Type': 'application/json' } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error((Array.isArray(data?.message) ? data.message.join('. ') : data?.message) || 'No se pudo completar');
  return data as T;
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export const demosApi = {
  leadOptions: (leadId: string) => call<LeadDemoOptions>(`/leads/${leadId}/demo`),
  slug: (leadId: string, slug: string, signal?: AbortSignal) =>
    call<SlugAvailability>(`/leads/${leadId}/demo/slug-availability?slug=${encodeURIComponent(slug)}`, { signal }),
  create: (leadId: string, body: { businessName: string; slug: string; template: string; days: number }) =>
    call<ProvisionedDemo>(`/leads/${leadId}/demo`, json('POST', body)),
  refresh: (demoId: string) => call<ProvisionedDemo>(`/product-demos/${demoId}/refresh`, json('POST')),
  extend: (demoId: string, days: number) => call<ProvisionedDemo>(`/product-demos/${demoId}/extend`, json('POST', { days })),
  /** Entregar al cliente; con una demo ya entregada, reenvía el acceso. */
  claim: (demoId: string, body: { name: string; email: string }) =>
    call<ProvisionedDemo & { accessEmail: 'sent' | 'failed' | null }>(`/product-demos/${demoId}/claim`, json('POST', body)),
  remove: (demoId: string) => call<ProvisionedDemo>(`/product-demos/${demoId}`, json('DELETE')),

  connection: (productId: string) => call<DemoApiConnection>(`/catalogs/products/${productId}/demo-api`),
  connect: (productId: string, body: { url: string; secret?: string }) =>
    call<DemoApiConnection>(`/catalogs/products/${productId}/demo-api`, json('PUT', body)),
  test: (productId: string) => call<DemoApiConnection>(`/catalogs/products/${productId}/demo-api/test`, json('POST')),
  disconnect: (productId: string) => call<DemoApiConnection>(`/catalogs/products/${productId}/demo-api`, json('DELETE')),
};

/** Secreto nuevo de 32 bytes en hex, igual que `openssl rand -hex 32`. */
export function generateDemoSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
