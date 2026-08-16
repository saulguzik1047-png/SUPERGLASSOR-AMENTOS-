import { prisma } from "@/lib/prisma";
import { atualizarMaterial, criarMaterial, desativarMaterial } from "@/lib/actions";

export const dynamic = "force-dynamic";

const categoriaLabel: Record<string, string> = {
  PERFIL: "Perfil de alumínio",
  VIDRO: "Vidro",
  ACESSORIO: "Acessórios",
};

export default async function MateriaisPage() {
  const materiais = await prisma.material.findMany({ where: { ativo: true }, orderBy: [{ categoria: "asc" }, { nome: "asc" }] });
  const grupos = ["PERFIL", "VIDRO", "ACESSORIO"].map((categoria) => ({
    categoria,
    itens: materiais.filter((m) => m.categoria === categoria),
  }));

  async function desativar(formData: FormData) {
    "use server";
    await desativarMaterial(Number(formData.get("id")));
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Materiais e preços</h1>
      <p className="text-slate-600 text-sm">
        Ajuste aqui os preços usados no cálculo dos orçamentos. Perfil de alumínio: preço por metro e comprimento
        padrão da barra. Vidro: preço por m². Acessórios: preço por unidade.
      </p>

      {grupos.map((g) => (
        <div key={g.categoria} className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">{categoriaLabel[g.categoria]}</h2>
          <div className="flex flex-col divide-y">
            {g.itens.length === 0 && <p className="text-slate-500 text-sm py-2">Nenhum material cadastrado.</p>}
            {g.itens.map((m) => (
              <form key={m.id} action={atualizarMaterial} className="py-2 flex items-center gap-3 flex-wrap">
                <input type="hidden" name="id" value={m.id} />
                <span className="flex-1 min-w-[180px]">{m.nome}</span>
                <label className="text-sm text-slate-500 flex items-center gap-1">
                  R$
                  <input name="precoUnitario" type="number" step="0.01" min={0} defaultValue={m.precoUnitario} className="border rounded px-2 py-1 w-24" />
                  / {m.unidade === "BARRA" ? "metro" : m.unidade === "M2" ? "m²" : "un"}
                </label>
                {g.categoria === "PERFIL" && (
                  <label className="text-sm text-slate-500 flex items-center gap-1">
                    Barra de
                    <input name="comprimentoBarra" type="number" step="0.1" min={0.1} defaultValue={m.comprimentoBarra ?? 6} className="border rounded px-2 py-1 w-20" />
                    m
                  </label>
                )}
                <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1.5 text-sm font-semibold">Salvar</button>
                <button formAction={desativar} className="text-red-600 hover:underline text-xs">Remover</button>
              </form>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-3">Adicionar novo material</h2>
        <form action={criarMaterial} className="grid gap-3 md:grid-cols-5">
          <input name="nome" placeholder="Nome do material" required className="border rounded px-3 py-2 md:col-span-2" />
          <select name="categoria" className="border rounded px-3 py-2">
            <option value="PERFIL">Perfil de alumínio</option>
            <option value="VIDRO">Vidro</option>
            <option value="ACESSORIO">Acessório</option>
          </select>
          <select name="unidade" className="border rounded px-3 py-2">
            <option value="PECA">Peça</option>
            <option value="BARRA">Barra (por metro)</option>
            <option value="M2">m²</option>
            <option value="ROLO">Rolo/metro</option>
          </select>
          <input name="precoUnitario" type="number" step="0.01" min={0} placeholder="Preço (R$)" required className="border rounded px-3 py-2" />
          <input name="comprimentoBarra" type="number" step="0.1" min={0.1} placeholder="Comprimento da barra (m) — só perfil" className="border rounded px-3 py-2 md:col-span-2" />
          <button className="bg-slate-800 hover:bg-slate-900 text-white rounded px-4 py-2 font-semibold w-fit">Adicionar</button>
        </form>
      </div>
    </div>
  );
}
