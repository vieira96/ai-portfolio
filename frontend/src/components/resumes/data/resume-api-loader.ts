import { getSession } from '@/lib/auth/auth';
import { getEducations } from '@/lib/educations/educations';
import { getExperiences } from '@/lib/experiences/experiences';
import { getProjects } from '@/lib/projects/projects';
import { getSkills } from '@/lib/skills/skills';
import type { Education } from '@/types/educations/educations.types';
import type { Experience } from '@/types/experiences/experiences.types';
import type { Project } from '@/types/projects/projects.types';
import { mapApiDataToResumeData } from './resume-mapper';

const PAGE_SIZE = 20;

interface Paginated<T> {
  data: T[];
  totalPages: number;
}

type PageLoader<T> = (
  page: number,
  size: number,
  throwOnError: boolean,
) => Promise<Paginated<T>>;

async function loadAllPages<T>(loadPage: PageLoader<T>): Promise<T[]> {
  const firstPage = await loadPage(1, PAGE_SIZE, true);

  if (firstPage.totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      loadPage(index + 2, PAGE_SIZE, true),
    ),
  );

  return [
    ...firstPage.data,
    ...remainingPages.flatMap((page) => page.data),
  ];
}

export async function loadResumeInitialData() {
  const [profile, skills, experiences, projects, educations] = await Promise.all([
    getSession(),
    getSkills(true),
    loadAllPages<Experience>(getExperiences),
    loadAllPages<Project>(getProjects),
    loadAllPages<Education>(getEducations),
  ]);

  if (!profile) {
    throw new Error('Não foi possível carregar o perfil autenticado.');
  }

  return mapApiDataToResumeData({
    profile,
    skills,
    experiences,
    projects,
    educations,
  });
}
