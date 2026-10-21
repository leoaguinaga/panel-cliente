import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Bebas_Neue, Raleway } from "next/font/google";
import "./globals.css";
import "@/src/bones/registry";

// Las mismas fuentes de la landing: Raleway para texto y Bebas Neue para títulos de página.
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway", display: "swap" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas", display: "swap" });

export const metadata: Metadata = {
  title: "Foxcode — Portal de cliente",
  description: "Consulta el avance de tus proyectos, documentos y pagos.",
  icons: {
    icon: [{ url: "/favicon-dark.webp", type: "image/webp"}],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`dark h-full antialiased font-sans ${raleway.variable} ${bebas.variable}`}>
      <body className="min-h-full flex flex-col">{children}<Toaster /></body>
    </html>
  );
}
