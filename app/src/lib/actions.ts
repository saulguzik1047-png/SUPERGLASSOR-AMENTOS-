"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { calcularOrcamentoItem, type PrecosMateriais } from "./calculo";

export async function criarCliente(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  if (!nome || !telefone) throw new Error("Nome e telefone são obrigatórios.");

  await prisma.cliente.create({ data: { nome, endereco: endereco || null, telefone } });
  revalidatePath("/clientes");
  revalidatePath("/orcamentos/novo");
}

export async function criarClienteRapido(nome: string, telefone: string) {
  const nomeNormalizado = nome.trim();
  const telefoneNormalizado = telefone.trim();
  if (!nomeNormalizado || !telefoneNormalizado) throw new Error("Informe nome e telefone do cliente.");

  const existente = await prisma.cliente.findFirst({ where: { telefone: telefoneNormalizado } });
  const cliente = existente ?? await prisma.cliente.create({ data: { nome: nomeNormalizado, telefone: telefoneNormalizado } });
  revalidatePath("/clientes");
  revalidatePath("/orcamentos/novo");
  return { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone };
}

export async function excluirCliente(id: number) {
  await prisma.cliente.delete({ where: { id } });
  revalidatePath("/clientes");
}

async function montarPrecosMateriais(perfilMaterialId?: number): Promise<{ precos: PrecosMateriais; comprimentoBarraM: number; perfilNome: string; perfilTNome: string; perfilMaterialId?: number }> {
  const materiais = await prisma.material.findMany({ where: { ativo: true } });
  const precoVenda = (material: { precoUnitario: number; margemPercentual: number } | undefined, padrao: number) => material ? material.precoUnitario * (1 + material.margemPercentual / 100) : padrao;
  const porNome = (nome: string, padrao: number) => precoVenda(materiais.find((m) => m.nome === nome), padrao);
  const perfil = materiais.find((m) => m.categoria === "PERFIL" && m.id === perfilMaterialId) ?? materiais.find((m) => m.categoria === "PERFIL");
  const perfilT = materiais.find((m) => m.categoria === "PERFIL_T");

  const precos: PrecosMateriais = {
    perfilMetro: precoVenda(perfil, 18.5),
    perfilTMetro: precoVenda(perfilT, 24),
    rodizio: porNome("Rodízio simples", 6.5),
    dobradica: porNome("Dobradiça de aço", 9),
    fechoTrava: porNome("Fecho/trava", 14),
    puxador: porNome("Puxador", 8),
    cantoneira: porNome("Cantoneira", 1.2),
    parafusosJogo: porNome("Jogo de parafusos", 2.5),
    tuboSilicone: porNome("Tubo de silicone", 18),
    fitaEscovaMetro: porNome("Fita de vedação/escova (metro)", 2.2),
  };

  const precoM2VidroPorNome: Record<string, number> = {};
  for (const m of materiais.filter((m) => m.categoria === "VIDRO")) {
    precoM2VidroPorNome[m.nome] = precoVenda(m, m.precoUnitario);
  }

  return { precos, comprimentoBarraM: perfil?.comprimentoBarra ?? 6, perfilNome: perfil?.nome ?? "Perfil de alumínio", perfilTNome: perfilT?.nome ?? "Perfil T para emenda", perfilMaterialId: perfil?.id };
}

export interface ItemOrcamentoInput {
  tipoEsquadriaId: number;
  descricao?: string;
  larguraCm: number;
  alturaCm: number;
  quantidade: number;
  corPerfil: string;
  tipoVidro: string;
  precoM2Vidro: number;
  perfilMaterialId?: number;
}

export interface CriarOrcamentoInput {
  clienteId: number;
  maoDeObra: number;
  descontoValor: number;
  descontoMotivo?: string;
  observacoes?: string;
  validadeDias?: number;
  itens: ItemOrcamentoInput[];
}

type SobraPool = { id: number; restanteM: number }[];
type SobraDb = Awaited<ReturnType<typeof prisma.estoqueSobra.findMany>>;

