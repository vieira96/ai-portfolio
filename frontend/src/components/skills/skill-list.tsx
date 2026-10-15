import type { SkillCategory, Skill } from "@/types/skills/skills.types";
import { skillCategoryLabels } from "@/types/skills/skills.types";
import { SkillChip } from "./skill-chip";

const categoryOrder: SkillCategory[] = [
  "BACKEND",
  "FRONTEND",
  "DADOS",
  "DEVOPS",
  "IA",
  "METODOLOGIAS",
  "MENSAGERIA",
  "TESTES",
];

interface SkillListProps {
  technologies: Skill[];
  onDeleteConfirm: (id: string) => void;
}

export function SkillList({ technologies, onDeleteConfirm }: SkillListProps) {
  return (
    <div className="flex flex-col gap-6">
      {categoryOrder.map((category) => (
        <div key={category}>
          <p className="font-mono text-[11px] uppercase tracking-[.18em] text-slate-500">
            {skillCategoryLabels[category]}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {technologies
              .filter((technology) => technology.category === category)
              .map((technology) => (
                <SkillChip
                  key={technology.id}
                  label={technology.name}
                  category={technology.category}
                  onDeleteConfirm={() => onDeleteConfirm(technology.id)}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
