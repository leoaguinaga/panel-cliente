"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Menu } from 'lucide-react';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Overview', href: ROUTES.client.dashboard },
  { name: 'Projects', href: ROUTES.client.projects },
  { name: 'Documents', href: ROUTES.client.documents },
  { name: 'Payments', href: ROUTES.client.payments },
];

export function ClientNavbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={ROUTES.client.dashboard} className="font-bold tracking-tight text-lg flex items-center gap-2 text-gray-900">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">F</span>
            </div>
            Portal
          </Link>
          <nav className="hidden md:flex gap-1 ml-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "text-black" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Link href={ROUTES.client.help} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Help
            </Link>
            <div className="w-px h-4 bg-gray-200" />
            <Link href={ROUTES.client.profile} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 border border-gray-200" />
            </Link>
          </div>
          <button className="md:hidden text-gray-500 hover:text-gray-900">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
