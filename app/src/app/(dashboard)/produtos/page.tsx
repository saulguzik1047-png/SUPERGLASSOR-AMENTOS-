import { prisma } from "@/lib/prisma";
import { criarTipoEsquadria, atualizarTipoEsquadria, desativarTipoEsquadria } from "@/lib/actions";

export const dynamic = "force-dynamic";

const categorias = [
  ["JANELA_CORRER", "Janela de correr"],
  ["VITRO_BASCULANTE", "Vitrô / basculante"],
  ["FIXO", "Janela fixa"],
  ["PORTA_CORRER", "Porta de correr"],
  ["PORTA_GIRO", "Porta de giro"],
  ["COBERTURA_PERGOLADO", "Cobertura de pergolado"],
] as const;

const categoriaLabel = Object.fromEntries(categorias);

export default async function ProdutosPage() {
  const produtos = await prisma.tipoEsquadria.findMany({ where: { ativo: true }, orderBy: [{ categoria: "asc" }, { nome: "asc" }] });

  async function desativar(formData: FormData) {
    "use server";
    await desativarTipoEsquadria(Number(formData.get("id")));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Tipos de produtos</h1>
        <p className="text-sm text-slate-600 mt-1">Cadastre os modelos que aparecem no orçamento. Em coberturas, folhas/placas define a quantidade de emendas do perfil T.</p>
      </div>

      <div className="glass-card p-4">
        <h2 className="font-semibold mb-3">Novo produto</h2>
        <form action={criarTipoEsquadria} className="grid gap-3 md:grid-cols-6">
          <input name="nome" required placeholder="Nome do produto" className="ios-input md:col-span-2" />
          <select name="categoria" className="ios-input">
            {categorias.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm">Folhas/placas <input name="numFolhas" type="number" min={1} defaultValue={2} className="ios-input w-20" /></label>
          <input name="descricao" placeholder="Descrição (opcional)" className="ios-input md:col-span-2" />
          <textarea name="parametros" defaultValue="{}" aria-label="Parâmetros JSON" className="ios-input min-h-16 md:col-span-5" placeholder='Parâmetros JSON, ex.: {"descontoVidroCm":8}' />
          <button className="ios-btn ios-btn-primary h-fit">Cadastrar</button>
        </form>
      </div>

      <div className="flex flex-col gap-4">
        {produtos.map((produto) => (
          <form key={produto.id} action={atualizarTipoEsquadria} className="glass-card p-4 grid gap-3 md:grid-cols-6">
            <input type="hidden" name="id" value={produto.id} />
            <label className="flex flex-col gap-1 text-sm md:col-span-2">Nome<input name="nome" defaultValue={produto.nome} required className="ios-input" /></label>
            <label className="flex flex-col gap-1 text-sm">Categoria<select name="categoria" defaultValue={produto.categoria} className="ios-input">{categorias.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="flex flex-col gap-1 text-sm">Folhas/placas<input name="numFolhas" type="number" min={1} defaultValue={produto.numFolhas} className="ios-input" /></label>
            <label className="flex flex-col gap-1 text-sm md:col-span-2">Descrição<input name="descricao" defaultValue={produto.descricao ?? ""} className="ios-input" /></label>
            <label className="flex flex-col gap-1 text-sm md:col-span-5">Parâmetros de cálculo<input name="parametros" defaultValue={produto.parametros} className="ios-input font-mono text-xs" /></label>
            <div className="flex gap-2 items-end"><button className="ios-btn ios-btn-primary !py-2">Salvar</button><button formAction={desativar} className="ios-btn ios-btn-danger !py-2">Remover</button></div>
            <p className="text-xs text-slate-500 md:col-span-6">{categoriaLabel[produto.categoria] ?? produto.categoria} · fórmula: {produto.formulaKey}</p>
          </form>
        ))}
      </div>
    </div>
  );
}
