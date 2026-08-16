-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TipoEsquadria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "numFolhas" INTEGER NOT NULL,
    "formulaKey" TEXT NOT NULL,
    "parametros" TEXT NOT NULL DEFAULT '{}',
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_TipoEsquadria" ("ativo", "categoria", "descricao", "formulaKey", "id", "nome", "numFolhas") SELECT "ativo", "categoria", "descricao", "formulaKey", "id", "nome", "numFolhas" FROM "TipoEsquadria";
DROP TABLE "TipoEsquadria";
ALTER TABLE "new_TipoEsquadria" RENAME TO "TipoEsquadria";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
