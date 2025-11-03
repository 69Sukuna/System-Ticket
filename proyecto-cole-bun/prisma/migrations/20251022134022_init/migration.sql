-- CreateTable
CREATE TABLE "Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "age" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");
