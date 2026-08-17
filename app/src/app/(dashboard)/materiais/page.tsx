import { prisma } from "@/lib/prisma";
import { atualizarMaterial, criarMaterial, desativarMaterial, atualizarCor, criarCor, desativarCor } from "@/lib/actions";

export const dynamic = "force-dynamic";

const categoriaLabel: Record<string, string> = {
  PERFIL: "Perfil de alumínio",
  VIDRO: "Vidro",
  ACESSORIO: "Acessórios",
  PERFIL_T: "Perfil T para emendas",
};

export default async function MateriaisPage() {
  const materiais = await prisma.material.findMany({ where: { ativo: true }, orderBy: [{ categoria: "asc" }, { nome: "asc" }] });
  const cores = await prisma.cor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });
  const grupos = ["PERFIL", "PERFIL_T", "VIDRO", "ACESSORIO"].map((categoria) => ({
    categoria,
    itens: materiais.filter((m) => m.categoria === categoria),
  }));

  async function desativar(formData: FormData) {
    "use server";
    await desativarMaterial(Number(formData.get("id")));
  }

  async function desativarCorAction(formData: FormData) {
    "use server";
    await desativarCor(Number(formData.get("id")));
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Materiais e preços</h1>
      <p className="text-slate-600 text-sm">
        Ajuste aqui os preços usados no cálculo dos orçamentos. Perfil de alumínio: preço por metro e comprimento
        padrão da barra. Vidro: preço por m². Acessórios: preço por unidade.
      </p>

      {grupos.map((g) => (
        <div key={g.categoria} className="glass-card p-4">
          <h2 className="font-semibold mb-3">{categoriaLabel[g.categoria]}</h2>
          <div className="flex flex-col divide-y">
            {g.itens.length === 0 && <p className="text-slate-500 text-sm py-2">Nenhum material cadastrado.</p>}
            {g.itens.map((m) => (
              <form key={m.id} action={atualizarMaterial} className="py-2 flex items-center gap-3 flex-wrap">
                <input type="hidden" name="id" value={m.id} />
                <span className="flex-1 min-w-[180px]">{m.nome}</span>
                <label className="text-sm text-slate-500 flex items-center gap-1">
                  Custo
                  <span className="inline-flex items-center border rounded bg-white overflow-hidden"><span className="px-2 text-slate-400">R$</span><input name="precoUnitario" type="number" step="0.01" min={0} defaultValue={m.precoUnitario} className="px-2 py-1 w-24 outline-none" /></span>
                  / {m.unidade === "BARRA" ? "metro" : m.unidade === "M2" ? "m²" : "un"}
                </label>
                <label className="text-sm text-slate-500 flex items-center gap-1">
                  Lucro
                  <input name="margemPercentual" type="number" step="0.1" min={0} defaultValue={m.margemPercentual} className="border rounded px-2 py-1 w-20" />%
                </label>
                <span className="text-xs text-emerald-700 whitespace-nowrap">
                  Venda: R$ {(m.precoUnitario * (1 + m.margemPercentual / 100)).toFixed(2)}
                </span>
                {g.categoria === "PERFIL" && (
                  <label className="text-sm text-slate-500 flex items-center gap-1">
                    Barra de
                    <input name="comprimentoBarra" type="number" step="0.1" min={0.1} defaultValue={m.comprimentoBarra ?? 6} className="border rounded px-2 py-1 w-20" />
                    m
                  </label>
                )}
                <button className="ios-btn ios-btn-primary !py-1.5 !px-4 text-xs">Salvar</button>
                <button formAction={desativar} className="ios-btn ios-btn-danger !py-1.5 !px-3 text-xs">Remover</button>
              </form>
            ))}
          </div>
        </div>
      ))}

      <div className="glass-card p-4">
        <h2 className="font-semibold mb-3">Cores dos perfis</h2>
        <p className="text-slate-600 text-sm mb-3">
          Cadastre aqui cada cor uma única vez. O percentual é somado sobre o preço do perfil na cor Branco (referência,
          0%), sem precisar duplicar o cadastro de cada linha de perfil para cada cor.
        </p>
        <div className="flex flex-col divide-y">
          {cores.length === 0 && <p className="text-slate-500 text-sm py-2">Nenhuma cor cadastrada ainda. Cadastre ao menos "Branco" com 0%.</p>}
          {cores.map((c) => (
            <form key={c.id} action={atualizarCor} className="py-2 flex items-center gap-3 flex-wrap">
              <input type="hidden" name="id" value={c.id} />
              <input name="nome" defaultValue={c.nome} className="border rounded px-2 py-1 flex-1 min-w-[140px]" />
              <label className="text-sm text-slate-500 flex items-center gap-1">
                Adicional sobre o Branco
                <input name="percentualAdicional" type="number" step="0.1" defaultValue={c.percentualAdicional} className="border rounded px-2 py-1 w-20" />%
              </label>
              <button className="ios-btn ios-btn-primary !py-1.5 !px-4 text-xs">Salvar</button>
              <button formAction={desativarCorAction} className="ios-btn ios-btn-danger !py-1.5 !px-3 text-xs">Remover</button>
            </form>
          ))}
        </div>
        <form action={criarCor} className="grid gap-3 md:grid-cols-4 mt-4">
          <input name="nome" placeholder="Nome da cor (ex: Preto, Bronze)" required className="border rounded px-3 py-2 md:col-span-2" />
          <label className="inline-flex items-center border rounded bg-white overflow-hidden px-3">
            <input name="percentualAdicional" type="number" step="0.1" defaultValue={0} placeholder="0" className="py-2 w-full outline-none" />
            <span className="text-slate-400">% sobre o Branco</span>
          </label>
          <button className="ios-btn ios-btn-dark w-fit">Adicionar cor</button>
        </form>
      </div>

      <div className="glass-card p-4">
        <h2 className="font-semibold mb-3">Adicionar novo material</h2>
        <form action={criarMaterial} className="grid gap-3 md:grid-cols-5">
          <input name="nome" placeholder="Nome do material" required className="border rounded px-3 py-2 md:col-span-2" />
          <select name="categoria" className="border rounded px-3 py-2">
            <option value="PERFIL">Perfil de alumínio</option>
            <option value="PERFIL_T">Perfil T para emenda</option>
            <option value="VIDRO">Vidro</option>
            <option value="ACESSORIO">Acessório</option>
          </select>
          <select name="unidade" className="border rounded px-3 py-2">
            <option value="PECA">Peça</option>
            <option value="BARRA">Barra (por metro)</option>
            <option value="M2">m²</option>
            <option value="ROLO">Rolo/metro</option>
          </select>
          <span className="inline-flex items-center border rounded bg-white overflow-hidden"><span className="px-3 text-slate-400">R$</span><input name="precoUnitario" type="number" step="0.01" min={0} placeholder="Custo" required className="px-3 py-2 w-full outline-none" /></span>
          <input name="margemPercentual" type="number" step="0.1" min={0} defaultValue={0} placeholder="Lucro (%)" className="border rounded px-3 py-2" />
          <input name="comprimentoBarra" type="number" step="0.1" min={0.1} placeholder="Comprimento da barra (m) — só perfil" className="border rounded px-3 py-2 md:col-span-2" />
          <button className="ios-btn ios-btn-dark w-fit">Adicionar</button>
        </form>
      </div>
    </div>
  );
}
