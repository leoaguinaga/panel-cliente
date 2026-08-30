"use client"

import * as React from "react"
import {
  LayoutDashboard,
  UsersRound,
  Users,
  Briefcase,
  Box,
  FileText,
  CreditCard,
  Settings,
  Flame,
} from "lucide-react"

import { NavMain } from "@/components/layout/NavMain"
import { NavProjects } from "@/components/layout/NavProjects"
import { NavUser } from "@/components/layout/NavUser"
import { TeamSwitcher } from "@/components/layout/TeamSwitcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ROUTES } from "@/lib/constants"

function FoxcodeLogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4h16v4H8v4h10v4H8v4H4z" />
    </svg>
  )
}

const ServicesIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(function ServicesIcon(props, ref) {
  return (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M14.7 6.3a4.2 4.2 0 0 0-5.5 5.5L4.1 16.9a2.1 2.1 0 0 0 3 3l5.1-5.1a4.2 4.2 0 0 0 5.5-5.5l-2.6 2.6-2.6-.5-.5-2.6 2.7-2.5Z" />
      <path d="m17.5 4.5 2 2" />
    </svg>
  )
})

const teams = [
  {
    name: "Foxcode",
    logo: FoxcodeLogoIcon,
    plan: "Panel Operativo",
  },
]

const navMain = [
  {
    title: "Inicio",
    url: ROUTES.internal.dashboard,
    icon: LayoutDashboard,
  },
  {
    title: "Proyectos",
    url: ROUTES.internal.projects,
    icon: Briefcase,
  },
  {
    title: "Clientes",
    url: ROUTES.internal.clients,
    icon: Users,
  },
  {
    title: "Leads",
    url: ROUTES.internal.leads,
    icon: Flame,
  },
  {
    title: "Productos",
    url: ROUTES.internal.products,
    icon: Box,
  },
  {
    title: "Servicios",
    url: ROUTES.internal.services,
    icon: ServicesIcon,
  },
]

const navSecondary = [
  {
    name: "Documentos",
    url: ROUTES.internal.documents,
    icon: FileText,
  },
  {
    name: "Pagos",
    url: ROUTES.internal.payments,
    icon: CreditCard,
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
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: {
    name?: string | null
    email?: string | null
    avatar?: string | null
    role?: string | null
  } | null
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} label="Operaciones" />
        <NavProjects items={navSecondary} label="Gestión" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
