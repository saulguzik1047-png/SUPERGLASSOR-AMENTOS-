"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calcularOrcamentoItem, type PrecosMateriais, type ResultadoCalculo } from "@/lib/calculo";
import { criarOrcamento, atualizarOrcamento, criarClienteRapido, type ItemOrcamentoInput } from "@/lib/actions";
import EsquadriaSketch from "./EsquadriaSketch";

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
  perfilMaterialId?: number;
  tipoVidro: string;
  precoM2Vidro: number;
  resultado: ResultadoCalculo;
}

export interface OrcamentoParaEditar {
  id: number;
  clienteId: number;
  maoDeObra: number;
  descontoValor: number;
  descontoMotivo: string;
  observacoes: string;
  validadeDias: number;
  itens: ItemOrcamentoInput[];
}
interface Perfil { id: number; nome: string; precoUnitario: number; comprimentoBarraM: number }

export default function NovoOrcamentoForm({
  clientes,
  tipos,
  vidros,
  perfis,
  precos,
  comprimentoBarraM,
  sobrasDisponiveisCm,
  edicao,
}: {
  clientes: Cliente[];
  tipos: TipoEsquadria[];
  vidros: Vidro[];
  perfis: Perfil[];
  precos: PrecosMateriais;
  comprimentoBarraM: number;
  sobrasDisponiveisCm: number[];
  edicao?: OrcamentoParaEditar;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [clienteId, setClienteId] = useState<number | "">(edicao?.clienteId ?? clientes[0]?.id ?? "");
  const [maoDeObra, setMaoDeObra] = useState(edicao?.maoDeObra ?? 0);
  const [descontoValor, setDescontoValor] = useState(edicao?.descontoValor ?? 0);
  const [descontoMotivo, setDescontoMotivo] = useState(edicao?.descontoMotivo ?? "");
  const [observacoes, setObservacoes] = useState(edicao?.observacoes ?? "");
  const [validadeDias, setValidadeDias] = useState(edicao?.validadeDias ?? 15);
  const [itens, setItens] = useState<ItemForm[]>(() => {
    if (!edicao) return [];
    return edicao.itens.map((i) => {
      const tipo = tipos.find((t) => t.id === i.tipoEsquadriaId);
      const perfil = perfis.find((p) => p.id === i.perfilMaterialId) ?? perfis[0];
      const resultado = calcularOrcamentoItem({
        categoria: tipo?.categoria ?? "JANELA_CORRER",
        numFolhas: tipo?.numFolhas ?? 2,
        larguraCm: i.larguraCm,
        alturaCm: i.alturaCm,
        quantidade: i.quantidade,
        parametrosJson: tipo?.parametros,
        precoM2Vidro: i.precoM2Vidro,
        perfilNome: perfil?.nome,
        precos: perfil ? { ...precos, perfilMetro: perfil.precoUnitario } : precos,
        comprimentoBarraM: perfil?.comprimentoBarraM ?? comprimentoBarraM,
        sobrasPerfilDisponiveisM: [],
      });
      return {
        chave: crypto.randomUUID(),
        tipoEsquadriaId: i.tipoEsquadriaId,
        descricao: i.descricao ?? tipo?.nome ?? "",
        larguraCm: i.larguraCm,
        alturaCm: i.alturaCm,
        quantidade: i.quantidade,
        corPerfil: i.corPerfil,
        perfilMaterialId: i.perfilMaterialId,
        tipoVidro: i.tipoVidro,
        precoM2Vidro: i.precoM2Vidro,
        resultado,
      };
    });
  });

  const [tipoEsquadriaId, setTipoEsquadriaId] = useState<number | "">(tipos[0]?.id ?? "");
  const [descricao, setDescricao] = useState("");
  const [larguraCm, setLarguraCm] = useState(100);
  const [alturaCm, setAlturaCm] = useState(100);
  const [quantidade, setQuantidade] = useState(1);
  const [corPerfil, setCorPerfil] = useState("Branco");
  const [tipoVidro, setTipoVidro] = useState(vidros[0]?.nome ?? "");
  const [perfilMaterialId, setPerfilMaterialId] = useState<number | "">(perfis[0]?.id ?? "");
  const [preenchimentoAmpliado, setPreenchimentoAmpliado] = useState(false);

  const sobrasEmMetros = useMemo(() => sobrasDisponiveisCm.map((c) => c / 100), [sobrasDisponiveisCm]);

  function adicionarItem() {
    const tipo = tipos.find((t) => t.id === tipoEsquadriaId);
    const vidro = vidros.find((v) => v.nome === tipoVidro);
    const perfil = perfis.find((p) => p.id === perfilMaterialId);
    if (!tipo || !vidro || !perfil) return;

    const resultado = calcularOrcamentoItem({
      categoria: tipo.categoria,
      numFolhas: tipo.numFolhas,
      larguraCm,
      alturaCm,
      quantidade,
      parametrosJson: tipo.parametros,
      precoM2Vidro: vidro.precoUnitario,
      perfilNome: perfil.nome,
      precos: { ...precos, perfilMetro: perfil.precoUnitario },
      comprimentoBarraM: perfil.comprimentoBarraM,
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
              perfilMaterialId: perfil.id,
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
    if ((clienteId === "" && (!clienteNome.trim() || !clienteTelefone.trim())) || itens.length === 0) {
      setErro("Informe um cliente com nome e telefone e adicione ao menos um item.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        const cliente = clienteNome.trim() && clienteTelefone.trim()
          ? await criarClienteRapido(clienteNome, clienteTelefone)
          : clientes.find((item) => item.id === clienteId);
        if (!cliente) throw new Error("Não foi possível identificar o cliente.");
        const payload = {
          clienteId: cliente.id,
          maoDeObra,
          descontoValor,
          descontoMotivo,
          observacoes,
          validadeDias,
          itens: itens.map((i) => ({
            tipoEsquadriaId: i.tipoEsquadriaId,
            descricao: i.descricao,
            larguraCm: i.larguraCm,
            alturaCm: i.alturaCm,
            quantidade: i.quantidade,
            corPerfil: i.corPerfil,
            tipoVidro: i.tipoVidro,
            precoM2Vidro: i.precoM2Vidro,
            perfilMaterialId: i.perfilMaterialId,
          })),
        };
        const resp = edicao ? await atualizarOrcamento(edicao.id, payload) : await criarOrcamento(payload);
        router.push(`/orcamentos/${resp.orcamentoId}`);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao salvar orçamento.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-card p-4 grid gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          Cliente já cadastrado
          <select value={clienteId} onChange={(e) => setClienteId(Number(e.target.value))} className="ios-input">
            <option value="">Selecionar depois</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Nome do cliente
          <input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className="ios-input" placeholder="Digite para cadastrar direto" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Telefone / WhatsApp
          <input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} className="ios-input" placeholder="5511999999999" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mão de obra (R$)
          <span className="inline-flex items-center ios-input p-0 overflow-hidden"><span className="px-3 text-slate-500">R$</span><input type="number" min={0} step="0.01" value={maoDeObra} onChange={(e) => setMaoDeObra(Number(e.target.value))} className="flex-1 bg-transparent py-2 pr-3 outline-none" /></span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Observações
          <input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="ios-input" placeholder="Prazo, condições de pagamento..." />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Validade do orçamento (dias)
          <input type="number" min={1} value={validadeDias} onChange={(e) => setValidadeDias(Number(e.target.value))} className="ios-input" />
        </label>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-semibold">Adicionar item</h2>
          <button type="button" onClick={() => setPreenchimentoAmpliado(true)} className="ios-btn ios-btn-primary !py-2 !px-3 text-xs sm:text-sm">
            Abrir preenchimento grande
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.1fr_1.4fr]">
          <EsquadriaSketch
            categoria={tipos.find((t) => t.id === tipoEsquadriaId)?.categoria ?? "JANELA_CORRER"}
            numFolhas={tipos.find((t) => t.id === tipoEsquadriaId)?.numFolhas ?? 2}
            larguraCm={larguraCm}
            alturaCm={alturaCm}
          />
          <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm md:col-span-3">
            Tipo de esquadria
            <select value={tipoEsquadriaId} onChange={(e) => setTipoEsquadriaId(Number(e.target.value))} className="ios-input">
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Largura (cm)
            <input type="number" min={1} value={larguraCm} onChange={(e) => setLarguraCm(Number(e.target.value))} className="ios-input" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Altura (cm)
            <input type="number" min={1} value={alturaCm} onChange={(e) => setAlturaCm(Number(e.target.value))} className="ios-input" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {tipos.find((t) => t.id === tipoEsquadriaId)?.categoria === "COBERTURA_PERGOLADO" ? "Quantidade de placas de vidro" : "Quantidade"}
            <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} className="ios-input" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Cor do perfil
            <input value={corPerfil} onChange={(e) => setCorPerfil(e.target.value)} className="ios-input" />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Vidro
            <select value={tipoVidro} onChange={(e) => setTipoVidro(e.target.value)} className="ios-input">
              {vidros.map((v) => (
                <option key={v.nome} value={v.nome}>{v.nome} (R$ {v.precoUnitario.toFixed(2)}/m²)</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Linha do perfil
            <select value={perfilMaterialId} onChange={(e) => setPerfilMaterialId(Number(e.target.value))} className="ios-input">
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} — R$ {p.precoUnitario.toFixed(2)}/m · barra {p.comprimentoBarraM}m</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-3">
            Descrição/local (opcional)
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="ios-input" placeholder="Ex: Sala, Quarto 1..." />
          </label>
          <button onClick={adicionarItem} type="button" className="ios-btn ios-btn-dark md:col-span-3 w-fit">
            Adicionar item
          </button>
          </div>
        </div>
      </div>

      {preenchimentoAmpliado && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-3 sm:p-6 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Preenchimento ampliado do item">
          <div className="w-full max-w-3xl max-h-[96vh] overflow-y-auto rounded-2xl border border-slate-300 bg-white p-4 text-slate-900 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Modo celular</p>
                <h2 className="text-2xl font-bold">Preencher item do orçamento</h2>
                <p className="mt-1 text-sm text-slate-600">Informe as medidas com calma. O desenho e o cálculo acompanham os valores.</p>
              </div>
              <button type="button" onClick={() => setPreenchimentoAmpliado(false)} className="ios-btn ios-btn-dark !px-3 !py-2">Fechar</button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <EsquadriaSketch
                categoria={tipos.find((t) => t.id === tipoEsquadriaId)?.categoria ?? "JANELA_CORRER"}
                numFolhas={tipos.find((t) => t.id === tipoEsquadriaId)?.numFolhas ?? 2}
                larguraCm={larguraCm}
                alturaCm={alturaCm}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-base font-semibold sm:col-span-2">Tipo de produto
                  <select value={tipoEsquadriaId} onChange={(e) => setTipoEsquadriaId(Number(e.target.value))} className="ios-input min-h-12 text-base">
                    {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-base font-semibold">Largura (cm)
                  <input autoFocus type="number" inputMode="decimal" min={1} value={larguraCm} onChange={(e) => setLarguraCm(Number(e.target.value))} className="ios-input min-h-14 text-xl font-bold" />
                </label>
                <label className="flex flex-col gap-2 text-base font-semibold">Altura / profundidade (cm)
                  <input type="number" inputMode="decimal" min={1} value={alturaCm} onChange={(e) => setAlturaCm(Number(e.target.value))} className="ios-input min-h-14 text-xl font-bold" />
                </label>
                <label className="flex flex-col gap-2 text-base font-semibold">{tipos.find((t) => t.id === tipoEsquadriaId)?.categoria === "COBERTURA_PERGOLADO" ? "Quantidade de placas" : "Quantidade"}
                  <input type="number" inputMode="numeric" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} className="ios-input min-h-14 text-xl font-bold" />
                </label>
                <label className="flex flex-col gap-2 text-base font-semibold">Cor do perfil
                  <input value={corPerfil} onChange={(e) => setCorPerfil(e.target.value)} className="ios-input min-h-12 text-base" />
                </label>
                <label className="flex flex-col gap-2 text-base font-semibold sm:col-span-2">Tipo de vidro
                  <select value={tipoVidro} onChange={(e) => setTipoVidro(e.target.value)} className="ios-input min-h-12 text-base">
                    {vidros.map((v) => <option key={v.nome} value={v.nome}>{v.nome} — R$ {v.precoUnitario.toFixed(2)}/m²</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-base font-semibold sm:col-span-2">Linha do perfil
                  <select value={perfilMaterialId} onChange={(e) => setPerfilMaterialId(Number(e.target.value))} className="ios-input min-h-12 text-base">
                    {perfis.map((p) => <option key={p.id} value={p.id}>{p.nome} — R$ {p.precoUnitario.toFixed(2)}/m</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-base font-semibold sm:col-span-2">Descrição / local
                  <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="ios-input min-h-12 text-base" placeholder="Ex.: Sala, quarto, cobertura" />
                </label>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPreenchimentoAmpliado(false)} className="ios-btn ios-btn-secondary min-h-12">Continuar depois</button>
              <button type="button" onClick={() => { adicionarItem(); setPreenchimentoAmpliado(false); }} className="ios-btn ios-btn-primary min-h-12">Adicionar item ao orçamento</button>
            </div>
          </div>
        </div>
      )}

      {itens.length > 0 && (
        <div className="glass-card p-4 overflow-x-auto">
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
                <>
                <tr key={i.chave} className="border-b last:border-0">
                  <td className="py-2">{i.descricao}</td>
                  <td>{i.larguraCm}×{i.alturaCm}cm</td>
                  <td>{i.quantidade}</td>
                  <td>{i.resultado.barrasPerfilNecessarias}</td>
                  <td>{i.resultado.vidroM2Total.toFixed(2)}</td>
                  <td className="font-semibold">R$ {i.resultado.totalMateriais.toFixed(2)}</td>
                  <td>
                    <button onClick={() => removerItem(i.chave)} className="ios-btn ios-btn-danger !py-1 !px-2.5 text-xs">remover</button>
                  </td>
                </tr>
                <tr key={`${i.chave}-materiais`} className="border-b text-xs text-slate-500">
                  <td colSpan={7} className="pb-2">{i.resultado.itens.map((material) => `${material.descricao}: ${material.quantidade} ${material.unidade}`).join(" · ")}</td>
                  <td />
                </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {algumReaproveitamento && (
        <div className="glass-card p-4 text-sm text-amber-800" style={{ background: "rgba(255, 251, 235, 0.75)" }}>
          ♻️ Este orçamento reaproveita sobras/retalhos que já estão em estoque. Considere aplicar um desconto ao cliente pelo material reaproveitado.
        </div>
      )}

      <div className="glass-card p-4 grid gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          Desconto (R$)
          <span className="inline-flex items-center ios-input p-0 overflow-hidden"><span className="px-3 text-slate-500">R$</span><input type="number" min={0} step="0.01" value={descontoValor} onChange={(e) => setDescontoValor(Number(e.target.value))} className="flex-1 bg-transparent py-2 pr-3 outline-none" /></span>
        </label>
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          Motivo do desconto
          <input value={descontoMotivo} onChange={(e) => setDescontoMotivo(e.target.value)} className="ios-input" placeholder="Ex: aproveitamento de sobras em estoque" />
        </label>
        <div className="flex flex-col justify-end text-right">
          <div className="text-sm text-slate-500">Subtotal: R$ {subtotal.toFixed(2)}</div>
          <div className="text-2xl font-bold">Total: R$ {total.toFixed(2)}</div>
        </div>
      </div>

      {erro && <div className="text-red-600 text-sm">{erro}</div>}

      <button onClick={salvar} disabled={isPending} className="self-end ios-btn ios-btn-success !px-6 !py-3 text-base">
        {isPending ? "Salvando..." : edicao ? "Salvar alterações" : "Salvar orçamento"}
      </button>
    </div>
  );
}
