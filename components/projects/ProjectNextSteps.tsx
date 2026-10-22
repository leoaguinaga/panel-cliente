import Link from 'next/link';
import { ArrowRight, BookOpen, Check } from 'lucide-react';
import type { SetupStep } from '@/src/modules/projects/setup-steps';
import { guideHref } from '@/src/modules/guides/registry';

/** Checklist de arranque del proyecto: resalta solo el próximo paso y desaparece cuando todo está hecho. */
export function ProjectNextSteps({ base, steps }: { base: string; steps: SetupStep[] }) {
  const done = steps.filter((step) => step.done).length;
  const next = steps.find((step) => !step.done);
  if (!next) return null;
  const href = (step: SetupStep) => `${base}${step.path}`;

  return <article aria-labelledby="next-steps-title" className="rounded-2xl border bg-card p-5">
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div><h3 id="next-steps-title" className="text-sm font-bold text-slate-900">Siguiente paso</h3><p className="mt-1 text-xs text-slate-500">Para arrancar el proyecto. Cada paso se marca solo cuando está hecho.</p></div>
      <Link href={guideHref('proyectos', 'primeros-pasos')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"><BookOpen className="size-3.5" aria-hidden />Ver la guía</Link>
    </div>
    <div className="mt-4 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Primeros pasos" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done}><div className="h-full rounded-full bg-blue-600" style={{ width: `${(done / steps.length) * 100}%` }} /></div><span className="text-xs font-semibold tabular-nums text-slate-600">{done} de {steps.length}</span></div>
    <ol className="mt-4 space-y-1">{steps.map((step, index) => {
      const current = step === next;
      return <li key={step.id} aria-current={current ? 'step' : undefined} className={`flex gap-3 rounded-xl px-3 py-2.5 ${current ? 'border border-blue-200 bg-blue-50' : ''}`}>
        <span aria-hidden className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${step.done ? 'bg-emerald-500 text-white' : current ? 'bg-blue-600 text-white' : 'border text-slate-500'}`}>{step.done ? <Check className="size-3" strokeWidth={3} /> : index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${step.done ? 'text-slate-500' : 'font-semibold text-slate-900'}`}>{step.title}<span className="sr-only">{step.done ? ' (hecho)' : ' (pendiente)'}</span>{!current && step.detail && !step.done && <span className="font-normal text-slate-500"> · {step.detail}</span>}</p>
          {current && <>
            <p className="mt-1 text-xs leading-5 text-slate-600">{step.hint}</p>
            {step.detail && <p className="mt-1 text-xs font-semibold text-slate-800">{step.detail}</p>}
            <Link href={href(step)} scroll={false} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">{step.action}<ArrowRight className="size-3.5" aria-hidden /></Link>
          </>}
        </div>
        {!current && !step.done && <Link href={href(step)} scroll={false} className="hidden self-center text-xs font-semibold text-slate-500 hover:text-slate-900 sm:block">{step.action}</Link>}
      </li>;
    })}</ol>
  </article>;
}
