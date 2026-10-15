import { backendUrl } from '../backend';
import type { Project } from '@/types/projects/projects.types';

export interface ProjectsPage {
  data: Project[];
  total: number;
  page: number;
  totalPages: number;
}

const emptyPage: ProjectsPage = { data: [], total: 0, page: 1, totalPages: 0 };

export async function getProjects(
  page = 1,
  size = 4,
  throwOnError = false,
): Promise<ProjectsPage> {
  const response = await fetch(
    backendUrl(`/projects?page=${page}&size=${size}`),
    { cache: 'no-store' },
  );

  if (!response.ok) {
    if (throwOnError) {
      throw new Error(`Falha ao carregar projetos: ${response.status}`);
    }
    return emptyPage;
  }

  return (await response.json()) as ProjectsPage;
}
