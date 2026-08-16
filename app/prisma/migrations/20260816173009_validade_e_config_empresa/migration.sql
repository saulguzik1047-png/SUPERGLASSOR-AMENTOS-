-- CreateTable
CREATE TABLE "ConfiguracaoEmpresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nome" TEXT NOT NULL DEFAULT 'SULGLASS',
    "cnpj" TEXT,
    "endereco" TEXT,
    "telefone" TEXT,
    "rodape" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Orcamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "maoDeObra" REAL NOT NULL DEFAULT 0,
    "descontoValor" REAL NOT NULL DEFAULT 0,
    "descontoMotivo" TEXT,
    "observacoes" TEXT,
    "validadeDias" INTEGER NOT NULL DEFAULT 15,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "subtotal" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Orcamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Orcamento" ("clienteId", "createdAt", "descontoMotivo", "descontoValor", "id", "maoDeObra", "numero", "observacoes", "status", "subtotal", "total") SELECT "clienteId", "createdAt", "descontoMotivo", "descontoValor", "id", "maoDeObra", "numero", "observacoes", "status", "subtotal", "total" FROM "Orcamento";
DROP TABLE "Orcamento";
ALTER TABLE "new_Orcamento" RENAME TO "Orcamento";
CREATE UNIQUE INDEX "Orcamento_numero_key" ON "Orcamento"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
