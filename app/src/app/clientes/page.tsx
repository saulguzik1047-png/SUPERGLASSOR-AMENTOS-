import { prisma } from "@/lib/prisma";
import { criarCliente, excluirCliente } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({ orderBy: { nome: "asc" } });

  async function excluir(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    await excluirCliente(id);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Clientes</h1>

      <form action={criarCliente} className="bg-white rounded-xl shadow p-4 grid gap-3 md:grid-cols-4">
        <input name="nome" placeholder="Nome" required className="border rounded px-3 py-2 md:col-span-1" />
        <input name="endereco" placeholder="Endereço" className="border rounded px-3 py-2 md:col-span-2" />
        <input name="telefone" placeholder="Telefone (WhatsApp) ex: 5511999999999" required className="border rounded px-3 py-2" />
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-semibold md:col-span-4 w-fit">
          Cadastrar cliente
        </button>
      </form>

      <div className="bg-white rounded-xl shadow divide-y">
        {clientes.length === 0 && <p className="p-4 text-slate-500 text-sm">Nenhum cliente cadastrado.</p>}
        {clientes.map((c) => (
          <div key={c.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-medium">{c.nome}</div>
              <div className="text-sm text-slate-500">{c.endereco || "Sem endereço"} · {c.telefone}</div>
            </div>
            <form action={excluir}>
              <input type="hidden" name="id" value={c.id} />
              <button className="text-red-600 hover:underline text-sm">Excluir</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
