import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orçamentos Serralheria",
  description: "App de orçamentos de esquadrias de alumínio e vidro temperado",
};

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/orcamentos/novo", label: "Novo Orçamento" },
  { href: "/orcamentos", label: "Orçamentos" },
  { href: "/clientes", label: "Clientes" },
  { href: "/estoque", label: "Estoque de Sobras" },
  { href: "/materiais", label: "Materiais e Preços" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-900">
        <header className="bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4">
            <span className="font-bold text-lg tracking-tight">🔩 Serralheria Orçamentos</span>
            <nav className="flex flex-wrap gap-1 text-sm">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} className="px-3 py-1.5 rounded hover:bg-slate-700 transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

