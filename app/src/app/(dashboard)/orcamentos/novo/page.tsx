import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NovoOrcamentoForm from "./NovoOrcamentoForm";

export const dynamic = "force-dynamic";

export default async function NovoOrcamentoPage() {
  const [clientes, tipos, materiais, sobras] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { nome: "asc" } }),
    prisma.tipoEsquadria.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.material.findMany({ where: { ativo: true } }),
    prisma.estoqueSobra.findMany({ where: { tipo: "PERFIL", disponivel: true } }),
  ]);

  const perfil = materiais.find((m) => m.categoria === "PERFIL");
  const precos = {
    perfilMetro: perfil?.precoUnitario ?? 18.5,
    rodizio: materiais.find((m) => m.nome === "Rodízio simples")?.precoUnitario ?? 6.5,
    dobradica: materiais.find((m) => m.nome === "Dobradiça de aço")?.precoUnitario ?? 9,
    fechoTrava: materiais.find((m) => m.nome === "Fecho/trava")?.precoUnitario ?? 14,
    puxador: materiais.find((m) => m.nome === "Puxador")?.precoUnitario ?? 8,
    cantoneira: materiais.find((m) => m.nome === "Cantoneira")?.precoUnitario ?? 1.2,
    parafusosJogo: materiais.find((m) => m.nome === "Jogo de parafusos")?.precoUnitario ?? 2.5,
    tuboSilicone: materiais.find((m) => m.nome === "Tubo de silicone")?.precoUnitario ?? 18,
    fitaEscovaMetro: materiais.find((m) => m.nome === "Fita de vedação/escova (metro)")?.precoUnitario ?? 2.2,
  };
  const vidros = materiais.filter((m) => m.categoria === "VIDRO").map((m) => ({ nome: m.nome, precoUnitario: m.precoUnitario }));

  if (clientes.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="mb-3">Cadastre um cliente antes de criar o primeiro orçamento.</p>
        <Link href="/clientes" className="text-blue-600 font-semibold hover:underline">Ir para Clientes</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Novo Orçamento</h1>
      <NovoOrcamentoForm
        clientes={clientes.map((c) => ({ id: c.id, nome: c.nome, telefone: c.telefone }))}
        tipos={tipos.map((t) => ({ id: t.id, nome: t.nome, categoria: t.categoria, numFolhas: t.numFolhas, parametros: t.parametros }))}
        vidros={vidros}
        precos={precos}
        comprimentoBarraM={perfil?.comprimentoBarra ?? 6}
        sobrasDisponiveisCm={sobras.map((s) => s.medida1)}
      />
    </div>
  );
}
