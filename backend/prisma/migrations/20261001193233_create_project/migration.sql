/*
  Warnings:

  - You are about to drop the `project_images` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "project_images" DROP CONSTRAINT "project_images_projectId_fkey";

-- DropTable
DROP TABLE "project_images";
