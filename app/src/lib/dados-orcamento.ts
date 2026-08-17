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
    .map((m) => ({ id: m.id, nome: m.nome, precoUnitario: m.precoUnitario * (1 + m.margemPercentual / 100), comprimentoBarraM: m.comprimentoBarra ?? 6 }));
  const perfil = perfis[0];
  const perfilT = materiais.find((m) => m.categoria === "PERFIL_T");
  const precos = {
    perfilMetro: perfil?.precoUnitario ?? 18.5,
    perfilTMetro: perfilT ? perfilT.precoUnitario * (1 + perfilT.margemPercentual / 100) : 24,
    rodizio: (materiais.find((m) => m.nome === "Rodízio simples")?.precoUnitario ?? 6.5) * (1 + (materiais.find((m) => m.nome === "Rodízio simples")?.margemPercentual ?? 0) / 100),
    dobradica: (materiais.find((m) => m.nome === "Dobradiça de aço")?.precoUnitario ?? 9) * (1 + (materiais.find((m) => m.nome === "Dobradiça de aço")?.margemPercentual ?? 0) / 100),
    fechoTrava: (materiais.find((m) => m.nome === "Fecho/trava")?.precoUnitario ?? 14) * (1 + (materiais.find((m) => m.nome === "Fecho/trava")?.margemPercentual ?? 0) / 100),
    puxador: (materiais.find((m) => m.nome === "Puxador")?.precoUnitario ?? 8) * (1 + (materiais.find((m) => m.nome === "Puxador")?.margemPercentual ?? 0) / 100),
    cantoneira: (materiais.find((m) => m.nome === "Cantoneira")?.precoUnitario ?? 1.2) * (1 + (materiais.find((m) => m.nome === "Cantoneira")?.margemPercentual ?? 0) / 100),
    parafusosJogo: (materiais.find((m) => m.nome === "Jogo de parafusos")?.precoUnitario ?? 2.5) * (1 + (materiais.find((m) => m.nome === "Jogo de parafusos")?.margemPercentual ?? 0) / 100),
    tuboSilicone: (materiais.find((m) => m.nome === "Tubo de silicone")?.precoUnitario ?? 18) * (1 + (materiais.find((m) => m.nome === "Tubo de silicone")?.margemPercentual ?? 0) / 100),
    fitaEscovaMetro: (materiais.find((m) => m.nome === "Fita de vedação/escova (metro)")?.precoUnitario ?? 2.2) * (1 + (materiais.find((m) => m.nome === "Fita de vedação/escova (metro)")?.margemPercentual ?? 0) / 100),
  };
  const vidros = materiais.filter((m) => m.categoria === "VIDRO").map((m) => ({ nome: m.nome, precoUnitario: m.precoUnitario * (1 + m.margemPercentual / 100) }));

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
