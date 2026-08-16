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

export async function excluirCliente(id: number) {
  await prisma.cliente.delete({ where: { id } });
  revalidatePath("/clientes");
}

async function montarPrecosMateriais(): Promise<{ precos: PrecosMateriais; comprimentoBarraM: number; precoM2VidroPorNome: Record<string, number> }> {
  const materiais = await prisma.material.findMany({ where: { ativo: true } });
  const porNome = (nome: string, padrao: number) => materiais.find((m) => m.nome === nome)?.precoUnitario ?? padrao;
  const perfil = materiais.find((m) => m.categoria === "PERFIL");

  const precos: PrecosMateriais = {
    perfilMetro: perfil?.precoUnitario ?? 18.5,
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
    precoM2VidroPorNome[m.nome] = m.precoUnitario;
  }

  return { precos, comprimentoBarraM: perfil?.comprimentoBarra ?? 6, precoM2VidroPorNome };
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
}

export interface CriarOrcamentoInput {
  clienteId: number;
  maoDeObra: number;
  descontoValor: number;
  descontoMotivo?: string;
  observacoes?: string;
  itens: ItemOrcamentoInput[];
}

export async function criarOrcamento(input: CriarOrcamentoInput) {
  if (!input.itens.length) throw new Error("Adicione ao menos um item ao orçamento.");

  const { precos, comprimentoBarraM } = await montarPrecosMateriais();
  const tipos = await prisma.tipoEsquadria.findMany({ where: { id: { in: input.itens.map((i) => i.tipoEsquadriaId) } } });
  const tiposPorId = new Map(tipos.map((t) => [t.id, t]));

  // Sobras de perfil disponíveis em estoque, das mais compridas para as mais curtas
  const sobrasDb = await prisma.estoqueSobra.findMany({ where: { tipo: "PERFIL", disponivel: true }, orderBy: { medida1: "desc" } });
  const sobrasPool = sobrasDb.map((s) => ({ id: s.id, restanteM: s.medida1 / 100 }));

  let subtotalMateriais = 0;
  const itensParaCriar: { tipoEsquadriaId: number; descricao: string | null; largura: number; altura: number; quantidade: number; corPerfil: string; tipoVidro: string; precoM2Vidro: number; calculoJson: string; valorItem: number }[] = [];
  const alertasSobra: string[] = [];
  const novasSobras: { medida1: number }[] = [];

  for (const item of input.itens) {
    const tipo = tiposPorId.get(item.tipoEsquadriaId);
    if (!tipo) throw new Error("Tipo de esquadria inválido.");

    const disponiveisAgora = sobrasPool.filter((s) => s.restanteM > 0).map((s) => s.restanteM);

    const resultado = calcularOrcamentoItem({
      categoria: tipo.categoria,
      numFolhas: tipo.numFolhas,
      larguraCm: item.larguraCm,
      alturaCm: item.alturaCm,
      quantidade: item.quantidade,
      parametrosJson: tipo.parametros,
      precoM2Vidro: item.precoM2Vidro,
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
      calculoJson: JSON.stringify(resultado),
      valorItem: resultado.totalMateriais,
    });

    subtotalMateriais += resultado.totalMateriais;
  }

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
        subtotal,
        total,
        itens: { create: itensParaCriar },
      },
      include: { itens: true, cliente: true },
    });

    // Atualiza/zera sobras usadas
    for (const s of sobrasPool) {
      const original = sobrasDb.find((o) => o.id === s.id)!;
      if (s.restanteM <= 0.01) {
        await tx.estoqueSobra.update({ where: { id: s.id }, data: { disponivel: false, medida1: 0 } });
      } else if (s.restanteM < original.medida1 / 100) {
        await tx.estoqueSobra.update({ where: { id: s.id }, data: { medida1: Number((s.restanteM * 100).toFixed(1)) } });
      }
    }

    // Registra sobras novas geradas por este orçamento
    for (const nova of novasSobras) {
      await tx.estoqueSobra.create({
        data: {
          tipo: "PERFIL",
          descricaoMaterial: "Perfil de alumínio (retalho)",
          medida1: nova.medida1,
          origemOrcamentoId: criado.id,
        },
      });
    }

    return criado;
  });

  revalidatePath("/orcamentos");
  revalidatePath("/estoque");
  return { orcamentoId: orcamento.id, alertasSobra };
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
  const comprimentoBarraRaw = formData.get("comprimentoBarra");
  const comprimentoBarra = comprimentoBarraRaw ? Number(comprimentoBarraRaw) : undefined;
  if (!id || Number.isNaN(precoUnitario) || precoUnitario < 0) throw new Error("Preço inválido.");

  await prisma.material.update({
    where: { id },
    data: { precoUnitario, ...(comprimentoBarra !== undefined ? { comprimentoBarra } : {}) },
  });
  revalidatePath("/materiais");
  revalidatePath("/orcamentos/novo");
}

export async function criarMaterial(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "ACESSORIO");
  const unidade = String(formData.get("unidade") ?? "PECA");
  const precoUnitario = Number(formData.get("precoUnitario"));
  const comprimentoBarraRaw = formData.get("comprimentoBarra");
  const comprimentoBarra = comprimentoBarraRaw ? Number(comprimentoBarraRaw) : null;
  if (!nome || Number.isNaN(precoUnitario) || precoUnitario < 0) throw new Error("Preencha nome e preço válido.");

  await prisma.material.create({ data: { nome, categoria, unidade, precoUnitario, comprimentoBarra } });
  revalidatePath("/materiais");
  revalidatePath("/orcamentos/novo");
}

export async function desativarMaterial(id: number) {
  await prisma.material.update({ where: { id }, data: { ativo: false } });
  revalidatePath("/materiais");
  revalidatePath("/orcamentos/novo");
}

export async function excluirOrcamento(id: number) {
  const orcamento = await prisma.orcamento.findUnique({ where: { id } });
  if (!orcamento) return;
  if (orcamento.status !== "RASCUNHO") throw new Error("Só é possível excluir orçamentos em rascunho.");
  await prisma.orcamento.delete({ where: { id } });
  revalidatePath("/orcamentos");
}
