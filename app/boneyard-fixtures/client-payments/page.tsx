import {
  ClientPaymentsView,
  type ClientPaymentItem,
} from "@/components/client/ClientPaymentsView";
export const metadata = { robots: { index: false, follow: false } };
const payments: ClientPaymentItem[] = [
  {
    id: "fixture-pending",
    concept: "Anticipo inicial",
    amount: 600,
    paidAmount: 200,
    currency: "USD",
    status: "PARTIAL",
    dueDate: "2026-10-23",
    paidAt: null,
    project: { name: "Proyecto de demostración" },
  },
  {
    id: "fixture-scheduled",
    concept: "Entrega final y conformidad",
    amount: 360,
    currency: "USD",
    status: "SCHEDULED",
    dueDate: null,
    paidAt: null,
    milestone: { title: "Entrega final" },
    project: { name: "Proyecto de demostración" },
  },
  {
    id: "fixture-review",
    concept: "Mantenimiento de octubre",
    amount: 450,
    currency: "PEN",
    status: "UNDER_REVIEW",
    dueDate: null,
    paidAt: null,
    evidenceUrl: "/logos/logo-full.webp",
    evidenceOriginalName: "imagen-de-demostracion.webp",
    evidenceMimeType: "image/webp",
    project: null,
  },
  {
    id: "fixture-paid",
    concept: "Reserva confirmada",
    amount: 180,
    currency: "USD",
    status: "PAID",
    dueDate: null,
    paidAt: "2026-10-12",
    project: null,
  },
];
export default function PaymentsFixture() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <p className="mb-6 text-sm text-muted-foreground">
        Fixture de validación · Datos ficticios
      </p>
      <ClientPaymentsView payments={payments} channels={[{ id: 'TRANSFER_BCP', name: 'Banco de demostración', shortName: 'Banco demo', category: 'BANK', accountHolder: 'Empresa de demostración', instructions: 'Datos ficticios, no transferir.', color: '#c93a20', accounts: [{ currency: 'USD', currencyLabel: 'Dólares', accountType: 'Ahorros', accountNumber: '00000000000000000000', cci: '00000000000000000000' }] }]} />
      <ClientPaymentsView payments={[]} />
    </main>
  );
}
