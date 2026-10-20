import { convertLeadToClientAction } from '@/src/modules/clients/server/actions';
import { ActionForm } from '@/components/shared/ActionForm';
import { getLeadById } from '@/src/modules/leads/server/queries';
import { changeLeadStatusAction, markLeadAsLostAction, convertLeadToProjectAction } from '@/src/modules/leads/server/actions';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ExternalLink,
  MapPin,
  Sparkles,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { leadStatusLabels, defaultProjectTypeForLead, formatDate, formatProjectPriority, projectTypeOptions } from '@/lib/formatters';

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const lead = await getLeadById(leadId);

  if (!lead) {
    notFound();
  }

  async function handleConvert(formData: FormData) {
    'use server';
    const res = await convertLeadToProjectAction(leadId, undefined, undefined, undefined, String(formData.get('projectType') || ''));
    if (res?.project?.id) {
      redirect(`/internal/projects/${res.project.id}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <Link href="/internal/leads" className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
            ← Volver a Prospección & Leads
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {lead.companyName || lead.name}
            </h1>
            <Badge
              className={`text-[10px] px-2 py-0.5 ${
                lead.priority === 'URGENT'
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : lead.priority === 'HIGH'
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : lead.priority === 'LOW'
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              Prioridad {formatProjectPriority(lead.priority).toLowerCase()}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lead.status !== 'LOST' && lead.status !== 'WON' && (
            <form action={markLeadAsLostAction.bind(null, lead.id)}>
              <button
                type="submit"
                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                Marcar como Perdido
              </button>
            </form>
          )}

          {lead.status !== 'WON' && (
            <form action={handleConvert} className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="convert-project-type">Tipo de proyecto</label>
              <select id="convert-project-type" name="projectType" defaultValue={defaultProjectTypeForLead(lead.type)} className="h-8 rounded-md border bg-white px-2 text-xs">
                {projectTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Convertir en cliente y proyecto
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column info */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Información del Negocio & Contacto
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Empresa / Negocio</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{lead.companyName || '-'}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">Persona de Contacto</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{lead.name}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">Zona Mapeada</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {lead.zone || 'Sin zona asignada'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">Teléfono / WhatsApp</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{lead.phone || '-'}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-slate-500">Correo Electrónico</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                      {lead.email}
                    </a>
                  ) : (
                    '-'
                  )}
                </p>
              </div>

              {/* Demo Web Card */}
              {lead.previewUrl && (
                <div className="sm:col-span-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Maqueta / Demo Web Desarrollada Autónomamente
                    </p>
                    <p className="text-xs text-blue-700 truncate max-w-md">{lead.previewUrl}</p>
                  </div>
                  <a
                    href={lead.previewUrl.startsWith('http') ? lead.previewUrl : `https://${lead.previewUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"
                  >
                    Abrir Demo
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-slate-500">Notas de Prospección / Mensaje</p>
                <div className="mt-1 text-xs text-slate-800 bg-slate-50 p-3.5 rounded-lg border border-slate-100 whitespace-pre-wrap min-h-16">
                  {lead.message || 'Sin notas registradas.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column status */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Estado del Pipeline
            </h3>

            <form
              action={async (formData) => {
                'use server';
                const newStatus = String(formData.get('status') || '');
                await changeLeadStatusAction(lead.id, newStatus);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Etapa Actual
                </label>
                <select
                  name="status"
                  defaultValue={lead.status}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.entries(leadStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>

              <Button type="submit" size="sm" className="w-full bg-slate-900 hover:bg-black text-white text-xs">
                Actualizar Etapa
              </Button>
            </form>

            <dl className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
              <div className="flex justify-between py-1">
                <dt className="text-slate-500">Responsable</dt>
                <dd className="font-semibold text-slate-800">{lead.assignedTo?.name || 'Sin asignar'}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500">Tipo de Lead</dt>
                <dd className="font-semibold text-slate-800">{lead.type}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500">Fecha de Registro</dt>
                <dd className="font-semibold text-slate-800">
                  {formatDate(lead.createdAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      {lead.status !== 'WON' && <section className="space-y-3 rounded-xl border p-5"><h2 className="font-medium">Convertir solo a cliente o con proyecto personalizado</h2><ActionForm action={convertLeadToClientAction.bind(null,lead.id)} className="space-y-3"><label className="block text-sm">Proyecto opcional<input name="projectName" className="mt-1 w-full rounded-md border p-2" /></label><button className="rounded-md border px-4 py-2 text-sm">Convertir lead</button></ActionForm></section>}
    </div>
  );
}
