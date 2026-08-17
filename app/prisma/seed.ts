import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const materiais = [
    { nome: "Linha convencional", categoria: "PERFIL", unidade: "BARRA", comprimentoBarra: 6, precoUnitario: 18.5 },
    { nome: "Linha Suprema", categoria: "PERFIL", unidade: "BARRA", comprimentoBarra: 6, precoUnitario: 32.5 },
    { nome: "Linha Gold", categoria: "PERFIL", unidade: "BARRA", comprimentoBarra: 6, precoUnitario: 42.5 },
    { nome: "Perfil T para emenda de pergolado", categoria: "PERFIL_T", unidade: "BARRA", comprimentoBarra: 6, precoUnitario: 24 },
    { nome: "Vidro temperado incolor 8mm (m²)", categoria: "VIDRO", unidade: "M2", precoUnitario: 210 },
    { nome: "Vidro temperado incolor 10mm (m²)", categoria: "VIDRO", unidade: "M2", precoUnitario: 260 },
    { nome: "Rodízio simples", categoria: "ACESSORIO", unidade: "PECA", precoUnitario: 6.5 },
    { nome: "Dobradiça de aço", categoria: "ACESSORIO", unidade: "PECA", precoUnitario: 9 },
    { nome: "Fecho/trava", categoria: "ACESSORIO", unidade: "PECA", precoUnitario: 14 },
    { nome: "Puxador", categoria: "ACESSORIO", unidade: "PECA", precoUnitario: 8 },
    { nome: "Cantoneira", categoria: "ACESSORIO", unidade: "PECA", precoUnitario: 1.2 },
    { nome: "Jogo de parafusos", categoria: "ACESSORIO", unidade: "PECA", precoUnitario: 2.5 },
    { nome: "Tubo de silicone", categoria: "ACESSORIO", unidade: "PECA", precoUnitario: 18 },
    { nome: "Fita de vedação/escova (metro)", categoria: "ACESSORIO", unidade: "ROLO", precoUnitario: 2.2 },
  ];

  for (const m of materiais) {
    const existente = await prisma.material.findFirst({ where: { nome: m.nome } });
    if (!existente) await prisma.material.create({ data: m });
  }

  const tipos = [
    { nome: "Janela de Correr 2 Folhas", categoria: "JANELA_CORRER", numFolhas: 2, formulaKey: "JANELA_CORRER" },
    { nome: "Janela de Correr 4 Folhas", categoria: "JANELA_CORRER", numFolhas: 4, formulaKey: "JANELA_CORRER" },
    { nome: "Janela Basculante/Vitrô", categoria: "VITRO_BASCULANTE", numFolhas: 1, formulaKey: "VITRO_BASCULANTE" },
    { nome: "Janela Fixa", categoria: "FIXO", numFolhas: 1, formulaKey: "FIXO" },
    { nome: "Porta de Correr 2 Folhas", categoria: "PORTA_CORRER", numFolhas: 2, formulaKey: "PORTA_CORRER" },
    { nome: "Porta de Correr 4 Folhas", categoria: "PORTA_CORRER", numFolhas: 4, formulaKey: "PORTA_CORRER" },
    { nome: "Porta de Giro 1 Folha", categoria: "PORTA_GIRO", numFolhas: 1, formulaKey: "PORTA_GIRO" },
    { nome: "Porta de Giro 2 Folhas", categoria: "PORTA_GIRO", numFolhas: 2, formulaKey: "PORTA_GIRO" },
    { nome: "Cobertura de vidro para pergolado — 2 placas", categoria: "COBERTURA_PERGOLADO", numFolhas: 2, formulaKey: "COBERTURA_PERGOLADO" },
    { nome: "Cobertura de vidro para pergolado — 3 placas", categoria: "COBERTURA_PERGOLADO", numFolhas: 3, formulaKey: "COBERTURA_PERGOLADO" },
    { nome: "Cobertura de vidro para pergolado — 4 placas", categoria: "COBERTURA_PERGOLADO", numFolhas: 4, formulaKey: "COBERTURA_PERGOLADO" },
  ];

  for (const t of tipos) {
    const existente = await prisma.tipoEsquadria.findFirst({ where: { nome: t.nome } });
    if (!existente) await prisma.tipoEsquadria.create({ data: t });
  }

  const cores = [{ nome: "Branco", percentualAdicional: 0 }];
  for (const c of cores) {
    const existente = await prisma.cor.findFirst({ where: { nome: c.nome } });
    if (!existente) await prisma.cor.create({ data: c });
  }

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
