// Utilitários de formatação numérica no padrão brasileiro (vírgula decimal).

/** Converte um texto digitado (ex.: "120,5" ou "120.5") para número. Vazio/ inválido vira 0. */
export function paraNumeroDecimal(texto: string): number {
  if (!texto) return 0;
  const normalizado = texto.trim().replace(/\./g, "").replace(",", ".");
  const n = parseFloat(normalizado);
  return Number.isFinite(n) ? n : 0;
}

/** Sanitiza a digitação de um campo decimal (medida), permitindo apenas dígitos e uma vírgula. */
export function sanitizarDecimal(valor: string): string {
  let limpo = valor.replace(/[^0-9,]/g, "");
  const partes = limpo.split(",");
  if (partes.length > 2) limpo = partes[0] + "," + partes.slice(1).join("");
  return limpo;
}

/** Formata um número como valor monetário BR, sem o prefixo "R$" (ex.: 1234.5 -> "1.234,50"). */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Formata um número como valor monetário BR com o prefixo "R$" (ex.: 1234.5 -> "R$ 1.234,50"). */
export function formatarMoedaComPrefixo(valor: number): string {
  return `R$ ${formatarMoeda(valor)}`;
}

/** Converte a digitação bruta de um campo de moeda (máscara por centavos) para número. */
export function digitosParaValorMoeda(textoDigitado: string): number {
  const digitos = textoDigitado.replace(/\D/g, "");
  if (!digitos) return 0;
  return parseInt(digitos, 10) / 100;
}
