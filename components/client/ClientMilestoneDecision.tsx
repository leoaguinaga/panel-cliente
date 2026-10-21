'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Check, MessageSquareWarning } from 'lucide-react';
import { approveMilestoneAsClient, requestMilestoneChangesAsClient } from '@/src/modules/projects/server/client-milestone-actions';

const field = 'mt-1 w-full rounded-xl border border-slate-200 bg-card px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand';

/** Aprobar o pedir cambios de un hito en revisión. Aprobar es definitivo: se pide confirmar. */
export function ClientMilestoneDecision({ projectId, milestoneId, title, linkedPayments }: { projectId: string; milestoneId: string; title: string; linkedPayments: number }) {
  const [mode, setMode] = useState<'idle' | 'approve' | 'changes'>('idle');
  const [text, setText] = useState('');
  const [pending, startTransition] = useTransition();

  function submit() {
    const approving = mode === 'approve';
    if (!approving && text.trim().length < 3) return void toast.error('Cuéntanos qué cambios necesitas');
    startTransition(async () => {
      const id = toast.loading(approving ? 'Aprobando hito…' : 'Enviando tus comentarios…');
      const result = approving
        ? await approveMilestoneAsClient(projectId, milestoneId, text)
        : await requestMilestoneChangesAsClient(projectId, milestoneId, text);
      if (!result.ok) return void toast.error('No se pudo completar', { id, description: result.error });
      toast.success(approving ? 'Hito aprobado' : 'Enviamos tus comentarios', {
        id,
        description: approving ? 'Gracias. Pasamos a la siguiente etapa.' : 'El equipo ya tiene la tarea y te avisará cuando esté listo de nuevo.',
      });
      setMode('idle');
      setText('');
    });
  }

  if (mode === 'idle') return <div className="mt-3 flex flex-wrap gap-2">
    <button type="button" onClick={() => setMode('approve')} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-button px-4 text-sm font-semibold text-white hover:bg-brand-hover"><Check size={15} />Aprobar hito</button>
    <button type="button" onClick={() => setMode('changes')} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 hover:bg-slate-100"><MessageSquareWarning size={15} />Pedir cambios</button>
  </div>;

  const approving = mode === 'approve';
  return <form onSubmit={(event) => { event.preventDefault(); if (!pending) submit(); }} aria-busy={pending} className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
    <p className="text-sm font-semibold text-slate-900">{approving ? `¿Apruebas «${title}»?` : '¿Qué necesitas cambiar?'}</p>
    <p className="mt-0.5 text-xs leading-5 text-slate-500">
      {approving
        ? `Revisa los entregables antes de aprobar: la etapa queda cerrada${linkedPayments ? ` y se habilita${linkedPayments === 1 ? ' la cuota ligada' : 'n las cuotas ligadas'} a este hito` : ''}.`
        : 'Sé lo más concreto posible: qué pantalla o parte, qué esperabas y qué viste.'}
    </p>
    <label className="mt-2 block text-xs font-semibold text-slate-700">{approving ? <>Comentario <span className="font-normal text-slate-500">(opcional)</span></> : 'Cambios'}
      <textarea autoFocus rows={approving ? 2 : 4} maxLength={approving ? 2000 : 5000} required={!approving} value={text} onChange={(event) => setText(event.target.value)} placeholder={approving ? '¡Todo bien!' : 'Ej.: en el formulario de reserva falta elegir el número de personas.'} className={field} />
    </label>
    <div className="mt-3 flex flex-wrap justify-end gap-2">
      <button type="button" disabled={pending} onClick={() => { setMode('idle'); setText(''); }} className="min-h-10 rounded-full px-4 text-sm font-semibold text-slate-600 hover:text-slate-900">Cancelar</button>
      <button type="submit" disabled={pending} className="min-h-10 rounded-full bg-brand-button px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60">{pending ? 'Enviando…' : approving ? 'Sí, aprobar' : 'Enviar cambios'}</button>
    </div>
  </form>;
}
