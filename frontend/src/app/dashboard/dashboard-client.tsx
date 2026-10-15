'use client';

import { useState } from 'react';
import { SkillsSection } from '@/components/skills/sections/skills-section';
import { ProjectsSection } from '@/components/projects/sections/projects-section';
import { ExperiencesSection } from '@/components/experiences/sections/experiences-section';
import { EducationsSection } from '@/components/educations/sections/educations-section';
import { ProfileForm } from '@/components/users/forms/profile-form';
import type { Skill } from '@/types/skills/skills.types';
import type { Project } from '@/types/projects/projects.types';
import type { ExperiencesPage } from '@/types/experiences/experiences.types';
import type { EducationsPage } from '@/types/educations/educations.types';
import type { AuthenticatedUserProfile } from '@/types/users/users.types';

interface DashboardClientProps {
  initialSkills: Skill[];
  initialProjects: { data: Project[]; total: number; page: number; totalPages: number };
  initialExperiences: ExperiencesPage;
  initialEducations: EducationsPage;
  session: AuthenticatedUserProfile | null;
}

export function DashboardClient({
  initialSkills,
  initialProjects,
  initialExperiences,
  initialEducations,
  session,
}: DashboardClientProps) {
  const [skills, setSkillsState] = useState<Skill[]>(initialSkills);

  function addSkills(newSkills: Skill[]) {
    setSkillsState((current) => {
      const existingIds = new Set(current.map((skill) => skill.id));
      const uniqueNew = newSkills.filter((skill) => !existingIds.has(skill.id));
      return [...current, ...uniqueNew];
    });
  }

  function setSkills(next: Skill[] | ((current: Skill[]) => Skill[])) {
    setSkillsState(next);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pb-8 pt-24">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-white">
        Perfil
      </h1>
      <ProfileForm initial={session!} />
      <SkillsSection
        skills={skills}
        onAddSkills={addSkills}
        onSetSkills={setSkills}
      />
      <ProjectsSection
        initialPage={initialProjects}
        skills={skills}
        onSkillsCreated={addSkills}
      />
      <ExperiencesSection
        initialPage={initialExperiences}
        skills={skills}
        onSkillsCreated={addSkills}
      />
      <EducationsSection initialPage={initialEducations} />
    </main>
  );
}
