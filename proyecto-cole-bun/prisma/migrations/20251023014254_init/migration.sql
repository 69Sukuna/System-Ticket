/*
  Warnings:

  - You are about to drop the `administradores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categorias_tickets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `compras` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `eventos` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `tickets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoriaId` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `codigoTicket` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `compraId` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `fechaUso` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `usado` on the `tickets` table. All the data in the column will be lost.
  - Added the required column `date` to the `tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventTitle` to the `tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchasedAt` to the `tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "administradores_usuario_key";

-- DropIndex
DROP INDEX "administradores_email_key";

-- DropIndex
DROP INDEX "compras_codigoCompra_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "administradores";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "categorias_tickets";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "compras";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "eventos";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ticketTypes" JSONB NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventTitle" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchasedAt" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tickets" ("createdAt", "id") SELECT "createdAt", "id" FROM "tickets";
DROP TABLE "tickets";
ALTER TABLE "new_tickets" RENAME TO "tickets";
CREATE INDEX "tickets_userId_idx" ON "tickets"("userId");
CREATE INDEX "tickets_eventId_idx" ON "tickets"("eventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
