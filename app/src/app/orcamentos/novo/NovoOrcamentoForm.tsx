"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calcularOrcamentoItem, type PrecosMateriais, type ResultadoCalculo } from "@/lib/calculo";
import { criarOrcamento } from "@/lib/actions";

interface Cliente { id: number; nome: string; telefone: string }
interface TipoEsquadria { id: number; nome: string; categoria: string; numFolhas: number; parametros: string }
interface Vidro { nome: string; precoUnitario: number }

interface ItemForm {
  chave: string;
  tipoEsquadriaId: number;
  descricao: string;
  larguraCm: number;
  alturaCm: number;
  quantidade: number;
  corPerfil: string;
  tipoVidro: string;
  precoM2Vidro: number;
  resultado: ResultadoCalculo;
}

export default function NovoOrcamentoForm({
  clientes,
  tipos,
  vidros,
  precos,
  comprimentoBarraM,
  sobrasDisponiveisCm,
}: {
  clientes: Cliente[];
  tipos: TipoEsquadria[];
  vidros: Vidro[];
  precos: PrecosMateriais;
  comprimentoBarraM: number;
  sobrasDisponiveisCm: number[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [clienteId, setClienteId] = useState<number | "">(clientes[0]?.id ?? "");
  const [maoDeObra, setMaoDeObra] = useState(0);
  const [descontoValor, setDescontoValor] = useState(0);
  const [descontoMotivo, setDescontoMotivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([]);

  const [tipoEsquadriaId, setTipoEsquadriaId] = useState<number | "">(tipos[0]?.id ?? "");
  const [descricao, setDescricao] = useState("");
  const [larguraCm, setLarguraCm] = useState(100);
  const [alturaCm, setAlturaCm] = useState(100);
  const [quantidade, setQuantidade] = useState(1);
  const [corPerfil, setCorPerfil] = useState("Branco");
  const [tipoVidro, setTipoVidro] = useState(vidros[0]?.nome ?? "");

  const sobrasEmMetros = useMemo(() => sobrasDisponiveisCm.map((c) => c / 100), [sobrasDisponiveisCm]);

  function adicionarItem() {
    const tipo = tipos.find((t) => t.id === tipoEsquadriaId);
    const vidro = vidros.find((v) => v.nome === tipoVidro);
    if (!tipo || !vidro) return;

    const resultado = calcularOrcamentoItem({
      categoria: tipo.categoria,
      numFolhas: tipo.numFolhas,
      larguraCm,
      alturaCm,
      quantidade,
      parametrosJson: tipo.parametros,
      precoM2Vidro: vidro.precoUnitario,
      precos,
      comprimentoBarraM,
      sobrasPerfilDisponiveisM: sobrasEmMetros,
    });

    setItens((prev) => [
      ...prev,
      {
        chave: crypto.randomUUID(),
        tipoEsquadriaId: tipo.id,
        descricao: descricao || tipo.nome,
        larguraCm,
        alturaCm,
        quantidade,
        corPerfil,
        tipoVidro,
        precoM2Vidro: vidro.precoUnitario,
        resultado,
      },
    ]);
    setDescricao("");
  }

  function removerItem(chave: string) {
    setItens((prev) => prev.filter((i) => i.chave !== chave));
  }

  const subtotalMateriais = itens.reduce((acc, i) => acc + i.resultado.totalMateriais, 0);
  const subtotal = subtotalMateriais + maoDeObra;
  const total = Math.max(subtotal - descontoValor, 0);
  const algumReaproveitamento = itens.some((i) => i.resultado.metrosPerfilReaproveitadosEstoque > 0);

  function salvar() {
    if (clienteId === "" || itens.length === 0) {
      setErro("Selecione um cliente e adicione ao menos um item.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        const resp = await criarOrcamento({
          clienteId: Number(clienteId),
          maoDeObra,
          descontoValor,
          descontoMotivo,
          observacoes,
          itens: itens.map((i) => ({
            tipoEsquadriaId: i.tipoEsquadriaId,
            descricao: i.descricao,
            larguraCm: i.larguraCm,
            alturaCm: i.alturaCm,
            quantidade: i.quantidade,
            corPerfil: i.corPerfil,
            tipoVidro: i.tipoVidro,
            precoM2Vidro: i.precoM2Vidro,
          })),
        });
        router.push(`/orcamentos/${resp.orcamentoId}`);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao salvar orçamento.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl shadow p-4 grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Cliente
          <select value={clienteId} onChange={(e) => setClienteId(Number(e.target.value))} className="border rounded px-3 py-2">
            {clientes.length === 0 && <option value="">Cadastre um cliente primeiro</option>}
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mão de obra (R$)
          <input type="number" min={0} step="0.01" value={maoDeObra} onChange={(e) => setMaoDeObra(Number(e.target.value))} className="border rounded px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Observações
          <input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="border rounded px-3 py-2" placeholder="Prazo, condições de pagamento..." />
        </label>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-3">Adicionar item</h2>
        <div className="grid gap-3 md:grid-cols-6">
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Tipo de esquadria
            <select value={tipoEsquadriaId} onChange={(e) => setTipoEsquadriaId(Number(e.target.value))} className="border rounded px-3 py-2">
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Largura (cm)
            <input type="number" min={1} value={larguraCm} onChange={(e) => setLarguraCm(Number(e.target.value))} className="border rounded px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Altura (cm)
            <input type="number" min={1} value={alturaCm} onChange={(e) => setAlturaCm(Number(e.target.value))} className="border rounded px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Quantidade
            <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} className="border rounded px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Cor do perfil
            <input value={corPerfil} onChange={(e) => setCorPerfil(e.target.value)} className="border rounded px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Vidro
            <select value={tipoVidro} onChange={(e) => setTipoVidro(e.target.value)} className="border rounded px-3 py-2">
              {vidros.map((v) => (
                <option key={v.nome} value={v.nome}>{v.nome} (R$ {v.precoUnitario.toFixed(2)}/m²)</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-3">
            Descrição/local (opcional)
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="border rounded px-3 py-2" placeholder="Ex: Sala, Quarto 1..." />
          </label>
          <button onClick={adicionarItem} type="button" className="self-end bg-slate-800 hover:bg-slate-900 text-white rounded px-4 py-2 font-semibold md:col-span-1">
            Adicionar item
          </button>
        </div>
      </div>

      {itens.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
          <h2 className="font-semibold mb-3">Itens do orçamento</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-slate-500">
                <th className="py-2">Item</th>
                <th>Medidas</th>
                <th>Qtd</th>
                <th>Barras</th>
                <th>Vidro (m²)</th>
                <th>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.chave} className="border-b last:border-0">
                  <td className="py-2">{i.descricao}</td>
                  <td>{i.larguraCm}×{i.alturaCm}cm</td>
                  <td>{i.quantidade}</td>
                  <td>{i.resultado.barrasPerfilNecessarias}</td>
                  <td>{i.resultado.vidroM2Total.toFixed(2)}</td>
                  <td className="font-semibold">R$ {i.resultado.totalMateriais.toFixed(2)}</td>
                  <td>
                    <button onClick={() => removerItem(i.chave)} className="text-red-600 text-xs hover:underline">remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {algumReaproveitamento && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-xl p-4 text-sm">
          ♻️ Este orçamento reaproveita sobras/retalhos que já estão em estoque. Considere aplicar um desconto ao cliente pelo material reaproveitado.
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4 grid gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          Desconto (R$)
          <input type="number" min={0} step="0.01" value={descontoValor} onChange={(e) => setDescontoValor(Number(e.target.value))} className="border rounded px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          Motivo do desconto
          <input value={descontoMotivo} onChange={(e) => setDescontoMotivo(e.target.value)} className="border rounded px-3 py-2" placeholder="Ex: aproveitamento de sobras em estoque" />
        </label>
        <div className="flex flex-col justify-end text-right">
          <div className="text-sm text-slate-500">Subtotal: R$ {subtotal.toFixed(2)}</div>
          <div className="text-2xl font-bold">Total: R$ {total.toFixed(2)}</div>
        </div>
      </div>

      {erro && <div className="text-red-600 text-sm">{erro}</div>}

      <button onClick={salvar} disabled={isPending} className="self-end bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg px-6 py-3 font-bold shadow">
        {isPending ? "Salvando..." : "Salvar orçamento"}
      </button>
    </div>
  );
}
