import { backendUrl } from '../backend';
import type { ExperiencesPage } from '@/types/experiences/experiences.types';

const emptyPage: ExperiencesPage = { data: [], total: 0, page: 1, totalPages: 0 };

export async function getExperiences(
  page = 1,
  size = 2,
  throwOnError = false,
): Promise<ExperiencesPage> {
  const response = await fetch(
    backendUrl(`/experiences?page=${page}&size=${size}`),
    { cache: 'no-store' },
  );

  if (!response.ok) {
    if (throwOnError) {
      throw new Error(`Falha ao carregar experiências: ${response.status}`);
    }
    return emptyPage;
  }

  return (await response.json()) as ExperiencesPage;
}

const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export function formatExperiencePeriod(
  startedAt: string,
  endedAt: string | null,
): string {
  const start = new Date(startedAt);
  const startLabel = `${MONTHS[start.getUTCMonth()]}/${start.getUTCFullYear()}`;
  if (!endedAt) {
    return `${startLabel} – atual`;
  }
  const end = new Date(endedAt);
  return `${startLabel} – ${MONTHS[end.getUTCMonth()]}/${end.getUTCFullYear()}`;
}
