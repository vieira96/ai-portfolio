import type { ComponentType } from 'react';
import type { EducationDegree } from '../educations/educations.types';
import type { SkillCategory } from '../skills/skills.types';

export type ResumeTemplateId = 'classic' | 'modern' | 'minimal';

export type ResumeSectionId =
  | 'summary'
  | 'experiences'
  | 'projects'
  | 'education'
  | 'skills';

export interface ResumePersonalData {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
}

export interface ResumeSkill {
  localId: string;
  sourceId?: string;
  name: string;
  category: SkillCategory;
}

export interface ResumeExperience {
  localId: string;
  sourceId?: string;
  company: string;
  position: string;
  description: string;
  highlights: string[];
  startedAt: string;
  endedAt: string | null;
  technologies: ResumeSkill[];
}

export interface ResumeProject {
  localId: string;
  sourceId?: string;
  name: string;
  description: string;
  repositoryUrl: string;
  demoUrl: string;
  technologies: ResumeSkill[];
}

export interface ResumeEducation {
  localId: string;
  sourceId?: string;
  institution: string;
  course: string;
  degree: EducationDegree | null;
  description: string;
  startedAt: string;
  endedAt: string | null;
  expectedEnd: string | null;
}

export interface ResumeSection {
  id: ResumeSectionId;
  visible: boolean;
  order: number;
}

export interface ResumeData {
  personal: ResumePersonalData;
  experiences: ResumeExperience[];
  projects: ResumeProject[];
  educations: ResumeEducation[];
  skills: ResumeSkill[];
  skillCategoryOrder: SkillCategory[];
  sections: ResumeSection[];
}

export interface ResumeTemplateProps {
  data: ResumeData;
}

export interface ResumeTemplateDefinition {
  id: ResumeTemplateId;
  name: string;
  description: string;
  component: ComponentType<ResumeTemplateProps>;
}
