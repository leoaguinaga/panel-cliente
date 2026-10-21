'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProjectDocumentUpload({ projectId, clientId, defaultType = 'OTHER' }: { projectId: string; clientId: string; defaultType?: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const close = () => { setOpen(false); setError(null); setSuccess(null); };
  return <>
    <Button type="button" onClick={() => setOpen(true)} className="min-h-11">Subir documento</Button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="w-full max-w-lg rounded-2xl bg-card p-5 shadow-xl"><h2 id="upload-title" className="text-base font-bold">Subir documento al proyecto</h2><form ref={formRef} action={(data) => startTransition(async () => {
      setError(null); setSuccess(null);
      const response = await fetch('/api/backend/documents', { method: 'POST', body: data });
      const body = await response.json().catch(() => null);
      if (!response.ok) { setError(body?.error || 'No se pudo subir el documento'); return; }
      setSuccess(`“${body?.document?.originalName || 'El archivo'}” se subió correctamente.`);
      formRef.current?.reset();
      router.refresh();
    })} className="mt-4 space-y-4"><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="clientId" value={clientId} /><label className="block text-sm font-medium">Archivo<input required name="file" type="file" disabled={pending} className="mt-1 block w-full rounded-xl border p-2 text-sm disabled:opacity-60" /></label><label className="block text-sm font-medium">Tipo<select name="type" defaultValue={defaultType} disabled={pending} className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm disabled:opacity-60"><option value="OTHER">Otro</option><option value="COMMERCIAL_PROPOSAL">Propuesta comercial</option><option value="SIGNED_CONTRACT">Contrato firmado</option><option value="INVOICE">Factura</option><option value="PAYMENT_PROOF">Comprobante de pago</option><option value="DELIVERABLE">Entregable</option><option value="INTERNAL_FILE">Archivo interno</option></select></label><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="visibleToClient" disabled={pending} />Visible para el cliente</label><div aria-live="polite" aria-atomic="true">{pending && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">Subiendo archivo… No cierres esta ventana.</p>}{success && <p className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{success}</p>}{error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}</div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={close} disabled={pending}>{success ? 'Cerrar' : 'Cancelar'}</Button><Button disabled={pending}>{pending ? 'Subiendo…' : success ? 'Subir otro archivo' : 'Subir'}</Button></div></form></div></div>}
  </>;
}
