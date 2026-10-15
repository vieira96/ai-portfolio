import type { ResumeData, ResumeSkill } from "@/types/resumes/resume.types";
import {
  skillCategoryLabels,
  skillCategories,
  type SkillCategory,
} from "@/types/skills/skills.types";

export const defaultSkillCategoryOrder: SkillCategory[] = [
  "FRONTEND",
  "BACKEND",
  "DADOS",
  "IA",
  "DEVOPS",
  "METODOLOGIAS",
  "MENSAGERIA",
  "TESTES",
];

export { skillCategoryLabels };

export function getSkillCategoryOrder(
  data: Pick<ResumeData, "skillCategoryOrder">,
) {
  const requestedOrder = data.skillCategoryOrder ?? [];

  return [
    ...requestedOrder,
    ...skillCategories.filter((category) => !requestedOrder.includes(category)),
  ];
}

export function getSkillGroups(data: ResumeData) {
  return getSkillCategoryOrder(data)
    .map((category) => ({
      category,
      skills: data.skills.filter(
        (skill) => skill.category === category && skill.name.trim(),
      ),
    }))
    .filter((group) => group.skills.length > 0);
}

export function reorderSkillsInCategory(
  skills: ResumeSkill[],
  category: SkillCategory,
  index: number,
  direction: -1 | 1,
) {
  const categorySkills = skills.filter((skill) => skill.category === category);
  const target = index + direction;

  if (target < 0 || target >= categorySkills.length) return skills;

  [categorySkills[index], categorySkills[target]] = [
    categorySkills[target],
    categorySkills[index],
  ];
  let categoryIndex = 0;

  return skills.map((skill) => {
    if (skill.category !== category) return skill;
    return categorySkills[categoryIndex++];
  });
}
