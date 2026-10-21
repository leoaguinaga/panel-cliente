"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { WorkerForm } from "./WorkerForms";
import styles from "./workers.module.css";

export function WorkerCreateSheet() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className={styles.primary}>
          <Plus size={18} aria-hidden="true" />
          Crear trabajador
        </button>
      </SheetTrigger>
      <SheetContent className={styles.createSheet}>
        <SheetHeader>
          <SheetTitle>Registrar trabajador</SheetTitle>
          <SheetDescription>
            Completa sus datos. Le enviaremos un correo para que cree su contraseña.
          </SheetDescription>
        </SheetHeader>
        <WorkerForm onCancel={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
