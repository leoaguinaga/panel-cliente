'use client';

import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { Check, Copy, KeyRound, PlugZap, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { demosApi, generateDemoSecret, type DemoApiConnection } from '@/src/modules/demos/client';

const input =
  'h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring';
const checkedFormat = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });
const errorText = (err: unknown) => (err instanceof Error ? err.message : 'No se pudo completar');

/**
 * «API de demos» en la hoja del producto: la URL del contrato /demos del
 * producto y el secreto compartido. Vive dentro del formulario del espacio,
 * así que no usa `<form>` ni `name`: nada de esto se envía con «Guardar».
 */
export function DemoApiSection({ productId, productName }: { productId: string; productName: string }) {
  const ids = useId();
  const [connection, setConnection] = useState<DemoApiConnection | null>(null);
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<'connect' | 'test' | 'disconnect' | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    demosApi
      .connection(productId)
      .then((result) => alive && setConnection(result))
      .catch((err) => alive && setMessage({ ok: false, text: errorText(err) }));
    return () => {
      alive = false;
    };
  }, [productId]);

  const run = async (kind: NonNullable<typeof busy>, action: () => Promise<DemoApiConnection>, success: string) => {
    setBusy(kind);
    setMessage(null);
    try {
      setConnection(await action());
      setMessage({ ok: true, text: success });
      return true;
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const startEditing = () => {
    setUrl(connection?.url ?? '');
    setSecret('');
    setGenerated(false);
    setMessage(null);
    setEditing(true);
  };

  const connect = async () => {
    const ok = await run(
      'connect',
      () => demosApi.connect(productId, { url: url.trim(), ...(secret.trim() ? { secret: secret.trim() } : {}) }),
      `Conectado: ${productName} respondió a la prueba firmada`,
    );
    if (ok) setEditing(false);
  };

  const generate = () => {
    setSecret(generateDemoSecret());
    setGenerated(true);
    setCopied(false);
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  // Enter dentro de estos campos no debe enviar el formulario del espacio.
  const onEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (url.trim()) void connect();
  };

  const showForm = connection && (!connection.connected || editing);
  const canConnect = !!url.trim() && (connection?.connected || secret.trim().length >= 32);

  return (
    <section aria-labelledby={`${ids}-title`} className="grid gap-3 border-t pt-5">
      <div>
        <h3 id={`${ids}-title`} className="text-sm font-semibold">
          API de demos
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Con la API conectada, la hoja de cada lead de {productName} crea la demo en el producto. Sin ella, la demo se enlaza a mano.
        </p>
      </div>

      {!connection && !message && <div className="h-[74px] animate-pulse rounded-lg border bg-card motion-reduce:animate-none" aria-label="Cargando conexión" />}

      {connection?.connected && !editing && (
        <div className="grid gap-3 rounded-lg border bg-card p-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold">
                Conectada{connection.remoteProduct ? ` a «${connection.remoteProduct}»` : ''}
              </p>
              <p className="truncate text-xs text-muted-foreground" title={connection.url ?? ''}>
                {connection.url}
              </p>
              {connection.checkedAt && <p className="text-xs text-muted-foreground">Última prueba: {checkedFormat.format(new Date(connection.checkedAt))}</p>}
            </div>
          </div>
          {confirmDisconnect ? (
            <div role="alertdialog" aria-labelledby={`${ids}-disconnect`} className="grid gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5">
              <p id={`${ids}-disconnect`} className="text-sm">
                ¿Desconectar? Las demos ya creadas siguen en {productName}, pero desde el panel no se podrán crear, extender ni eliminar.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={busy !== null}
                  onClick={async () => {
                    if (await run('disconnect', () => demosApi.disconnect(productId), 'API desconectada')) setConfirmDisconnect(false);
                  }}
                >
                  {busy === 'disconnect' ? 'Desconectando…' : 'Sí, desconectar'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDisconnect(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={busy !== null} onClick={() => run('test', () => demosApi.test(productId), 'La prueba firmada respondió bien')}>
                <RotateCw aria-hidden="true" />
                {busy === 'test' ? 'Probando…' : 'Probar conexión'}
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={busy !== null} onClick={startEditing}>
                Cambiar URL o secreto
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" disabled={busy !== null} onClick={() => setConfirmDisconnect(true)}>
                Desconectar
              </Button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="grid gap-3 rounded-lg border bg-card p-3">
          <label className="grid gap-1.5 text-sm font-semibold">
            URL de la API
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={onEnter}
              placeholder="https://api.producto.pe/v1/integrations/foxcode/demos"
              className={input}
              autoComplete="off"
            />
            <span className="text-xs font-normal text-muted-foreground">La ruta base del contrato /demos en el servidor del producto.</span>
          </label>

          <div className="grid gap-1.5">
            <label htmlFor={`${ids}-secret`} className="text-sm font-semibold">
              Secreto compartido
            </label>
            <div className="flex gap-2">
              <input
                id={`${ids}-secret`}
                type={generated ? 'text' : 'password'}
                value={secret}
                onChange={(event) => {
                  setSecret(event.target.value);
                  setGenerated(false);
                }}
                onKeyDown={onEnter}
                placeholder={connection?.connected ? 'Vacío = conservar el actual' : 'Mínimo 32 caracteres'}
                className={cn(input, 'font-mono text-xs')}
                autoComplete="off"
                spellCheck={false}
                aria-describedby={`${ids}-secret-hint`}
              />
              {generated ? (
                <Button type="button" variant="outline" onClick={copySecret}>
                  {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={generate}>
                  <KeyRound aria-hidden="true" />
                  Generar
                </Button>
              )}
            </div>
            <p id={`${ids}-secret-hint`} className="text-xs text-muted-foreground">
              {generated
                ? 'Cópialo ahora en FOXCODE_INTEGRATION_SECRET del producto y reinícialo: el panel lo guarda cifrado y no lo vuelve a mostrar.'
                : 'El mismo valor que FOXCODE_INTEGRATION_SECRET en el servidor del producto. Se guarda cifrado.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!canConnect || busy !== null} onClick={connect}>
              <PlugZap aria-hidden="true" />
              {busy === 'connect' ? 'Probando…' : 'Conectar y probar'}
            </Button>
            {connection?.connected && (
              <Button type="button" variant="outline" disabled={busy !== null} onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Antes de guardar, el panel hace una llamada firmada de prueba. Cómo implementar el contrato en un producto: docs/GUIA-IMPLEMENTAR-DEMOS.md.
          </p>
        </div>
      )}

      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={cn('rounded-md p-2.5 text-sm', message.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-destructive/10 text-destructive')}>
          {message.text}
        </p>
      )}
    </section>
  );
}
