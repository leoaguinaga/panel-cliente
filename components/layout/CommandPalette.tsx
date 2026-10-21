"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  Flame,
  FolderKanban,
  ListChecks,
  Loader2,
  Search,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

import { ROUTES } from "@/lib/constants"
import {
  formatClientStatus,
  formatCurrency,
  formatLeadStatus,
  formatProjectStatus,
  formatTaskStatus,
  taskCode,
} from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { GUIDES, guideHref } from "@/src/modules/guides/registry"

type ClientRef = { name: string; businessName: string | null }
type SearchResponse = {
  query: string
  projects: { id: string; name: string; status: string; client: ClientRef }[]
  clients: { id: string; name: string; businessName: string | null; status: string; projectCount: number }[]
  leads: { id: string; name: string; companyName: string | null; status: string }[]
  tasks: { id: string; number: number; title: string; status: string; project: { id: string; name: string } }[]
  payments: { id: string; concept: string; amount: string; currency: string; status: string; projectId: string | null; client: ClientRef }[]
}
type Item = { id: string; group: string; title: string; meta?: string; href: string; icon: LucideIcon }

const PAGES: { title: string; href: string }[] = [
  { title: "Inicio", href: ROUTES.internal.dashboard },
  { title: "Calendario", href: "/internal/calendar" },
  { title: "Tareas", href: "/internal/tasks" },
  { title: "Proyectos", href: ROUTES.internal.projects },
  { title: "Leads", href: ROUTES.internal.leads },
  { title: "Clientes", href: ROUTES.internal.clients },
  { title: "Productos", href: ROUTES.internal.products },
  { title: "Servicios", href: ROUTES.internal.settings + "?section=servicios" },
  { title: "Documentos", href: ROUTES.internal.documents },
  { title: "Cobros", href: ROUTES.internal.payments },
  { title: "Guías", href: ROUTES.internal.guides },
  { title: "Colaboradores", href: ROUTES.internal.workers },
  { title: "Configuración", href: ROUTES.internal.settings },
]

const paymentStatusLabels: Record<string, string> = {
  SCHEDULED: "programado",
  PENDING: "pendiente",
  UNDER_REVIEW: "por verificar",
  PARTIAL: "pago parcial",
  PAID: "pagado",
  OVERDUE: "vencido",
}

const clientName = (client: ClientRef) => client.businessName || client.name
const fold = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()

/** Secciones de las guías que coinciden con el término (título de guía, de sección o palabras clave). */
function guideItems(term: string): Item[] {
  const needle = fold(term)
  return GUIDES.flatMap((guide) =>
    guide.sections
      .filter((section) => [guide.title, section.title, ...(section.keywords ?? [])].some((text) => fold(text).includes(needle)))
      .map((section) => ({
        id: `guide-${guide.slug}-${section.id}`, group: "Guías", title: section.title, meta: guide.title,
        href: guideHref(guide.slug, section.id), icon: BookOpen,
      })),
  ).slice(0, 6)
}

function toItems(data: SearchResponse): Item[] {
  return [
    ...data.projects.map((p) => ({
      id: `project-${p.id}`, group: "Proyectos", title: p.name, icon: FolderKanban,
      meta: `${clientName(p.client)} · ${formatProjectStatus(p.status).toLowerCase()}`,
      href: `${ROUTES.internal.projects}/${p.id}`,
    })),
    ...data.clients.map((c) => ({
      id: `client-${c.id}`, group: "Clientes", title: c.businessName || c.name, icon: UsersRound,
      meta: `${c.projectCount} ${c.projectCount === 1 ? "proyecto" : "proyectos"} · ${formatClientStatus(c.status).toLowerCase()}`,
      href: `${ROUTES.internal.clients}/${c.id}`,
    })),
    ...data.leads.map((l) => ({
      id: `lead-${l.id}`, group: "Leads", title: l.name, icon: Flame,
      meta: [l.companyName, formatLeadStatus(l.status).toLowerCase()].filter(Boolean).join(" · "),
      href: `${ROUTES.internal.leads}/${l.id}`,
    })),
    ...data.tasks.map((t) => ({
      id: `task-${t.id}`, group: "Tareas", title: `${taskCode(t.number)} ${t.title}`, icon: ListChecks,
      meta: `${t.project.name} · ${formatTaskStatus(t.status).toLowerCase()}`,
      href: `${ROUTES.internal.projects}/${t.project.id}/tasks/kanban?task=${t.id}`,
    })),
    ...data.payments.map((p) => ({
      id: `payment-${p.id}`, group: "Cobros", title: p.concept, icon: CreditCard,
      meta: `${formatCurrency(p.amount, p.currency)} · ${paymentStatusLabels[p.status] ?? p.status.toLowerCase()}`,
      href: p.projectId ? `${ROUTES.internal.projects}/${p.projectId}/documentation/payments` : ROUTES.internal.payments,
    })),
  ]
}