// Calcula os itens (barras, vidro, acessórios) e simula o consumo do estoque de sobras, sem persistir nada ainda
async function calcularItensEEstoque(itensInput: ItemOrcamentoInput[]) {
  if (!itensInput.length) throw new Error("Adicione ao menos um item ao orçamento.");

  const tipos = await prisma.tipoEsquadria.findMany({ where: { id: { in: itensInput.map((i) => i.tipoEsquadriaId) } } });
  const tiposPorId = new Map(tipos.map((t) => [t.id, t]));

  const sobrasDb = await prisma.estoqueSobra.findMany({ where: { tipo: "PERFIL", disponivel: true }, orderBy: { medida1: "desc" } });
  const sobrasPool: SobraPool = sobrasDb.map((s) => ({ id: s.id, restanteM: s.medida1 / 100 }));

  let subtotalMateriais = 0;
  const itensParaCriar: { tipoEsquadriaId: number; descricao: string | null; largura: number; altura: number; quantidade: number; corPerfil: string; tipoVidro: string; perfilMaterialId?: number; perfilNome?: string; precoPerfilMetro?: number; precoM2Vidro: number; calculoJson: string; valorItem: number }[] = [];
  const alertasSobra: string[] = [];
  const novasSobras: { medida1: number }[] = [];

  for (const item of itensInput) {
    const tipo = tiposPorId.get(item.tipoEsquadriaId);
    if (!tipo) throw new Error("Tipo de esquadria inválido.");
    const { precos, comprimentoBarraM, perfilNome, perfilTNome, perfilMaterialId } = await montarPrecosMateriais(item.perfilMaterialId);

    const disponiveisAgora = sobrasPool.filter((s) => s.restanteM > 0).map((s) => s.restanteM);

    const resultado = calcularOrcamentoItem({
      categoria: tipo.categoria,
      numFolhas: tipo.numFolhas,
      larguraCm: item.larguraCm,
      alturaCm: item.alturaCm,
      quantidade: item.quantidade,
      parametrosJson: tipo.parametros,
      precoM2Vidro: item.precoM2Vidro,
      perfilNome,
      perfilTNome,
      precos,
      comprimentoBarraM,
      sobrasPerfilDisponiveisM: disponiveisAgora,
    });

    // Consome de fato o estoque de sobras (do maior para o menor) e devolve o restante como um novo retalho
    let precisaM = resultado.metrosPerfilReaproveitadosEstoque;
    if (precisaM > 0) {
      alertasSobra.push(
        `Item "${tipo.nome}" (${item.larguraCm}x${item.alturaCm}cm): reaproveitou ${precisaM.toFixed(2)}m de sobras em estoque — considere aplicar desconto ao cliente.`
      );
      for (const s of sobrasPool) {
        if (precisaM <= 0) break;
        if (s.restanteM <= 0) continue;
        const uso = Math.min(s.restanteM, precisaM);
        s.restanteM -= uso;
        precisaM -= uso;
      }
    }

    for (const s of resultado.sobras) novasSobras.push({ medida1: s.medida1Cm });

    itensParaCriar.push({
      tipoEsquadriaId: tipo.id,
      descricao: item.descricao ?? null,
      largura: item.larguraCm,
      altura: item.alturaCm,
      quantidade: item.quantidade,
      corPerfil: item.corPerfil,
      tipoVidro: item.tipoVidro,
      precoM2Vidro: item.precoM2Vidro,
      perfilMaterialId,
      perfilNome,
      precoPerfilMetro: precos.perfilMetro,
      calculoJson: JSON.stringify(resultado),
      valorItem: resultado.totalMateriais,
    });

    subtotalMateriais += resultado.totalMateriais;
  }

  return { itensParaCriar, subtotalMateriais, alertasSobra, novasSobras, sobrasPool, sobrasDb };
}

// Aplica no banco o consumo de sobras simulado acima e registra os novos retalhos gerados
async function aplicarConsumoEstoque(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  sobrasPool: SobraPool,
  sobrasDb: SobraDb,
  novasSobras: { medida1: number }[],
  orcamentoId: number
) {
  for (const s of sobrasPool) {
    const original = sobrasDb.find((o) => o.id === s.id)!;
    if (s.restanteM <= 0.01) {
      await tx.estoqueSobra.update({ where: { id: s.id }, data: { disponivel: false, medida1: 0 } });
    } else if (s.restanteM < original.medida1 / 100) {
      await tx.estoqueSobra.update({ where: { id: s.id }, data: { medida1: Number((s.restanteM * 100).toFixed(1)) } });
    }
  }

  for (const nova of novasSobras) {
    await tx.estoqueSobra.create({
      data: {
        tipo: "PERFIL",
        descricaoMaterial: "Perfil de alumínio (retalho)",
        medida1: nova.medida1,
        origemOrcamentoId: orcamentoId,
      },
    });
  }
}

