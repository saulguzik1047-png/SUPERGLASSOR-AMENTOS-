export function codigoSobra(tipo: string, id: number): string {
  const prefixo = tipo === "PERFIL" ? "PF" : "VD";
  return `${prefixo}-${String(id).padStart(4, "0")}`;
}
