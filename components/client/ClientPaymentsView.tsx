'use client';

import { useState } from 'react';
import {
  formatDate,
  formatMoney,
  paymentStatus,
  paymentStatusStyles,
} from '@/components/client/client-formatters';
import { formatPaymentChannelName } from '@/src/modules/payments/channels';
import { ClientReportPaymentModal } from '@/components/client/ClientReportPaymentModal';
import { PaymentMethodsGuide } from '@/components/client/PaymentMethodsGuide';
import {
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Clock3,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  HelpCircle,
  Receipt,
  Smartphone,
  UploadCloud,
  X,
} from 'lucide-react';

export interface ClientPaymentItem {
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
  evidenceStorageKey?: string | null;
  evidenceMimeType?: string | null;
  clientNotes?: string | null;
  reviewNotes?: string | null;
  project: { name: string } | null;
}

export function ClientPaymentsView({
  payments,
}: {
  payments: ClientPaymentItem[];
}) {
  const [reportingPayment, setReportingPayment] = useState<ClientPaymentItem | null>(null);
  const [previewingPayment, setPreviewingPayment] = useState<ClientPaymentItem | null>(null);

  const pendingPayments = payments.filter((p) =>
    ['PENDING', 'PARTIAL', 'OVERDUE'].includes(p.status)
  );
  const underReviewPayments = payments.filter((p) => p.status === 'UNDER_REVIEW');
  const paidPayments = payments.filter((p) => p.status === 'PAID');

  const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const underReviewAmount = underReviewPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidAmount = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const currency = payments[0]?.currency || 'PEN';

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col justify-between rounded-2xl bg-slate-950 p-5 text-white shadow-xs">
          <div>
            <p className="text-xs font-medium text-slate-400">Saldo por pagar</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              {formatMoney(pendingAmount, currency)}
            </p>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {pendingPayments.length} {pendingPayments.length === 1 ? 'cuota pendiente' : 'cuotas pendientes'}
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-amber-950 shadow-xs">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>En validación</span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-amber-950">
              {formatMoney(underReviewAmount, currency)}
            </p>
          </div>
          <p className="mt-3 text-xs text-amber-700">
            {underReviewPayments.length}{' '}
            {underReviewPayments.length === 1
              ? 'comprobante en revisión'
              : 'comprobantes en revisión'}
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <p className="text-xs font-medium text-slate-500">Total pagado</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-700">
              {formatMoney(paidAmount, currency)}
            </p>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {paidPayments.length} {paidPayments.length === 1 ? 'pago completado' : 'pagos completados'}
          </p>
        </div>
      </div>

      {/* Payment Methods Guide */}
      <PaymentMethodsGuide />

      {/* Payments List */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Historial y próximos pagos</h2>
          <span className="text-xs font-medium text-slate-500">
            {payments.length} {payments.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Clock3 className="mx-auto mb-3 text-slate-400" size={32} />
            <h3 className="font-semibold text-slate-900">No tienes pagos programados</h3>
            <p className="mt-1 text-xs text-slate-500">
              Cuando se programen nuevas cuotas de tus proyectos aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => {
              const isPending = ['PENDING', 'PARTIAL', 'OVERDUE'].includes(payment.status);
              const isUnderReview = payment.status === 'UNDER_REVIEW';
              const isPaid = payment.status === 'PAID';

              return (
                <div
                  key={payment.id}
                  className={`rounded-2xl border bg-white p-5 shadow-xs transition hover:border-slate-300 ${
                    isUnderReview
                      ? 'border-amber-200 ring-1 ring-amber-400/20'
                      : isPending
                      ? 'border-slate-200'
                      : 'border-slate-200/80 bg-slate-50/40'
                  }`}
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{payment.concept}</h3>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            paymentStatusStyles[payment.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {paymentStatus[payment.status] || payment.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">
                        {payment.project?.name || 'Pago general'} · Vence{' '}
                        <strong>{formatDate(payment.dueDate)}</strong>
                      </p>

                      {/* Info if Under Review or Paid */}
                      {isUnderReview && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-amber-800">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock size={13} className="text-amber-600" />
                            Comprobante enviado vía{' '}
                            <strong>
                              {formatPaymentChannelName(payment.paymentChannel)}
                            </strong>
                          </span>
                          {payment.transactionReference && (
                            <span className="font-mono text-[11px] text-amber-700">
                              (N° {payment.transactionReference})
                            </span>
                          )}
                        </div>
                      )}

                      {isPaid && payment.paidAt && (
                        <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-700">
                          <CheckCircle2 size={13} />
                          <span>
                            Pagado el {formatDate(payment.paidAt)}{' '}
                            {payment.paymentChannel
                              ? `vía ${formatPaymentChannelName(payment.paymentChannel)}`
                              : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex flex-col items-start gap-2.5 sm:items-end">
                      <p className="text-lg font-bold text-slate-950">
                        {formatMoney(payment.amount, payment.currency)}
                      </p>

                      <div className="flex items-center gap-2">
                        {/* If pending or overdue: Action to report payment */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => setReportingPayment(payment)}
                            className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-orange-500"
                          >
                            <UploadCloud size={14} />
                            <span>Ya pagué / Subir comprobante</span>
                          </button>
                        )}

                        {/* If under review: View proof or replace proof */}
                        {isUnderReview && (
                          <>
                            {payment.evidenceUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewingPayment(payment)}
                                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Eye size={13} />
                                <span>Ver comprobante</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setReportingPayment(payment)}
                              className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                            >
                              Actualizar constancia
                            </button>
                          </>
                        )}

                        {/* If paid: View receipt if exists */}
                        {isPaid && payment.evidenceUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewingPayment(payment)}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Receipt size={13} />
                            <span>Ver constancia</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Payment Modal */}
      {reportingPayment && (
        <ClientReportPaymentModal
          payment={reportingPayment}
          isOpen={Boolean(reportingPayment)}
          onClose={() => setReportingPayment(null)}
        />
      )}

      {/* Client Preview Modal */}
      {previewingPayment && (
        <ClientEvidenceViewerModal
          payment={previewingPayment}
          isOpen={Boolean(previewingPayment)}
          onClose={() => setPreviewingPayment(null)}
        />
      )}
    </div>
  );
}

function ClientEvidenceViewerModal({
  payment,
  isOpen,
  onClose,
}: {
  payment: ClientPaymentItem;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !payment.evidenceUrl) return null;

  const isImage =
    payment.evidenceMimeType?.startsWith('image/') ||
    payment.evidenceOriginalName?.match(/\.(jpg|jpeg|png|webp|gif)$/i);

  const inlineUrl = `${payment.evidenceUrl}?inline=1`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-evidence-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative my-8 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <span className="text-xs font-semibold text-orange-600">Comprobante de pago</span>
            <h3 id="client-evidence-title" className="text-base font-bold text-slate-900">
              {payment.concept}
            </h3>
            <p className="text-xs text-slate-500">
              {formatPaymentChannelName(payment.paymentChannel)} · {formatMoney(payment.amount, payment.currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex max-h-[70vh] items-center justify-center overflow-y-auto bg-slate-50 p-4">
          {isImage ? (
            <img
              src={inlineUrl}
              alt={payment.evidenceOriginalName || 'Comprobante de pago'}
              className="max-h-[60vh] w-auto rounded-2xl object-contain shadow-xs"
            />
          ) : (
            <div className="py-8 text-center">
              <FileText size={48} className="mx-auto text-slate-400" />
              <p className="mt-2 font-medium text-slate-800">
                {payment.evidenceOriginalName || 'Documento adjunto'}
              </p>
              <a
                href={payment.evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <ExternalLink size={14} />
                <span>Abrir archivo en nueva pestaña</span>
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 p-4">
          <a
            href={payment.evidenceUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            <ExternalLink size={14} />
            <span>Descargar comprobante</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
