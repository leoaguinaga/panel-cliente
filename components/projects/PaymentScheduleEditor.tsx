'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePaymentAction } from '@/src/modules/projects/server/actions';
import type { ProjectPayment } from '@/src/modules/projects/types';

export function PaymentScheduleEditor({ projectId, payments, milestones }: { projectId: string; payments: ProjectPayment[]; milestones: Array<{ id: string; title: string; status: string }> }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const savePayment = (paymentId: string, formData: FormData) => {
    setPendingId(paymentId);
    setMessage(null);
    startTransition(async () => {
      try {
        await updatePaymentAction(projectId, paymentId, formData);
        setMessage({ type: 'success', text: 'Condición de pago actualizada correctamente.' });
        router.refresh();
      } catch (error) {
        setMessage({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo guardar la condición de pago.' });
      } finally {
        setPendingId(null);
      }
    });
  };

  return <div className="space-y-3">
    <div aria-live="polite" aria-atomic="true" className="min-h-5 text-sm">
      {isPending && <p className="text-blue-700">Guardando cambios…</p>}
      {!isPending && message && <p role={message.type === 'error' ? 'alert' : 'status'} className={message.type === 'error' ? 'text-red-700' : 'text-emerald-700'}>{message.text}</p>}
    </div>
    {payments.map((payment) => <form key={payment.id} onSubmit={(event) => { event.preventDefault(); savePayment(payment.id, new FormData(event.currentTarget)); }} aria-busy={pendingId === payment.id} className="grid gap-3 rounded-2xl border bg-white p-4 lg:grid-cols-[1fr_8rem_8rem_10rem_auto]">
      <label className="text-xs font-semibold text-slate-700">Concepto<input name="concept" defaultValue={payment.concept} className="mt-1 min-h-11 w-full rounded-xl border px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" /></label>
      <label className="text-xs font-semibold text-slate-700">Monto<input name="amount" type="number" min="0" step="0.01" defaultValue={Number(payment.amount)} className="mt-1 min-h-11 w-full rounded-xl border px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" /></label>
      <label className="text-xs font-semibold text-slate-700">Vencimiento<input name="dueDate" type="date" defaultValue={payment.dueDate?.slice(0,10) || ''} className="mt-1 min-h-11 w-full rounded-xl border px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" /></label>
      <label className="text-xs font-semibold text-slate-700">Estado<select name="status" defaultValue={payment.status} className="mt-1 min-h-11 w-full rounded-xl border px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><option value="PENDING">Pendiente</option><option value="PARTIAL">Pago parcial</option><option value="PAID">Pagado</option><option value="OVERDUE">Vencido</option><option value="CANCELLED">Cancelado</option></select></label>
      <div className="flex items-end"><button disabled={isPending} className="min-h-11 min-w-24 rounded-xl border px-3 text-xs font-semibold disabled:cursor-wait disabled:opacity-60">{pendingId === payment.id ? 'Guardando…' : 'Guardar'}</button></div>
      <label className="text-xs font-semibold text-slate-700 lg:col-span-2">Hito<select name="milestoneId" defaultValue={payment.milestoneId || ''} className="mt-1 min-h-11 w-full rounded-xl border px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><option value="">Sin hito</option>{milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.title}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-700 lg:col-span-3">Notas<input name="notes" defaultValue={payment.notes || ''} className="mt-1 min-h-11 w-full rounded-xl border px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" /></label>
      <input type="hidden" name="currency" value={payment.currency} /><input type="hidden" name="percentage" value={payment.percentage == null ? '' : Number(payment.percentage)} />
    </form>)}
    {payments.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">No hay condiciones de pago. Aplica un esquema para comenzar.</div>}
  </div>;
}
