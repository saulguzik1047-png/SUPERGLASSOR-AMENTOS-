import { carregarDadosFormularioOrcamento } from "@/lib/dados-orcamento";
import NovoOrcamentoForm from "./NovoOrcamentoForm";

export const dynamic = "force-dynamic";

export default async function NovoOrcamentoPage() {
  const { clientes, tipos, vidros, perfis, precos, comprimentoBarraM, sobrasDisponiveisCm, cores } = await carregarDadosFormularioOrcamento();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Novo Orçamento</h1>
      <NovoOrcamentoForm
        clientes={clientes}
        tipos={tipos}
        vidros={vidros}
        perfis={perfis}
        precos={precos}
        cores={cores}
        comprimentoBarraM={comprimentoBarraM}
        sobrasDisponiveisCm={sobrasDisponiveisCm}
      />
    </div>
  );
}
