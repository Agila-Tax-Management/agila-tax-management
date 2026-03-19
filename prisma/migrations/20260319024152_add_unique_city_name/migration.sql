/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `city` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "city_name_key" ON "city"("name");
