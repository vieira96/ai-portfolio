"use client";

import { useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import type { SkillCategory } from "@/types/skills/skills.types";
import { skillCategoryLabels } from "@/types/skills/skills.types";

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

interface PendingSkill {
  name: string;
  category: SkillCategory;
}

interface NewSkillsModalProps {
  unknownSkills: string[];
  error?: string | null;
  onConfirm: (skills: { name: string; category: SkillCategory }[]) => void;
  onCancel: () => void;
}

export function NewSkillsModal({
  unknownSkills,
  error,
  onConfirm,
  onCancel,
}: NewSkillsModalProps) {
  const [pendingSkills, setPendingSkills] = useState<PendingSkill[]>(
    unknownSkills.map((name) => ({ name, category: "BACKEND" })),
  );

  function setPendingCategory(name: string, category: SkillCategory) {
    setPendingSkills((current) =>
      current.map((skill) =>
        skill.name === name ? { ...skill, category } : skill,
      ),
    );
  }

  function handleConfirm() {
    const skills = pendingSkills.map((s) => ({
      name: s.name,
      category: s.category,
    }));
    onConfirm(skills);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      onCancel();
    }
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-6">
        <DialogTitle className="text-lg font-bold text-white">
          Categorizar novas skills
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-slate-400">
          Essas ainda não existem — escolha a categoria de cada uma.
        </DialogDescription>
        <div className="mt-4 flex flex-col gap-4">
          {pendingSkills.map((skill) => (
            <div key={skill.name} className="flex items-center gap-4 text-sm">
              <span className="flex-1 text-slate-200">{skill.name}</span>
              <select
                value={skill.category}
                onChange={(event) =>
                  setPendingCategory(
                    skill.name,
                    event.target.value as SkillCategory,
                  )
                }
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400"
                aria-label={`Categoria de ${skill.name}`}
              >
                {categoryOrder.map((category) => (
                  <option key={category} value={category}>
                    {skillCategoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            onClick={handleConfirm}
            className="h-auto rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400"
          >
            Confirmar e salvar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="h-auto rounded-full border-line bg-transparent px-4 py-2.5 text-sm font-bold text-slate-300 hover:border-blue-400/40 hover:bg-transparent hover:text-white"
          >
            Voltar
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
