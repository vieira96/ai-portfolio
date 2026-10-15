import type { Skill } from '../skills/skills.types';

export interface Project {
  id: string;
  name: string;
  description: string;
  repositoryUrl: string | null;
  demoUrl: string | null;
  technologies: Skill[];
  createdAt: string;
  updatedAt: string;
}
