import { cn } from "@/lib/utils"

/**
 * Isotipo + «FoxCode» en Bricolage, el mismo lockup del header de la landing.
 * `tone="light"` invierte el isotipo para fondos oscuros.
 */
export function BrandLogo({
  tone = "light",
  className,
}: {
  tone?: "dark" | "light"
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[0.45em] font-heading font-bold tracking-[-0.02em] leading-none",
        tone === "light" ? "text-white" : "text-foreground",
        className,
      )}
    >
      <img
        src="/logos/logo.webp"
        alt=""
        className={cn("size-[1.15em] shrink-0", tone === "light" && "invert")}
      />
      FoxCode
    </span>
  )
}
