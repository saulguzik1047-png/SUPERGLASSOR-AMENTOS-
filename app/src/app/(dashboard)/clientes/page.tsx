import { prisma } from "@/lib/prisma";
import { criarCliente, excluirCliente } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const clientes = await prisma.cliente.findMany({
    where: q
      ? { OR: [{ nome: { contains: q } }, { telefone: { contains: q } }, { endereco: { contains: q } }] }
      : undefined,
    orderBy: { nome: "asc" },
  });

  async function excluir(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    await excluirCliente(id);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Clientes</h1>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nome, telefone ou endereço..."
          className="ios-input flex-1"
        />
        <button className="ios-btn ios-btn-secondary">Buscar</button>
      </form>

      <form action={criarCliente} className="glass-card p-4 grid gap-3 md:grid-cols-4">
        <input name="nome" placeholder="Nome" required className="ios-input md:col-span-1" />
        <input name="endereco" placeholder="Endereço" className="ios-input md:col-span-2" />
        <input name="telefone" placeholder="Telefone (WhatsApp) ex: 5511999999999" required className="ios-input" />
        <button className="ios-btn ios-btn-primary md:col-span-4 w-fit">
          Cadastrar cliente
        </button>
      </form>

      <div className="glass-card divide-y divide-white/40">
        {clientes.length === 0 && <p className="p-4 text-slate-500 text-sm">Nenhum cliente encontrado.</p>}
        {clientes.map((c) => (
          <div key={c.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-medium">{c.nome}</div>
              <div className="text-sm text-slate-500">{c.endereco || "Sem endereço"} · {c.telefone}</div>
            </div>
            <form action={excluir}>
              <input type="hidden" name="id" value={c.id} />
              <button className="ios-btn ios-btn-danger !py-1.5 !px-3 text-xs">Excluir</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

