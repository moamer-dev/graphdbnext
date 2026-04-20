/*
  Warnings:

  - You are about to drop the column `authorId` on the `DataSource` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Model` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `SavedQuery` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Workflow` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `SavedQuery` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Model" DROP CONSTRAINT "Model_userId_fkey";

-- DropForeignKey
ALTER TABLE "SavedQuery" DROP CONSTRAINT "SavedQuery_userId_fkey";

-- DropForeignKey
ALTER TABLE "Workflow" DROP CONSTRAINT "Workflow_userId_fkey";

-- DropIndex
DROP INDEX "SavedQuery_userId_idx";

-- AlterTable
ALTER TABLE "DataSource" DROP COLUMN "authorId",
ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "Model" DROP COLUMN "userId",
ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "SavedQuery" DROP COLUMN "userId",
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Workflow" DROP COLUMN "userId",
ADD COLUMN     "creatorId" TEXT;

-- CreateIndex
CREATE INDEX "SavedQuery_creatorId_idx" ON "SavedQuery"("creatorId");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedQuery" ADD CONSTRAINT "SavedQuery_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
