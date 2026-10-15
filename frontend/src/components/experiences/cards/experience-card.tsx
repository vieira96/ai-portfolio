'use client';

import { Button } from '@/components/ui/shadcn/button';
import type { Experience } from '@/types/experiences/experiences.types';

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

export function formatPeriod(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt);
  const startLabel = `${MONTHS[start.getUTCMonth()]}/${start.getUTCFullYear()}`;
  if (!endedAt) {
    return `${startLabel} – atual`;
  }
  const end = new Date(endedAt);
  return `${startLabel} – ${MONTHS[end.getUTCMonth()]}/${end.getUTCFullYear()}`;
}

interface ExperienceCardProps {
  experience: Experience;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExperienceCard({
  experience,
  onEdit,
  onDelete,
}: ExperienceCardProps) {
  return (
    <article className="rounded-2xl border border-line bg-surface/60 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">{experience.company}</h3>
          <p className="text-sm text-slate-300">{experience.position}</p>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {formatPeriod(experience.startedAt, experience.endedAt)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-400">{experience.description}</p>
      {experience.technologies.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {experience.technologies.map((technology) => (
            <span
              key={technology.id}
              className="rounded-full border border-line bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-200"
            >
              {technology.name}
            </span>
          ))}
        </div>
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
