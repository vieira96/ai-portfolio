import type { Skill } from '../skills/skills.types';

export interface Experience {
  id: string;
  company: string;
  position: string;
  description: string;
  startedAt: string;
  endedAt: string | null;
  technologies: Skill[];
  createdAt: string;
  updatedAt: string;
}

export interface ExperiencesPage {
  data: Experience[];
  total: number;
  page: number;
  totalPages: number;
}
