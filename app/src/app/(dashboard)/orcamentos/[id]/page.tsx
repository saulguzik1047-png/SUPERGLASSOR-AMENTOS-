import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obterConfiguracaoEmpresa } from "@/lib/actions";
import OrcamentoAcoes from "./OrcamentoAcoes";
import ListaCortesButton from "./ListaCortesButton";
import type { ResultadoCalculo } from "@/lib/calculo";

export default async function OrcamentoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orcamento, empresa] = await Promise.all([
    prisma.orcamento.findUnique({
      where: { id: Number(id) },
      include: { cliente: true, itens: { include: { tipoEsquadria: true } } },
    }),
    obterConfiguracaoEmpresa(),
  ]);

  if (!orcamento) notFound();

  const dataValidade = new Date(orcamento.createdAt);
  dataValidade.setDate(dataValidade.getDate() + orcamento.validadeDias);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orçamento #{orcamento.numero}</h1>
          <p className="text-slate-600">{orcamento.cliente.nome} · {orcamento.cliente.telefone}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <OrcamentoAcoes
          orcamentoId={orcamento.id}
          numero={orcamento.numero}
          status={orcamento.status}
          clienteNome={orcamento.cliente.nome}
          clienteTelefone={orcamento.cliente.telefone}
          clienteEndereco={orcamento.cliente.endereco}
          maoDeObra={orcamento.maoDeObra}
          descontoValor={orcamento.descontoValor}
          descontoMotivo={orcamento.descontoMotivo}
          observacoes={orcamento.observacoes}
          validadeDias={orcamento.validadeDias}
          empresa={empresa}
          subtotal={orcamento.subtotal}
          total={orcamento.total}
          criadoEm={new Date(orcamento.createdAt).toLocaleDateString("pt-BR")}
          itens={orcamento.itens.map((i) => ({
            descricao: i.descricao ?? i.tipoEsquadria.nome,
            largura: i.largura,
            altura: i.altura,
            quantidade: i.quantidade,
            corPerfil: i.corPerfil,
            tipoVidro: i.tipoVidro,
            materiais: (JSON.parse(i.calculoJson) as ResultadoCalculo).itens.map((material) => `${material.descricao}: ${material.quantidade} ${material.unidade}`).join("; "),
            valorItem: i.valorItem,
          }))}
        />
      </div>

      <div className="glass-card p-4 overflow-x-auto">
        <h2 className="font-semibold mb-3">Itens</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b text-slate-500">
              <th className="py-2">Item</th>
              <th>Medidas</th>
              <th>Qtd</th>
              <th>Cor</th>
              <th>Vidro</th>
              <th>Barras</th>
              <th>Vidro (m²)</th>
              <th>Valor</th>
              <th>Produção</th>
            </tr>
          </thead>
          <tbody>
            {orcamento.itens.map((i) => {
              const calc: ResultadoCalculo = JSON.parse(i.calculoJson);
              return (
                <>
                <tr key={i.id} className="border-b last:border-0 align-top">
                  <td className="py-2">{i.descricao ?? i.tipoEsquadria.nome}</td>
                  <td>{i.largura}×{i.altura}cm</td>
                  <td>{i.quantidade}</td>
                  <td>{i.corPerfil}</td>
                  <td>{i.tipoVidro}</td>
                  <td>{calc.barrasPerfilNecessarias}</td>
                  <td>{calc.vidroM2Total.toFixed(2)}</td>
                  <td className="font-semibold">R$ {i.valorItem.toFixed(2)}</td>
                  <td><ListaCortesButton cortes={calc.cortes ?? []} /></td>
                </tr>
                <tr key={`${i.id}-materiais`} className="border-b bg-slate-50/60">
                  <td colSpan={8} className="px-2 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Detalhamento de materiais</div>
                    <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                      {calc.itens.map((material) => (
                        <div key={material.descricao} className="flex justify-between gap-3 text-sm">
                          <span>{material.descricao}</span>
                          <span className="font-medium whitespace-nowrap">{material.quantidade} {material.unidade} · R$ {material.precoTotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {calc.metrosPerfilReaproveitadosEstoque > 0 && <p className="mt-2 text-xs text-amber-700">Reaproveitamento: {calc.metrosPerfilReaproveitadosEstoque.toFixed(2)} m de perfil do estoque.</p>}
                  </td>
                </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="glass-card p-4 flex flex-col items-end gap-1">
        <div className="text-sm text-slate-500">Mão de obra: R$ {orcamento.maoDeObra.toFixed(2)}</div>
        <div className="text-sm text-slate-500">Subtotal: R$ {orcamento.subtotal.toFixed(2)}</div>
        {orcamento.descontoValor > 0 && (
          <div className="text-sm text-amber-700">
            Desconto: R$ {orcamento.descontoValor.toFixed(2)} {orcamento.descontoMotivo ? `(${orcamento.descontoMotivo})` : ""}
          </div>
        )}
        <div className="text-2xl font-bold">Total: R$ {orcamento.total.toFixed(2)}</div>
        <div className="text-xs text-slate-400">Válido até {dataValidade.toLocaleDateString("pt-BR")} ({orcamento.validadeDias} dias)</div>
        {orcamento.observacoes && <div className="text-sm text-slate-500 mt-2">Obs: {orcamento.observacoes}</div>}
      </div>
    </div>
  );
}
