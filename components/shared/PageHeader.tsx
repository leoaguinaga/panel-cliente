import Link from 'next/link';
import { CircleHelp } from 'lucide-react';
import { guideHref } from '@/src/modules/guides/registry';

/** `help="slug#seccion"` enlaza a una guía cuando el «?» del header no alcanza (p. ej. dos pantallas en la misma ruta). */
export function PageHeader({ eyebrow, title, description, action, help }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode; help?: string }) {
  const [slug, section] = help?.split('#') ?? [];
  return <div className="flex flex-wrap items-end justify-between gap-4"><div>{eyebrow && <p className="text-sm text-muted-foreground">{eyebrow}</p>}<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>{description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}{slug && <Link href={guideHref(slug, section)} className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><CircleHelp size={15} aria-hidden="true" />Cómo funciona</Link>}</div>{action}</div>;
}
