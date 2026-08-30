"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Settings,
  UsersRound,
  Box,
  CreditCard,
  FileText
} from 'lucide-react';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Inicio', href: ROUTES.internal.dashboard, icon: LayoutDashboard },
  { name: 'Leads', href: ROUTES.internal.leads, icon: UsersRound },
  { name: 'Clientes', href: ROUTES.internal.clients, icon: Users },
  { name: 'Proyectos', href: ROUTES.internal.projects, icon: Briefcase },
  { name: 'Productos', href: ROUTES.internal.products, icon: Box },
  { name: 'Servicios', href: ROUTES.internal.services, icon: Briefcase },
  { name: 'Documentos', href: ROUTES.internal.documents, icon: FileText },
  { name: 'Pagos', href: ROUTES.internal.payments, icon: CreditCard },
  { name: 'Colaboradores', href: ROUTES.internal.workers, icon: UsersRound },
  { name: 'Configuración', href: ROUTES.internal.settings, icon: Settings },
];

export function InternalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#FAFAFA] border-r border-gray-200 h-screen sticky top-0">
      <div className="p-5 flex items-center mb-2">
        <div className="font-bold text-lg tracking-tight text-gray-900 flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center">
            <img src="/favicon-light.webp" className='size-9' alt="" />
          </div>
          Foxcode
        </div>
      </div>
      <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-gray-200/50 text-gray-900" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/30"
              )}
            >
              <Icon size={18} className={isActive ? "text-gray-900" : "text-gray-400"} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 mt-auto">
        <div className="flex items-center gap-3 px-2 py-1 text-sm">
          <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex-shrink-0" />
          <div className="truncate">
            <p className="font-medium text-gray-900">Workspace</p>
            <p className="text-xs text-gray-500">foxcode.pe</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
