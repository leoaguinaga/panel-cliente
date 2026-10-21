'use client';

import { Skeleton } from 'boneyard-js/react';

function ProjectSummaryFixture() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <header className="space-y-4">
        <div className="h-10 w-24 rounded-xl bg-slate-200" />
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="h-8 w-64 max-w-[70vw] rounded-lg bg-slate-200" />
              <div className="h-6 w-20 rounded-full bg-slate-200" />
              <div className="h-6 w-28 rounded-full bg-slate-200" />
            </div>
            <div className="h-4 w-72 max-w-full rounded bg-slate-200" />
          </div>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-slate-200" />
            <div className="space-y-1 border-l pl-3">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="h-5 w-12 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </header>

      <nav className="flex min-h-11 items-center gap-2 overflow-hidden border-b border-slate-200">
        {[72, 142, 156, 126, 82].map((width) => <div key={width} className="h-9 shrink-0 rounded-lg bg-slate-200" style={{ width }} />)}
      </nav>

      <main className="space-y-5">
        <div className="space-y-2"><div className="h-5 w-40 rounded bg-slate-200" /><div className="h-4 w-72 max-w-full rounded bg-slate-200" /></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-28 rounded-2xl border bg-card p-4"><div className="flex justify-between"><div className="size-5 rounded bg-slate-200" /><div className="h-8 w-10 rounded bg-slate-200" /></div><div className="mt-5 h-4 w-24 rounded bg-slate-200" /></div>)}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-44 rounded-2xl border bg-card p-5"><div className="h-5 w-28 rounded bg-slate-200" /><div className="mt-4 h-4 w-full rounded bg-slate-200" /><div className="mt-2 h-4 w-4/5 rounded bg-slate-200" /></div>
          <div className="h-44 rounded-2xl border bg-card p-5"><div className="h-5 w-32 rounded bg-slate-200" /><div className="mt-4 space-y-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex justify-between gap-4"><div className="h-4 w-20 rounded bg-slate-200" /><div className="h-4 w-24 rounded bg-slate-200" /></div>)}</div></div>
        </div>
      </main>
    </div>
  );
}

export function ProjectSummaryLoading() {
  const fixture = <ProjectSummaryFixture />;
  return <Skeleton name="project-summary" loading fixture={fixture} fallback={fixture} select="viewport">{fixture}</Skeleton>;
}
