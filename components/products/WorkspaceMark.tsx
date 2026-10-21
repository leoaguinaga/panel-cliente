import { cn } from '@/lib/utils';
import { DEFAULT_WORKSPACE_COLOR, workspaceInitial } from '@/src/modules/products/workspace';

const sizes = {
  sm: 'size-[22px] rounded-md text-[10.5px]',
  md: 'size-[30px] rounded-lg text-[13px]',
  lg: 'size-10 rounded-[10px] text-base',
};

/**
 * Marca de un espacio: su logo o, sin logo, la inicial sobre un tinte de su
 * color. La usan la página de Productos y el selector de espacios.
 */
export function WorkspaceMark({ name, color, logoUrl, size = 'md', muted = false, className }: { name: string; color?: string | null; logoUrl?: string | null; size?: keyof typeof sizes; muted?: boolean; className?: string }) {
  const hue = color || DEFAULT_WORKSPACE_COLOR;
  if (logoUrl)
    // eslint-disable-next-line @next/next/no-img-element -- logos externos de tamaño fijo; no pasan por el optimizador
    return <img src={logoUrl} alt="" className={cn('shrink-0 bg-card object-contain ring-1 ring-inset ring-white/10', sizes[size], muted && 'opacity-60 grayscale', className)} />;
  return (
    <span
      aria-hidden
      style={{ '--hue': hue } as React.CSSProperties}
      className={cn(
        'grid shrink-0 place-items-center font-bold tracking-[-0.02em]',
        'bg-[color-mix(in_oklab,var(--hue)_22%,var(--card))] text-[color-mix(in_oklab,var(--hue)_60%,var(--foreground))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hue)_35%,transparent)]',
        sizes[size],
        muted && 'opacity-60 grayscale',
        className,
      )}
    >
      {workspaceInitial(name)}
    </span>
  );
}

/**
 * Marca del espacio al que pertenece un proyecto: el producto, o el isotipo de
 * FoxCode cuando es un proyecto de servicios.
 */
export function ProjectMark({ product, className }: { product?: { name: string; color?: string | null; logoUrl?: string | null } | null; className?: string }) {
  if (product) return <WorkspaceMark name={product.name} color={product.color} logoUrl={product.logoUrl} className={className} />;
  return (
    <span aria-hidden className={cn('grid size-[30px] shrink-0 place-items-center rounded-lg bg-primary', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- isotipo estático */}
      <img src="/favicon-light.webp" className="size-[55%]" alt="" />
    </span>
  );
}
