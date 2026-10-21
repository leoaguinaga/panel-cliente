"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { getGuide } from "@/src/modules/guides/registry"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const ROUTE_LABELS: Record<string, string> = {
  internal: "Foxcode",
  dashboard: "Inicio",
  calendar: "Calendario",
  support: "Atención al cliente",
  gestion: "Resumen de gestión",
  projects: "Proyectos",
  clients: "Clientes",
  leads: "Leads",
  products: "Productos",
  services: "Servicios",
  documents: "Documentos",
  payments: "Pagos",
  workers: "Colaboradores",
  settings: "Configuración",
  profile: "Mi perfil",
  guides: "Guías",
  new: "Nuevo",
  documentation: "Documentación",
  kanban: "Kanban",
  gantt: "Gantt",
  planning: "Planificación",
  milestones: "Hitos",
  requirements: "Requerimientos",
  scope: "Alcance",
  contracts: "Contratos",
  tasks: "Tareas",
  files: "Archivos",
}

export function DynamicBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const internalIndex = segments.indexOf("internal")
  const pathParts = internalIndex >= 0 ? segments.slice(internalIndex + 1) : segments

  const items = [
    { label: "Foxcode", href: "/internal/dashboard" },
    ...pathParts.map((segment, index) => {
      const href = `/internal/${pathParts.slice(0, index + 1).join("/")}`
      const guideTitle = pathParts[index - 1] === "guides" ? getGuide(segment)?.title : undefined
      // El módulo global se llama «Cobros»; la pestaña del proyecto sigue siendo «Pagos».
      const moduleLabel = index === 0 && segment === "payments" ? "Cobros" : undefined
      const label = guideTitle || moduleLabel || ROUTE_LABELS[segment] || (segment.length > 20 ? "Detalle" : segment)
      return { label, href }
    }),
  ]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <React.Fragment key={`${item.href}-${index}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
