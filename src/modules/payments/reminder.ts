import { formatCurrency } from '@/lib/formatters';

/** Se usa cuando Configuración › Cobros no tiene un mensaje propio. */
export const DEFAULT_REMINDER_TEMPLATE = `Hola {contacto}, te escribimos de {empresa} por la cuota «{concepto}» de {monto}, que {vence}.

Puedes ver los medios de pago y subir tu comprobante aquí: {portal}

¡Gracias!`;

export const REMINDER_VARIABLES: [string, string][] = [
  ['{contacto}', 'Nombre de la persona de contacto'],
  ['{empresa}', 'Nombre de tu empresa (Empresa y contacto)'],
  ['{concepto}', 'Concepto de la cuota'],
  ['{proyecto}', 'Nombre del proyecto'],
  ['{monto}', 'Lo que falta pagar, con moneda'],
  ['{vence}', '«vence el 26/10» o «venció el 26/09»'],
  ['{portal}', 'Enlace a los pagos en el portal del cliente'],
];

export interface ReminderInput {
  concept: string;
  currency: string;
  balance: number;
  dueDate: string | null;
  today: string;
  contactName: string;
  projectName?: string | null;
  companyName?: string | null;
  portalUrl: string;
}

const day = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

export function renderReminder(template: string | null | undefined, input: ReminderInput) {
  const due = input.dueDate?.slice(0, 10);
  const vence = !due ? 'aún no tiene fecha de vencimiento' : `${due < input.today ? 'venció' : 'vence'} el ${day.format(new Date(due))}`;
  const values: Record<string, string> = {
    '{contacto}': input.contactName.trim(),
    '{empresa}': input.companyName?.trim() || 'Foxcode',
    '{concepto}': input.concept,
    '{proyecto}': input.projectName ?? '',
    '{monto}': formatCurrency(input.balance, input.currency),
    '{vence}': vence,
    '{portal}': input.portalUrl,
  };
  return (template?.trim() || DEFAULT_REMINDER_TEMPLATE).replace(/\{[a-z]+\}/g, (token) => values[token] ?? token);
}

/** Solo dígitos, con código de país. Un celular peruano de 9 dígitos recibe el 51. */
export function normalizePhone(raw: string | null | undefined) {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (/^9\d{8}$/.test(digits)) return `51${digits}`;
  return digits.length >= 10 ? digits : null;
}

export const whatsappUrl = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
