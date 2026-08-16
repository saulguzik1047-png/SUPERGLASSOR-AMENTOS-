-- CreateTable
CREATE TABLE "Cliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "telefone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Material" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "comprimentoBarra" REAL,
    "precoUnitario" REAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "TipoEsquadria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "numFolhas" INTEGER NOT NULL,
    "formulaKey" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Orcamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "maoDeObra" REAL NOT NULL DEFAULT 0,
    "descontoValor" REAL NOT NULL DEFAULT 0,
    "descontoMotivo" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "subtotal" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Orcamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemOrcamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orcamentoId" INTEGER NOT NULL,
    "tipoEsquadriaId" INTEGER NOT NULL,
    "descricao" TEXT,
    "largura" REAL NOT NULL,
    "altura" REAL NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "corPerfil" TEXT NOT NULL DEFAULT 'Branco',
    "tipoVidro" TEXT NOT NULL DEFAULT 'Temperado Incolor',
    "precoM2Vidro" REAL NOT NULL,
    "usarSobraEstoqueId" INTEGER,
    "calculoJson" TEXT NOT NULL,
    "valorItem" REAL NOT NULL,
    CONSTRAINT "ItemOrcamento_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemOrcamento_tipoEsquadriaId_fkey" FOREIGN KEY ("tipoEsquadriaId") REFERENCES "TipoEsquadria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstoqueSobra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "descricaoMaterial" TEXT NOT NULL,
    "medida1" REAL NOT NULL,
    "medida2" REAL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "origemOrcamentoId" INTEGER,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Orcamento_numero_key" ON "Orcamento"("numero");
