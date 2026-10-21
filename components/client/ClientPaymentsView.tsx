"use client";
import { useState, type ReactNode } from "react";
import type { PaymentChannelConfig } from "@/src/modules/payments/channels";
import { formatDate, formatMoney, paymentStatus } from "./client-formatters";
import { ClientReportPaymentModal } from "./ClientReportPaymentModal";
import { PaymentMethodsGuide } from "./PaymentMethodsGuide";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import Link from "next/link";

export interface ClientPaymentItem {
  paidAmount?: number;
  milestone?: { title: string } | null;
  id: string;
  concept: string;
  amount: number | string;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  paymentChannel?: string | null;
  transactionReference?: string | null;
  evidenceUrl?: string | null;
  evidenceOriginalName?: string | null;
  evidenceStorageKey?: string | null;
  evidenceMimeType?: string | null;
  clientNotes?: string | null;
  reviewNotes?: string | null;
  project: { name: string } | null;
}

const groups = [
  {
    key: "pending",
    label: "Por pagar",
    statuses: ["PENDING", "PARTIAL", "OVERDUE"],
  },
  { key: "review", label: "En revisión", statuses: ["UNDER_REVIEW"] },
  { key: "scheduled", label: "Programadas", statuses: ["SCHEDULED"] },
  { key: "paid", label: "Pagadas", statuses: ["PAID"] },
  { key: "cancelled", label: "Canceladas", statuses: ["CANCELLED"] },
];
const paid = (p: ClientPaymentItem) =>
  p.status === "PAID" ? Number(p.amount) : Number(p.paidAmount ?? 0);
const balance = (p: ClientPaymentItem) =>
  Math.max(0, Number(p.amount) - paid(p));
const condition = (p: ClientPaymentItem) =>
  p.status === "SCHEDULED"
    ? p.milestone
      ? `Se habilita al aprobar «${p.milestone.title}»`
      : "Condición de habilitación por confirmar"
    : p.status === "PAID"
      ? p.paidAt
        ? `Pago confirmado el ${formatDate(p.paidAt)}`
        : "Pago confirmado"
      : p.status === "UNDER_REVIEW"
        ? "Comprobante enviado · pendiente de revisión"
        : p.status === "CANCELLED"
          ? "Esta cuota fue cancelada"
          : p.dueDate
            ? `Vence el ${formatDate(p.dueDate)}`
            : "Fecha de vencimiento por definir";
const button =
  "rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const primary =
  "rounded-lg bg-brand-button px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
