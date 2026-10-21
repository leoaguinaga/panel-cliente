import type { PaymentChannelConfig } from '../payments/channels';
import { parsePaymentMethods } from './types';
export function configuredPaymentChannels(value?: string): PaymentChannelConfig[] {
  return parsePaymentMethods(value).map((method, i) => ({
    id: method.type === 'wallet' ? `${method.wallet} · ${i + 1}` : `${method.bank.slice(0, 70)} · ${method.currency} · ${i + 1}`,
    name: method.type === 'wallet' ? method.wallet : method.bank,
    shortName: method.type === 'wallet' ? method.wallet : method.bank,
    category: method.type === 'wallet' ? 'WALLET' : 'BANK',
    accountHolder: method.holder,
    phoneNumber: method.type === 'wallet' ? method.phone : undefined,
    bankName: method.type === 'bank' ? method.bank : undefined,
    accounts: method.type === 'bank' ? [{ currency: method.currency, currencyLabel: method.currency === 'PEN' ? 'Soles (PEN)' : 'Dólares (USD)', accountType: method.currency === 'PEN' ? 'Cuenta en soles' : 'Cuenta en dólares', accountNumber: method.account, cci: method.cci }] : undefined,
    instructions: 'Verifica los datos y el titular antes de confirmar el pago. Luego adjunta tu comprobante en la cuota correspondiente.',
    color: '#c93a20',
  }));
}
