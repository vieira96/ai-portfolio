"use client";

import { useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { NewSkillsModal } from "@/components/skills/modals/new-skills-modal";
import {
  SkillsSelection,
  findKnownSkill,
  type SelectedSkill,
} from "@/components/skills/inputs/skills-selection";
import type { Skill, SkillCategory } from "@/types/skills/skills.types";
import type { Project } from "@/types/projects/projects.types";
import { projectSchema } from "../modals/project.schema";
import { WritingAssistance } from "@/components/ai/writing-assistance/writing-assistance";

interface ProjectFormProps {
  project?: Project | null;
  skills: Skill[];
  onSkillsCreated: (newSkills: Skill[]) => void;
  onSaved: () => void;
  onClose: () => void;
}

interface ProjectSkillSubmit {
  id?: string;
  name: string;
  category: SkillCategory;
}

function toPayloadItem(
  item: SelectedSkill,
  knownList: Skill[],
  categorized: ProjectSkillSubmit[],
): ProjectSkillSubmit | null {
  if (item.id !== undefined && item.category !== undefined) {
    return { id: item.id, name: item.name, category: item.category };
  }
  const known = findKnownSkill(knownList, item.name);
  if (known) {
    return { id: known.id, name: known.name, category: known.category };
  }
  const pending = categorized.find(
    (skill) => skill.name.toLowerCase() === item.name.toLowerCase(),
  );
  if (pending) {
    return { name: pending.name, category: pending.category };
  }
  return null;
}

function buildPayload(
  selected: SelectedSkill[],
  knownList: Skill[],
  categorized: ProjectSkillSubmit[],
): ProjectSkillSubmit[] {
  const payload: ProjectSkillSubmit[] = [];
  const seen = new Set<string>();
  for (const item of selected) {
    const entry = toPayloadItem(item, knownList, categorized);
    if (!entry) {
      continue;
    }
    const key = entry.id ?? entry.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      payload.push(entry);
    }
  }
  return payload;
}

export function ProjectForm({
  project,
  skills,
  onSkillsCreated,
  onSaved,
  onClose,
}: ProjectFormProps) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [repositoryUrl, setRepositoryUrl] = useState(
    project?.repositoryUrl ?? "",
  );
  const [demoUrl, setDemoUrl] = useState(project?.demoUrl ?? "");
  const [selected, setSelected] = useState<SelectedSkill[]>(() =>
    (project?.technologies ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
    })),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pendingUnknown, setPendingUnknown] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = project !== null && project !== undefined;

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!(field in current)) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submitWithSkills(
    skillsToSend: ProjectSkillSubmit[],
  ): Promise<Project | null> {
    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
    };
    if (repositoryUrl.trim()) {
      body.repositoryUrl = repositoryUrl.trim();
    }
    if (demoUrl.trim()) {
      body.demoUrl = demoUrl.trim();
    }
    if (skillsToSend.length > 0 || editing) {
      body.skills = skillsToSend;
    }

    const url = editing ? `/api/projects/${project?.id}` : "/api/projects";
    const response = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setError("Não foi possível salvar. Tente novamente.");
      return null;
    }

    const saved = (await response.json()) as Project;
    onSkillsCreated(saved.technologies ?? []);
    onSaved();
    onClose();
    return saved;
  }

  async function submitFlow(skillsToSend: ProjectSkillSubmit[]) {
    setSaving(true);
    try {
      await submitWithSkills(skillsToSend);
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit() {
    const parsed = projectSchema.safeParse({
      name,
      description,
      repositoryUrl,
      demoUrl,
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !errors[key]) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError(null);

    if (selected.length === 0) {
      void submitFlow([]);
      return;
    }

    const unknown = selected.filter(
      (item) =>
        item.id === undefined &&
        findKnownSkill(skills, item.name) === undefined,
    );

    if (unknown.length === 0) {
      void submitFlow(buildPayload(selected, skills, []));
      return;
    }

    setPendingUnknown(unknown.map((item) => item.name));
  }

  async function handleConfirmNewSkills(categorized: ProjectSkillSubmit[]) {
    setSaving(true);
    try {
      const saved = await submitWithSkills(
        buildPayload(selected, skills, categorized),
      );
      if (saved) {
        setPendingUnknown(null);
      }
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (pendingUnknown !== null) {
    return (
      <NewSkillsModal
        unknownSkills={pendingUnknown}
        error={error}
        onConfirm={(categorized) => void handleConfirmNewSkills(categorized)}
        onCancel={() => setPendingUnknown(null)}
      />
    );
  }

  return (
    <>
      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Nome</span>
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearFieldError("name");
            }}
            placeholder="Ex: Auth API"
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.name && (
            <p className="text-xs text-red-400">{fieldErrors.name}</p>
          )}
        </label>

        <div className="sm:col-span-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-slate-400">Descrição</span>
            <Textarea
              rows={3}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                clearFieldError("description");
              }}
              className="border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 min-h-0 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
            />
          </label>
          {fieldErrors.description && (
            <p className="text-xs text-red-400">{fieldErrors.description}</p>
          )}
          <WritingAssistance
            fieldType="projectDescription"
            fieldLabel="descrição do projeto"
            value={description}
            onApply={setDescription}
          />
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Repositório (URL)</span>
          <Input
            value={repositoryUrl}
            onChange={(event) => {
              setRepositoryUrl(event.target.value);
              clearFieldError("repositoryUrl");
            }}
            placeholder="https://github.com/..."
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.repositoryUrl && (
            <p className="text-xs text-red-400">{fieldErrors.repositoryUrl}</p>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Demo (URL)</span>
          <Input
            value={demoUrl}
            onChange={(event) => {
              setDemoUrl(event.target.value);
              clearFieldError("demoUrl");
            }}
            placeholder="https://..."
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.demoUrl && (
            <p className="text-xs text-red-400">{fieldErrors.demoUrl}</p>
          )}
        </label>

        <SkillsSelection
          id="project-skills"
          skills={skills}
          selected={selected}
          onChange={setSelected}
        />
      </div>
      <div className="mt-6 flex gap-3">
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={saving}
          className="h-auto rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400"
        >
          {saving ? "Salvando..." : "Salvar"}
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
