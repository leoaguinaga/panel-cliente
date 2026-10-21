import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { GuideIcon } from '@/components/guides/GuideIcon';
import { formatGuideDate, getGuide } from '@/src/modules/guides/registry';
import { ROUTES } from '@/lib/constants';

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const { default: Content } = await import(`@/content/guides/${guide.slug}.mdx`);

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_220px]">
      <article className="min-w-0 max-w-4xl">
        <Link href={ROUTES.internal.guides} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} aria-hidden="true" />Guías
        </Link>
        <header className="mt-5 border-b pb-6">
          <span className="grid size-10 place-items-center rounded-xl bg-muted text-brand"><GuideIcon name={guide.icon} size={20} /></span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{guide.title}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{guide.summary}</p>
        </header>
        <div className="pt-8">
          <Content />
        </div>
        <footer className="mt-14 border-t pt-5 text-sm text-muted-foreground">
          <p>Actualizada el {formatGuideDate(guide.updatedAt)}.</p>
          {guide.covers.length > 0 && (
            <p className="mt-1">Cubre: {guide.covers.map((cover, index) => <span key={cover.route}>{index > 0 && ', '}<code className="font-mono text-xs">{cover.route}</code></span>)}</p>
          )}
        </footer>
      </article>
      <nav aria-label="En esta guía" className="hidden xl:block">
        <div className="sticky top-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">En esta guía</p>
          <ol className="mt-3 space-y-1 border-l">
            {guide.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="-ml-px block border-l border-transparent py-1 pl-3 text-sm text-slate-600 hover:border-slate-400 hover:text-foreground">{section.title}</a>
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </div>
  );
}
