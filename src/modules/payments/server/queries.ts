import { backendFetch } from '@/src/lib/api/server';

export type AgendaGroupKey = 'overdue' | 'week' | 'next30' | 'later' | 'awaitingMilestone' | 'noDate' | 'paid';

export interface CurrencyTotals { dueThisMonth: number; paidOfThisMonth: number; overdueOfThisMonth: number; overdue: number; collectedThisMonth: number; collectedLastMonth: number }

export interface AgendaPayment {
  id: string;
  group: AgendaGroupKey;
  concept: string;
  amount: number;
  percentage: number | string | null;
  /** Lo ya cobrado (abonos, o el total si está PAID). */
  paidAmount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  paymentChannel: string | null;
  transactionReference: string | null;
  evidenceUrl: string | null;
  evidenceOriginalName: string | null;
  evidenceMimeType: string | null;
  clientNotes: string | null;
  reviewNotes: string | null;
  projectId: string | null;
  lastReminderAt: string | null;
  reminderCount: number;
  client: { id: string; name: string; businessName: string | null; whatsapp: string | null; phone: string | null };
  project: { id: string; name: string } | null;
  milestone: { id: string; title: string; status: string; approvedAt: string | null; order?: number } | null;
}

export interface PaymentAgenda {
  summary: { today: string; currencies: Record<string, CurrencyTotals>; overdueCount: number; overdueClients: number; oldestOverdueDays: number | null; underReviewCount: number };
  items: AgendaPayment[];
  /** Plantilla de Configuración › Cobros (null = la predeterminada). */
  reminder: { template: string | null; companyName: string | null };
}

export interface PaymentRecordItem {
  id: string;
  amount: number;
  paidAt: string;
  channel: string | null;
  reference: string | null;
  notes: string | null;
  evidenceUrl: string | null;
  evidenceOriginalName: string | null;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
}

export type PaymentHistory = Omit<AgendaPayment, 'group' | 'lastReminderAt' | 'reminderCount'> & {
  records: PaymentRecordItem[];
  reminders: { id: string; channel: 'WHATSAPP' | 'COPY'; message: string; phone: string | null; sentAt: string; sentBy: { id: string; name: string } | null }[];
  activity: { id: string; action: string; description: string | null; createdAt: string; actor: { id: string; name: string } | null }[];
};

/** `allPaid` incluye todo lo cobrado, no solo los últimos 30 días; `projectId` trae el plan completo de un proyecto. */
export function getPaymentAgenda({ allPaid = false, projectId }: { allPaid?: boolean; projectId?: string } = {}) {
  const params = new URLSearchParams();
  if (allPaid) params.set('cobrado', 'todo');
  if (projectId) params.set('projectId', projectId);
  return backendFetch<PaymentAgenda>(`/payments/agenda${params.size ? `?${params}` : ''}`);
}


export function getPaymentHistory(id: string) { return backendFetch<PaymentHistory>(`/payments/${encodeURIComponent(id)}/history`); }
