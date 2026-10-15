/*
  Warnings:

  - The `category` column on the `technologies` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TechnologyCategory" AS ENUM ('BACKEND', 'FRONTEND', 'DADOS', 'DEVOPS', 'IA');

-- AlterTable
ALTER TABLE "technologies" DROP COLUMN "category",
ADD COLUMN     "category" "TechnologyCategory";
