"use client";

import { useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import type { SkillCategory } from "@/types/skills/skills.types";
import { skillCategoryLabels } from "@/types/skills/skills.types";
import { addSkillSchema } from "../modals/add-skill.schema";

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

interface AddSkillFormProps {
  onAdded: (skill: {
    id: string;
    name: string;
    category: SkillCategory;
  }) => void;
  onClose: () => void;
}

export function AddSkillForm({ onAdded, onClose }: AddSkillFormProps) {
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<SkillCategory>("BACKEND");
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const parsed = addSkillSchema.safeParse({
      name: newName,
      category: newCategory,
    });
    if (!parsed.success) {
      setNameError("Nome precisa de ao menos 2 caracteres.");
      return;
    }
    setNameError(null);
    const name = parsed.data.name;
    setError(null);
    setSaving(true);

    try {
      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category: newCategory }),
      });

      if (response.status === 409) {
        setError("Essa habilidade já existe.");
        return;
      }

      if (!response.ok) {
        setError("Não foi possível adicionar. Tente novamente.");
        return;
      }

      onAdded(
        (await response.json()) as {
          id: string;
          name: string;
          category: SkillCategory;
        },
      );
      setNewName("");
      onClose();
    } catch {
      setError("Não foi possível adicionar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Nome</span>
          <Input
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value);
              setNameError(null);
            }}
            placeholder="Ex: Rust"
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {nameError && <p className="text-xs text-red-400">{nameError}</p>}
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Categoria</span>
          <span className="relative block">
            <select
              value={newCategory}
              onChange={(event) =>
                setNewCategory(event.target.value as SkillCategory)
              }
              className="w-full appearance-none rounded-lg border border-line bg-surface py-2.5 pl-4 pr-10 text-sm text-slate-100 outline-none transition focus:border-blue-400"
            >
              {categoryOrder.map((category) => (
                <option key={category} value={category}>
                  {skillCategoryLabels[category]}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            >
              <path
                d="M4 6l4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </label>
      </div>
      <div className="mt-6 flex gap-3">
        <Button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="h-auto rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400"
        >
          {saving ? "Adicionando..." : "Adicionar"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="h-auto rounded-full border-line bg-transparent px-4 py-2.5 text-sm font-bold text-slate-300 hover:border-blue-400/40 hover:bg-transparent hover:text-white"
        >
          Cancelar
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}
    </>
  );
}
