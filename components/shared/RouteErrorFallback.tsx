'use client';

import { useEffect } from 'react';

export function RouteErrorFallback({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <section className="mx-auto max-w-xl rounded-xl border bg-card px-6 py-12 text-center"><p className="text-sm text-muted-foreground">No pudimos completar esta carga</p><h1 className="mt-2 text-xl font-semibold">La información no está disponible por ahora</h1><p className="mt-2 text-sm text-muted-foreground">Tu trabajo no se ha modificado. Intenta cargar nuevamente; si el problema continúa, contacta al administrador.</p><button type="button" onClick={reset} className="mt-6 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">Reintentar</button></section>;
}
