import { backendUrl } from '../backend';
import type { Skill } from '@/types/skills/skills.types';

export async function getSkills(throwOnError = false): Promise<Skill[]> {
  const response = await fetch(backendUrl('/technologies'), {
    cache: 'no-store',
  });

  if (!response.ok) {
    if (throwOnError) {
      throw new Error(`Falha ao carregar tecnologias: ${response.status}`);
    }
    return [];
  }

  return (await response.json()) as Skill[];
}
