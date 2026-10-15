-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_technologies" (
    "experienceId" UUID NOT NULL,
    "technologyId" UUID NOT NULL,

    CONSTRAINT "experience_technologies_pkey" PRIMARY KEY ("experienceId","technologyId")
);

-- AddForeignKey
ALTER TABLE "experience_technologies" ADD CONSTRAINT "experience_technologies_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_technologies" ADD CONSTRAINT "experience_technologies_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
