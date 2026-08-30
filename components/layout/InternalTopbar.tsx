"use client";

import { Menu, Bell } from "lucide-react";

export function InternalTopbar() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 sticky top-0 z-10 md:px-6">
      <div className="flex items-center gap-3">
        <button aria-label="Abrir navegación" className="md:hidden text-gray-500 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
          <Menu size={20} />
        </button>
        <span className="font-medium text-sm text-gray-500 md:hidden">Foxcode</span>
      </div>
      <div className="flex items-center gap-4 ml-auto">
        <button aria-label="Ver notificaciones" className="text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
