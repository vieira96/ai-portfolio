import { describe, expect, it } from 'vitest';
import type { Education } from '@/types/educations/educations.types';
import type { Experience } from '@/types/experiences/experiences.types';
import type { Project } from '@/types/projects/projects.types';
import type { Skill } from '@/types/skills/skills.types';
import type { AuthenticatedUserProfile } from '@/types/users/users.types';
import { resumeFixture } from './resume-fixture';
import { createResumeDraft, mapApiDataToResumeData } from './resume-mapper';

describe('createResumeDraft', () => {
  it('creates an independent snapshot of the source data', () => {
    const draft = createResumeDraft(resumeFixture);

    draft.personal.name = 'Nome editado';
    draft.experiences[0].company = 'Empresa editada';

    expect(resumeFixture.personal.name).toBe('Samuel Vieira');
    expect(resumeFixture.experiences[0].company).toBe('Levante Lab');
  });

  it('maps API data into the editable resume contract', () => {
    const profile = {
      id: 'user-1',
      name: 'Pessoa Teste',
      email: 'pessoa@example.com',
      headline: 'Desenvolvedor Full Stack',
      bio: 'Resumo vindo da API',
      location: 'Laje do Muriaé, RJ',
      githubUrl: 'https://github.com/pessoa',
      linkedinUrl: null,
      portfolioUrl: null,
      avatarUrl: null,
      phone: '+55 21 99999-9999',
    } satisfies AuthenticatedUserProfile;
    const skill = {
      id: 'skill-1',
      name: 'Node.js',
      category: 'BACKEND',
    } satisfies Skill;
    const experience = {
      id: 'experience-1',
      company: 'Empresa',
      position: 'Desenvolvedor',
      description: 'Criação de APIs REST.',
      startedAt: '2024-01-01',
      endedAt: null,
      technologies: [skill],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    } satisfies Experience;
    const project = {
      id: 'project-1',
      name: 'Projeto',
      description: 'Projeto vindo da API.',
      repositoryUrl: null,
      demoUrl: null,
      technologies: [skill],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    } satisfies Project;
    const education = {
      id: 'education-1',
      institution: 'Instituição',
      course: 'Curso',
      degree: null,
      description: null,
      startedAt: '2024-01-01',
      endedAt: null,
      expectedEnd: '2027-01-01',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    } satisfies Education;

    const data = mapApiDataToResumeData({
      profile,
      skills: [skill],
      experiences: [experience],
      projects: [project],
      educations: [education],
    });

    expect(data.personal).toMatchObject({
      name: 'Pessoa Teste',
      summary: 'Resumo vindo da API',
      phone: '+55 21 99999-9999',
      linkedinUrl: '',
    });

    const withoutPhone = mapApiDataToResumeData({
      profile: { ...profile, phone: null },
      skills: [skill],
      experiences: [experience],
      projects: [project],
      educations: [education],
    });
    expect(withoutPhone.personal.phone).toBe('');
    expect(data.skills[0]).toMatchObject({
      localId: 'skill-skill-1',
      sourceId: 'skill-1',
      name: 'Node.js',
    });
    expect(data.experiences[0]).toMatchObject({
      localId: 'experience-experience-1',
      highlights: ['Criação de APIs REST.'],
    });
    expect(data.projects[0].repositoryUrl).toBe('');
    expect(data.educations[0].description).toBe('');
  });
});
