'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { verifyPaymentAction } from '@/src/modules/payments/server/actions';
import { formatPaymentChannelName } from '@/src/modules/payments/channels';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Building2,
  Check,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Receipt,
  User,
  X,
  XCircle,
} from 'lucide-react';

export interface PaymentReviewItem {
  id: string;
  concept: string;
  amount: number | string;
  currency: string;
  status: string;
  dueDate?: string | null;
  paidAt?: string | null;
  paymentChannel?: string | null;
  transactionReference?: string | null;
  evidenceUrl?: string | null;
  evidenceOriginalName?: string | null;
  evidenceMimeType?: string | null;
  clientNotes?: string | null;
  reviewNotes?: string | null;
  client?: { name: string; businessName?: string | null; email?: string | null };
  project?: { id?: string; name: string } | null;
}

interface AdminPaymentReviewModalProps {
  payment: PaymentReviewItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPaymentReviewModal({
  payment,
  isOpen,
  onClose,
}: AdminPaymentReviewModalProps) {
  const router = useRouter();
  const [reviewNotes, setReviewNotes] = useState<string>(payment?.reviewNotes || '');
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payment) return null;

  const isImage =
    payment.evidenceMimeType?.startsWith('image/') ||
    payment.evidenceOriginalName?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  const isPdf =
    payment.evidenceMimeType === 'application/pdf' ||
    payment.evidenceOriginalName?.endsWith('.pdf');

  const handleVerify = (status: 'PAID' | 'PENDING') => {
    setActionType(status === 'PAID' ? 'APPROVE' : 'REJECT');
    setError(null);

    startTransition(async () => {
      try {
        await verifyPaymentAction(payment.id, status, reviewNotes);
        router.refresh();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al procesar la verificación');
      } finally {
        setActionType(null);
      }
    });
  };

  const inlineEvidenceUrl = payment.evidenceUrl
    ? `${payment.evidenceUrl}?inline=1`
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-payment-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative my-8 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                <Receipt size={14} className="text-orange-600" />
                Validación de Comprobante
              </span>
              <StatusBadge status={payment.status} />
            </div>
            <h2
              id="review-payment-title"
              className="mt-2 text-xl font-bold tracking-tight text-slate-950"
            >
              {payment.concept}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {payment.project?.name || 'Pago general'} · Cliente:{' '}
              <strong className="text-slate-700">
                {payment.client?.businessName || payment.client?.name || 'Cliente'}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: 2 Columns on Desktop */}
        <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
          {/* Left Column: Evidence Viewer */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Comprobante Adjunto
              </span>
              {payment.evidenceUrl && (
                <a
                  href={payment.evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  <ExternalLink size={13} />
                  <span>Abrir original</span>
                </a>
              )}
            </div>

            <div className="flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 min-h-[280px]">
              {payment.evidenceUrl ? (
                isImage ? (
                  <img
                    src={inlineEvidenceUrl || payment.evidenceUrl}
                    alt={payment.evidenceOriginalName || 'Comprobante de pago'}
                    className="max-h-[380px] w-auto rounded-xl object-contain shadow-xs"
                  />
                ) : isPdf ? (
                  <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <FileText size={48} className="text-red-500" />
                    <div>
                      <p className="font-semibold text-slate-800">
                        {payment.evidenceOriginalName || 'Documento PDF'}
                      </p>
                      <p className="text-xs text-slate-500">Comprobante en formato PDF</p>
                    </div>
                    <a
                      href={payment.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      <Eye size={14} />
                      <span>Ver o descargar PDF</span>
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <FileText size={48} className="text-slate-400" />
                    <p className="font-semibold text-slate-800">
                      {payment.evidenceOriginalName || 'Archivo adjunto'}
                    </p>
                    <a
                      href={payment.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      <ExternalLink size={14} />
                      <span>Descargar archivo</span>
                    </a>
                  </div>
                )
              ) : (
                <div className="text-center text-xs text-slate-400">
                  No se ha adjuntado ningún archivo de comprobante aún.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Payment Data & Review Notes */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Monto programado</p>
                <p className="mt-0.5 text-2xl font-bold text-slate-950">
                  {payment.currency} {Number(payment.amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5">
                  <span className="text-slate-500">Canal reportado:</span>
                  <span className="font-bold text-slate-900">
                    {formatPaymentChannelName(payment.paymentChannel)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5">
                  <span className="text-slate-500">N° de operación:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {payment.transactionReference || 'No indicado'}
                  </span>
                </div>

                {payment.paidAt && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5">
                    <span className="text-slate-500">Fecha reportada:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(payment.paidAt).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {payment.clientNotes && (
                  <div className="rounded-xl border border-slate-100 p-2.5">
                    <span className="text-slate-500">Notas del cliente:</span>
                    <p className="mt-1 font-medium text-slate-800">
                      {payment.clientNotes}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Notas de revisión interna (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ej. Verificado en cuenta BCP, abono conforme..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            {payment.status !== 'PENDING' && (
              <button
                type="button"
                onClick={() => handleVerify('PENDING')}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 shadow-2xs hover:bg-red-50 disabled:opacity-50"
              >
                {isPending && actionType === 'REJECT' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XCircle size={14} />
                )}
                <span>Rechazar comprobante</span>
              </button>
            )}

            {payment.status !== 'PAID' && (
              <button
                type="button"
                onClick={() => handleVerify('PAID')}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 disabled:opacity-50"
              >
                {isPending && actionType === 'APPROVE' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                <span>Aprobar y marcar completado</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
