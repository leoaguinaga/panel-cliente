import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { isValidElement, type ReactNode } from 'react';
import { headingId } from '@/src/modules/guides/registry';
import { Atencion, Carriles, CicloDeEstados, Jerarquia, Nota, Pasos, Relaciones } from '@/components/guides/diagrams';

/** Texto plano de los hijos de un encabezado, para generar su id sin plugins. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

function Heading({ level, children }: { level: 2 | 3; children?: ReactNode }) {
  const id = headingId(textOf(children));
  const Tag = level === 2 ? 'h2' : 'h3';
  return (
    <Tag id={id} className={`group scroll-mt-6 ${level === 2 ? 'mt-12 mb-3 text-xl font-semibold tracking-tight first:mt-0' : 'mt-8 mb-2 text-base font-semibold'}`}>
      {children}
      <a href={`#${id}`} aria-hidden="true" tabIndex={-1} className="ml-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100">#</a>
    </Tag>
  );
}

const components: MDXComponents = {
  // Diagramas y avisos disponibles en cualquier guía sin importarlos.
  Carriles,
  CicloDeEstados,
  Jerarquia,
  Relaciones,
  Nota,
  Atencion,
  Pasos,
  h1: ({ children }) => <h1 className="mb-4 text-3xl font-semibold tracking-tight">{children}</h1>,
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  p: ({ children }) => <p className="max-w-[70ch] my-3 leading-7 text-slate-700">{children}</p>,
  ul: ({ children }) => <ul className="max-w-[70ch] my-3 list-disc space-y-1.5 pl-6 leading-7 text-slate-700 marker:text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="max-w-[70ch] my-3 list-decimal space-y-1.5 pl-6 leading-7 text-slate-700 marker:text-muted-foreground">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ href = '', children }) =>
    href.startsWith('/') || href.startsWith('#') ? (
      <Link href={href} className="font-medium text-blue-700 underline underline-offset-4 hover:text-foreground">{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline underline-offset-4 hover:text-foreground">{children}</a>
    ),
  code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>,
  blockquote: ({ children }) => <blockquote className="max-w-[70ch] my-4 border-l-2 border-brand pl-4 text-slate-600">{children}</blockquote>,
  hr: () => <hr className="my-10 border-border" />,
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-xl border bg-card">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</th>,
  td: ({ children }) => <td className="border-b px-3 py-2.5 align-top text-slate-700 [tr:last-child_&]:border-b-0">{children}</td>,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
