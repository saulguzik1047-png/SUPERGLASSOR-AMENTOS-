import { prisma } from "@/lib/prisma";
import { adicionarSobraManual, descartarSobra } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const sobras = await prisma.estoqueSobra.findMany({
    where: { disponivel: true },
    orderBy: { createdAt: "desc" },
  });

  async function descartar(formData: FormData) {
    "use server";
    await descartarSobra(Number(formData.get("id")));
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Estoque de sobras</h1>
      <p className="text-slate-600 text-sm">
        Retalhos de perfil e vidro que sobraram de orçamentos anteriores. Eles são reaproveitados automaticamente nos
        próximos orçamentos (o sistema avisa quando isso acontece, para você poder oferecer desconto ao cliente).
      </p>

      <form action={adicionarSobraManual} className="bg-white rounded-xl shadow p-4 grid gap-3 md:grid-cols-5">
        <select name="tipo" className="border rounded px-3 py-2">
          <option value="PERFIL">Perfil</option>
          <option value="VIDRO">Vidro</option>
        </select>
        <input name="descricaoMaterial" placeholder="Descrição do material" required className="border rounded px-3 py-2 md:col-span-2" />
        <input name="medida1" type="number" step="0.1" placeholder="Comprimento/Largura (cm)" required className="border rounded px-3 py-2" />
        <input name="medida2" type="number" step="0.1" placeholder="Altura (cm) — só vidro" className="border rounded px-3 py-2" />
        <input name="quantidade" type="number" defaultValue={1} min={1} className="border rounded px-3 py-2" />
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-semibold md:col-span-5 w-fit">
          Adicionar sobra manualmente
        </button>
      </form>

      <div className="bg-white rounded-xl shadow divide-y">
        {sobras.length === 0 && <p className="p-4 text-slate-500 text-sm">Nenhuma sobra disponível em estoque no momento.</p>}
        {sobras.map((s) => (
          <div key={s.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-medium">{s.descricaoMaterial}</div>
              <div className="text-sm text-slate-500">
                {s.tipo === "PERFIL" ? `${s.medida1.toFixed(1)}cm de comprimento` : `${s.medida1}x${s.medida2}cm`} · qtd {s.quantidade}
                {s.origemOrcamentoId ? " · sobra de orçamento anterior" : " · adicionado manualmente"}
              </div>
            </div>
            <form action={descartar}>
              <input type="hidden" name="id" value={s.id} />
              <button className="text-red-600 hover:underline text-sm">Descartar</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
