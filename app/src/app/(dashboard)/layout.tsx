import Link from "next/link";
import { logout } from "@/lib/auth-actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 glass-card !rounded-none border-x-0 border-t-0 mx-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            aria-label="Voltar"
            className="ios-btn ios-btn-danger-solid !rounded-full w-14 h-14 !p-0 flex items-center justify-center text-3xl leading-none"
          >
            ←
          </Link>
          <span className="font-bold text-lg tracking-tight">
            SUL<span className="text-blue-600">GLASS</span>
          </span>
          <Link href="/produtos" className="text-sm text-slate-600 hover:text-blue-600">Produtos</Link>
          <form action={logout} className="ml-auto">
            <button className="ios-pill bg-white/60 hover:bg-white/90 text-slate-600">Sair</button>
          </form>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>

    </div>

  );
}
