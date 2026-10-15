import type { DragEvent, ReactNode } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import type { ResumeSkill } from '@/types/resumes/resume.types';

export const inputClassName =
  'h-auto border-line bg-ink/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0';
export const textareaClassName =
  'min-h-24 border-line bg-ink/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0';

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export function SectionHeader({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {count !== undefined && (
          <p className="mt-1 text-xs text-slate-500">
            {count} {count === 1 ? 'item' : 'itens'} no currículo
          </p>
        )}
      </div>
    </div>
  );
}

export function AddButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-semibold text-blue-300 transition hover:border-blue-400 hover:bg-blue-400/5"
    >
      <Plus className="size-4" aria-hidden="true" />
      {children}
    </button>
  );
}

export function ItemActions({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 pl-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="size-7 text-slate-400 hover:bg-white/5 hover:text-white"
        disabled={!canMoveUp}
        onClick={onMoveUp}
        aria-label="Mover para cima"
      >
        <ChevronUp aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="size-7 text-slate-400 hover:bg-white/5 hover:text-white"
        disabled={!canMoveDown}
        onClick={onMoveDown}
        aria-label="Mover para baixo"
      >
        <ChevronDown aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        aria-label="Remover item"
        className="ml-1 size-7 text-red-300 hover:bg-red-400/10 hover:text-red-200"
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}

export function Card({ children, actions }: { children: ReactNode; actions: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-ink/30 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">Editável no currículo</span>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function SkillCategorySelect({
  ariaLabel,
  value,
  onChange,
}: {
  ariaLabel: string;
  value: ResumeSkill['category'];
  onChange: (value: ResumeSkill['category']) => void;
}) {
  return (
    <div className="relative shrink-0">
      <select
        aria-label={ariaLabel}
        className="h-9 w-[106px] appearance-none rounded-lg border border-line bg-ink/60 px-2 pr-8 text-xs text-slate-300 outline-none transition focus:border-blue-400"
        value={value}
        onChange={(event) =>
          onChange(event.target.value as ResumeSkill['category'])
        }
      >
        <option value="BACKEND">Backend</option>
        <option value="FRONTEND">Frontend</option>
        <option value="DADOS">Dados</option>
        <option value="DEVOPS">DevOps</option>
        <option value="IA">Inteligência artificial</option>
        <option value="METODOLOGIAS">Metodologias</option>
        <option value="MENSAGERIA">Mensageria</option>
        <option value="TESTES">Testes</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
    </div>
  );
}

export function DragHandle({
  label,
  onDragStart,
  onDragEnd,
}: {
  label: string;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      aria-label={label}
      title="Arraste para reordenar"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-slate-500 transition hover:bg-white/5 hover:text-slate-200 active:cursor-grabbing"
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  );
}
