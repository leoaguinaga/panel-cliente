import Link from 'next/link';
export function Pagination({ total, page, pageSize = 25, query }: { total: number; page: number; pageSize?: number; query: Record<string, string | undefined> }) {
 const pages = Math.max(1, Math.ceil(total / pageSize));
 const href = (next: number) => { const params = new URLSearchParams(); for (const [key,value] of Object.entries(query)) if (value) params.set(key,value); params.set('page',String(next)); return '?' + params; };
 return <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3 text-sm"><span>{total} resultados · Página {page} de {pages}</span><div className="flex gap-4">{page > 1 && <Link href={href(page-1)}>Anterior</Link>}{page < pages && <Link href={href(page+1)}>Siguiente</Link>}</div></nav>;
}
