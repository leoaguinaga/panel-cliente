import { cn } from '@/lib/utils';

type LogoClient = { id: string; name: string; businessName?: string | null; logoKey?: string | null };

/** Logo subido desde la ficha del cliente; la clave cambia con cada archivo, así que sirve para invalidar la caché. */
export function clientLogoSrc(client: LogoClient) {
  return client.logoKey ? `/api/backend/clients/${encodeURIComponent(client.id)}/logo?v=${encodeURIComponent(client.logoKey.slice(0, 12))}` : null;
}

/** Logo del cliente sobre fondo claro (los logos suelen pensarse para fondo blanco), con iniciales de respaldo. */
export function ClientLogo({ client, src, className }: { client: LogoClient; src?: string | null; className?: string }) {
  const image = src === undefined ? clientLogoSrc(client) : src;
  const label = client.businessName || client.name;
  return <span aria-hidden className={cn('flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border text-sm font-semibold', image ? 'bg-white p-1' : 'bg-background text-muted-foreground', className)}>
    {/* eslint-disable-next-line @next/next/no-img-element -- archivo privado servido por el proxy autenticado */}
    {image ? <img src={image} alt="" className="size-full object-contain" /> : label.slice(0, 2).toUpperCase()}
  </span>;
}
