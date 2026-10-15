export type SkillCategory =
  | "BACKEND"
  | "FRONTEND"
  | "DADOS"
  | "DEVOPS"
  | "IA"
  | "METODOLOGIAS"
  | "MENSAGERIA"
  | "TESTES";

export const skillCategories: SkillCategory[] = [
  "BACKEND",
  "FRONTEND",
  "DADOS",
  "DEVOPS",
  "IA",
  "METODOLOGIAS",
  "MENSAGERIA",
  "TESTES",
];

export const skillCategoryLabels: Record<SkillCategory, string> = {
  BACKEND: "Backend",
  FRONTEND: "Frontend",
  DADOS: "Dados",
  DEVOPS: "DevOps",
  IA: "Inteligência artificial",
  METODOLOGIAS: "Metodologias",
  MENSAGERIA: "Mensageria",
  TESTES: "Testes",
};

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
}
