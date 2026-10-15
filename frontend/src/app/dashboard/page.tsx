import { getSession } from '@/lib/auth/auth';
import { getSkills } from '@/lib/skills/skills';
import { getProjects } from '@/lib/projects/projects';
import { getExperiences } from '@/lib/experiences/experiences';
import { getEducations } from '@/lib/educations/educations';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  // Layout already guarantees a session (redirects otherwise).
  const session = await getSession();
  const skills = await getSkills();
  const projects = await getProjects(1, 4);
  const experiences = await getExperiences(1, 2);
  const educations = await getEducations(1, 2);

  return (
    <>
      <DashboardHeader />
      <DashboardClient
        initialSkills={skills}
        initialProjects={projects}
        initialExperiences={experiences}
        initialEducations={educations}
        session={session}
      />
    </>
  );
}
