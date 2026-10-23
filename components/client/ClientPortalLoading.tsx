'use client';
import { Skeleton } from 'boneyard-js/react';
export function ClientPortalFixture() { return <div className="space-y-6" aria-hidden="true"><div className="space-y-3"><div className="h-8 w-56 rounded-lg bg-slate-200" /><div className="h-4 w-80 max-w-full rounded bg-slate-200" /></div><div className="h-52 rounded-2xl bg-slate-200" /><div className="grid gap-5 md:grid-cols-3"><div className="h-48 rounded-2xl bg-slate-200 md:col-span-2" /><div className="h-48 rounded-2xl bg-slate-200" /></div><div className="h-48 rounded-2xl bg-slate-200" /></div> }
export function ClientPortalLoading() { const fixture = <ClientPortalFixture />; return <Skeleton name="client-portal" loading fixture={fixture} fallback={fixture} select="viewport">{fixture}</Skeleton> }
