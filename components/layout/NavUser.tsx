"use client"

import { useRouter } from "next/navigation"
import {
  ChevronsUpDown,
  CircleUserRound,
  LogOut,
  Settings,
} from "lucide-react"

import { UserAvatar } from "@/components/shared/UserAvatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ROUTES } from "@/lib/constants"
import { authClient } from "@/src/lib/auth-client"

export type NavUserData = {
  id?: string | null
  name?: string | null
  email?: string | null
  image?: string | null
  jobTitle?: string | null
  role?: string | null
}

export function NavUser({ user }: { user?: NavUserData | null }) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const displayName = user?.name || user?.email?.split("@")[0] || "Colaborador"
  const displayEmail = user?.email || "foxcode.pe"
  const subtitle = user?.jobTitle || displayEmail
  const avatarUser = { id: user?.id, name: displayName, image: user?.image }

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
    } catch {
      // continue to login
    } finally {
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar user={avatarUser} className="size-8 rounded-lg" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "top"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar user={avatarUser} className="size-8 rounded-lg" />
                <div className="grid flex-1 leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push(ROUTES.internal.profile)}
                className="gap-2 cursor-pointer"
              >
                <CircleUserRound className="size-4" />
                Mi perfil
              </DropdownMenuItem>
              {user?.role === "ADMIN" && (
                <DropdownMenuItem
                  onClick={() => router.push(ROUTES.internal.settings)}
                  className="gap-2 cursor-pointer"
                >
                  <Settings className="size-4" />
                  Configuración
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
