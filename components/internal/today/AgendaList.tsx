import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { TodayItem } from '@/src/modules/dashboard/server/queries';
import { actionLabels, formatMoney, itemHref, kindLabels, kindTone, whenLabel } from './today-items';

const VISIBLE = 8;

export function AgendaGroup({ title, items, today, tone = 'default', note, children }: { title: string; items: TodayItem[]; today: string; tone?: 'default' | 'late'; note?: string; children?: React.ReactNode }) {
  if (items.length === 0 && !children) return null;
  const visible = items.slice(0, VISIBLE);
  const hidden = items.slice(VISIBLE);
  return (
    <section aria-labelledby={`group-${title}`} className="space-y-2.5">
      <div className="flex items-baseline gap-2.5">
        <h2 id={`group-${title}`} className={`font-sans text-[15px] font-semibold tracking-normal ${tone === 'late' ? 'text-red-700 dark:text-red-400' : ''}`}>{title}</h2>
        {items.length > 0 && <span className="text-sm tabular-nums text-muted-foreground">{items.length}</span>}
        {note && <span className="text-sm text-muted-foreground">· {note}</span>}
      </div>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {visible.map((item) => <AgendaRow key={item.id} item={item} today={today} late={tone === 'late'} />)}
        {children}
      </ul>
      {hidden.length > 0 && (
        <details className="group">
          <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded-md px-1 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
            Mostrar {hidden.length} más
          </summary>
          <ul className="mt-2 divide-y overflow-hidden rounded-xl border bg-card">
            {hidden.map((item) => <AgendaRow key={item.id} item={item} today={today} late={tone === 'late'} />)}
          </ul>
        </details>
      )}
    </section>
  );
}

function AgendaRow({ item, today, late }: { item: TodayItem; today: string; late: boolean }) {
  const when = whenLabel(item, today);
  const money = formatMoney(item.amount);
  const href = itemHref(item);
  return (
    <li className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 transition-colors focus-within:bg-muted/40 hover:bg-muted/40 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:gap-x-4">
      <span className={`hidden text-xs tabular-nums sm:block ${late ? 'font-medium text-red-700 dark:text-red-400' : 'text-muted-foreground'}`}>{when ?? '—'}</span>
      <div className="min-w-0">
        <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <span className={`shrink-0 rounded-full px-2 py-px text-[11px] font-semibold ${kindTone[item.kind]}`}>{kindLabels[item.kind]}</span>
          <span className="truncate">{item.title}</span>
        </p>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {when && <span className={`sm:hidden ${late ? 'font-medium text-red-700 dark:text-red-400' : ''}`}>{when} · </span>}
          {[money, item.context, item.unassigned ? 'sin responsable' : null].filter(Boolean).join(' · ')}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors after:absolute after:inset-0 after:content-[''] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-8 sm:w-fit sm:border sm:bg-background sm:px-3 sm:text-[13px] sm:font-medium sm:whitespace-nowrap sm:text-foreground"
      >
        <span className="sr-only sm:not-sr-only">{actionLabels[item.kind]}</span>
        <span className="sr-only">: {item.title}</span>
        <ChevronRight aria-hidden className="size-4 sm:hidden" />
      </Link>
    </li>
  );
}

export function AgendaExtraRow({ href, label, description, action }: { href: string; label: string; description: string; action: string }) {
  return (
    <li className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium"><span className={`rounded-full px-2 py-px text-[11px] font-semibold ${kindTone.project_unassigned}`}>Sin responsable</span>{label}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
      </div>
      <Link href={href} className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-[13px] font-medium after:absolute after:inset-0 after:content-[''] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{action}</Link>
    </li>
  );
}
