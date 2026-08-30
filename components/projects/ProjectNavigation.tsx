'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarRange, ClipboardList, FileText, Kanban, Layers, ListChecks, Settings, Target, WalletCards } from 'lucide-react';

const groups = [
  { segment: '/tasks/', label: 'Tareas y progreso', href: 'tasks/kanban', icon: Kanban },
  { segment: '/planning/', label: 'Hitos y planificación', href: 'planning/requirements', icon: Target },
  { segment: '/documentation/', label: 'Documentación', href: 'documentation/contracts', icon: FileText },
];

const tabs = {
  tasks: [
    { href: 'tasks/kanban', label: 'Kanban', icon: Kanban },
    { href: 'tasks/sprints', label: 'Sprints', icon: Layers },
    { href: 'tasks/gantt', label: 'Gantt', icon: CalendarRange },
  ],
  planning: [
    { href: 'planning/requirements', label: 'Requerimientos', icon: ClipboardList },
    { href: 'planning/milestones', label: 'Hitos', icon: Target },
    { href: 'planning/scope', label: 'Alcance', icon: ListChecks },
  ],
  documentation: [
    { href: 'documentation/contracts', label: 'Contratos', icon: FileText },
    { href: 'documentation/files', label: 'Archivos', icon: FileText },
    { href: 'documentation/payments', label: 'Condiciones de pago', icon: WalletCards },
  ],
};

export function ProjectNavigation({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const activeGroup = pathname.includes('/tasks/') ? 'tasks' : pathname.includes('/planning/') ? 'planning' : pathname.includes('/documentation/') ? 'documentation' : null;
  const base = `/internal/projects/${projectId}`;

  return (
    <nav aria-label="Navegación del proyecto" className="space-y-2">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href={base} aria-current={pathname === base ? 'page' : undefined} className={`min-h-11 shrink-0 px-3.5 py-2.5 text-xs font-semibold ${pathname === base ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}>Resumen</Link>
        {groups.map(({ segment, label, href, icon: Icon }) => {
          const active = pathname.includes(segment);
          return <Link key={href} href={`${base}/${href}`} aria-current={active ? 'page' : undefined} className={`inline-flex min-h-11 shrink-0 items-center gap-2 px-3.5 py-2.5 text-xs font-semibold ${active ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}><Icon className="size-4" />{label}</Link>;
        })}
        <Link href={`${base}/settings`} aria-label="Ajustes del proyecto" aria-current={pathname.endsWith('/settings') ? 'page' : undefined} className={`ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 px-3.5 py-2.5 text-xs font-semibold ${pathname.endsWith('/settings') ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}><Settings className="size-4" />Ajustes</Link>
      </div>
      {activeGroup && <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-50 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={`Vistas de ${activeGroup}`}>
        {tabs[activeGroup].map(({ href, label, icon: Icon }) => {
          const active = pathname.endsWith(`/${href}`);
          return <Link key={href} href={`${base}/${href}`} aria-current={active ? 'page' : undefined} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${active ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'}`}><Icon className="size-3.5" />{label}</Link>;
        })}
      </div>}
    </nav>
  );
}
