'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { Check, ChevronDown, Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterOption = { value: string; label: string; count?: number };
export type FilterDef = {
  /** Parámetro de la URL; los valores múltiples van separados por comas. */
  key: string;
  label: string;
  options: FilterOption[];
  /** Solo una opción a la vez (p. ej. vencimiento). */
  single?: boolean;
  /** Se muestra en «Más filtros» mientras no esté activo. */
  secondary?: boolean;
};
export type FilterView = { id: string; label: string; count?: number };

const valuesOf = (raw: string | null) => (raw ? raw.split(',').filter(Boolean) : []);

/**
 * Barra de filtros de los listados: pestañas de vista, búsqueda y filtros en
 * pastillas que se aplican al elegir. Todo vive en la URL para poder compartirla.
 */
export function FilterBar({
  views,
  defaultView,
  filters,
  searchPlaceholder = 'Buscar…',
}: {
  views?: FilterView[];
  defaultView?: string;
  filters: FilterDef[];
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
  const urlQuery = searchParams.get('q') ?? '';
  const [search, setSearch] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (syncedQuery !== urlQuery) {
    setSyncedQuery(urlQuery);
    setSearch(urlQuery);
  }

  const navigate = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete('page');
    const next = params.toString();
    startTransition(() => router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false }));
  };
  const setValues = (key: string, values: string[]) =>
    navigate((params) => (values.length ? params.set(key, values.join(',')) : params.delete(key)));

  // Búsqueda: se aplica al dejar de escribir.
  useEffect(() => {
    if (search === urlQuery) return;
    const timer = setTimeout(() => navigate((params) => (search.trim() ? params.set('q', search.trim()) : params.delete('q'))), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo reacciona al texto
  }, [search]);

  // «/» enfoca la búsqueda desde cualquier parte de la página.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== '/' || event.metaKey || event.ctrlKey || target.closest('input, textarea, select, [contenteditable=true]')) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activeView = searchParams.get('view') || defaultView;
  const isActive = (filter: FilterDef) => valuesOf(searchParams.get(filter.key)).length > 0;
  const visible = filters.filter((filter) => !filter.secondary || isActive(filter));
  const hidden = filters.filter((filter) => filter.secondary && !isActive(filter));
  const anyActive = Boolean(urlQuery) || filters.some(isActive);

  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={isPending}>
      {views && (
        <>
          <div role="tablist" aria-label="Vista" className="inline-flex max-w-full overflow-x-auto rounded-lg border bg-card p-0.5 [scrollbar-width:none]">
            {views.map((view) => (
              <button
                key={view.id}
                type="button"
                role="tab"
                aria-selected={activeView === view.id}
                onClick={() => navigate((params) => (view.id === defaultView ? params.delete('view') : params.set('view', view.id)))}
                className="shrink-0 rounded-md px-3 py-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-muted aria-selected:text-foreground"
              >
                {view.label}
                {view.count !== undefined && <span className="ml-1.5 text-xs font-medium tabular-nums text-muted-foreground">{view.count}</span>}
              </button>
            ))}
          </div>
          <span aria-hidden className="mx-0.5 hidden h-5 w-px bg-border sm:block" />
        </>
      )}

      <label className="flex h-9 min-w-0 flex-1 basis-56 items-center gap-2 rounded-lg border bg-card px-3 text-sm focus-within:ring-2 focus-within:ring-ring sm:max-w-72">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="sr-only">Buscar</span>
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => event.key === 'Escape' && setSearch('')}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {isPending ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-label="Actualizando" />
        ) : (
          <kbd className="hidden rounded border px-1.5 font-sans text-[10.5px] text-muted-foreground sm:inline">/</kbd>
        )}
      </label>

      {visible.map((filter) => (
        <FilterPill key={filter.key} filter={filter} selected={valuesOf(searchParams.get(filter.key))} onChange={(values) => setValues(filter.key, values)} />
      ))}

      {hidden.length > 0 && <MoreFilters filters={hidden} onChange={setValues} />}

      {anyActive && (
        <button
          type="button"
          onClick={() => {
            setSearch('');
            navigate((params) => {
              params.delete('q');
              for (const filter of filters) params.delete(filter.key);
            });
          }}
          className="px-1 text-[13px] font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}

function FilterPill({ filter, selected, onChange }: { filter: FilterDef; selected: string[]; onChange: (values: string[]) => void }) {
  const active = selected.length > 0;
  const summary = selected.length === 1 ? (filter.options.find((option) => option.value === selected[0])?.label ?? '1') : String(selected.length);
  return (
    <PopoverPrimitive.Root>
      <div
        className={cn(
          'inline-flex h-8 items-center rounded-full border text-[13px] font-semibold transition-colors',
          active ? 'border-border bg-card text-foreground' : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/70 hover:text-foreground',
        )}
      >
        <PopoverPrimitive.Trigger className="inline-flex h-full items-center gap-1.5 rounded-full pl-3 pr-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {active ? (
            <>
              {filter.label}: <span className="max-w-40 truncate font-medium text-muted-foreground">{summary}</span>
            </>
          ) : (
            <>+ {filter.label}</>
          )}
          {!active && <ChevronDown className="size-3.5" aria-hidden />}
        </PopoverPrimitive.Trigger>
        {active && (
          <button
            type="button"
            onClick={() => onChange([])}
            aria-label={`Quitar filtro ${filter.label}`}
            className="-ml-1 mr-1 grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 w-64 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <OptionList filter={filter} selected={selected} onChange={onChange} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function OptionList({ filter, selected, onChange }: { filter: FilterDef; selected: string[]; onChange: (values: string[]) => void }) {
  const [term, setTerm] = useState('');
  const searchable = filter.options.length > 7;
  const options = term ? filter.options.filter((option) => option.label.toLowerCase().includes(term.toLowerCase())) : filter.options;
  const toggle = (value: string) => {
    if (filter.single) return onChange(selected.includes(value) ? [] : [value]);
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };
  return (
    <div>
      {searchable && (
        <input
          autoFocus
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={`Buscar ${filter.label.toLowerCase()}…`}
          aria-label={`Buscar ${filter.label.toLowerCase()}`}
          className="mb-1 h-8 w-full rounded-md border bg-background px-2.5 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
      <div role={filter.single ? 'radiogroup' : 'group'} aria-label={filter.label} className="max-h-72 overflow-y-auto">
        {!options.length && <p className="px-2 py-3 text-[13px] text-muted-foreground">Sin coincidencias.</p>}
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              role={filter.single ? 'radio' : 'checkbox'}
              aria-checked={checked}
              onClick={() => toggle(option.value)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
                option.count === 0 && !checked && 'text-muted-foreground',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'grid size-4 shrink-0 place-items-center border',
                  filter.single ? 'rounded-full' : 'rounded',
                  checked ? 'border-foreground bg-foreground text-background' : 'border-muted-foreground/50',
                )}
              >
                {checked && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.count !== undefined && <span className="text-xs tabular-nums text-muted-foreground">{option.count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MoreFilters({ filters, onChange }: { filters: FilterDef[]; onChange: (key: string, values: string[]) => void }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const current = filters.find((filter) => filter.key === openKey);
  return (
    <PopoverPrimitive.Root onOpenChange={(open) => !open && setOpenKey(null)}>
      <PopoverPrimitive.Trigger className="inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/40 px-3 text-[13px] font-semibold text-muted-foreground hover:border-muted-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <SlidersHorizontal className="size-3.5" aria-hidden />
        Más filtros
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="start" sideOffset={6} collisionPadding={12} className="z-50 w-64 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none">
          {current ? (
            <>
              <button type="button" onClick={() => setOpenKey(null)} className="mb-1 flex w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                ‹ {current.label}
              </button>
              <OptionList filter={current} selected={[]} onChange={(values) => onChange(current.key, values)} />
            </>
          ) : (
            filters.map((filter) => (
              <button key={filter.key} type="button" onClick={() => setOpenKey(filter.key)} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">
                {filter.label}
                <span aria-hidden className="text-muted-foreground">›</span>
              </button>
            ))
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
