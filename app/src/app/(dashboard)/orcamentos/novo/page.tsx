import Link from "next/link";
import { carregarDadosFormularioOrcamento } from "@/lib/dados-orcamento";
import NovoOrcamentoForm from "./NovoOrcamentoForm";

export const dynamic = "force-dynamic";

export default async function NovoOrcamentoPage() {
  const { clientes, tipos, vidros, perfis, precos, comprimentoBarraM, sobrasDisponiveisCm } = await carregarDadosFormularioOrcamento();

  if (clientes.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="mb-3">Cadastre um cliente antes de criar o primeiro orçamento.</p>
        <Link href="/clientes" className="text-blue-600 font-semibold hover:underline">Ir para Clientes</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Novo Orçamento</h1>
      <NovoOrcamentoForm
        clientes={clientes}
        tipos={tipos}
        vidros={vidros}
        perfis={perfis}
        precos={precos}
        comprimentoBarraM={comprimentoBarraM}
        sobrasDisponiveisCm={sobrasDisponiveisCm}
      />
    </div>
  );
}
