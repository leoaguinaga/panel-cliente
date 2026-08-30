import type { Metadata } from "next";
import "./globals.css";
import "@/src/bones/registry";

export const metadata: Metadata = {
  title: "FoxCode - Panel interno",
  description: "",
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
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
