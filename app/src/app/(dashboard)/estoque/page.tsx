import { prisma } from "@/lib/prisma";
import { adicionarSobraManual, descartarSobra } from "@/lib/actions";
import { codigoSobra } from "@/lib/codigos";

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
        Anote o <strong>código</strong> abaixo na própria peça para identificar facilmente no depósito.
      </p>

      <form action={adicionarSobraManual} className="glass-card p-4 grid gap-3 md:grid-cols-5">
        <select name="tipo" className="border rounded-lg px-3 py-2 bg-white/70">
          <option value="PERFIL">Perfil</option>
          <option value="VIDRO">Vidro</option>
        </select>
        <input name="descricaoMaterial" placeholder="Descrição do material" required className="border rounded-lg px-3 py-2 bg-white/70 md:col-span-2" />
        <input name="medida1" type="number" step="0.1" placeholder="Comprimento/Largura (cm)" required className="border rounded-lg px-3 py-2 bg-white/70" />
        <input name="medida2" type="number" step="0.1" placeholder="Altura (cm) — só vidro" className="border rounded-lg px-3 py-2 bg-white/70" />
        <input name="quantidade" type="number" defaultValue={1} min={1} className="border rounded-lg px-3 py-2 bg-white/70" />
        <button className="ios-btn ios-btn-primary md:col-span-5 w-fit">
          Adicionar sobra manualmente
        </button>
      </form>

      <div className="glass-card divide-y divide-white/40">
        {sobras.length === 0 && <p className="p-4 text-slate-500 text-sm">Nenhuma sobra disponível em estoque no momento.</p>}
        {sobras.map((s) => (
          <div key={s.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg tracking-wide">
                {codigoSobra(s.tipo, s.id)}
              </span>
              <div>
                <div className="font-medium">{s.descricaoMaterial}</div>
                <div className="text-sm text-slate-500">
                  {s.tipo === "PERFIL" ? `${s.medida1.toFixed(1)}cm de comprimento` : `${s.medida1}x${s.medida2}cm`} · qtd {s.quantidade}
                  {s.origemOrcamentoId ? " · sobra de orçamento anterior" : " · adicionado manualmente"}
                </div>
              </div>
            </div>
            <form action={descartar}>
              <input type="hidden" name="id" value={s.id} />
              <button className="ios-btn ios-btn-danger !py-1.5 !px-3 text-xs">Descartar</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

