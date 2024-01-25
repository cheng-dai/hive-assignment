/*
  Warnings:

  - Changed the type of `timestamp` on the `Data` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Data" DROP COLUMN "timestamp",
ADD COLUMN     "timestamp" INTEGER NOT NULL;
