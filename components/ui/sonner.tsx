"use client"

import type { CSSProperties } from "react"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// Foxcode uses a single dark theme at the root layout.
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      closeButton
      containerAriaLabel="Notificaciones"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin motion-reduce:animate-none" />,
      }}
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
        fontFamily: "var(--font-raleway), sans-serif",
      } as CSSProperties}
      toastOptions={{ classNames: { toast: "cn-toast" }, closeButtonAriaLabel: "Cerrar notificación" }}
      {...props}
    />
  )
}

export { Toaster }
