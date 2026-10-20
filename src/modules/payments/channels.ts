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

export const PAYMENT_CHANNELS: Record<string, PaymentChannelConfig> = {
  YAPE: {
    id: 'YAPE',
    name: 'Yape / Billetera Digital',
    shortName: 'Yape',
    category: 'WALLET',
    accountHolder: 'Leonardo Aguinaga / Foxcode',
    phoneNumber: '992 481 234',
    instructions: 'Transfiere el monto exacto mediante la app de Yape o Plin al número indicado. Asegúrate de verificar el nombre del titular antes de confirmar.',
    tips: [
      'Límite diario estándar según tu banco',
      'Adjunta la captura completa donde se aprecie el N° de operación',
    ],
    color: '#742284',
  },
  PLIN: {
    id: 'PLIN',
    name: 'Plin',
    shortName: 'Plin',
    category: 'WALLET',
    accountHolder: 'Leonardo Aguinaga / Foxcode',
    phoneNumber: '992 481 234',
    instructions: 'Transfiere mediante Plin (desde BBVA, Interbank, Scotiabank o BanBif) al número telefónico indicado.',
    tips: [
      'Sin comisión interbancaria inmediata',
      'Adjunta el comprobante con la referencia visible',
    ],
    color: '#00D1D2',
  },
  TRANSFER_BCP: {
    id: 'TRANSFER_BCP',
    name: 'BCP - Banco de Crédito del Perú',
    shortName: 'BCP',
    category: 'BANK',
    bankName: 'Banco de Crédito del Perú (BCP)',
    accountHolder: 'Foxcode S.A.C.',
    ruc: '20608912345',
    accounts: [
      {
        currency: 'PEN',
        currencyLabel: 'Soles (PEN)',
        accountType: 'Cuenta Corriente Soles',
        accountNumber: '191-98765432-0-12',
        cci: '002-191-009876543201-55',
      },
      {
        currency: 'USD',
        currencyLabel: 'Dólares (USD)',
        accountType: 'Cuenta Corriente Dólares',
        accountNumber: '191-98765433-1-13',
        cci: '002-191-009876543311-56',
      },
    ],
    instructions: 'Realiza una transferencia directa desde tu banca por internet o app móvil del BCP, o por transferencia interbancaria (CCI) desde cualquier otro banco.',
    tips: [
      'Transferencias BCP a BCP se procesan de inmediato',
      'Conserva y adjunta el PDF o captura de la constancia digital',
    ],
    color: '#002A8F',
  },
  TRANSFER_INTERBANK: {
    id: 'TRANSFER_INTERBANK',
    name: 'Interbank',
    shortName: 'Interbank',
    category: 'BANK',
    bankName: 'Interbank',
    accountHolder: 'Foxcode S.A.C.',
    ruc: '20608912345',
    accounts: [
      {
        currency: 'PEN',
        currencyLabel: 'Soles (PEN)',
        accountType: 'Cuenta Corriente Soles',
        accountNumber: '200-3001234567',
        cci: '003-200-003001234567-28',
      },
      {
        currency: 'USD',
        currencyLabel: 'Dólares (USD)',
        accountType: 'Cuenta Corriente Dólares',
        accountNumber: '200-3007654321',
        cci: '003-200-003007654321-44',
      },
    ],
    instructions: 'Transfiere desde la app o web de Interbank, o usando el Código de Cuenta Interbancario (CCI) si transfieres desde otra entidad financiera.',
    tips: [
      'Comprueba el número de cuenta y el titular Foxcode S.A.C.',
      'Sube la constancia emitida por el banco',
    ],
    color: '#009B3A',
  },
  TRANSFER_BBVA: {
    id: 'TRANSFER_BBVA',
    name: 'BBVA',
    shortName: 'BBVA',
    category: 'BANK',
    bankName: 'BBVA Perú',
    accountHolder: 'Foxcode S.A.C.',
    ruc: '20608912345',
    accounts: [
      {
        currency: 'PEN',
        currencyLabel: 'Soles (PEN)',
        accountType: 'Cuenta Corriente Soles',
        accountNumber: '0011-0123-0100045678',
        cci: '011-123-000100045678-40',
      },
    ],
    instructions: 'Realiza el abono a nuestra cuenta corriente BBVA o mediante CCI interbancario.',
    tips: [
      'Las transferencias inmediatas se reflejan en pocos minutos',
    ],
    color: '#004481',
  },
  OTHER: {
    id: 'OTHER',
    name: 'Otro medio / Transferencia internacional',
    shortName: 'Otro medio',
    category: 'OTHER',
    accountHolder: 'Foxcode S.A.C.',
    instructions: 'Si acordaste un método de pago alternativo (efectivo, PayPal, tarjeta de crédito o transferencia internacional), indícalo en las notas y adjunta el comprobante correspondiente.',
    tips: [
      'Escribe en las notas el canal acordado con el equipo',
      'Adjunta cualquier documento que respalde la operación',
    ],
    color: '#475569',
  },
};

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
