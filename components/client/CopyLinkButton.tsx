'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('No se pudo copiar', { description: url });
    }
  }
  return <button type="button" onClick={copy} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 hover:bg-slate-100">
    {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}{copied ? 'Copiado' : 'Copiar enlace'}
  </button>;
}
