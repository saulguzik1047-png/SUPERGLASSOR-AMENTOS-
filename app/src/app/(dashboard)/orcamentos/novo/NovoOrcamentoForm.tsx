"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calcularOrcamentoItem, type PrecosMateriais, type ResultadoCalculo } from "@/lib/calculo";
import { criarOrcamento, atualizarOrcamento, criarClienteRapido, type ItemOrcamentoInput } from "@/lib/actions";
import EsquadriaSketch from "./EsquadriaSketch";
import { paraNumeroDecimal, sanitizarDecimal, formatarMoeda, digitosParaValorMoeda } from "@/lib/formatters";

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
interface Cor { id: number; nome: string; percentualAdicional: number }

export default function NovoOrcamentoForm({
  clientes,
  tipos,
  vidros,
  perfis,
  precos,
  cores,
  comprimentoBarraM,
  sobrasDisponiveisCm,
  edicao,
}: {
  clientes: Cliente[];
  tipos: TipoEsquadria[];
  vidros: Vidro[];
  perfis: Perfil[];
  precos: PrecosMateriais;
  cores: Cor[];
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
  const percentualCor = (nome: string) => cores.find((c) => c.nome === nome)?.percentualAdicional ?? 0;
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
        precos: perfil ? { ...precos, perfilMetro: perfil.precoUnitario * (1 + percentualCor(i.corPerfil) / 100) } : precos,
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
  const [larguraCm, setLarguraCm] = useState("");
  const [alturaCm, setAlturaCm] = useState("");
  const larguraNum = paraNumeroDecimal(larguraCm);
  const alturaNum = paraNumeroDecimal(alturaCm);
  const [quantidade, setQuantidade] = useState(1);
  const [corPerfil, setCorPerfil] = useState(cores.find((c) => c.nome === "Branco")?.nome ?? cores[0]?.nome ?? "Branco");
  const [tipoVidro, setTipoVidro] = useState(vidros[0]?.nome ?? "");
  const [perfilMaterialId, setPerfilMaterialId] = useState<number | "">(perfis[0]?.id ?? "");
  const [preenchimentoAmpliado, setPreenchimentoAmpliado] = useState(false);
  const [passo, setPasso] = useState(0);

  const TITULOS_PASSOS = [
    "Tipo de produto",
    "Largura (cm)",
    "Altura / profundidade (cm)",
    "Quantidade",
    "Cor do perfil",
    "Tipo de vidro",
    "Linha do perfil",
    "Descrição / local",
    "Conferir e adicionar",
  ];
  const PASSO_FINAL = TITULOS_PASSOS.length - 1;

  const sobrasEmMetros = useMemo(() => sobrasDisponiveisCm.map((c) => c / 100), [sobrasDisponiveisCm]);

  function adicionarItem() {
    const tipo = tipos.find((t) => t.id === tipoEsquadriaId);
    const vidro = vidros.find((v) => v.nome === tipoVidro);
    const perfil = perfis.find((p) => p.id === perfilMaterialId);
    if (!tipo || !vidro || !perfil) return;
    if (larguraNum <= 0 || alturaNum <= 0) {
      setErro("Informe a largura e a altura do item.");
      return;
    }

    const resultado = calcularOrcamentoItem({
      categoria: tipo.categoria,
      numFolhas: tipo.numFolhas,
      larguraCm: larguraNum,
      alturaCm: alturaNum,
      quantidade,
      parametrosJson: tipo.parametros,
      precoM2Vidro: vidro.precoUnitario,
      perfilNome: perfil.nome,
      precos: { ...precos, perfilMetro: perfil.precoUnitario * (1 + percentualCor(corPerfil) / 100) },
      comprimentoBarraM: perfil.comprimentoBarraM,
      sobrasPerfilDisponiveisM: sobrasEmMetros,
    });

    setItens((prev) => [
      ...prev,
      {
        chave: crypto.randomUUID(),
        tipoEsquadriaId: tipo.id,
        descricao: descricao || tipo.nome,
        larguraCm: larguraNum,
        alturaCm: alturaNum,
        quantidade,
        corPerfil,
              perfilMaterialId: perfil.id,
        tipoVidro,
        precoM2Vidro: vidro.precoUnitario,
        resultado,
      },
    ]);
    setDescricao("");
    setErro(null);
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
          <span className="inline-flex items-center ios-input p-0 overflow-hidden"><span className="px-3 text-slate-500">R$</span><input type="text" inputMode="decimal" value={formatarMoeda(maoDeObra)} onChange={(e) => setMaoDeObra(digitosParaValorMoeda(e.target.value))} className="flex-1 bg-transparent py-2 pr-3 outline-none text-right" /></span>
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
          <button type="button" onClick={() => { setPasso(0); setPreenchimentoAmpliado(true); }} className="ios-btn ios-btn-primary !py-2 !px-3 text-xs sm:text-sm">
            Ver grande
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.1fr_1.4fr]">
          <EsquadriaSketch
            categoria={tipos.find((t) => t.id === tipoEsquadriaId)?.categoria ?? "JANELA_CORRER"}
            numFolhas={tipos.find((t) => t.id === tipoEsquadriaId)?.numFolhas ?? 2}
            larguraCm={larguraNum}
            alturaCm={alturaNum}
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
            <input type="text" inputMode="decimal" placeholder="Ex: 120" value={larguraCm} onChange={(e) => setLarguraCm(sanitizarDecimal(e.target.value))} className="ios-input" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Altura (cm)
            <input type="text" inputMode="decimal" placeholder="Ex: 150" value={alturaCm} onChange={(e) => setAlturaCm(sanitizarDecimal(e.target.value))} className="ios-input" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {tipos.find((t) => t.id === tipoEsquadriaId)?.categoria === "COBERTURA_PERGOLADO" ? "Quantidade de placas de vidro" : "Quantidade"}
            <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} className="ios-input" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Cor do perfil
            <select value={corPerfil} onChange={(e) => setCorPerfil(e.target.value)} className="ios-input">
              {cores.length === 0 && <option value="Branco">Branco</option>}
              {cores.map((c) => (
                <option key={c.id} value={c.nome}>{c.nome}{c.percentualAdicional !== 0 ? ` (+${c.percentualAdicional}%)` : ""}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Vidro
            <select value={tipoVidro} onChange={(e) => setTipoVidro(e.target.value)} className="ios-input">
              {vidros.map((v) => (
                <option key={v.nome} value={v.nome}>{v.nome} (R$ {formatarMoeda(v.precoUnitario)}/m²)</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Linha do perfil
            <select value={perfilMaterialId} onChange={(e) => setPerfilMaterialId(Number(e.target.value))} className="ios-input">
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} — R$ {formatarMoeda(p.precoUnitario)}/m · barra {p.comprimentoBarraM}m</option>
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-stretch justify-center" role="dialog" aria-modal="true" aria-label="Preenchimento passo a passo do item">
          <div className="w-full max-w-2xl bg-white text-slate-900 flex flex-col h-dvh shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Passo {passo + 1} de {TITULOS_PASSOS.length}</p>
                <h2 className="text-2xl font-bold">{TITULOS_PASSOS[passo]}</h2>
              </div>
              <button type="button" onClick={() => setPreenchimentoAmpliado(false)} className="ios-btn ios-btn-dark !px-4 !py-2 whitespace-nowrap">Fechar</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 justify-center">
              {passo === 0 && (
                <>
                  <select autoFocus value={tipoEsquadriaId} onChange={(e) => setTipoEsquadriaId(Number(e.target.value))} className="ios-input w-full min-h-16 text-xl font-semibold">
                    {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                  <EsquadriaSketch
                    categoria={tipos.find((t) => t.id === tipoEsquadriaId)?.categoria ?? "JANELA_CORRER"}
                    numFolhas={tipos.find((t) => t.id === tipoEsquadriaId)?.numFolhas ?? 2}
                    larguraCm={larguraNum}
                    alturaCm={alturaNum}
                  />
                </>
              )}
              {passo === 1 && (
                <>
                  <input autoFocus type="text" inputMode="decimal" placeholder="Ex: 120" value={larguraCm} onChange={(e) => setLarguraCm(sanitizarDecimal(e.target.value))} className="ios-input w-full min-h-20 text-4xl font-bold text-center" />
                  <EsquadriaSketch
                    categoria={tipos.find((t) => t.id === tipoEsquadriaId)?.categoria ?? "JANELA_CORRER"}
                    numFolhas={tipos.find((t) => t.id === tipoEsquadriaId)?.numFolhas ?? 2}
                    larguraCm={larguraNum}
                    alturaCm={alturaNum}
                  />
                </>
              )}
              {passo === 2 && (
                <>
                  <input autoFocus type="text" inputMode="decimal" placeholder="Ex: 150" value={alturaCm} onChange={(e) => setAlturaCm(sanitizarDecimal(e.target.value))} className="ios-input w-full min-h-20 text-4xl font-bold text-center" />
                  <EsquadriaSketch
                    categoria={tipos.find((t) => t.id === tipoEsquadriaId)?.categoria ?? "JANELA_CORRER"}
                    numFolhas={tipos.find((t) => t.id === tipoEsquadriaId)?.numFolhas ?? 2}
                    larguraCm={larguraNum}
                    alturaCm={alturaNum}
                  />
                </>
              )}
              {passo === 3 && (
                <>
                  <p className="text-center text-lg text-slate-600">{tipos.find((t) => t.id === tipoEsquadriaId)?.categoria === "COBERTURA_PERGOLADO" ? "Quantidade de placas de vidro" : "Quantas unidades iguais a esta?"}</p>
                  <input autoFocus type="number" inputMode="numeric" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} className="ios-input w-full min-h-20 text-4xl font-bold text-center" />
                </>
              )}
              {passo === 4 && (
                <select autoFocus value={corPerfil} onChange={(e) => setCorPerfil(e.target.value)} className="ios-input w-full min-h-16 text-xl font-semibold">
                  {cores.length === 0 && <option value="Branco">Branco</option>}
                  {cores.map((c) => (
                    <option key={c.id} value={c.nome}>{c.nome}{c.percentualAdicional !== 0 ? ` (+${c.percentualAdicional}%)` : ""}</option>
                  ))}
                </select>
              )}
              {passo === 5 && (
                <select autoFocus value={tipoVidro} onChange={(e) => setTipoVidro(e.target.value)} className="ios-input w-full min-h-16 text-xl font-semibold">
                  {vidros.map((v) => <option key={v.nome} value={v.nome}>{v.nome} — R$ {formatarMoeda(v.precoUnitario)}/m²</option>)}
                </select>
              )}
              {passo === 6 && (
                <select autoFocus value={perfilMaterialId} onChange={(e) => setPerfilMaterialId(Number(e.target.value))} className="ios-input w-full min-h-16 text-xl font-semibold">
                  {perfis.map((p) => <option key={p.id} value={p.id}>{p.nome} — R$ {formatarMoeda(p.precoUnitario)}/m · barra {p.comprimentoBarraM}m</option>)}
                </select>
              )}
              {passo === 7 && (
                <>
                  <p className="text-center text-lg text-slate-600">Onde este item vai ser instalado? (opcional)</p>
                  <input autoFocus value={descricao} onChange={(e) => setDescricao(e.target.value)} className="ios-input w-full min-h-16 text-2xl font-semibold text-center" placeholder="Ex.: Sala, quarto, cobertura" />
                </>
              )}
              {passo === PASSO_FINAL && (
                <div className="flex flex-col gap-4">
                  <EsquadriaSketch
                    categoria={tipos.find((t) => t.id === tipoEsquadriaId)?.categoria ?? "JANELA_CORRER"}
                    numFolhas={tipos.find((t) => t.id === tipoEsquadriaId)?.numFolhas ?? 2}
                    larguraCm={larguraNum}
                    alturaCm={alturaNum}
                  />
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 grid gap-2 text-lg">
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Tipo</span><span className="font-bold text-right">{tipos.find((t) => t.id === tipoEsquadriaId)?.nome ?? "—"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Medidas</span><span className="font-bold">{larguraCm || "—"} × {alturaCm || "—"} cm</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Quantidade</span><span className="font-bold">{quantidade}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Cor do perfil</span><span className="font-bold">{corPerfil || "—"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Vidro</span><span className="font-bold text-right">{tipoVidro || "—"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Linha do perfil</span><span className="font-bold text-right">{perfis.find((p) => p.id === perfilMaterialId)?.nome ?? "—"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Descrição / local</span><span className="font-bold text-right">{descricao || "—"}</span></div>
                  </div>
                  <p className="text-center text-sm text-slate-500">Confira os dados acima. Se precisar corrigir, use o botão Voltar.</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-4 py-4 flex gap-3">
              {passo > 0 && (
                <button type="button" onClick={() => setPasso((p) => p - 1)} className="ios-btn ios-btn-secondary flex-1 min-h-16 !text-lg whitespace-nowrap">Voltar</button>
              )}
              {passo < PASSO_FINAL ? (
                <button
                  type="button"
                  disabled={(passo === 1 && larguraNum <= 0) || (passo === 2 && alturaNum <= 0)}
                  onClick={() => setPasso((p) => p + 1)}
                  className="ios-btn ios-btn-primary flex-1 min-h-16 !text-xl whitespace-nowrap"
                >
                  Próximo
                </button>
              ) : (
                <button type="button" onClick={() => { adicionarItem(); setPreenchimentoAmpliado(false); }} className="ios-btn ios-btn-success flex-1 min-h-16 !text-xl">Adicionar item ao orçamento</button>
              )}
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
                  <td>{formatarMoeda(i.resultado.vidroM2Total)}</td>
                  <td className="font-semibold">R$ {formatarMoeda(i.resultado.totalMateriais)}</td>
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
          <span className="inline-flex items-center ios-input p-0 overflow-hidden"><span className="px-3 text-slate-500">R$</span><input type="text" inputMode="decimal" value={formatarMoeda(descontoValor)} onChange={(e) => setDescontoValor(digitosParaValorMoeda(e.target.value))} className="flex-1 bg-transparent py-2 pr-3 outline-none text-right" /></span>
        </label>
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          Motivo do desconto
          <input value={descontoMotivo} onChange={(e) => setDescontoMotivo(e.target.value)} className="ios-input" placeholder="Ex: aproveitamento de sobras em estoque" />
        </label>
        <div className="flex flex-col justify-end text-right">
          <div className="text-sm text-slate-500">Subtotal: R$ {formatarMoeda(subtotal)}</div>
          <div className="text-2xl font-bold">Total: R$ {formatarMoeda(total)}</div>
        </div>
      </div>

      {erro && <div className="text-red-600 text-sm">{erro}</div>}

      <button onClick={salvar} disabled={isPending} className="self-end ios-btn ios-btn-success !px-6 !py-3 text-base">
        {isPending ? "Salvando..." : edicao ? "Salvar alterações" : "Salvar orçamento"}
      </button>
    </div>
  );
}
