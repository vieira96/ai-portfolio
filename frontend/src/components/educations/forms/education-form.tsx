'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import type {
  Education,
  EducationDegree,
} from '@/types/educations/educations.types';
import { educationSchema } from '../modals/education.schema';

const degreeOrder: EducationDegree[] = [
  'GRADUACAO',
  'POS',
  'TECNICO',
  'CURSO_LIVRE',
  'CERTIFICACAO',
];

interface EducationFormProps {
  education?: Education | null;
  onSaved: () => void;
  onClose: () => void;
}

export function EducationForm({
  education,
  onSaved,
  onClose,
}: EducationFormProps) {
  const [institution, setInstitution] = useState(education?.institution ?? '');
  const [course, setCourse] = useState(education?.course ?? '');
  const [degree, setDegree] = useState<EducationDegree>(
    education?.degree ?? 'GRADUACAO',
  );
  const [description, setDescription] = useState(
    education?.description ?? '',
  );
  const [startedAt, setStartedAt] = useState(
    toDateInput(education?.startedAt ?? ''),
  );
  const [endedAt, setEndedAt] = useState(
    toDateInput(education?.endedAt ?? ''),
  );
  const [expectedEnd, setExpectedEnd] = useState(
    toDateInput(education?.expectedEnd ?? ''),
  );
  const [currentJob, setCurrentJob] = useState(
    !education || education.endedAt === null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = education !== null && education !== undefined;

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

  async function handleSubmit() {
    const parsed = educationSchema.safeParse({
      institution,
      course,
      description,
      startedAt,
      endedAt: currentJob ? '' : endedAt,
      expectedEnd: currentJob ? expectedEnd : '',
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !errors[key]) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError(null);
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        institution: institution.trim(),
        course: course.trim(),
        degree,
        description: description.trim(),
        startedAt,
        endedAt: currentJob ? null : endedAt || null,
        expectedEnd: currentJob ? expectedEnd || null : null,
      };

      const url = editing
        ? `/api/educations/${education?.id}`
        : '/api/educations';
      const response = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setError('Não foi possível salvar. Tente novamente.');
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Instituição</span>
          <Input
            value={institution}
            onChange={(event) => {
              setInstitution(event.target.value);
              clearFieldError('institution');
            }}
            placeholder="Ex: USP"
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.institution && (
            <p className="text-xs text-red-400">{fieldErrors.institution}</p>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Curso</span>
          <Input
            value={course}
            onChange={(event) => {
              setCourse(event.target.value);
              clearFieldError('course');
            }}
            placeholder="Ex: Ciência da Computação"
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.course && (
            <p className="text-xs text-red-400">{fieldErrors.course}</p>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Tipo</span>
          <span className="relative block">
            <select
              value={degree}
              onChange={(event) =>
                setDegree(event.target.value as EducationDegree)
              }
              className="w-full appearance-none rounded-lg border border-line bg-surface py-2.5 pl-4 pr-10 text-sm text-slate-100 outline-none transition focus:border-blue-400"
              aria-label="Tipo de formação"
            >
              {degreeOrder.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Descrição</span>
          <Textarea
            rows={3}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              clearFieldError('description');
            }}
            className="border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 min-h-0 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.description && (
            <p className="text-xs text-red-400">
              {fieldErrors.description}
            </p>
          )}
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-slate-400">Início</span>
            <Input
              type="date"
              value={startedAt}
              onChange={(event) => {
                setStartedAt(event.target.value);
                clearFieldError('startedAt');
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
                clearFieldError('endedAt');
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
                setEndedAt('');
              }
              clearFieldError('endedAt');
            }}
            className="size-4 accent-blue-500"
          />
          Cursando atualmente
        </label>

        {currentJob && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-slate-400">Previsão de término</span>
            <Input
              type="date"
              value={expectedEnd}
              onChange={(event) => setExpectedEnd(event.target.value)}
              className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
            />
          </label>
        )}
      </div>
      <div className="mt-6 flex gap-3">
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={saving}
          className="h-auto rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400"
        >
          {saving ? 'Salvando...' : 'Salvar'}
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

function toDateInput(value: string | null): string {
  if (!value) {
    return '';
  }
  return value.slice(0, 10);
}