export function ClientPaymentsView({
  payments,
  channels = [],
  instructions = "",
  fiscalInformation,
}: {
  payments: ClientPaymentItem[];
  channels?: PaymentChannelConfig[];
  instructions?: string;
  fiscalInformation?: ReactNode;
}) {
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<ClientPaymentItem | null>(null);
  const [report, setReport] = useState<ClientPaymentItem | null>(null);
  const [accounts, setAccounts] = useState(false);
  const pending = payments.filter((p) => groups[0].statuses.includes(p.status));
  const review = payments.filter((p) => p.status === "UNDER_REVIEW");
  const scheduled = payments.filter((p) => p.status === "SCHEDULED");
  const currencies = [...new Set(payments.map((p) => p.currency))].sort();
  const startReport = (p: ClientPaymentItem) => {
    setDetail(null);
    setReport(p);
  };
  return (
    <div className="space-y-8 text-foreground">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tus cuotas, sus condiciones y el estado de cada pago.
          </p>
        </div>
        <button className={button} onClick={() => setAccounts(true)}>
          Consultar cuentas de pago
        </button>
      </div>
      <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <section className="border-y py-6" aria-labelledby="payment-notice">
            <h2 id="payment-notice" className="text-xl font-semibold">
              {!payments.length
                ? "Todo empieza con tu primera cuota"
                : pending.length
                  ? `Tienes ${pending.length === 1 ? "una cuota" : `${pending.length} cuotas`} por pagar`
                  : review.length
                    ? "Tu comprobante está en revisión"
                    : scheduled.length
                      ? "No tienes pagos exigibles por ahora"
                      : "No tienes cuotas pendientes"}
            </h2>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              {!payments.length
                ? "Cuando se programe un pago para tus proyectos, podrás consultar aquí el importe y sus condiciones."
                : pending.length
                  ? "Consulta las cuentas disponibles. Si ya transferiste, reporta el pago para su revisión."
                  : review.length
                    ? "El equipo revisará tu reporte antes de confirmar el abono."
                    : scheduled.length
                      ? "Tus cuotas están programadas. Revisa la condición de cada una para saber cuándo se habilitará el pago."
                      : "Puedes consultar tus movimientos y comprobantes más abajo."}
            </p>
            {pending[0] && (
              <button
                className={`${primary} mt-4`}
                onClick={() => setDetail(pending[0])}
              >
                Ver cuota y reportar pago
              </button>
            )}
          </section>
          <h2 className="mt-7 text-lg font-semibold">Mis cuotas</h2>
          <div
            className="mt-4 flex flex-wrap gap-1"
            role="group"
            aria-label="Filtrar cuotas"
          >
            {[
              { key: "all", label: "Todas" },
              ...groups.filter(
                (g) =>
                  g.key !== "cancelled" ||
                  payments.some((p) => p.status === "CANCELLED"),
              ),
            ].map((g) => (
              <button
                key={g.key}
                aria-pressed={filter === g.key}
                className={`${button} border-transparent ${filter === g.key ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                onClick={() => setFilter(g.key)}
              >
                {g.label}
              </button>
            ))}
          </div>
          {groups
            .filter((g) => filter === "all" || filter === g.key)
            .map((g) => {
              const rows = payments
                .filter((p) => g.statuses.includes(p.status))
                .sort((a, b) =>
                  (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
                );
              if (!rows.length) return null;
              return (
                <section key={g.key} className="mt-7">
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    {g.key === "scheduled"
                      ? "Programadas · aún no exigibles"
                      : g.label}{" "}
                    <span className="ml-2">{rows.length}</span>
                  </h3>
                  {rows.map((p) => (
                    <article
                      key={p.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-t py-5"
                    >
                      <div className="min-w-0">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs ${p.status === "UNDER_REVIEW" ? "bg-muted text-foreground" : p.status === "PAID" ? "bg-muted text-foreground" : "bg-muted text-muted-foreground"}`}
                        >
                          {paymentStatus[p.status] || p.status}
                        </span>
                        <h4 className="mt-2 break-words text-sm font-semibold sm:text-base">
                          {p.concept}
                        </h4>
                        <p className="mt-1 break-words text-xs text-muted-foreground sm:text-sm">
                          {p.project?.name || "Pago general"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                          {condition(p)}
                        </p>
                        {paid(p) > 0 && p.status !== "PAID" && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Abonado: {formatMoney(paid(p), p.currency)} de{" "}
                            {formatMoney(p.amount, p.currency)}
                          </p>
                        )}
                      </div>
                      <div className="flex max-w-36 flex-col items-end gap-3 text-right">
                        <p className="text-base font-semibold tabular-nums sm:text-lg">
                          {formatMoney(
                            ["PAID", "CANCELLED"].includes(p.status)
                              ? p.amount
                              : balance(p),
                            p.currency,
                          )}
                        </p>
                        <button
                          className={g.key === "pending" ? primary : button}
                          onClick={() =>
                            g.key === "pending" ? startReport(p) : setDetail(p)
                          }
                        >
                          {g.key === "pending"
                            ? "Reportar pago"
                            : g.key === "scheduled"
                              ? "Ver condición"
                              : g.key === "review"
                                ? "Ver reporte"
                                : "Ver detalle"}
                        </button>
                      </div>
                    </article>
                  ))}
                </section>
              );
            })}
          {!payments.some(
            (p) =>
              filter === "all" ||
              groups.find((g) => g.key === filter)?.statuses.includes(p.status),
          ) && (
            <p className="py-10 text-sm text-muted-foreground">
              No hay cuotas en este estado.
            </p>
          )}
        </div>
        <aside className="border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
          <section className="border-b pb-6">
            <h2 className="font-semibold">Estado de tu cuenta</h2>
            {currencies.map((currency) => {
              const rows = payments.filter((p) => p.currency === currency);
              const summary = [
                [
                  "Por pagar",
                  rows
                    .filter((p) => groups[0].statuses.includes(p.status))
                    .reduce((s, p) => s + balance(p), 0),
                ],
                [
                  "En revisión",
                  rows
                    .filter((p) => p.status === "UNDER_REVIEW")
                    .reduce((s, p) => s + balance(p), 0),
                ],
                [
                  "Programado a futuro",
                  rows
                    .filter((p) => p.status === "SCHEDULED")
                    .reduce((s, p) => s + balance(p), 0),
                ],
                ["Pagado y confirmado", rows.reduce((s, p) => s + paid(p), 0)],
              ] as const;
              return (
                <div key={currency} className="mt-5">
                  <h3 className="text-sm font-semibold">{currency}</h3>
                  <dl className="mt-3 space-y-3">
                    {summary.map(([label, value]) => (
                      <div
                        key={label}
                        className="flex justify-between gap-3 text-xs"
                      >
                        <dt>{label}</dt>
                        <dd className="font-semibold tabular-nums">
                          {formatMoney(value, currency)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
            {!payments.length && (
              <p className="mt-4 text-sm text-muted-foreground">
                Aún no hay movimientos.
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Los importes se muestran en su moneda original.
            </p>
          </section>
          <section className="border-b py-6">
            <h2 className="font-semibold">¿Cómo reporto un pago?</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Transfiere a una cuenta publicada y adjunta tu comprobante en la
              cuota correspondiente.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              El equipo revisará el reporte antes de confirmar el abono.
            </p>
            <button
              className={`${button} mt-4 w-full`}
              onClick={() => setAccounts(true)}
            >
              Ver cuentas disponibles
            </button>
            <Link
              href="/client/help"
              className="mt-4 block text-sm text-brand-primary underline underline-offset-4"
            >
              Tengo una consulta sobre un pago
            </Link>
          </section>
          {fiscalInformation}
        </aside>
      </div>
      <Sheet open={accounts} onOpenChange={setAccounts}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Cuentas de pago</SheetTitle>
            <SheetDescription>
              Consulta las cuentas oficiales y verifica la moneda antes de
              transferir.
            </SheetDescription>
          </SheetHeader>
          <PaymentMethodsGuide
            channels={channels}
            instructions={instructions}
            expanded
          />
        </SheetContent>
      </Sheet>
      <Sheet
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalle de la cuota</SheetTitle>
            <SheetDescription>
              {detail?.project?.name || "Pago general"}
            </SheetDescription>
          </SheetHeader>
          {detail && (
            <div className="space-y-5">
              <span className="text-sm text-muted-foreground">
                {paymentStatus[detail.status]}
              </span>
              <h3 className="text-xl font-semibold">{detail.concept}</h3>
              <p className="text-2xl font-semibold tabular-nums">
                {formatMoney(detail.amount, detail.currency)}
              </p>
              <p className="text-sm text-muted-foreground">
                {condition(detail)}
              </p>
              {detail.status === "SCHEDULED" && (
                <p className="border-y py-5 text-sm">
                  Esta cuota todavía no se puede reportar. Cuando se habilite,
                  aparecerá la opción para adjuntar tu comprobante.
                </p>
              )}
              {detail.reviewNotes && (
                <p className="whitespace-pre-wrap text-sm">
                  Observaciones: {detail.reviewNotes}
                </p>
              )}
              {detail.transactionReference && (
                <p className="break-words text-sm">
                  N.º de operación: {detail.transactionReference}
                </p>
              )}
              {detail.evidenceUrl && (
                <div className="space-y-3">
                  {detail.evidenceMimeType?.startsWith("image/") && (
                    <img
                      src={`${detail.evidenceUrl}?inline=1`}
                      alt={detail.evidenceOriginalName || "Comprobante de pago"}
                      className="max-h-96 w-full object-contain"
                    />
                  )}
                  <a
                    href={detail.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-words text-sm text-brand-primary underline underline-offset-4"
                  >
                    Abrir comprobante:{" "}
                    {detail.evidenceOriginalName || "Archivo adjunto"}
                  </a>
                </div>
              )}
              {groups[0].statuses.includes(detail.status) && (
                <button className={primary} onClick={() => startReport(detail)}>
                  Reportar pago
                </button>
              )}
              {detail.status === "UNDER_REVIEW" && (
                <button className={button} onClick={() => startReport(detail)}>
                  Actualizar comprobante
                </button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
      {report && (
        <ClientReportPaymentModal
          payment={report}
          channels={channels}
          isOpen
          onClose={() => setReport(null)}
        />
      )}
    </div>
  );
}
