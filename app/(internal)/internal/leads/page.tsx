import Link from "next/link";
import { getLeads, getWorkers } from "@/src/modules/leads/server/queries";
import { getCatalogs } from "@/src/modules/products/server/queries";
import { getActiveWorkspace } from "@/src/modules/workspaces/server/workspace";
import { CreateLeadSheet } from "@/components/internal/CreateSheets";
import { LeadKanban } from "@/components/kanban/LeadKanban";
import {
  Kanban,
  Table as TableIcon,
  MapPin,
  ExternalLink,
  Sparkles,
  Filter,
  User,
  Phone,
  Mail,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatLeadStatus, formatProjectPriority } from "@/lib/formatters";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    status?: string;
    type?: string;
    priority?: string;
    zone?: string;
    q?: string;
    lead?: string;
  }>;
}) {
  const {
    view = "kanban",
    status,
    type,
    priority,
    zone,
    q,
    lead,
  } = await searchParams;

  const [leads, workers, products, workspace] = await Promise.all([
    getLeads({ status, type, priority, zone, q }).catch(() => []),
    getWorkers().catch(() => []),
    getCatalogs().then((catalogs) => catalogs.products.map(({ id, name }) => ({ id, name }))).catch(() => []),
    getActiveWorkspace(),
  ]);
  // Un lead nuevo nace en el espacio activo.
  const defaultProductId = products.some((product) => product.id === workspace) ? workspace : null;

  return (
    <div className="space-y-6">
      {/* Header with Title, View Toggle and New Lead */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {leads.length} prospectos en los últimos 30 días
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Prospección Comercial & Leads
            </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Flujo de prospección por zonas geográficas y desarrollo autónomo de
            sitios web para cierre comercial.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border bg-slate-100 p-1">
            <Link
              href={`/internal/leads?view=kanban${status ? `&status=${status}` : ""}${zone ? `&zone=${zone}` : ""}`}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                view === "kanban"
                  ? "bg-card text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Tablero Kanban
            </Link>
            <Link
              href={`/internal/leads?view=table${status ? `&status=${status}` : ""}${zone ? `&zone=${zone}` : ""}`}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                view === "table"
                  ? "bg-card text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Vista Lista
            </Link>
          </div>

          <CreateLeadSheet workers={workers} products={products} defaultProductId={defaultProductId} />
        </div>
      </div>

      {/* Main View Area */}
      {view === "kanban" ? (
        <LeadKanban initialLeads={leads} workers={workers} products={products} initialLeadId={lead} />
      ) : (
        <div className="space-y-4">
          {/* Table View */}
          <div className="bg-card border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Negocio / Contacto
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Zona / Territorio
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Estado del Pipeline
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Demo Web
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Responsable
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-slate-200">
                  {leads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-xs text-slate-500"
                      >
                        No hay prospectos registrados que coincidan con el
                        criterio.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Link
                            href={`/internal/leads/${lead.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-blue-600 block transition-colors"
                          >
                            {lead.companyName || lead.name}
                          </Link>
                          {lead.companyName &&
                            lead.name !== lead.companyName && (
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <User className="w-3 h-3 text-slate-400" />
                                {lead.name}
                              </p>
                            )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {lead.zone ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {lead.zone}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              General
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Badge
                            className={`text-[10px] px-2 py-0.5 ${
                              lead.priority === "URGENT"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : lead.priority === "HIGH"
                                  ? "bg-amber-100 text-amber-700 border-amber-200"
                                  : lead.priority === "LOW"
                                    ? "bg-slate-100 text-slate-600 border-slate-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {formatProjectPriority(lead.priority)}
                          </Badge>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {formatLeadStatus(lead.status)}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {lead.previewUrl ? (
                            <a
                              href={
                                lead.previewUrl.startsWith("http")
                                  ? lead.previewUrl
                                  : `https://${lead.previewUrl}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                            >
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              Ver Demo
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Sin demo
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600">
                          {lead.assignedTo?.name || (
                            <span className="text-slate-400 italic">
                              Sin asignar
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs font-semibold">
                          <Link
                            href={`/internal/leads/${lead.id}`}
                            className="text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                          >
                            Ver Detalle
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
