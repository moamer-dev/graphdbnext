/*
  Warnings:

  - You are about to drop the `QueryHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "QueryHistory" DROP CONSTRAINT "QueryHistory_userId_fkey";

-- DropTable
DROP TABLE "QueryHistory";
