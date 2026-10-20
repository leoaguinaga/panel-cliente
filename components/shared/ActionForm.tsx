 'use client';
import { useState, useTransition } from 'react';
import { runFormAction } from '@/src/lib/api/form-action';
export function ActionForm({ action, children, className, confirmMessage }: { action: (data: FormData) => Promise<unknown>; children: React.ReactNode; className?: string; confirmMessage?: string }) {
 const [error, setError] = useState<string | null>(null), [message, setMessage] = useState(''), [pending, start] = useTransition();
 return <form className={className} action={data => {
  if (confirmMessage && !window.confirm(confirmMessage)) return;
  start(async () => { setError(null); setMessage(''); try { const result = await runFormAction(action, data); if (!result.ok) setError(result.error); else setMessage('Cambios guardados'); } catch { setError('No se pudo completar la operación. Vuelve a intentarlo.'); } });
 }}><fieldset disabled={pending} className="contents">{children}</fieldset>{error && <p role="alert" className="col-span-full text-sm text-destructive">{error}</p>}<p role="status" className="col-span-full text-sm text-muted-foreground">{pending ? 'Guardando…' : message}</p></form>;
}
