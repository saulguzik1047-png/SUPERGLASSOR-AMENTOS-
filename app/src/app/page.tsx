import Link from "next/link";
import { logout } from "@/lib/auth-actions";

const botoes = [
  { href: "/orcamentos/novo", label: "Novo Orçamento", icone: "📝", destaque: true },
  { href: "/orcamentos", label: "Orçamentos", icone: "🗂️" },
  { href: "/clientes", label: "Clientes", icone: "👤" },
  { href: "/estoque", label: "Estoque de Sobras", icone: "♻️" },
  { href: "/materiais", label: "Materiais e Preços", icone: "💲" },
  { href: "/relatorios", label: "Relatórios", icone: "📊" },
  { href: "/configuracoes", label: "Empresa", icone: "⚙️" },
];

export default function Home() {
  return (
    <div className="h-dvh flex flex-col items-center justify-between gap-4 px-5 py-8 overflow-hidden relative">
      <form action={logout} className="absolute top-3 right-3">
        <button className="ios-pill bg-white/60 hover:bg-white/90 text-slate-600 text-xs">Sair</button>
      </form>
      <div className="flex flex-col items-center gap-1 pt-2">
        <div className="flex items-center gap-2 text-4xl font-black tracking-tight">
          <span className="text-slate-900">SUL</span>
          <span className="bg-gradient-to-br from-blue-500 to-sky-300 bg-clip-text text-transparent">GLASS</span>
        </div>
        <p className="text-slate-500 text-sm font-medium">Esquadrias de alumínio &amp; vidro temperado</p>
      </div>

      <div className="w-full max-w-md flex-1 flex flex-col gap-3 justify-center min-h-0 py-2">
        <Link
          href={botoes[0].href}
          className="glass-card flex flex-1 items-center justify-center gap-4 px-5 text-xl font-bold text-white min-h-0 whitespace-nowrap active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.92), rgba(56,189,248,0.85))" }}
        >
          <span className="text-3xl">{botoes[0].icone}</span>
          {botoes[0].label}
        </Link>

        {botoes.slice(1).map((b) => (
          <Link
            key={b.href}
            href={b.href}
            className="glass-card flex flex-1 items-center gap-4 px-5 font-bold text-slate-800 text-lg min-h-0 whitespace-nowrap active:scale-[0.98] transition-transform"
          >
            <span className="text-3xl">{b.icone}</span>
            <span className="leading-tight">{b.label}</span>
          </Link>
        ))}
      </div>

      <p className="text-xs text-slate-400">SULGLASS © {new Date().getFullYear()}</p>
    </div>
  );
}


