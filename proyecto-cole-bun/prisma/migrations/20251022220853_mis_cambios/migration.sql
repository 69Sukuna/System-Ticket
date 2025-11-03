/*
  Warnings:

  - You are about to drop the `tickets_ventas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `contrasena` on the `administradores` table. All the data in the column will be lost.
  - You are about to drop the column `correo` on the `administradores` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad` on the `eventos` table. All the data in the column will be lost.
  - You are about to drop the column `costo` on the `eventos` table. All the data in the column will be lost.
  - You are about to drop the column `nombreEvento` on the `eventos` table. All the data in the column will be lost.
  - Added the required column `email` to the `administradores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `administradores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `capacidadTotal` to the `eventos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hora` to the `eventos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lugar` to the `eventos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `eventos` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tickets_ventas";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "categorias_tickets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" REAL NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "vendidos" INTEGER NOT NULL DEFAULT 0,
    "maxPorCompra" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "categorias_tickets_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "compras" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigoCompra" TEXT NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "vendedorId" INTEGER,
    "nombreCliente" TEXT NOT NULL,
    "emailCliente" TEXT,
    "telefonoCliente" TEXT,
    "ciCliente" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "total" REAL NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "estadoPago" TEXT NOT NULL DEFAULT 'pagado',
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "compras_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "compras_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "administradores" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigoTicket" TEXT NOT NULL,
    "compraId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "fechaUso" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tickets_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compras" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tickets_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_tickets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_administradores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'vendedor',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_administradores" ("createdAt", "id", "nombre", "rol", "updatedAt", "usuario") SELECT "createdAt", "id", "nombre", "rol", "updatedAt", "usuario" FROM "administradores";
DROP TABLE "administradores";
ALTER TABLE "new_administradores" RENAME TO "administradores";
CREATE UNIQUE INDEX "administradores_email_key" ON "administradores"("email");
CREATE UNIQUE INDEX "administradores_usuario_key" ON "administradores"("usuario");
CREATE TABLE "new_eventos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "imagen" TEXT,
    "fecha" DATETIME NOT NULL,
    "hora" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL DEFAULT 'La Paz',
    "capacidadTotal" INTEGER NOT NULL,
    "ticketsVendidos" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'disponible',
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_eventos" ("createdAt", "descripcion", "fecha", "id", "imagen", "updatedAt") SELECT "createdAt", "descripcion", "fecha", "id", "imagen", "updatedAt" FROM "eventos";
DROP TABLE "eventos";
ALTER TABLE "new_eventos" RENAME TO "eventos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "compras_codigoCompra_key" ON "compras"("codigoCompra");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_codigoTicket_key" ON "tickets"("codigoTicket");
