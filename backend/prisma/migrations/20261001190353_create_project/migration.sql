-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "repositoryUrl" TEXT,
    "demoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_technologies" (
    "projectId" UUID NOT NULL,
    "technologyId" UUID NOT NULL,

    CONSTRAINT "project_technologies_pkey" PRIMARY KEY ("projectId","technologyId")
);

-- CreateTable
CREATE TABLE "project_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
