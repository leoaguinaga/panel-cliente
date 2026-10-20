import { Pagination } from '@/components/shared/Pagination';
import Link from 'next/link';
import { DocumentUploadSheet } from '@/components/internal/DocumentUploadSheet';
import { EmptyState } from '@/components/shared/EmptyState';
import { getClients } from '@/src/modules/clients/server/queries';
import { getDocumentsPage } from '@/src/modules/documents/server/queries';
import { getProjectsOverview } from '@/src/modules/projects/server/queries';
import { AdminDocumentsTable } from '@/components/internal/AdminDocumentsTable';

const labels: Record<string, string> = {
  COMMERCIAL_PROPOSAL: 'Propuesta',
  SIGNED_CONTRACT: 'Contrato',
  INVOICE: 'Factura',
  PAYMENT_PROOF: 'Comprobante',
  DELIVERABLE: 'Entregable',
  INTERNAL_FILE: 'Interno',
  OTHER: 'Otro',
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; clientId?: string; projectId?: string; page?: string; archived?: string }>;
}) {
  const filters = await searchParams;
  const [documentPage, clients, projects] = await Promise.all([
    getDocumentsPage({
      q: filters.q,
      type: filters.type,
      clientId: filters.clientId,
      projectId: filters.projectId,
      page: filters.page,
      archived: filters.archived,
    }),
    getClients(),
    getProjectsOverview(),
  ]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Archivos y evidencia</p>
          <h1 className="text-3xl font-semibold tracking-tight">Documentos</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Centraliza contratos, propuestas, entregables y archivos de operación con visor de Word (.docx), imágenes y PDF.
          </p>
        </div>
        <DocumentUploadSheet clients={clients} projects={projects} />
      </header>

      <form className="flex flex-wrap gap-2 rounded-2xl border bg-card p-3 shadow-xs">
        <input
          name="q" aria-label="Buscar documentos"
          defaultValue={filters.q}
          placeholder="Buscar documento, cliente o proyecto"
          className="min-w-56 flex-1 rounded-xl border bg-background px-3 py-2 text-sm"
        />
        <select
          name="type" aria-label="Tipo de documento"
          defaultValue={filters.type || ''}
          className="rounded-xl border bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
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
        <Link
          href="/internal/documents"
          className="flex items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Limpiar
        </Link>
      </form>

      <form className="flex items-center gap-3 text-sm"><label><input type="checkbox" name="archived" value="true" defaultChecked={filters.archived === 'true'} /> Ver archivados</label><button className="rounded-md border p-2">Aplicar</button></form>
      {documentPage.items.length === 0 ? (
        <EmptyState
          title="No hay documentos con estos filtros"
          description="Sube el primer archivo para dejar evidencia vinculada a un cliente o proyecto."
          action={<DocumentUploadSheet clients={clients} projects={projects} />}
        />
      ) : (
        <AdminDocumentsTable documents={documentPage.items} />
      )}
      <Pagination total={documentPage.total} page={documentPage.page} query={filters} />
    </section>
  );
}
