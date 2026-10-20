'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  PAYMENT_CHANNELS,
  PAYMENT_CHANNELS_LIST,
  getPaymentChannel,
} from '@/src/modules/payments/channels';
import { formatMoney } from '@/components/client/client-formatters';
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  FileCheck,
  FileText,
  Info,
  Loader2,
  QrCode,
  Smartphone,
  UploadCloud,
  X,
} from 'lucide-react';

interface PaymentItem {
  id: string;
  concept: string;
  amount: number | string;
  currency: string;
  status: string;
  dueDate?: string | null;
  paymentChannel?: string | null;
  transactionReference?: string | null;
  evidenceUrl?: string | null;
  evidenceOriginalName?: string | null;
  clientNotes?: string | null;
}

interface ClientReportPaymentModalProps {
  payment: PaymentItem;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientReportPaymentModal({
  payment,
  isOpen,
  onClose,
}: ClientReportPaymentModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedChannel, setSelectedChannel] = useState<string>(
    payment.paymentChannel || 'YAPE'
  );
  const [transactionRef, setTransactionRef] = useState<string>(
    payment.transactionReference || ''
  );
  const [clientNotes, setClientNotes] = useState<string>(
    payment.clientNotes || ''
  );
  const [paidAt, setPaidAt] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const currentChannel = getPaymentChannel(selectedChannel);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('El archivo seleccionado supera el límite de 25 MB.');
      return;
    }

    setError(null);
    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      formData.append('paymentChannel', selectedChannel);
      formData.append('transactionReference', transactionRef);
      formData.append('clientNotes', clientNotes);
      formData.append('paidAt', paidAt);

      const response = await fetch(`/api/backend/payments/${payment.id}/report`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'No fue posible registrar el pago');
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al reportar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-payment-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative my-8 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
              <CheckCircle2 size={13} />
              Reportar Pago Realizado
            </span>
            <h2
              id="report-payment-title"
              className="mt-2 text-xl font-bold tracking-tight text-slate-950"
            >
              {payment.concept}
            </h2>
            <p className="text-sm font-semibold text-orange-600">
              Monto: {formatMoney(payment.amount, payment.currency)}
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

        {isSuccess ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check size={32} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">
              ¡Comprobante enviado con éxito!
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              El equipo de administración revisará la constancia y validará el pago a la brevedad.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Step 1: Channel Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Selecciona el canal de pago
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PAYMENT_CHANNELS_LIST.map((channel) => {
                  const isSelected = selectedChannel === channel.id;
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => setSelectedChannel(channel.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-center transition ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/50 text-orange-950 ring-2 ring-orange-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {channel.category === 'WALLET' ? (
                        <Smartphone
                          size={20}
                          className={isSelected ? 'text-orange-600' : 'text-purple-600'}
                        />
                      ) : channel.category === 'BANK' ? (
                        <Building2
                          size={20}
                          className={isSelected ? 'text-orange-600' : 'text-blue-600'}
                        />
                      ) : (
                        <Info
                          size={20}
                          className={isSelected ? 'text-orange-600' : 'text-slate-500'}
                        />
                      )}
                      <span className="text-xs font-semibold">{channel.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Channel Instructions Box */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900">
                  Datos para transferir por {currentChannel.name}
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 shadow-2xs">
                  {currentChannel.accountHolder}
                </span>
              </div>

              {/* Yape / Plin instructions */}
              {currentChannel.phoneNumber && (
                <div className="mt-3">
                  <p className="text-xs text-slate-600">Número de Yape / Plin:</p>
                  <div className="mt-1 flex items-center justify-between rounded-xl bg-white p-3 shadow-2xs">
                    <span className="font-mono text-lg font-bold text-purple-900">
                      {currentChannel.phoneNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(currentChannel.phoneNumber!, 'modal-phone')
                      }
                      className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                    >
                      {copiedKey === 'modal-phone' ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          <span className="text-emerald-600">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copiar número</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Titular verificado: <strong>{currentChannel.accountHolder}</strong>
                  </p>
                </div>
              )}

              {/* Bank accounts instructions */}
              {currentChannel.accounts && currentChannel.accounts.length > 0 && (
                <div className="mt-3 space-y-2.5">
                  {currentChannel.accounts.map((acc, idx) => (
                    <div key={idx} className="rounded-xl bg-white p-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {acc.accountType} ({acc.currency})
                        </span>
                        {currentChannel.ruc && (
                          <span className="text-[10px] text-slate-400">
                            RUC: {currentChannel.ruc}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">N° de cuenta:</span>
                          <div className="flex items-center gap-2">
                            <code className="font-mono font-bold text-slate-900">
                              {acc.accountNumber}
                            </code>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(acc.accountNumber, `modal-acc-${idx}`)
                              }
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-orange-600"
                              title="Copiar cuenta"
                            >
                              {copiedKey === `modal-acc-${idx}` ? (
                                <Check size={14} className="text-emerald-600" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">CCI Interbancario:</span>
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-slate-800">{acc.cci}</code>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(acc.cci, `modal-cci-${idx}`)
                              }
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-orange-600"
                              title="Copiar CCI"
                            >
                              {copiedKey === `modal-cci-${idx}` ? (
                                <Check size={14} className="text-emerald-600" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-2.5 text-[11px] text-slate-500">
                {currentChannel.instructions}
              </p>
            </div>

            {/* Step 3: Evidence Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Adjunta tu comprobante o constancia de pago
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />

              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFileChange(e.dataTransfer.files?.[0] || null);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                    isDragOver
                      ? 'border-orange-500 bg-orange-50/50'
                      : 'border-slate-300 bg-slate-50/50 hover:border-orange-400 hover:bg-slate-50'
                  }`}
                >
                  <UploadCloud size={32} className="text-slate-400" />
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    Haz clic para subir o arrastra tu comprobante aquí
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Formatos admitidos: JPG, PNG, WEBP o PDF (máx. 25 MB)
                  </p>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Vista previa del comprobante"
                        className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                        <FileText size={24} />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB · Listo para enviar
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cambiar archivo
                  </button>
                </div>
              )}
            </div>

            {/* Step 4: Transaction Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  N° de Operación / Referencia (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. OP-982341 / 184920"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Fecha en la que pagaste
                </label>
                <input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Notas o comentarios adicionales (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Pago realizado desde la cuenta de Juan Pérez..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-orange-500 disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Enviando comprobante…</span>
                  </>
                ) : (
                  <>
                    <FileCheck size={16} />
                    <span>Confirmar y enviar comprobante</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
