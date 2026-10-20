export function ClientPageHeader({ title, description }: { title: string; description: string }) {
  return <header className="mb-8"><h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p></header>;
}
