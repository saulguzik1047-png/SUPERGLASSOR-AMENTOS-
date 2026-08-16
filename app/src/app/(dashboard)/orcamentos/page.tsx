import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
};

const statusColor: Record<string, string> = {
  RASCUNHO: "bg-slate-200 text-slate-700",
  ENVIADO: "bg-blue-100 text-blue-700",
  APROVADO: "bg-green-100 text-green-700",
  RECUSADO: "bg-red-100 text-red-700",
};

export default async function OrcamentosPage() {
  const orcamentos = await prisma.orcamento.findMany({
    orderBy: { createdAt: "desc" },
    include: { cliente: true, itens: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orçamentos arquivados</h1>
        <Link href="/orcamentos/novo" className="ios-btn ios-btn-primary">
          + Novo Orçamento
        </Link>
      </div>

      <div className="glass-card divide-y divide-white/40">
        {orcamentos.length === 0 && <p className="p-4 text-slate-500 text-sm">Nenhum orçamento cadastrado ainda.</p>}
        {orcamentos.map((o) => (
          <Link key={o.id} href={`/orcamentos/${o.id}`} className="p-4 flex items-center justify-between gap-4 flex-wrap hover:bg-slate-50">
            <div>
              <div className="font-medium">Orçamento #{o.numero} — {o.cliente.nome}</div>
              <div className="text-xs text-slate-500">{o.itens.length} item(ns) · {new Date(o.createdAt).toLocaleDateString("pt-BR")}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`ios-pill ${statusColor[o.status]}`}>{statusLabel[o.status]}</span>
              <span className="font-semibold">R$ {o.total.toFixed(2)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
