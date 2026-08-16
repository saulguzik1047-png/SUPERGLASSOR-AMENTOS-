import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [totalClientes, totalOrcamentos, orcamentosAbertos, sobrasDisponiveis] = await Promise.all([
    prisma.cliente.count(),
    prisma.orcamento.count(),
    prisma.orcamento.count({ where: { status: { in: ["RASCUNHO", "ENVIADO"] } } }),
    prisma.estoqueSobra.count({ where: { disponivel: true } }),
  ]);

  const ultimosOrcamentos = await prisma.orcamento.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { cliente: true },
  });

  const cards = [
    { label: "Clientes cadastrados", valor: totalClientes, href: "/clientes" },
    { label: "Orçamentos no total", valor: totalOrcamentos, href: "/orcamentos" },
    { label: "Em aberto (rascunho/enviado)", valor: orcamentosAbertos, href: "/orcamentos" },
    { label: "Sobras em estoque", valor: sobrasDisponiveis, href: "/estoque" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Painel</h1>
          <p className="text-slate-600">Orçamentos de esquadrias de alumínio e vidro temperado</p>
        </div>
        <Link href="/orcamentos/novo" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow">
          + Novo Orçamento
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-slate-900">{c.valor}</div>
            <div className="text-sm text-slate-500 mt-1">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold text-lg mb-3">Últimos orçamentos</h2>
        {ultimosOrcamentos.length === 0 && <p className="text-slate-500 text-sm">Nenhum orçamento criado ainda.</p>}
        <div className="flex flex-col divide-y">
          {ultimosOrcamentos.map((o) => (
            <Link key={o.id} href={`/orcamentos/${o.id}`} className="py-2 flex items-center justify-between hover:bg-slate-50 px-2 rounded">
              <div>
                <div className="font-medium">Orçamento #{o.numero} — {o.cliente.nome}</div>
                <div className="text-xs text-slate-500">{o.status}</div>
              </div>
              <div className="font-semibold">R$ {o.total.toFixed(2)}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

