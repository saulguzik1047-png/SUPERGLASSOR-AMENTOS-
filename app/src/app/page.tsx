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
    <div className="h-dvh flex flex-col overflow-hidden px-3 py-3 gap-3">
      {/* Cabeçalho compacto */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-2xl font-black tracking-tight">
          <span className="text-slate-900">SUL</span>
          <span className="bg-gradient-to-br from-blue-500 to-sky-300 bg-clip-text text-transparent">GLASS</span>
        </div>
        <form action={logout}>
          <button className="ios-pill bg-white/60 hover:bg-white/90 text-slate-600 text-xs">Sair</button>
        </form>
      </div>

      {/* Botão destaque — Novo Orçamento */}
      <Link
        href={botoes[0].href}
        className="glass-card shrink-0 flex items-center justify-center gap-3 px-4 font-bold text-white text-lg"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.92), rgba(56,189,248,0.85))",
          flex: "1.6",
        }}
      >
        <span className="text-4xl">{botoes[0].icone}</span>
        {botoes[0].label}
      </Link>

      {/* Grade 2×3 com os outros 6 botões */}
      <div className="grid grid-cols-2 gap-3" style={{ flex: "3" }}>
        {botoes.slice(1).map((b) => (
          <Link
            key={b.href}
            href={b.href}
            className="glass-card flex flex-col items-center justify-center gap-2 font-semibold text-slate-800 active:scale-95 transition-transform"
          >
            <span className="text-4xl">{b.icone}</span>
            <span className="text-sm leading-tight text-center px-1">{b.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

