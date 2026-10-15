'use client';

import { Button } from '@/components/ui/shadcn/button';
import type { Education } from '@/types/educations/educations.types';

const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

function formatMonthYear(value: string): string {
  const date = new Date(value);
  return `${MONTHS[date.getUTCMonth()]}/${date.getUTCFullYear()}`;
}

export function formatEducationPeriod(
  startedAt: string | null,
  endedAt: string | null,
  expectedEnd: string | null,
): string {
  const start = startedAt ? formatMonthYear(startedAt) : '?';
  if (endedAt) {
    return `${start} – ${formatMonthYear(endedAt)}`;
  }
  if (expectedEnd) {
    return `${start} – previsão ${formatMonthYear(expectedEnd)}`;
  }
  return `${start} – atual`;
}

interface EducationCardProps {
  education: Education;
  onEdit: () => void;
  onDelete: () => void;
}

export function EducationCard({
  education,
  onEdit,
  onDelete,
}: EducationCardProps) {
  return (
    <article className="rounded-2xl border border-line bg-surface/60 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            {education.institution}
          </h3>
          <p className="text-sm text-slate-300">
            {education.course}
            {education.degree ? ` · ${education.degree}` : ''}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {formatEducationPeriod(
              education.startedAt,
              education.endedAt,
              education.expectedEnd,
            )}
          </p>
        </div>
      </div>
      {education.description && (
        <p className="mt-3 text-sm text-slate-400">{education.description}</p>
      )}
      <div className="mt-4 flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onEdit}
          className="h-auto rounded-full border-line bg-transparent px-4 py-2.5 text-sm font-bold text-slate-300 hover:border-blue-400/40 hover:bg-transparent hover:text-white"
        >
          Editar
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          className="h-auto rounded-full border-danger/40 bg-transparent px-4 py-2.5 text-sm font-bold text-danger hover:border-danger/70 hover:bg-danger/10"
        >
          Excluir
        </Button>
      </div>
    </article>
  );
}
