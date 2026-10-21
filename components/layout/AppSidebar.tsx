"use client"

import * as React from "react"
import {
  LayoutDashboard,
  CalendarDays,
  UsersRound,
  Users,
  ListChecks,
  FolderKanban,
  Box,
  FileText,
  CreditCard,
  Settings,
  Flame,
  BookOpen,
  MessagesSquare,
} from "lucide-react"

import { NavMain } from "@/components/layout/NavMain"
import { NavProjects } from "@/components/layout/NavProjects"
import { NavUser, type NavUserData } from "@/components/layout/NavUser"
import { WorkspaceSwitcher, type SwitcherWorkspace } from "@/components/layout/WorkspaceSwitcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ROUTES } from "@/lib/constants"

const navMain = [
  {
    title: "Inicio",
    url: ROUTES.internal.dashboard,
    icon: LayoutDashboard,
  },
  { title: "Calendario", url: "/internal/calendar", icon: CalendarDays },
  { title: "Tareas", url: "/internal/tasks", icon: ListChecks },
  {
    title: "Proyectos",
    url: ROUTES.internal.projects,
    icon: FolderKanban,
  },
  {
    title: "Leads",
    url: ROUTES.internal.leads,
    icon: Flame,
  },
  {
    title: "Clientes",
    url: ROUTES.internal.clients,
    icon: Users,
  },
]

// Colaboradores y Configuración son solo de administración; a un colaborador lo redirigen.
const adminOnly = new Set<string>([ROUTES.internal.workers, ROUTES.internal.settings])

const navSecondary = [
  { name: "Atención al cliente", url: "/internal/support", icon: MessagesSquare },
  {
    name: "Productos",
    url: ROUTES.internal.products,
    icon: Box,
  },
  {
    name: "Documentos",
    url: ROUTES.internal.documents,
    icon: FileText,
  },
  {
    name: "Cobros",
    url: ROUTES.internal.payments,
    icon: CreditCard,
  },
  {
    name: "Guías",
    url: ROUTES.internal.guides,
    icon: BookOpen,
  },
  {
    name: "Colaboradores",
    url: ROUTES.internal.workers,
    icon: UsersRound,
  },
  {
    name: "Configuración",
    url: ROUTES.internal.settings,
    icon: Settings,
  },
]

export function AppSidebar({
  user,
  workspaces = [],
  activeWorkspace = "all",
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: NavUserData | null
  workspaces?: SwitcherWorkspace[]
  activeWorkspace?: string
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher workspaces={workspaces} active={activeWorkspace} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} label="Operaciones" />
        <NavProjects items={user?.role === "ADMIN" ? navSecondary : navSecondary.filter((item) => !adminOnly.has(item.url))} label="Gestión" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
