-- CreateEnum
CREATE TYPE "EducationDegree" AS ENUM ('GRADUACAO', 'POS', 'TECNICO', 'CURSO_LIVRE', 'CERTIFICACAO');

-- CreateTable
CREATE TABLE "educations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "institution" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "degree" "EducationDegree",
    "description" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "expectedEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);
