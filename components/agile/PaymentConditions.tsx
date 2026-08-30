'use client';

import { useState, useTransition } from 'react';
import { applyPaymentPresetAction } from '@/src/modules/projects/server/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/formatters';
import {
  DollarSign,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export type PaymentScheduleItem = {
  id: string;
  concept: string;
  amount: any;
  percentage?: any;
  currency: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  milestone?: { id: string; title: string; status: string } | null;
};

const PRESETS = [
  { id: 'FULL_100', label: '100% Contado / Contra Entrega', desc: '1 pago único total' },
  { id: 'SPLIT_50_50', label: '50% Anticipo / 50% Entrega', desc: 'Esquema estándar 2 cuotas' },
  { id: 'SPLIT_70_30', label: '70% Inicio / 30% Despliegue', desc: 'Garantía mayor al inicio' },
  { id: 'SPLIT_50_20_30', label: '50% / 20% / 30% en 3 Hitos', desc: 'Anticipo, hito intermedio y cierre' },
];

export function PaymentConditions({
  projectId,
  projectPrice,
  payments = [],
}: {
  projectId: string;
  projectPrice: number;
  payments: any[];
}) {
  const [totalPrice, setTotalPrice] = useState<string>(String(projectPrice || '1500'));
  const [selectedPreset, setSelectedPreset] = useState<string>('SPLIT_50_50');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApplyPreset = (presetId: string) => {
    const total = Number(totalPrice);
    if (!Number.isFinite(total) || total <= 0) {
      setFeedback({ type: 'error', text: 'Ingresa un monto total válido.' });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      try {
        await applyPaymentPresetAction(projectId, presetId, total);
        setFeedback({ type: 'success', text: 'Esquema de pago aplicado correctamente.' });
        window.location.reload();
      } catch (error) {
        setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo aplicar el esquema de pago.' });
      }
    });
  };

  // Calculations
  const totalAmount = payments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
  const paidAmount = payments.filter((p: any) => p.status === 'PAID').reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
  const pendingAmount = payments.filter((p: any) => p.status === 'PENDING' || p.status === 'PARTIAL').reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Condiciones de Pago del Proyecto</h3>
          <p className="text-xs text-muted-foreground">
            Estructuración de cuotas, anticipos e hitos financieros acordados en la propuesta comercial.
          </p>
        </div>
        <div aria-live="polite" aria-atomic="true" className="min-h-5 text-xs">
          {isPending && <p className="text-blue-700">Aplicando esquema y recalculando cuotas…</p>}
          {!isPending && feedback && <p role={feedback.type === 'error' ? 'alert' : 'status'} className={feedback.type === 'error' ? 'text-red-700' : 'text-emerald-700'}>{feedback.text}</p>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Monto Total del Proyecto</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            ${totalAmount > 0 ? totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : Number(projectPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-xs border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-emerald-700">Cobrado / Liquidado</p>
          <p className="text-xl font-extrabold text-emerald-800 mt-1">
            ${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-xs border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-amber-700">Pendiente de Cobro</p>
          <p className="text-xl font-extrabold text-amber-800 mt-1">
            ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
          </p>
        </div>
      </div>

      {/* Presets Generator Card */}
      <div className="rounded-xl border bg-slate-50/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Generador Rápido de Esquemas de Pago
          </h4>
          <span className="text-xs text-muted-foreground">
            Sobrescribe las cuotas pendientes con el esquema seleccionado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Total (USD)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              className="w-full rounded-md border bg-white px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Seleccionar Esquema</label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full rounded-md border bg-white px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {p.desc}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            disabled={isPending}
            onClick={() => handleApplyPreset(selectedPreset)}
            className="w-full bg-slate-900 hover:bg-black text-white text-xs"
          >
            {isPending ? 'Aplicando...' : 'Aplicar Esquema'}
          </Button>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="rounded-xl border bg-white overflow-hidden shadow-xs">
        <div className="border-b px-5 py-3 bg-slate-50 flex items-center justify-between">
          <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
            Cronograma de Cuotas Registradas ({payments.length})
          </h4>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No se han configurado cuotas de pago para este proyecto.</p>
            <p className="text-[11px] text-slate-400">
              Selecciona un esquema arriba para generar las cuotas automáticamente.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {payments.map((p: any, idx: number) => (
              <div key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <p className="text-sm font-semibold text-slate-900">{p.concept}</p>
                    {p.percentage && (
                      <span className="text-xs font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {p.percentage}%
                      </span>
                    )}
                  </div>
                  {p.milestone && (
                    <p className="text-xs text-purple-700 font-medium">
                      Vinculado al Hito: {p.milestone.title}
                    </p>
                  )}
                  {p.dueDate && (
                    <p className="text-xs text-slate-400">
                      Vencimiento: {formatDate(p.dueDate)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-base font-extrabold text-slate-900">
                      ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {p.currency}
                    </p>
                  </div>

                  <Badge
                    className={`text-xs px-2.5 py-0.5 ${
                      p.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : p.status === 'OVERDUE'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {p.status === 'PAID' ? '✓ Pagado' : p.status === 'OVERDUE' ? 'Vencido' : 'Pendiente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
