'use client';

import { useState, useTransition } from 'react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { formatPaymentChannelName } from '@/src/modules/payments/channels';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AdminPaymentReviewModal } from '@/components/internal/AdminPaymentReviewModal';
import { updatePaymentStatusAction, verifyPaymentAction } from '@/src/modules/payments/server/actions';
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  Receipt,
  Smartphone,
  XCircle,
} from 'lucide-react';

interface ClientDetail {
  id?: string;
  name: string;
  businessName?: string | null;
  email?: string | null;
}

interface ProjectDetail {
  id?: string;
  name: string;
}

export interface AdminPaymentRow {
  id: string;
  concept: string;
  amount: number | string;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  paymentChannel?: string | null;
  transactionReference?: string | null;
  evidenceUrl?: string | null;
  evidenceOriginalName?: string | null;
  evidenceMimeType?: string | null;
  clientNotes?: string | null;
  reviewNotes?: string | null;
  client: ClientDetail;
  project?: ProjectDetail | null;
}

export function AdminPaymentsTable({
  payments,
}: {
  payments: AdminPaymentRow[];
}) {
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentRow | null>(null);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleQuickApprove = (paymentId: string) => {
    setActionPendingId(paymentId);
    startTransition(async () => {
      try {
        await verifyPaymentAction(paymentId, 'PAID', 'Aprobado rápidamente desde panel');
      } finally {
        setActionPendingId(null);
      }
    });
  };

  const handleToggleStatus = (paymentId: string, nextStatus: string) => {
    setActionPendingId(paymentId);
    startTransition(async () => {
      try {
        await updatePaymentStatusAction(paymentId, nextStatus);
      } finally {
        setActionPendingId(null);
      }
    });
  };

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-card shadow-xs">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Concepto</th>
              <th className="px-5 py-3.5">Cliente</th>
              <th className="px-5 py-3.5">Vencimiento</th>
              <th className="px-5 py-3.5">Monto</th>
              <th className="px-5 py-3.5">Canal</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5">Comprobante</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((payment) => {
              const isUnderReview = payment.status === 'UNDER_REVIEW';
              const isPaid = payment.status === 'PAID';
              const hasEvidence = Boolean(payment.evidenceUrl);
              const isRowBusy = actionPendingId === payment.id && isPending;

              return (
                <tr
                  key={payment.id}
                  className={`transition hover:bg-slate-50/80 ${
                    isUnderReview ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Concept */}
                  <td className="px-5 py-4">
                    <b className="font-semibold text-slate-900">{payment.concept}</b>
                    <small className="block text-xs text-muted-foreground">
                      {payment.project?.name || 'Sin proyecto'}
                    </small>
                  </td>

                  {/* Client */}
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {payment.client.businessName || payment.client.name}
                  </td>

                  {/* Due Date */}
                  <td className="px-5 py-4 text-slate-600">
                    {formatDate(payment.dueDate)}
                  </td>

                  {/* Amount */}
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </td>

                  {/* Payment Channel */}
                  <td className="px-5 py-4">
                    {payment.paymentChannel ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 text-xs">
                          {payment.paymentChannel.includes('YAPE') ||
                          payment.paymentChannel.includes('PLIN') ? (
                            <Smartphone size={13} className="text-purple-600" />
                          ) : (
                            <Building2 size={13} className="text-blue-600" />
                          )}
                          {formatPaymentChannelName(payment.paymentChannel)}
                        </span>
                        {payment.transactionReference && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            Ref: {payment.transactionReference}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusBadge status={payment.status} />
                  </td>

                  {/* Evidence Button */}
                  <td className="px-5 py-4">
                    {hasEvidence ? (
                      <button
                        type="button"
                        onClick={() => setSelectedPayment(payment)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                          isUnderReview
                            ? 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Eye size={13} />
                        <span>Ver constancia</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">Sin archivo</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isUnderReview ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(payment)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Revisar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickApprove(payment.id)}
                            disabled={isRowBusy}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 disabled:opacity-50"
                            title="Aprobar y marcar como completado"
                          >
                            {isRowBusy ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Check size={12} />
                            )}
                            <span>Aprobar</span>
                          </button>
                        </>
                      ) : isPaid ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(payment.id, 'PENDING')}
                          disabled={isRowBusy}
                          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Reabrir
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(payment.id, 'PAID')}
                          disabled={isRowBusy}
                          className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
                        >
                          Marcar pagado
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {payments.length === 0 && (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No se encontraron pagos programados con los filtros seleccionados.
          </div>
        )}
      </div>

      {/* Review & Verification Modal */}
      {selectedPayment && (
        <AdminPaymentReviewModal
          payment={selectedPayment}
          isOpen={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </>
  );
}
