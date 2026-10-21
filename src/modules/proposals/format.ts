import type { ProposalAddon, ProposalItem, ProposalLayer, ProposalStage, ProposalStatus, ProposalTaxMode } from './types';

/** Mismos cálculos que backend/src/modules/proposals/proposal-math.ts, en céntimos. */
const IGV_RATE = 0.18;
const toCents = (value: string | number | null | undefined) => Math.round(Number(value ?? 0) * 100) || 0;

export function proposalTotal(items: Pick<ProposalItem, 'amount'>[], addons: Pick<ProposalAddon, 'price' | 'chosen'>[]) {
  const cents = items.reduce((sum, item) => sum + toCents(item.amount), 0) + addons.filter((addon) => addon.chosen).reduce((sum, addon) => sum + toCents(addon.price), 0);
  return cents / 100;
}

export function taxBreakdown(total: string | number, taxMode: ProposalTaxMode) {
  const cents = toCents(total);
  if (taxMode === 'IGV_INCLUDED') {
    const subtotal = Math.round(cents / (1 + IGV_RATE));
    return { subtotal: subtotal / 100, igv: (cents - subtotal) / 100, total: cents / 100 };
  }
  const igv = Math.round(cents * IGV_RATE);
  return { subtotal: cents / 100, igv: igv / 100, total: (cents + igv) / 100 };
}

/** Cuotas por etapa; la última absorbe el redondeo. */
export function stagePayments(stages: Pick<ProposalStage, 'order' | 'paymentPct'>[], amount: number) {
  const cents = toCents(amount);
  const paying = [...stages].sort((a, b) => a.order - b.order).filter((stage) => stage.paymentPct > 0);
  let assigned = 0;
  return paying.map((stage, index) => {
    const part = index === paying.length - 1 ? cents - assigned : Math.round((cents * stage.paymentPct) / 100);
    assigned += part;
    return { order: stage.order, paymentPct: stage.paymentPct, amount: part / 100 };
  });
}

export const totalWeeks = (stages: Pick<ProposalStage, 'weeks'>[]) => stages.reduce((sum, stage) => sum + stage.weeks, 0);
export const stagePctSum = (stages: Pick<ProposalStage, 'paymentPct'>[]) => stages.reduce((sum, stage) => sum + stage.paymentPct, 0);

const moneyFormats = new Map<string, Intl.NumberFormat>();
export function formatMoney(value: string | number, currency: string) {
  const key = currency;
  if (!moneyFormats.has(key)) moneyFormats.set(key, new Intl.NumberFormat('es-PE', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }));
  return moneyFormats.get(key)!.format(Number(value));
}

export const proposalLabel = (proposal: { code: string; version: number }) => (proposal.version > 1 ? `${proposal.code} · v${proposal.version}` : proposal.code);

export const PROPOSAL_STATUS: Record<ProposalStatus, { label: string; tone: string }> = {
  DRAFT: { label: 'Borrador', tone: 'border-border bg-muted text-muted-foreground' },
  SENT: { label: 'Enviada', tone: 'border-sky-500/40 bg-sky-500/10 text-sky-400' },
  ACCEPTED: { label: 'Aceptada', tone: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  REJECTED: { label: 'Rechazada', tone: 'border-rose-500/40 bg-rose-500/10 text-rose-400' },
  EXPIRED: { label: 'Vencida', tone: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
};

export const LAYERS: { id: ProposalLayer; label: string; short: string; description: string }[] = [
  { id: 'WEB', label: 'Web', short: 'Web', description: 'Sistemas, paneles y plataformas que el equipo usa todos los días.' },
  { id: 'BACKEND', label: 'Backend y APIs', short: 'Backend', description: 'Datos, reglas de negocio, roles, integraciones e infraestructura.' },
  { id: 'MOBILE', label: 'App móvil', short: 'Móvil', description: 'iOS y Android, sobre el mismo backend que el sistema web.' },
];
export const layerShort = (layer: string) => LAYERS.find((option) => option.id === layer)?.short ?? layer;

/** Qué entrega cada etapa (pág. 05). */
export const STAGE_OUTCOMES: Record<number, string> = {
  1: 'Alcance y arquitectura',
  2: 'Prototipo navegable',
  3: 'Staging semanal',
  4: 'Producción y capacitación',
};

const dayFormat = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'America/Lima' });
export const shortDate = (value: string) => dayFormat.format(new Date(value)).replaceAll('.', '');
