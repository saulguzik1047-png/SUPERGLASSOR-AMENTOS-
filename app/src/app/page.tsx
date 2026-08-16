import Link from "next/link";

const botoes = [
  { href: "/orcamentos/novo", label: "Novo Orçamento", icone: "📝", destaque: true },
  { href: "/orcamentos", label: "Orçamentos", icone: "🗂️" },
  { href: "/clientes", label: "Clientes", icone: "👤" },
  { href: "/estoque", label: "Estoque de Sobras", icone: "♻️" },
  { href: "/materiais", label: "Materiais e Preços", icone: "💲" },
];

export default function Home() {
  return (
    <div className="h-dvh flex flex-col items-center justify-between gap-4 px-5 py-8 overflow-hidden">
      <div className="flex flex-col items-center gap-1 pt-2">
        <div className="flex items-center gap-2 text-4xl font-black tracking-tight">
          <span className="text-slate-900">SUL</span>
          <span className="bg-gradient-to-br from-blue-500 to-sky-300 bg-clip-text text-transparent">GLASS</span>
        </div>
        <p className="text-slate-500 text-sm font-medium">Esquadrias de alumínio &amp; vidro temperado</p>
      </div>

      <div className="w-full max-w-sm flex-1 flex flex-col gap-3 justify-center">
        <Link
          href={botoes[0].href}
          className="glass-card flex items-center gap-4 px-5 py-5 text-lg font-bold text-white"
          style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.92), rgba(56,189,248,0.85))" }}
        >
          <span className="text-3xl">{botoes[0].icone}</span>
          {botoes[0].label}
        </Link>

        <div className="grid grid-cols-2 gap-3 flex-1">
          {botoes.slice(1).map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="glass-card flex flex-col items-center justify-center gap-2 p-4 text-center font-semibold text-slate-800 active:scale-95 transition-transform"
            >
              <span className="text-3xl">{b.icone}</span>
              <span className="text-sm leading-tight">{b.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400">SULGLASS © {new Date().getFullYear()}</p>
    </div>
  );
}


