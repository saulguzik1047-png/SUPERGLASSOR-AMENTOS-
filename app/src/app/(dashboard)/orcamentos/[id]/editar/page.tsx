import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { carregarDadosFormularioOrcamento } from "@/lib/dados-orcamento";
import NovoOrcamentoForm from "../../novo/NovoOrcamentoForm";

export const dynamic = "force-dynamic";

export default async function EditarOrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orcamento = await prisma.orcamento.findUnique({
    where: { id: Number(id) },
    include: { itens: true },
  });

  if (!orcamento) notFound();
  if (orcamento.status !== "RASCUNHO") redirect(`/orcamentos/${orcamento.id}`);

  const { clientes, tipos, vidros, precos, comprimentoBarraM, sobrasDisponiveisCm } = await carregarDadosFormularioOrcamento();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Editar Orçamento #{orcamento.numero}</h1>
      <NovoOrcamentoForm
        clientes={clientes}
        tipos={tipos}
        vidros={vidros}
        precos={precos}
        comprimentoBarraM={comprimentoBarraM}
        sobrasDisponiveisCm={sobrasDisponiveisCm}
        edicao={{
          id: orcamento.id,
          clienteId: orcamento.clienteId,
          maoDeObra: orcamento.maoDeObra,
          descontoValor: orcamento.descontoValor,
          descontoMotivo: orcamento.descontoMotivo ?? "",
          observacoes: orcamento.observacoes ?? "",
          validadeDias: orcamento.validadeDias,
          itens: orcamento.itens.map((i) => ({
            tipoEsquadriaId: i.tipoEsquadriaId,
            descricao: i.descricao ?? undefined,
            larguraCm: i.largura,
            alturaCm: i.altura,
            quantidade: i.quantidade,
            corPerfil: i.corPerfil,
            tipoVidro: i.tipoVidro,
            precoM2Vidro: i.precoM2Vidro,
          })),
        }}
      />
    </div>
  );
}
