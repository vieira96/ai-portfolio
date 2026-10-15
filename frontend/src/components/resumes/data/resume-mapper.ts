import type { ResumeData } from "@/types/resumes/resume.types";
import type { Education } from "@/types/educations/educations.types";
import type { Experience } from "@/types/experiences/experiences.types";
import type { Project } from "@/types/projects/projects.types";
import type { Skill } from "@/types/skills/skills.types";
import type { AuthenticatedUserProfile } from "@/types/users/users.types";
import { defaultSkillCategoryOrder } from "../skills/resume-skill-groups";

export function createResumeDraft(data: ResumeData): ResumeData {
  const draft = JSON.parse(JSON.stringify(data)) as Partial<ResumeData>;

  return {
    ...draft,
    skillCategoryOrder: draft.skillCategoryOrder ?? [
      ...defaultSkillCategoryOrder,
    ],
  } as ResumeData;
}

function mapSkill(skill: Skill, prefix: string) {
  return {
    localId: `${prefix}-${skill.id}`,
    sourceId: skill.id,
    name: skill.name,
    category: skill.category,
  };
}

function mapExperience(experience: Experience) {
  return {
    localId: `experience-${experience.id}`,
    sourceId: experience.id,
    company: experience.company,
    position: experience.position,
    description: experience.description,
    highlights: experience.description ? [experience.description] : [],
    startedAt: experience.startedAt,
    endedAt: experience.endedAt,
    technologies: experience.technologies.map((skill) =>
      mapSkill(skill, `experience-${experience.id}`),
    ),
  };
}

function mapProject(project: Project) {
  return {
    localId: `project-${project.id}`,
    sourceId: project.id,
    name: project.name,
    description: project.description,
    repositoryUrl: project.repositoryUrl ?? "",
    demoUrl: project.demoUrl ?? "",
    technologies: project.technologies.map((skill) =>
      mapSkill(skill, `project-${project.id}`),
    ),
  };
}

function mapEducation(education: Education) {
  return {
    localId: `education-${education.id}`,
    sourceId: education.id,
    institution: education.institution,
    course: education.course,
    degree: education.degree,
    description: education.description ?? "",
    startedAt: education.startedAt,
    endedAt: education.endedAt,
    expectedEnd: education.expectedEnd,
  };
}

export function mapApiDataToResumeData({
  profile,
  skills,
  experiences,
  projects,
  educations,
}: {
  profile: Omit<AuthenticatedUserProfile, "phone"> & {
    phone?: string | null;
  };
  skills: Skill[];
  experiences: Experience[];
  projects: Project[];
  educations: Education[];
}): ResumeData {
  return {
    personal: {
      name: profile.name,
      email: profile.email,
      phone: profile.phone ?? "",
      location: profile.location ?? "",
      headline: profile.headline ?? "",
      summary: profile.bio ?? "",
      githubUrl: profile.githubUrl ?? "",
      linkedinUrl: profile.linkedinUrl ?? "",
      portfolioUrl: profile.portfolioUrl ?? "",
    },
    experiences: experiences.map(mapExperience),
    projects: projects.map(mapProject),
    educations: educations.map(mapEducation),
    skills: skills.map((skill) => mapSkill(skill, "skill")),
    skillCategoryOrder: [
      "BACKEND",
      "FRONTEND",
      "DADOS",
      "DEVOPS",
      "IA",
      "METODOLOGIAS",
      "MENSAGERIA",
      "TESTES",
    ],
    sections: [
      { id: "summary", visible: true, order: 1 },
      { id: "experiences", visible: true, order: 2 },
      { id: "projects", visible: true, order: 3 },
      { id: "education", visible: true, order: 4 },
      { id: "skills", visible: true, order: 5 },
    ],
  };
}
