"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) { return <SheetPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none", className)} {...props} /> }
function SheetContent({ className, children, side = "right", ...props }: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: "top" | "right" | "bottom" | "left" }) { return <SheetPortal><SheetOverlay /><SheetPrimitive.Content className={cn("fixed z-50 flex flex-col gap-4 bg-background p-6 shadow-xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in motion-reduce:animate-none", side === "right" && "inset-y-0 right-0 h-full w-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-lg", side === "left" && "inset-y-0 left-0 h-full w-full border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-lg", className)} {...props}>{children}<SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="size-4" /><span className="sr-only">Cerrar</span></SheetPrimitive.Close></SheetPrimitive.Content></SheetPortal> }
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("space-y-1.5 pr-8", className)} {...props} /> }
function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) { return <SheetPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} /> }
function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) { return <SheetPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} /> }

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetPortal, SheetTitle, SheetTrigger }
