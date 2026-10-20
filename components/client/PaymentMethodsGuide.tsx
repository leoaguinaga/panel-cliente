'use client';

import { useState } from 'react';
import {
  PAYMENT_CHANNELS_LIST,
  PaymentChannelConfig,
} from '@/src/modules/payments/channels';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Info,
  Smartphone,
  Wallet,
} from 'lucide-react';

export function PaymentMethodsGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
            <Wallet size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              Canales y cuentas de pago oficiales
            </h3>
            <p className="text-xs text-slate-500">
              Consulta nuestros números de Yape, cuentas bancarias y CCI para transferencias.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-orange-600">
          <span>{isOpen ? 'Ocultar cuentas' : 'Ver cuentas'}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-200 p-5 pt-3">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PAYMENT_CHANNELS_LIST.filter((c) => c.id !== 'OTHER').map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                copiedKey={copiedKey}
                onCopy={copyToClipboard}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-100/80 p-3 text-xs text-slate-600">
            <Info size={16} className="shrink-0 text-slate-500" />
            <span>
              Una vez realizado el pago por cualquiera de estos canales, pulsa{' '}
              <strong>«Ya pagué / Reportar pago»</strong> en la cuota correspondiente y adjunta tu constancia.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelCard({
  channel,
  copiedKey,
  onCopy,
}: {
  channel: PaymentChannelConfig;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 text-xs shadow-xs">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            {channel.category === 'WALLET' ? (
              <Smartphone size={16} className="text-purple-600" />
            ) : (
              <Building2 size={16} className="text-blue-600" />
            )}
            <span className="font-semibold text-slate-900">{channel.shortName}</span>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            {channel.category === 'WALLET' ? 'Billetera Digital' : 'Banco'}
          </span>
        </div>

        <div className="mt-3 space-y-2.5">
          {channel.phoneNumber && (
            <div>
              <p className="text-[11px] font-medium text-slate-500">Número celular</p>
              <div className="mt-1 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-sm font-semibold text-slate-900">
                <span>{channel.phoneNumber}</span>
                <button
                  type="button"
                  onClick={() => onCopy(channel.phoneNumber!, `${channel.id}-phone`)}
                  className="flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700"
                  title="Copiar número"
                >
                  {copiedKey === `${channel.id}-phone` ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span className="text-emerald-600">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-medium text-slate-500">Titular</p>
            <p className="mt-0.5 font-medium text-slate-800">{channel.accountHolder}</p>
            {channel.ruc && (
              <p className="text-[10px] text-slate-400">RUC: {channel.ruc}</p>
            )}
          </div>

          {channel.accounts && channel.accounts.length > 0 && (
            <div className="space-y-2 pt-1">
              {channel.accounts.map((acc, index) => (
                <div key={index} className="rounded-lg bg-slate-50 p-2 text-[11px]">
                  <span className="font-semibold text-slate-800">{acc.currencyLabel}</span>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">N° Cuenta:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-slate-900">{acc.accountNumber}</code>
                        <button
                          type="button"
                          onClick={() => onCopy(acc.accountNumber, `${channel.id}-${index}-acc`)}
                          className="text-slate-400 hover:text-orange-600"
                          title="Copiar número de cuenta"
                        >
                          {copiedKey === `${channel.id}-${index}-acc` ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">CCI:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-slate-900">{acc.cci}</code>
                        <button
                          type="button"
                          onClick={() => onCopy(acc.cci, `${channel.id}-${index}-cci`)}
                          className="text-slate-400 hover:text-orange-600"
                          title="Copiar CCI"
                        >
                          {copiedKey === `${channel.id}-${index}-cci` ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
