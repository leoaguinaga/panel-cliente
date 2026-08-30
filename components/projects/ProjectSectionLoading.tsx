'use client';

import { Skeleton } from 'boneyard-js/react';

function Shell() { return <div className="space-y-4" aria-hidden="true"><div className="space-y-2"><div className="h-5 w-48 rounded bg-muted" /><div className="h-4 w-80 max-w-full rounded bg-muted" /></div><div className="flex gap-2"><div className="h-10 w-28 rounded-xl bg-muted" /><div className="h-10 w-36 rounded-xl bg-muted" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-56 rounded-2xl border bg-muted" />)}</div></div>; }
export function ProjectSectionLoading({ name }: { name: string }) { return <Skeleton name={name} loading fixture={<Shell />} fallback={<Shell />}><Shell /></Skeleton>; }
