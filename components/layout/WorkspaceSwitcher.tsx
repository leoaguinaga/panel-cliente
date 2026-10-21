"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Loader2, Settings2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { WorkspaceMark } from "@/components/products/WorkspaceMark"
import { ROUTES } from "@/lib/constants"
import { setWorkspaceAction } from "@/src/modules/workspaces/server/actions"

export type SwitcherWorkspace = { id: string; name: string; color: string | null; logoUrl: string | null }

/** Marca de FoxCode: el espacio base y la vista «Todos». */
function FoxMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className={size === "sm" ? "flex size-[22px] shrink-0 items-center justify-center rounded-md bg-primary" : "flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary"}>
      {/* eslint-disable-next-line @next/next/no-img-element -- isotipo estático */}
      <img src="/favicon-light.webp" className={size === "sm" ? "size-3.5" : "size-5.5"} alt="" />
    </span>
  )
}

/**
 * Selector del espacio activo. «Todos» no filtra; FoxCode muestra solo lo que
 * no tiene producto; cada producto, lo suyo. El valor vive en la cookie
 * `workspace`, que el backend lee para filtrar Inicio, listados y búsqueda.
 */
export function WorkspaceSwitcher({ workspaces, active }: { workspaces: SwitcherWorkspace[]; active: string }) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  // Muestra el espacio elegido mientras el servidor confirma y la página se refresca.
  const [optimistic, setOptimistic] = React.useOptimistic(active)

  const current = workspaces.find((workspace) => workspace.id === optimistic)
  const title = current?.name ?? (optimistic === "foxcode" ? "FoxCode" : "Todos los espacios")
  const subtitle = current ? "Espacio de trabajo" : optimistic === "foxcode" ? "Servicios a medida" : "Panel Operativo"

  const select = (value: string) => {
    if (value === optimistic) return
    startTransition(async () => {
      setOptimistic(value)
      await setWorkspaceAction(value)
      router.refresh()
    })
  }

  const item = (value: string, label: string, mark: React.ReactNode) => (
    <DropdownMenuItem key={value} onSelect={() => select(value)} className="cursor-pointer gap-2 p-2" aria-current={optimistic === value ? "true" : undefined}>
      {mark}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
      {optimistic === value && <Check aria-hidden className="size-4 text-brand" />}
    </DropdownMenuItem>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" aria-label={`Espacio de trabajo: ${title}`} className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              {current ? <WorkspaceMark name={current.name} color={current.color} logoUrl={current.logoUrl} className="size-8" /> : <FoxMark />}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-heading text-[15px] font-bold tracking-[-0.02em]">{title}</span>
                <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
              </div>
              {pending ? <Loader2 aria-label="Cambiando de espacio" className="ml-auto size-4 animate-spin text-muted-foreground" /> : <ChevronsUpDown aria-hidden className="ml-auto size-4" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" align="end" side="bottom" sideOffset={4}>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Espacios de trabajo</DropdownMenuLabel>
            {item("all", "Todos", <FoxMark size="sm" />)}
            {item("foxcode", "FoxCode", <FoxMark size="sm" />)}
            {workspaces.map((workspace) => item(workspace.id, workspace.name, <WorkspaceMark name={workspace.name} color={workspace.color} logoUrl={workspace.logoUrl} size="sm" />))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer gap-2 p-2 text-muted-foreground">
              <Link href={ROUTES.internal.products}><Settings2 aria-hidden className="size-4" />Gestionar espacios</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