export async function criarOrcamento(input: CriarOrcamentoInput) {
  const { itensParaCriar, subtotalMateriais, alertasSobra, novasSobras, sobrasPool, sobrasDb } = await calcularItensEEstoque(input.itens);

  const subtotal = subtotalMateriais + input.maoDeObra;
  const total = Math.max(subtotal - input.descontoValor, 0);

  const ultimo = await prisma.orcamento.aggregate({ _max: { numero: true } });
  const numero = (ultimo._max.numero ?? 0) + 1;

  const orcamento = await prisma.$transaction(async (tx) => {
    const criado = await tx.orcamento.create({
      data: {
        numero,
        clienteId: input.clienteId,
        maoDeObra: input.maoDeObra,
        descontoValor: input.descontoValor,
        descontoMotivo: input.descontoMotivo || null,
        observacoes: input.observacoes || null,
        validadeDias: input.validadeDias ?? 15,
        subtotal,
        total,
        itens: { create: itensParaCriar },
      },
      include: { itens: true, cliente: true },
    });

    await aplicarConsumoEstoque(tx, sobrasPool, sobrasDb, novasSobras, criado.id);

    return criado;
  });

  revalidatePath("/orcamentos");
  revalidatePath("/estoque");
  return { orcamentoId: orcamento.id, alertasSobra };
}

export async function atualizarOrcamento(id: number, input: CriarOrcamentoInput) {
  const existente = await prisma.orcamento.findUnique({ where: { id } });
  if (!existente) throw new Error("Orçamento não encontrado.");
  if (existente.status !== "RASCUNHO") throw new Error("Só é possível editar orçamentos em rascunho.");

  // Remove os retalhos que essa versão do orçamento havia gerado, antes de recalcular do zero
  await prisma.estoqueSobra.deleteMany({ where: { origemOrcamentoId: id } });

  const { itensParaCriar, subtotalMateriais, alertasSobra, novasSobras, sobrasPool, sobrasDb } = await calcularItensEEstoque(input.itens);

  const subtotal = subtotalMateriais + input.maoDeObra;
  const total = Math.max(subtotal - input.descontoValor, 0);

  await prisma.$transaction(async (tx) => {
    await tx.itemOrcamento.deleteMany({ where: { orcamentoId: id } });
    await tx.orcamento.update({
      where: { id },
      data: {
        clienteId: input.clienteId,
        maoDeObra: input.maoDeObra,
        descontoValor: input.descontoValor,
        descontoMotivo: input.descontoMotivo || null,
        observacoes: input.observacoes || null,
        validadeDias: input.validadeDias ?? existente.validadeDias,
        subtotal,
        total,
        itens: { create: itensParaCriar },
      },
    });
    await aplicarConsumoEstoque(tx, sobrasPool, sobrasDb, novasSobras, id);
  });

  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/estoque");
  return { orcamentoId: id, alertasSobra };
}

export async function duplicarOrcamento(id: number) {
  const original = await prisma.orcamento.findUnique({ where: { id }, include: { itens: true } });
  if (!original) throw new Error("Orçamento não encontrado.");

  const itensInput: ItemOrcamentoInput[] = original.itens.map((i) => ({
    tipoEsquadriaId: i.tipoEsquadriaId,
    descricao: i.descricao ?? undefined,
    larguraCm: i.largura,
    alturaCm: i.altura,
    quantidade: i.quantidade,
    corPerfil: i.corPerfil,
    tipoVidro: i.tipoVidro,
    precoM2Vidro: i.precoM2Vidro,
  }));

  const resultado = await criarOrcamento({
    clienteId: original.clienteId,
    maoDeObra: original.maoDeObra,
    descontoValor: 0,
    observacoes: original.observacoes ?? undefined,
    validadeDias: original.validadeDias,
    itens: itensInput,
  });

  revalidatePath("/orcamentos");
  return resultado;
}


