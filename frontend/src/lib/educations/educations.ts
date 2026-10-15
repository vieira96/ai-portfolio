import { backendUrl } from '../backend';
import type { EducationsPage } from '@/types/educations/educations.types';

const emptyPage: EducationsPage = { data: [], total: 0, page: 1, totalPages: 0 };

export async function getEducations(
  page = 1,
  size = 2,
  throwOnError = false,
): Promise<EducationsPage> {
  const response = await fetch(
    backendUrl(`/educations?page=${page}&size=${size}`),
    { cache: 'no-store' },
  );

  if (!response.ok) {
    if (throwOnError) {
      throw new Error(`Falha ao carregar formações: ${response.status}`);
    }
    return emptyPage;
  }

  return (await response.json()) as EducationsPage;
}
