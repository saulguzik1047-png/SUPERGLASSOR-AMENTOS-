import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [total, aprovados, recusados, enviados, rascunhos, aprovadosMes, todosAprovados] = await Promise.all([
    prisma.orcamento.count(),
    prisma.orcamento.count({ where: { status: "APROVADO" } }),
    prisma.orcamento.count({ where: { status: "RECUSADO" } }),
    prisma.orcamento.count({ where: { status: "ENVIADO" } }),
    prisma.orcamento.count({ where: { status: "RASCUNHO" } }),
    prisma.orcamento.aggregate({ where: { status: "APROVADO", createdAt: { gte: inicioMes } }, _sum: { total: true }, _count: true }),
    prisma.orcamento.aggregate({ where: { status: "APROVADO" }, _sum: { total: true }, _avg: { total: true } }),
  ]);

  const finalizados = aprovados + recusados;
  const taxaConversao = finalizados > 0 ? (aprovados / finalizados) * 100 : 0;

  const cards = [
    { label: "Orçamentos no total", valor: total },
    { label: "Aprovados", valor: aprovados },
    { label: "Recusados", valor: recusados },
    { label: "Enviados (aguardando)", valor: enviados },
    { label: "Rascunhos", valor: rascunhos },
    { label: "Taxa de conversão", valor: `${taxaConversao.toFixed(0)}%` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass-card p-4">
            <div className="text-3xl font-bold text-slate-900">{c.valor}</div>
            <div className="text-sm text-slate-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card p-4 flex flex-col gap-2">
        <h2 className="font-semibold text-lg">Vendas aprovadas neste mês</h2>
        <div className="text-3xl font-bold text-green-700">
          R$ {(aprovadosMes._sum.total ?? 0).toFixed(2)}
        </div>
        <div className="text-sm text-slate-500">{aprovadosMes._count} orçamento(s) aprovado(s) este mês</div>
      </div>

      <div className="glass-card p-4 flex flex-col gap-2">
        <h2 className="font-semibold text-lg">Ticket médio (aprovados, histórico)</h2>
        <div className="text-3xl font-bold text-slate-900">
          R$ {(todosAprovados._avg.total ?? 0).toFixed(2)}
        </div>
        <div className="text-sm text-slate-500">Total já vendido: R$ {(todosAprovados._sum.total ?? 0).toFixed(2)}</div>
      </div>
    </div>
  );
}