export async function atualizarStatusOrcamento(id: number, status: "RASCUNHO" | "ENVIADO" | "APROVADO" | "RECUSADO") {
  await prisma.orcamento.update({ where: { id }, data: { status } });
  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${id}`);
}

export async function adicionarSobraManual(formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "PERFIL");
  const descricaoMaterial = String(formData.get("descricaoMaterial") ?? "").trim();
  const medida1 = Number(formData.get("medida1"));
  const medida2Raw = formData.get("medida2");
  const medida2 = medida2Raw ? Number(medida2Raw) : null;
  const quantidade = Number(formData.get("quantidade") ?? 1);

  if (!descricaoMaterial || !medida1) throw new Error("Preencha descrição e medida.");

  await prisma.estoqueSobra.create({
    data: { tipo, descricaoMaterial, medida1, medida2, quantidade },
  });
  revalidatePath("/estoque");
}

export async function descartarSobra(id: number) {
  await prisma.estoqueSobra.update({ where: { id }, data: { disponivel: false } });
  revalidatePath("/estoque");
}

export async function atualizarMaterial(formData: FormData) {
  const id = Number(formData.get("id"));
  const precoUnitario = Number(formData.get("precoUnitario"));
  const margemPercentual = Number(formData.get("margemPercentual") ?? 0);
  const comprimentoBarraRaw = formData.get("comprimentoBarra");
  const comprimentoBarra = comprimentoBarraRaw ? Number(comprimentoBarraRaw) : undefined;
  if (!id || Number.isNaN(precoUnitario) || precoUnitario < 0 || Number.isNaN(margemPercentual) || margemPercentual < 0) throw new Error("Preço ou margem inválidos.");

  await prisma.material.update({
    where: { id },
    data: { precoUnitario, margemPercentual, ...(comprimentoBarra !== undefined ? { comprimentoBarra } : {}) },
  });
  revalidatePath("/materiais");
  revalidatePath("/orcamentos/novo");
}

export async function criarMaterial(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "ACESSORIO");
  const unidade = String(formData.get("unidade") ?? "PECA");
  const precoUnitario = Number(formData.get("precoUnitario"));
  const margemPercentual = Number(formData.get("margemPercentual") ?? 0);
  const comprimentoBarraRaw = formData.get("comprimentoBarra");
  const comprimentoBarra = comprimentoBarraRaw ? Number(comprimentoBarraRaw) : null;
  if (!nome || Number.isNaN(precoUnitario) || precoUnitario < 0 || Number.isNaN(margemPercentual) || margemPercentual < 0) throw new Error("Preencha nome, preço e margem válidos.");

  await prisma.material.create({ data: { nome, categoria, unidade, precoUnitario, margemPercentual, comprimentoBarra } });
  revalidatePath("/materiais");
  revalidatePath("/orcamentos/novo");
}

export async function desativarMaterial(id: number) {
  await prisma.material.update({ where: { id }, data: { ativo: false } });
  revalidatePath("/materiais");
  revalidatePath("/orcamentos/novo");
}

export async function criarTipoEsquadria(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "JANELA_CORRER");
  const numFolhas = Number(formData.get("numFolhas") ?? 1);
  const formulaKey = categoria;
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const parametros = String(formData.get("parametros") ?? "{}").trim() || "{}";

  if (!nome || !Number.isInteger(numFolhas) || numFolhas < 1) throw new Error("Informe nome e quantidade válida de folhas/placas.");
  try {
    JSON.parse(parametros);
  } catch {
    throw new Error("Os parâmetros precisam estar em JSON válido.");
  }

  await prisma.tipoEsquadria.create({ data: { nome, categoria, numFolhas, formulaKey, descricao, parametros } });
  revalidatePath("/produtos");
  revalidatePath("/orcamentos/novo");
}

export async function atualizarTipoEsquadria(formData: FormData) {
  const id = Number(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "JANELA_CORRER");
  const numFolhas = Number(formData.get("numFolhas") ?? 1);
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const parametros = String(formData.get("parametros") ?? "{}").trim() || "{}";
  if (!id || !nome || !Number.isInteger(numFolhas) || numFolhas < 1) throw new Error("Dados do produto inválidos.");
  try {
    JSON.parse(parametros);
  } catch {
    throw new Error("Os parâmetros precisam estar em JSON válido.");
  }
  await prisma.tipoEsquadria.update({ where: { id }, data: { nome, categoria, numFolhas, formulaKey: categoria, descricao, parametros } });
  revalidatePath("/produtos");
  revalidatePath("/orcamentos/novo");
}

export async function desativarTipoEsquadria(id: number) {
  await prisma.tipoEsquadria.update({ where: { id }, data: { ativo: false } });
  revalidatePath("/produtos");
  revalidatePath("/orcamentos/novo");
}

export async function excluirOrcamento(id: number) {
  const orcamento = await prisma.orcamento.findUnique({ where: { id } });
  if (!orcamento) return;
  if (orcamento.status !== "RASCUNHO") throw new Error("Só é possível excluir orçamentos em rascunho.");
  await prisma.orcamento.delete({ where: { id } });
  revalidatePath("/orcamentos");
}

export async function obterConfiguracaoEmpresa() {
  const config = await prisma.configuracaoEmpresa.findUnique({ where: { id: 1 } });
  if (config) return config;
  return prisma.configuracaoEmpresa.create({ data: { id: 1, nome: "SULGLASS" } });
}

export async function atualizarConfiguracaoEmpresa(formData: FormData) {
  const nome = String(formData.get("nome") ?? "SULGLASS").trim() || "SULGLASS";
  const cnpj = String(formData.get("cnpj") ?? "").trim() || null;
  const endereco = String(formData.get("endereco") ?? "").trim() || null;
  const telefone = String(formData.get("telefone") ?? "").trim() || null;
  const rodape = String(formData.get("rodape") ?? "").trim() || null;

  await prisma.configuracaoEmpresa.upsert({
    where: { id: 1 },
    update: { nome, cnpj, endereco, telefone, rodape },
    create: { id: 1, nome, cnpj, endereco, telefone, rodape },
  });
  revalidatePath("/configuracoes");
  revalidatePath("/orcamentos/[id]", "page");
}

