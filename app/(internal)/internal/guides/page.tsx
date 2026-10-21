import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { GuideIcon } from '@/components/guides/GuideIcon';
import { GUIDES, formatGuideDate } from '@/src/modules/guides/registry';
import { ROUTES } from '@/lib/constants';

export default function GuidesPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Guías" description="Cómo funciona el panel: qué hace cada módulo, en qué orden y qué hace el sistema solo." />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((guide) => (
          <li key={guide.slug}>
            <Link href={`${ROUTES.internal.guides}/${guide.slug}`} className="group flex h-full flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-slate-300 hover:bg-slate-50">
              <span className="grid size-10 place-items-center rounded-xl bg-muted text-brand"><GuideIcon name={guide.icon} size={20} /></span>
              <h2 className="mt-4 font-semibold group-hover:text-foreground">{guide.title}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-6 text-muted-foreground">{guide.summary}</p>
              <p className="mt-4 text-xs text-muted-foreground">{guide.sections.length} secciones · actualizada el {formatGuideDate(guide.updatedAt)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
