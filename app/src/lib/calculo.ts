// Motor de cálculo de orçamentos de esquadrias de alumínio e vidro temperado.
// As fórmulas usam parâmetros ajustáveis por tipo de esquadria (ver TipoEsquadria.parametros),
// permitindo afinar descontos/quantidades sem alterar código.

export interface ParametrosTipo {
  /** metros de perfil de marco por m² não se aplica; calculado por perímetro */
  rodiziosPorFolha: number;
  dobradicasPorFolha: number;
  fechosPorEsquadria: number;
  puxadoresPorFolha: number;
  cantoneirasPorFolha: number;
  parafusosJogoPorFolha: number;
  /** cm somados à largura de cada folha (sobreposição no trilho) */
  descontoFolhaLarguraCm: number;
  /** cm subtraídos da altura da folha em relação ao marco (folga de encaixe) */
  descontoFolhaAlturaCm: number;
  /** cm subtraídos (somando os dois lados) da folha para achar a medida do vidro */
  descontoVidroCm: number;
  /** quantas das folhas totais realmente deslizam/abrem (as demais são fixas) */
  folhasMoveis: number;
  tubosSiliconePorEsquadria: number;
}

const PARAMS_PADRAO: Record<string, ParametrosTipo> = {
  JANELA_CORRER: {
    rodiziosPorFolha: 2,
    dobradicasPorFolha: 0,
    fechosPorEsquadria: 1,
    puxadoresPorFolha: 1,
    cantoneirasPorFolha: 4,
    parafusosJogoPorFolha: 1,
    descontoFolhaLarguraCm: 2,
    descontoFolhaAlturaCm: 1,
    descontoVidroCm: 8,
    folhasMoveis: 1, // sobrescrito conforme numFolhas
    tubosSiliconePorEsquadria: 1,
  },
  PORTA_CORRER: {
    rodiziosPorFolha: 2,
    dobradicasPorFolha: 0,
    fechosPorEsquadria: 1,
    puxadoresPorFolha: 1,
    cantoneirasPorFolha: 4,
    parafusosJogoPorFolha: 1,
    descontoFolhaLarguraCm: 2,
    descontoFolhaAlturaCm: 1.5,
    descontoVidroCm: 8,
    folhasMoveis: 1,
    tubosSiliconePorEsquadria: 1,
  },
  PORTA_GIRO: {
    rodiziosPorFolha: 0,
    dobradicasPorFolha: 3,
    fechosPorEsquadria: 1,
    puxadoresPorFolha: 1,
    cantoneirasPorFolha: 4,
    parafusosJogoPorFolha: 1,
    descontoFolhaLarguraCm: 0.5,
    descontoFolhaAlturaCm: 0.5,
    descontoVidroCm: 8,
    folhasMoveis: 999, // todas móveis
    tubosSiliconePorEsquadria: 1,
  },
  FIXO: {
    rodiziosPorFolha: 0,
    dobradicasPorFolha: 0,
    fechosPorEsquadria: 0,
    puxadoresPorFolha: 0,
    cantoneirasPorFolha: 4,
    parafusosJogoPorFolha: 0,
    descontoFolhaLarguraCm: 0,
    descontoFolhaAlturaCm: 0,
    descontoVidroCm: 6,
    folhasMoveis: 0,
    tubosSiliconePorEsquadria: 1,
  },
  VITRO_BASCULANTE: {
    rodiziosPorFolha: 0,
    dobradicasPorFolha: 2,
    fechosPorEsquadria: 1,
    puxadoresPorFolha: 0,
    cantoneirasPorFolha: 4,
    parafusosJogoPorFolha: 1,
    descontoFolhaLarguraCm: 1,
    descontoFolhaAlturaCm: 1,
    descontoVidroCm: 8,
    folhasMoveis: 999,
    tubosSiliconePorEsquadria: 1,
  },
};

export function parametrosPadrao(categoria: string): ParametrosTipo {
  return PARAMS_PADRAO[categoria] ?? PARAMS_PADRAO.JANELA_CORRER;
}

