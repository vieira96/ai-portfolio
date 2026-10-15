import { HeaderPublico } from "@/components/home/header-publico";
import { Hero } from "@/components/home/sections/hero/hero";
import { Sobre } from "@/components/home/sections/sobre/sobre";
import { ExperienciaTimeline } from "@/components/home/sections/experiencia/experiencia-timeline";
import { HabilidadesChips } from "@/components/home/sections/habilidades/habilidades-chips";
import { ProjetosGrid } from "@/components/home/sections/projetos/projetos-grid";
import { Contato } from "@/components/home/sections/contato/contato";
import { ChatWidget } from "@/components/chat/chat-widget";
import { getPublicProfile } from "@/lib/profile/profile";
import { getSession } from "@/lib/auth/auth";
import { getProjects } from "@/lib/projects/projects";
import { getSkills } from "@/lib/skills/skills";
import { getExperiences } from "@/lib/experiences/experiences";
import { formatExperiencePeriod } from "@/lib/experiences/experiences";
import { notFound } from "next/navigation";
import { skillCategoryLabels } from "@/types/skills/skills.types";

export default async function HomePage() {
  const [profile, projectsPage, skills, experiencesPage, session] =
    await Promise.all([
      getPublicProfile(),
      getProjects(1, 20),
      getSkills(),
      getExperiences(1, 20),
      getSession(),
    ]);

  if (!profile) {
    notFound();
  }

  const groups = groupByCategory(
    skills.map((s) => ({ category: s.category, name: s.name })),
  );

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <HeaderPublico
        name={profile.name}
        contatoHref="#contato"
        isLoggedIn={session !== null}
      />
      <main>
        <Hero
          name={profile.name}
          headline={profile.headline ?? ""}
          githubUrl={profile.githubUrl ?? undefined}
          linkedinUrl={profile.linkedinUrl ?? undefined}
          contatoHref="#contato"
        />
        <Sobre
          bio={profile.bio ?? ""}
          photoUrl={profile.avatarUrl ?? undefined}
          photoAlt={`Foto de ${profile.name}`}
        />
        <ExperienciaTimeline
          items={experiencesPage.data.map((experience) => ({
            id: experience.id,
            company: experience.company,
            position: experience.position,
            period: formatExperiencePeriod(
              experience.startedAt,
              experience.endedAt,
            ),
            description: experience.description,
            technologies: experience.technologies.map((technology) => technology.name),
          }))}
        />
        <HabilidadesChips groups={groups} />
        <ProjetosGrid
          projects={projectsPage.data.map((project) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            technologies: project.technologies.map((tech) => tech.name),
            repositoryUrl: project.repositoryUrl ?? undefined,
            demoUrl: project.demoUrl ?? undefined,
          }))}
        />
        <Contato
          email={profile.email}
          githubUrl={profile.githubUrl ?? undefined}
          linkedinUrl={profile.linkedinUrl ?? undefined}
        />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <p className="font-mono text-xs text-slate-500">
            © {new Date().getFullYear()} {profile.name}
          </p>
        </div>
      </footer>
      <ChatWidget />
    </div>
  );
}

const CATEGORY_ORDER = [
  "BACKEND",
  "FRONTEND",
  "DADOS",
  "DEVOPS",
  "IA",
  "METODOLOGIAS",
  "MENSAGERIA",
  "TESTES",
];

function groupByCategory(
  skills: { category: string; name: string }[],
): { category: string; items: string[] }[] {
  const byCategory = new Map<string, string[]>();
  for (const skill of skills) {
    if (!byCategory.has(skill.category)) {
      byCategory.set(skill.category, []);
    }
    byCategory.get(skill.category)?.push(skill.name);
  }
  return [...byCategory.keys()]
    .sort((a, b) => rankCategory(a) - rankCategory(b))
    .map((category) => ({
      category:
        skillCategoryLabels[category as keyof typeof skillCategoryLabels] ??
        category,
      items: byCategory.get(category) ?? [],
    }));
}

function rankCategory(category: string): number {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
