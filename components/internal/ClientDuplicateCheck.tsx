'use client';
import Link from 'next/link';
import { useState } from 'react';

export function ClientDuplicateCheck() {
  const [matches, setMatches] = useState<Array<{ id: string; name: string; businessName: string | null }>>([]);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  return <div className="space-y-3 text-sm"><button type="button" disabled={pending} className="min-h-10 underline underline-offset-4 disabled:opacity-50" onClick={async event => {
    const form = event.currentTarget.closest('form');
    if (!form || pending) return;
    const data = new FormData(form);
    setPending(true); setMessage(''); setMatches([]);
    try {
      const response = await fetch('/api/backend/clients/duplicates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries([...data.entries()].filter(([key, value]) => typeof value === 'string' && value && key !== 'confirmDuplicate'))) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error || result.message || 'No se pudo comprobar. Vuelve a intentarlo.'); return; }
      setMatches(result); setMessage(result.length ? 'Encontramos posibles coincidencias. Revisa sus fichas antes de crear el cliente.' : 'No se encontraron coincidencias.');
    } catch { setMessage('No se pudo comprobar. Vuelve a intentarlo.'); }
    finally { setPending(false); }
  }}>{pending ? 'Comprobando…' : 'Comprobar duplicados'}</button><p role="status">{message}</p>{matches.map(client => <Link key={client.id} href={`/internal/clients/${client.id}`} className="block break-words underline underline-offset-4">Abrir {client.businessName || client.name}</Link>)}<label className="flex items-start gap-2 text-muted-foreground"><input name="confirmDuplicate" type="checkbox" className="mt-1" />Crear igualmente si existen coincidencias</label></div>;
}
