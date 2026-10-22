'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { saveSettingsAction } from './server/actions';
import { parsePaymentMethods, taxFields, type PaymentMethod, type SettingValues } from './types';
import { GoogleIntegration } from './GoogleIntegration';
import styles from './settings.module.css';
import { ServicesSettings } from './ServicesSettings';
import type { getCatalogs } from '@/src/modules/products/server/queries';
import { DEFAULT_REMINDER_TEMPLATE, REMINDER_VARIABLES, renderReminder } from '@/src/modules/payments/reminder';
const sections = [['empresa', 'Empresa y contacto'], ['portal', 'Portal del cliente'], ['cobros', 'Cobros'], ['integraciones', 'Integraciones'], ['servicios', 'Servicios'], ['operacion', 'Operación']] as const;
export function SettingsWorkspace({ initialValues, services }: { initialValues: SettingValues; services: Awaited<ReturnType<typeof getCatalogs>>['services'] }) {
  const [section, setSection] = useState<string>('empresa');
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState(initialValues);
  const [methods, setMethods] = useState<PaymentMethod[]>(() => parsePaymentMethods(initialValues.payment_methods));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    const target = url.searchParams.has('code') || url.searchParams.has('error') ? 'integraciones' : url.searchParams.get('section');
    if (sections.some(([id]) => id === target)) setSection(target!);
  }, []);
  useEffect(() => {
    const reveal = () => document.querySelector(`[aria-label="Secciones de configuración"] button[data-section="${section}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    reveal();
    window.addEventListener('resize', reveal);
    return () => window.removeEventListener('resize', reveal);
  }, [section]);
  function navigate(id: string) { setSection(id); window.history.replaceState({}, '', '?section=' + id); document.querySelector(`[aria-label="Secciones de configuración"] button[data-section="${id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  function update(key: string, value: string) { setValues(v => ({ ...v, [key]: value })); }
  function methodUpdate(index: number, key: string, value: string) { setMethods(rows => rows.map((m, i) => i === index ? { ...m, [key]: value } as PaymentMethod : m)); }
  function input(key: string, label: string, options: { type?: string; wide?: boolean; required?: boolean; pattern?: string; maxLength?: number; hint?: string } = {}) {
    return <label key={key} className={options.wide ? styles.wide : undefined}>{label}<input name={key} type={options.type || 'text'} value={values[key] || ''} onChange={e => update(key, e.target.value)} required={options.required} pattern={options.pattern} maxLength={options.maxLength || 200} inputMode={key === 'tax_ruc' ? 'numeric' : undefined} />{options.hint && <small>{options.hint}</small>}</label>;
  }
  function textarea(key: string, label: string) { return <label className={styles.wide}>{label}<textarea name={key} value={values[key] || ''} onChange={e => update(key, e.target.value)} maxLength={5000} /></label>; }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const toastId = toast.loading('Guardando cambios…');
    const keys = section === 'empresa' ? ['company_name', 'contact_email', 'official_whatsapp', 'legal_representative_name', 'legal_representative_dni', 'contract_city'] : section === 'operacion' ? ['task_wip_limit'] : section === 'cobros' ? ['payment_reminder_template'] : ['payment_instructions', 'tax_information', 'help_message', ...taxFields.map(([key]) => key)];
    const payload: Record<string, string> = Object.fromEntries(keys.map(key => [key, values[key] || (key === 'task_wip_limit' ? '2' : '')]));
    if (section === 'portal') payload.payment_methods = JSON.stringify(methods);
    try {
      const result = await saveSettingsAction(payload);
      if (result.error) { toast.error(result.error, { id: toastId, duration: 7000 }); return; }
      setSaved(prev => ({ ...prev, ...payload }));
      toast.success('Cambios guardados.', { id: toastId });
    } catch { toast.error('No se pudo guardar. Revisa tu conexión e inténtalo nuevamente.', { id: toastId, duration: 7000 }); }
    finally { setBusy(false); }
  }
  function reset() { setValues(saved); setMethods(parsePaymentMethods(saved.payment_methods)); toast.info('Cambios sin guardar descartados.'); }
  return <section className={styles.workspace}><header className={styles.heading}><h1>Configuración</h1><p>Configura Foxcode, la experiencia de tus clientes y tus herramientas.</p></header><div className={styles.layout}><nav className={styles.nav} aria-label="Secciones de configuración">{sections.map(([id, label]) => <button key={id} data-section={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => navigate(id)}>{label}</button>)}</nav><div className={styles.content}>
    {section === 'servicios' ? <ServicesSettings services={services} /> : section === 'integraciones' ? <GoogleIntegration /> : <><header className={styles.intro}><h2>{sections.find(([id]) => id === section)?.[1]}</h2><p>{section === 'empresa' ? 'La identidad y los canales oficiales de Foxcode.' : section === 'portal' ? 'La información que encontrarán tus clientes al ingresar.' : section === 'cobros' ? 'Cómo le recuerdas a tus clientes las cuotas por pagar.' : 'Reglas compartidas para organizar el trabajo del equipo.'}</p></header>
    <form onSubmit={submit}><fieldset disabled={busy}>
    {section === 'empresa' && <div className={styles.section}><h3>Datos generales</h3><div className={styles.fields}>{input('company_name', 'Nombre de la empresa', { wide: true, required: true })}{input('contact_email', 'Correo de contacto', { type: 'email' })}{input('official_whatsapp', 'WhatsApp oficial', { type: 'tel', hint: 'Incluye el código de país.' })}</div></div>}
    {section === 'empresa' && <div className={styles.section}><h3>Datos para contratos</h3><p>Se imprimen en el contrato de prestación de servicios que sale de cada propuesta aceptada. La razón social, el RUC, el domicilio y las cuentas bancarias se toman de <button type="button" className="underline underline-offset-4" onClick={() => navigate('portal')}>Portal del cliente</button>.</p><div className={styles.fields}>{input('legal_representative_name', 'Representante legal', { hint: 'Nombre completo de quien firma por FoxCode.' })}{input('legal_representative_dni', 'DNI del representante', { pattern: '[0-9]{8}', maxLength: 8, hint: '8 dígitos.' })}{input('contract_city', 'Ciudad del contrato', { hint: 'Donde se firma y cuyos jueces resuelven controversias. Si se deja vacío: Chiclayo.' })}</div></div>}
    {section === 'portal' && <><div className={styles.section}><h3>Métodos de pago aceptados</h3><p>Registra las cuentas y billeteras que tus clientes pueden usar para pagarte.</p>
    {methods.length === 0 && <p className={styles.note}>Aún no hay métodos de pago configurados. Añade tus cuentas oficiales para mostrarlas al cliente.</p>}
    {methods.map((m, i) => <div className={styles.method} key={i}><div className={styles.methodHead}><h4>{m.type === 'bank' ? 'Cuenta bancaria' : 'Billetera digital'}</h4><Button type="button" variant="ghost" onClick={() => setMethods(rows => rows.filter((_, n) => n !== i))} aria-label={`Quitar método de pago ${i + 1}`}>Quitar</Button></div><div className={styles.fields}>
    {m.type === 'bank' ? <><label>Banco<input value={m.bank} required maxLength={200} onChange={e => methodUpdate(i, 'bank', e.target.value)} placeholder="Ej. BCP, Interbank, BBVA" /></label><label>Moneda<select value={m.currency} onChange={e => methodUpdate(i, 'currency', e.target.value)}><option value="PEN">Soles (PEN)</option><option value="USD">Dólares (USD)</option></select></label><label className={styles.wide}>Titular de la cuenta<input value={m.holder} required maxLength={200} onChange={e => methodUpdate(i, 'holder', e.target.value)} /></label><label>Número de cuenta<input value={m.account} required maxLength={200} onChange={e => methodUpdate(i, 'account', e.target.value)} /></label><label>CCI (opcional)<input value={m.cci} inputMode="numeric" pattern="[0-9]{20}" maxLength={20} onChange={e => methodUpdate(i, 'cci', e.target.value)} /><small>20 dígitos para transferencias interbancarias.</small></label></> : <><label>Billetera<select value={m.wallet} onChange={e => methodUpdate(i, 'wallet', e.target.value)}><option>Yape</option><option>Plin</option></select></label><label>Número de celular<input type="tel" value={m.phone} required pattern="9[0-9]{8}" maxLength={9} onChange={e => methodUpdate(i, 'phone', e.target.value)} /><small>9 dígitos, sin espacios.</small></label><label className={styles.wide}>Titular de la billetera<input value={m.holder} required maxLength={200} onChange={e => methodUpdate(i, 'holder', e.target.value)} /><small>El nombre que verá el cliente al pagar.</small></label></>}
    </div></div>)}<div className={styles.add}><Button type="button" variant="outline" disabled={methods.length >= 20} onClick={() => setMethods(m => [...m, { type: 'bank', bank: '', holder: '', currency: 'PEN', account: '', cci: '' }])}>Añadir cuenta bancaria</Button><Button type="button" variant="outline" disabled={methods.length >= 20} onClick={() => setMethods(m => [...m, { type: 'wallet', wallet: 'Yape', holder: '', phone: '' }])}>Añadir Yape o Plin</Button></div><div className={styles.fields}>{textarea('payment_instructions', 'Indicaciones adicionales')}</div></div>
    <div className={styles.section}><h3>Información fiscal</h3><p>Datos de la empresa para compartir con tus clientes.</p><div className={styles.fields}>{taxFields.map(([key, label]) => input(key, label, { wide: key === 'tax_address' || key === 'tax_trade_name', type: key === 'tax_billing_email' ? 'email' : 'text', pattern: key === 'tax_ruc' ? '[0-9]{11}' : undefined, maxLength: key === 'tax_ruc' ? 11 : 200, hint: key === 'tax_ruc' ? '11 dígitos, sin espacios ni guiones.' : undefined }))}{values.tax_information && textarea('tax_information', 'Información fiscal anterior (conservada)')}</div></div>
    <div className={styles.section}><h3>Ayuda y contacto</h3><p>Reutiliza el correo y WhatsApp de Empresa y contacto.</p><div className={styles.fields}>{textarea('help_message', 'Mensaje de ayuda')}</div></div></>}
    {section === 'cobros' && <ReminderTemplate value={values.payment_reminder_template || ''} companyName={values.company_name} onChange={(value) => update('payment_reminder_template', value)} />}
    {section === 'operacion' && <><div className={styles.section}><h3>Capacidad del tablero de tareas</h3><p>Limita el trabajo en curso para que el equipo pueda concentrarse.</p><div className={styles.fields}><label>Tareas en curso por persona<input type="number" name="task_wip_limit" min={1} max={20} step={1} value={values.task_wip_limit || '2'} required onChange={e => update('task_wip_limit', e.target.value)} /></label></div></div><div className={styles.section}><h3>Accesos y colaboradores</h3><p>Las personas y sus roles se administran en <Link href="/internal/workers" className="underline underline-offset-4">Colaboradores</Link>.</p></div></>}
    <footer className={styles.actions}><Button type="button" variant="outline" onClick={reset}>Descartar cambios</Button><Button type="submit">{busy ? 'Guardando…' : 'Guardar cambios'}</Button></footer></fieldset></form></>}
  </div></div></section>;
}


function ReminderTemplate({ value, companyName, onChange }: { value: string; companyName?: string; onChange: (value: string) => void }) {
  // Datos de ejemplo: la cuota vence el mismo día que se mira la vista previa.
  const today = new Date().toISOString().slice(0, 10);
  const preview = renderReminder(value, { concept: 'Saldo 50 % · Contra entrega', currency: 'USD', balance: 2500, dueDate: today, today, contactName: 'Carla Ríos', projectName: 'Sistema web', companyName, portalUrl: 'https://…/client/payments' });
  return <div className={styles.section}><h3>Mensaje de recordatorio</h3><p>Se usa al pulsar «Recordar» en Cobros: abre WhatsApp con este texto ya escrito, y puedes editarlo antes de enviarlo.</p>
    <div className={styles.fields}>
      <label className={styles.wide}>Mensaje<textarea name="payment_reminder_template" value={value || DEFAULT_REMINDER_TEMPLATE} onChange={e => onChange(e.target.value === DEFAULT_REMINDER_TEMPLATE ? '' : e.target.value)} maxLength={1000} rows={7} /><small>{value ? <button type="button" className="underline underline-offset-4" onClick={() => onChange('')}>Volver al mensaje predeterminado</button> : 'Es el mensaje predeterminado.'}</small></label>
      <div><p className="text-[13px] font-medium">Variables</p><dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">{REMINDER_VARIABLES.map(([token, label]) => <div key={token} className="contents"><dt><code className="rounded bg-muted px-1">{token}</code></dt><dd className="text-muted-foreground">{label}</dd></div>)}</dl></div>
      <div><p className="text-[13px] font-medium">Vista previa</p><p className="mt-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-[13px] whitespace-pre-line text-emerald-950">{preview}</p></div>
    </div></div>;
}