export function mesclarParametros(categoria: string, parametrosJson: string | null | undefined): ParametrosTipo {
  const base = parametrosPadrao(categoria);
  if (!parametrosJson) return base;
  try {
    const custom = JSON.parse(parametrosJson);
    return { ...base, ...custom };
  } catch {
    return base;
  }
}

export interface PrecosMateriais {
  perfilMetro: number; // preço médio do metro de perfil (marco+folha)
  rodizio: number;
  dobradica: number;
  fechoTrava: number;
  puxador: number;
  cantoneira: number;
  parafusosJogo: number;
  tuboSilicone: number;
  fitaEscovaMetro: number;
}

export interface CalculoInput {
  categoria: string;
  numFolhas: number;
  larguraCm: number;
  alturaCm: number;
  quantidade: number;
  parametrosJson?: string | null;
  precoM2Vidro: number;
  precos: PrecosMateriais;
  comprimentoBarraM?: number; // padrão 6m
  sobrasPerfilDisponiveisM?: number[]; // comprimentos (m) de retalhos de perfil em estoque, do mais comprido pro mais curto
}

export interface ItemCalculado {
  descricao: string;
  quantidade: number;
  unidade: string;
  precoUnitario: number;
  precoTotal: number;
}

export interface SobraGerada {
  tipo: "PERFIL" | "VIDRO";
  descricaoMaterial: string;
  medida1Cm: number;
  medida2Cm?: number;
}

export interface ResultadoCalculo {
  itens: ItemCalculado[];
  sobras: SobraGerada[];
  vidroM2Total: number;
  metrosPerfilTotal: number;
  barrasPerfilNecessarias: number;
  metrosPerfilReaproveitadosEstoque: number;
  totalMateriais: number;
}

