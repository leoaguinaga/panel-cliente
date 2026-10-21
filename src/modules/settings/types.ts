export type PaymentMethod =
  | { type: 'bank'; holder: string; bank: string; currency: 'PEN' | 'USD'; account: string; cci: string }
  | { type: 'wallet'; holder: string; wallet: 'Yape' | 'Plin'; phone: string };
export type SettingValues = Record<string, string>;
export function parsePaymentMethods(value?: string): PaymentMethod[] {
  if (!value) return [];
  try { const rows: unknown = JSON.parse(value); return Array.isArray(rows) ? rows.filter((r): r is PaymentMethod => r && typeof r.holder === 'string' && (r.type === 'bank' || r.type === 'wallet')) : []; } catch { return []; }
}
export const taxFields = [ ['tax_ruc', 'RUC'], ['tax_legal_name', 'Razón social'], ['tax_trade_name', 'Nombre comercial (opcional)'], ['tax_address', 'Dirección fiscal'], ['tax_department', 'Departamento'], ['tax_province', 'Provincia'], ['tax_district', 'Distrito'], ['tax_billing_email', 'Correo de facturación'] ] as const;