/** Búsqueda global del panel interno (⌘K / Ctrl+K). */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  // La respuesta guarda su término: si no coincide con el actual, la búsqueda sigue en curso.
  const [found, setFound] = React.useState<{ term: string; items: Item[]; failed: boolean }>({ term: "", items: [], failed: false })
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const term = query.trim()
  const searching = term.length >= 2
  React.useEffect(() => {
    if (term.length < 2) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/backend/dashboard/search?q=${encodeURIComponent(term)}`, { signal: controller.signal, headers: { Accept: "application/json" } })
        if (!response.ok) throw new Error(String(response.status))
        setFound({ term, items: toItems((await response.json()) as SearchResponse), failed: false })
      } catch (error) {
        if ((error as Error).name === "AbortError") return
        setFound({ term, items: [], failed: true })
      }
      setActive(0)
    }, 150)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [term])
  const loading = searching && found.term !== term
  const failed = searching && !loading && found.failed
  const items = React.useMemo(() => {
    const pages = PAGES
      .filter((page) => !term || fold(page.title).includes(fold(term)))
      .map((page): Item => ({ id: `page-${page.href}`, group: "Ir a", title: page.title, href: page.href, icon: ArrowRight }))
    // Mientras llega la respuesta se mantienen los resultados anteriores para no parpadear.
    return [...(term.length >= 2 ? found.items : []), ...(term.length >= 2 ? guideItems(term) : []), ...pages]
  }, [found.items, term])

  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active])

  const onOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) { setQuery(""); setActive(0) }
  }
  const go = (item?: Item) => {
    if (!item) return
    onOpenChange(false)
    router.push(item.href)
  }
  const onInputKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!items.length) return
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((i) => (i + 1) % items.length) }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => (i - 1 + items.length) % items.length) }
    else if (event.key === "Enter") { event.preventDefault(); go(items[active]) }
  }

  const showEmpty = searching && !loading && !items.length

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Buscar (⌘K)"
          className="ml-auto inline-flex size-8 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-card text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-60 md:justify-start md:pl-2.5 md:pr-1.5"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="hidden flex-1 text-left md:inline">Buscar…</span>
          <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10.5px] font-semibold md:inline">⌘K</kbd>
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[.98] motion-reduce:animate-none"
        >
          <DialogPrimitive.Title className="sr-only">Buscar en el panel</DialogPrimitive.Title>
          <div className="flex items-center gap-2.5 border-b px-4 text-muted-foreground">
            {loading ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : <Search className="size-4 shrink-0" aria-hidden />}
            <input
              autoFocus
              value={query}
              onChange={(event) => { setQuery(event.target.value); setActive(0) }}
              onKeyDown={onInputKey}
              placeholder="Busca proyectos, clientes, leads, tareas, cobros o guías…"
              role="combobox"
              aria-expanded
              aria-controls="command-palette-list"
              aria-activedescendant={items[active] ? `cmd-${items[active].id}` : undefined}
              aria-autocomplete="list"
              className="h-12 min-w-0 flex-1 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground/80"
            />
            <kbd className="rounded border bg-muted px-1.5 font-mono text-[10.5px] font-semibold">esc</kbd>
          </div>
          <div ref={listRef} id="command-palette-list" role="listbox" aria-label="Resultados" className="max-h-[min(60vh,22rem)] overflow-y-auto p-1">
            {failed && <p className="px-3 py-2 text-sm text-destructive">No se pudo buscar. Vuelve a intentarlo.</p>}
            {showEmpty && !failed && <p className="px-3 py-8 text-center text-sm text-muted-foreground">Nada coincide con «{term}»</p>}
            {items.map((item, index) => {
              const Icon = item.icon
              return (
                <React.Fragment key={item.id}>
                  {item.group !== items[index - 1]?.group && (
                    <div role="presentation" className="px-2.5 pb-1 pt-2.5 text-xs text-muted-foreground">{item.group}</div>
                  )}
                  <div
                    id={`cmd-${item.id}`}
                    role="option"
                    aria-selected={index === active}
                    data-index={index}
                    onMouseMove={() => index !== active && setActive(index)}
                    onClick={() => go(item)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground/85",
                      index === active && "bg-muted text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate">{item.title}</span>
                    {item.meta && <span className="ml-auto shrink-0 pl-3 text-xs text-muted-foreground max-sm:hidden">{item.meta}</span>}
                  </div>
                </React.Fragment>
              )
            })}
          </div>
          <div className="flex gap-4 border-t px-4 py-2 text-[11.5px] text-muted-foreground max-sm:hidden">
            <span><kbd className="font-mono">↑↓</kbd> moverse</span>
            <span><kbd className="font-mono">↵</kbd> abrir</span>
            <span><kbd className="font-mono">esc</kbd> cerrar</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
