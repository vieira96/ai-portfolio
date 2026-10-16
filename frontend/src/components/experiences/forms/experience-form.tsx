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
import type { Experience } from "@/types/experiences/experiences.types";
import { experienceSchema } from "../modals/experience.schema";
import { WritingAssistance } from "@/components/ai/writing-assistance/writing-assistance";

interface ExperienceFormProps {
  experience?: Experience | null;
  skills: Skill[];
  onSkillsCreated: (newSkills: Skill[]) => void;
  onSaved: () => void;
  onClose: () => void;
}

interface ExperienceSkillSubmit {
  id?: string;
  name: string;
  category: SkillCategory;
}

function toDateInput(value: string | null): string {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
}

function toPayloadItem(
  item: SelectedSkill,
  knownList: Skill[],
  categorized: ExperienceSkillSubmit[],
): ExperienceSkillSubmit | null {
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
  categorized: ExperienceSkillSubmit[],
): ExperienceSkillSubmit[] {
  const payload: ExperienceSkillSubmit[] = [];
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

export function ExperienceForm({
  experience,
  skills,
  onSkillsCreated,
  onSaved,
  onClose,
}: ExperienceFormProps) {
  const [company, setCompany] = useState(experience?.company ?? "");
  const [position, setPosition] = useState(experience?.position ?? "");
  const [description, setDescription] = useState(experience?.description ?? "");
  const [startedAt, setStartedAt] = useState(
    toDateInput(experience?.startedAt ?? ""),
  );
  const [endedAt, setEndedAt] = useState(
    toDateInput(experience?.endedAt ?? ""),
  );
  const [currentJob, setCurrentJob] = useState(
    !experience || experience.endedAt === null,
  );
  const [selected, setSelected] = useState<SelectedSkill[]>(() =>
    (experience?.technologies ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
    })),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pendingUnknown, setPendingUnknown] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = experience !== null && experience !== undefined;

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
    skillsToSend: ExperienceSkillSubmit[],
  ): Promise<Experience | null> {
    const body: Record<string, unknown> = {
      company: company.trim(),
      position: position.trim(),
      description: description.trim(),
      startedAt: startedAt,
      endedAt: currentJob ? null : endedAt || null,
    };
    if (skillsToSend.length > 0 || editing) {
      body.skills = skillsToSend;
    }

    const url = editing
      ? `/api/experiences/${experience?.id}`
      : "/api/experiences";
    const response = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setError("Não foi possível salvar. Tente novamente.");
      return null;
    }

    const saved = (await response.json()) as Experience;
    onSkillsCreated(saved.technologies ?? []);
    onSaved();
    onClose();
    return saved;
  }

  async function submitFlow(skillsToSend: ExperienceSkillSubmit[]) {
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
    const parsed = experienceSchema.safeParse({
      company,
      position,
      description,
      startedAt,
      endedAt: currentJob ? "" : endedAt,
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

  async function handleConfirmNewSkills(categorized: ExperienceSkillSubmit[]) {
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
          <span className="text-slate-400">Empresa</span>
          <Input
            value={company}
            onChange={(event) => {
              setCompany(event.target.value);
              clearFieldError("company");
            }}
            placeholder="Ex: Levante Lab"
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.company && (
            <p className="text-xs text-red-400">{fieldErrors.company}</p>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Cargo</span>
          <Input
            value={position}
            onChange={(event) => {
              setPosition(event.target.value);
              clearFieldError("position");
            }}
            placeholder="Ex: Backend Developer"
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.position && (
            <p className="text-xs text-red-400">{fieldErrors.position}</p>
          )}
        </label>

        <div>
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
            fieldType="experienceDescription"
            fieldLabel="descrição da experiência"
            value={description}
            onApply={setDescription}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-slate-400">Início</span>
            <Input
              type="date"
              value={startedAt}
              onChange={(event) => {
                setStartedAt(event.target.value);
                clearFieldError("startedAt");
              }}
              className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
            />
            {fieldErrors.startedAt && (
              <p className="text-xs text-red-400">{fieldErrors.startedAt}</p>
            )}
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-slate-400">Fim</span>
            <Input
              type="date"
              value={endedAt}
              disabled={currentJob}
              onChange={(event) => {
                setEndedAt(event.target.value);
                clearFieldError("endedAt");
              }}
              className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 disabled:opacity-50 dark:bg-surface"
            />
            {fieldErrors.endedAt && (
              <p className="text-xs text-red-400">{fieldErrors.endedAt}</p>
            )}
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={currentJob}
            onChange={(event) => {
              setCurrentJob(event.target.checked);
              if (event.target.checked) {
                setEndedAt("");
              }
              clearFieldError("endedAt");
            }}
            className="size-4 accent-blue-500"
          />
          Emprego atual
        </label>

        <SkillsSelection
          id="experience-skills"
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