export function calcularOrcamentoItem(input: CalculoInput): ResultadoCalculo {
  const p = mesclarParametros(input.categoria, input.parametrosJson);
  const comprimentoBarraM = input.comprimentoBarraM ?? 6;
  const folhasMoveis = Math.min(p.folhasMoveis, input.numFolhas);

  const larguraFolhaCm = input.numFolhas > 0
    ? input.larguraCm / input.numFolhas + p.descontoFolhaLarguraCm
    : input.larguraCm;
  const alturaFolhaCm = input.alturaCm - p.descontoFolhaAlturaCm;

  const perimetroMarcoM = (2 * (input.larguraCm + input.alturaCm)) / 100;
  const perimetroFolhaUnitM = (2 * (larguraFolhaCm + alturaFolhaCm)) / 100;
  const perimetroFolhasTotalM = perimetroFolhaUnitM * input.numFolhas;

  const metrosPerfilUnidade = perimetroMarcoM + perimetroFolhasTotalM;
  const metrosPerfilTotal = metrosPerfilUnidade * input.quantidade;

  // Tenta reaproveitar sobras de estoque antes de calcular barras novas
  const sobrasDisponiveis = [...(input.sobrasPerfilDisponiveisM ?? [])].sort((a, b) => b - a);
  let metrosRestantes = metrosPerfilTotal;
  let metrosReaproveitados = 0;
  for (let i = 0; i < sobrasDisponiveis.length && metrosRestantes > 0; i++) {
    const uso = Math.min(sobrasDisponiveis[i], metrosRestantes);
    metrosReaproveitados += uso;
    metrosRestantes -= uso;
  }

  const barrasNecessarias = Math.ceil(metrosRestantes / comprimentoBarraM);
  const sobraNovaM = barrasNecessarias * comprimentoBarraM - metrosRestantes;

  const larguraVidroCm = larguraFolhaCm - p.descontoVidroCm;
  const alturaVidroCm = alturaFolhaCm - p.descontoVidroCm;
  const m2VidroUnidade = Math.max((larguraVidroCm / 100) * (alturaVidroCm / 100), 0) * input.numFolhas;
  const vidroM2Total = m2VidroUnidade * input.quantidade;

  const rodizios = p.rodiziosPorFolha * folhasMoveis * input.quantidade;
  const dobradicas = p.dobradicasPorFolha * folhasMoveis * input.quantidade;
  const fechos = p.fechosPorEsquadria * input.quantidade;
  const puxadores = p.puxadoresPorFolha * folhasMoveis * input.quantidade;
  const cantoneiras = p.cantoneirasPorFolha * input.numFolhas * input.quantidade;
  const parafusos = p.parafusosJogoPorFolha * input.numFolhas * input.quantidade;
  const tubosSilicone = p.tubosSiliconePorEsquadria * input.quantidade;
  const fitaEscovaM = perimetroFolhasTotalM * input.quantidade;

  const itens: ItemCalculado[] = [];

  itens.push({
    descricao: `Perfil de alumínio (barras de ${comprimentoBarraM}m)`,
    quantidade: barrasNecessarias,
    unidade: "barra",
    precoUnitario: input.precos.perfilMetro * comprimentoBarraM,
    precoTotal: barrasNecessarias * input.precos.perfilMetro * comprimentoBarraM,
  });

  itens.push({
    descricao: "Vidro temperado",
    quantidade: Number(vidroM2Total.toFixed(3)),
    unidade: "m²",
    precoUnitario: input.precoM2Vidro,
    precoTotal: vidroM2Total * input.precoM2Vidro,
  });

  if (rodizios > 0) {
    itens.push({ descricao: "Rodízios", quantidade: rodizios, unidade: "un", precoUnitario: input.precos.rodizio, precoTotal: rodizios * input.precos.rodizio });
  }
  if (dobradicas > 0) {
    itens.push({ descricao: "Dobradiças", quantidade: dobradicas, unidade: "un", precoUnitario: input.precos.dobradica, precoTotal: dobradicas * input.precos.dobradica });
  }
  if (fechos > 0) {
    itens.push({ descricao: "Fecho/trava", quantidade: fechos, unidade: "un", precoUnitario: input.precos.fechoTrava, precoTotal: fechos * input.precos.fechoTrava });
  }
  if (puxadores > 0) {
    itens.push({ descricao: "Puxador", quantidade: puxadores, unidade: "un", precoUnitario: input.precos.puxador, precoTotal: puxadores * input.precos.puxador });
  }
  if (cantoneiras > 0) {
    itens.push({ descricao: "Cantoneiras", quantidade: cantoneiras, unidade: "un", precoUnitario: input.precos.cantoneira, precoTotal: cantoneiras * input.precos.cantoneira });
  }
  if (parafusos > 0) {
    itens.push({ descricao: "Jogo de parafusos", quantidade: parafusos, unidade: "jogo", precoUnitario: input.precos.parafusosJogo, precoTotal: parafusos * input.precos.parafusosJogo });
  }
  if (tubosSilicone > 0) {
    itens.push({ descricao: "Tubo de silicone", quantidade: tubosSilicone, unidade: "un", precoUnitario: input.precos.tuboSilicone, precoTotal: tubosSilicone * input.precos.tuboSilicone });
  }
  itens.push({
    descricao: "Fita de vedação/escova",
    quantidade: Number(fitaEscovaM.toFixed(2)),
    unidade: "m",
    precoUnitario: input.precos.fitaEscovaMetro,
    precoTotal: fitaEscovaM * input.precos.fitaEscovaMetro,
  });

  const sobras: SobraGerada[] = [];
  if (sobraNovaM * 100 >= 30) {
    // só vale a pena guardar retalhos de perfil com 30cm ou mais
    sobras.push({ tipo: "PERFIL", descricaoMaterial: "Perfil de alumínio (retalho)", medida1Cm: Number((sobraNovaM * 100).toFixed(1)) });
  }

  const totalMateriais = itens.reduce((acc, i) => acc + i.precoTotal, 0);

  return {
    itens,
    sobras,
    vidroM2Total,
    metrosPerfilTotal,
    barrasPerfilNecessarias: barrasNecessarias,
    metrosPerfilReaproveitadosEstoque: metrosReaproveitados,
    totalMateriais,
  };
}
