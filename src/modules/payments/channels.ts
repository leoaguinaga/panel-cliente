export type PaymentChannelCategory = 'WALLET' | 'BANK' | 'OTHER';

export interface BankAccountDetail {
  currency: 'PEN' | 'USD';
  currencyLabel: string;
  accountType: string;
  accountNumber: string;
  cci: string;
}

export interface PaymentChannelConfig {
  id: string;
  name: string;
  shortName: string;
  category: PaymentChannelCategory;
  accountHolder: string;
  phoneNumber?: string;
  ruc?: string;
  bankName?: string;
  accounts?: BankAccountDetail[];
  instructions: string;
  tips?: string[];
  color: string;
}

// Channel labels remain stable for historical payments. Account details come from Settings.
export const PAYMENT_CHANNELS: Record<string, PaymentChannelConfig> = Object.fromEntries([
  ['YAPE', 'Yape', 'WALLET'], ['PLIN', 'Plin', 'WALLET'], ['TRANSFER_BCP', 'BCP', 'BANK'], ['TRANSFER_INTERBANK', 'Interbank', 'BANK'], ['TRANSFER_BBVA', 'BBVA', 'BANK'], ['OTHER', 'Otro medio', 'OTHER'],
].map(([id, name, category]) => [id, { id, name, shortName: name, category: category as PaymentChannelCategory, accountHolder: '', instructions: 'Consulta los canales oficiales publicados y adjunta el comprobante de tu pago.', color: '#c93a20' }]));

export const PAYMENT_CHANNELS_LIST = Object.values(PAYMENT_CHANNELS);

export function getPaymentChannel(channelId?: string | null): PaymentChannelConfig {
  if (!channelId) return PAYMENT_CHANNELS.TRANSFER_BCP;
  return PAYMENT_CHANNELS[channelId] || {
    id: channelId,
    name: channelId,
    shortName: channelId,
    category: 'OTHER',
    accountHolder: 'Foxcode',
    instructions: 'Canal de pago registrado.',
    color: '#475569',
  };
}

export function formatPaymentChannelName(channelId?: string | null): string {
  if (!channelId) return 'No especificado';
  return PAYMENT_CHANNELS[channelId]?.shortName || channelId;
}
