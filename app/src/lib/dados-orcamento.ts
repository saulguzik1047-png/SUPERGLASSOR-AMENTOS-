import { prisma } from "./prisma";

// Dados usados para montar o formulário de orçamento (novo ou edição)
export async function carregarDadosFormularioOrcamento() {
  const [clientes, tipos, materiais, sobras] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { nome: "asc" } }),
    prisma.tipoEsquadria.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.material.findMany({ where: { ativo: true } }),
    prisma.estoqueSobra.findMany({ where: { tipo: "PERFIL", disponivel: true } }),
  ]);

  const perfis = materiais
    .filter((m) => m.categoria === "PERFIL")
    .map((m) => ({ id: m.id, nome: m.nome, precoUnitario: m.precoUnitario, comprimentoBarraM: m.comprimentoBarra ?? 6 }));
  const perfil = perfis[0];
  const perfilT = materiais.find((m) => m.categoria === "PERFIL_T");
  const precos = {
    perfilMetro: perfil?.precoUnitario ?? 18.5,
    perfilTMetro: perfilT?.precoUnitario ?? 24,
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

  return {
    clientes: clientes.map((c) => ({ id: c.id, nome: c.nome, telefone: c.telefone })),
    tipos: tipos.map((t) => ({ id: t.id, nome: t.nome, categoria: t.categoria, numFolhas: t.numFolhas, parametros: t.parametros })),
    vidros,
    precos,
    perfis,
    comprimentoBarraM: perfil?.comprimentoBarraM ?? 6,
    sobrasDisponiveisCm: sobras.map((s) => s.medida1),
  };
}
