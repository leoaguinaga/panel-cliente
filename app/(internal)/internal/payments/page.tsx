import { Pagination } from '@/components/shared/Pagination';
import { ActionForm } from '@/components/shared/ActionForm';
import { getClients } from '@/src/modules/clients/server/queries';
import { getProjectsOverview } from '@/src/modules/projects/server/queries';
import { getPaymentsPage, getPaymentSummary } from '@/src/modules/payments/server/queries';
import { createPaymentAction } from '@/src/modules/payments/server/actions';
import { formatCurrency } from '@/lib/formatters';
import { AdminPaymentsTable } from '@/components/internal/AdminPaymentsTable';
import { Clock, ShieldAlert } from 'lucide-react';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; clientId?: string; page?: string }>;
}) {
  const filters = await searchParams;
  const [paymentPage, summary, clients, projects] = await Promise.all([
    getPaymentsPage(filters),
    getPaymentSummary(),
    getClients(),
    getProjectsOverview(),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Finanzas operativas</p>
        <h1 className="text-3xl font-semibold tracking-tight">Pagos programados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controla cuotas, canales de pago, comprobantes adjuntos y validaciones administrativas.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Total Programado" value={formatCurrency(summary.total)} />
        <Metric
          label="Por verificar (En revisión)"
          value={formatCurrency(summary.underReview || 0)}
          highlight={Boolean(summary.underReview && summary.underReview > 0)}
        />
        <Metric label="Cobrado" value={formatCurrency(summary.paid)} />
        <Metric label="Pendiente" value={formatCurrency(summary.pending)} />
        <Metric label="Vencido" value={formatCurrency(summary.overdue)} isWarning={Boolean(summary.overdue && summary.overdue > 0)} />
      </div>

      {/* Filter and Create Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <form className="flex flex-wrap items-center gap-2">
          <select
            name="status" aria-label="Estado del pago"
            defaultValue={filters.status || ''}
            className="rounded-xl border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="UNDER_REVIEW">Por verificar (En revisión)</option>
            <option value="PENDING">Pendiente</option>
            <option value="PARTIAL">Pago parcial</option>
            <option value="PAID">Pagado</option>
            <option value="OVERDUE">Vencido</option>
            <option value="CANCELLED">Cancelado</option>
          </select>

          <select
            name="clientId" aria-label="Cliente"
            defaultValue={filters.clientId || ''}
            className="rounded-xl border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos los clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.businessName || client.name}
              </option>
            ))}
          </select>

          <button className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            Filtrar
          </button>
        </form>
      </div>

      <a className="block text-sm underline" href={`/api/backend/payments/export?${new URLSearchParams(Object.entries(filters).filter(([key,value]) => key !== 'page' && Boolean(value)) as [string,string][])}`}>Exportar CSV</a>
      {/* Register Payment Form */}
      <ActionForm
        action={createPaymentAction}
        className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs md:grid-cols-3"
      >
        <div className="md:col-span-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Registrar nueva cuota o pago programado
          </h3>
        </div>

        <select
          name="clientId" aria-label="Cliente"
          required
          className="rounded-xl border bg-background px-3 py-2 text-sm"
        >
          <option value="">Seleccionar cliente *</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.businessName || client.name}
            </option>
          ))}
        </select>

        <select
          name="projectId" aria-label="Proyecto"
          className="rounded-xl border bg-background px-3 py-2 text-sm"
        >
          <option value="">Sin proyecto asociado</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <input
          name="concept" aria-label="Concepto"
          required
          placeholder="Concepto (ej. Adelanto 50%) *"
          className="rounded-xl border bg-background px-3 py-2 text-sm"
        />

        <input
          name="amount" aria-label="Monto"
          type="number"
          min="0.01"
          step="0.01"
          required
          placeholder="Monto *"
          className="rounded-xl border bg-background px-3 py-2 text-sm"
        />

        <select
          name="currency" aria-label="Moneda"
          className="rounded-xl border bg-background px-3 py-2 text-sm"
        >
          <option value="USD">USD (Dólares)</option>
          <option value="PEN">PEN (Soles)</option>
        </select>

        <input
          name="dueDate" aria-label="Fecha de vencimiento"
          type="date"
          className="rounded-xl border bg-background px-3 py-2 text-sm"
        />

        <button className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 md:col-span-3">
          Registrar pago programado
        </button>
      </ActionForm>

      {/* Admin Payments Table */}
      <AdminPaymentsTable payments={paymentPage.items} /><Pagination total={paymentPage.total} page={paymentPage.page} query={filters} />
    </section>
  );
}

function Metric({
  label,
  value,
  highlight,
  isWarning,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  isWarning?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-xs ${
        highlight
          ? 'border-amber-300 bg-amber-50/70 text-amber-950 ring-1 ring-amber-400/30'
          : isWarning
          ? 'border-red-200 bg-red-50/50 text-red-950'
          : 'border-slate-200 bg-card'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {highlight && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
        {isWarning && <ShieldAlert size={14} className="text-red-500" />}
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
