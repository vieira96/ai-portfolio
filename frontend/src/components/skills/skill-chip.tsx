'use client';

import { useState } from 'react';
import { ConfirmModal } from '../ui/modals/confirm-modal';

import type { SkillCategory } from '@/types/skills/skills.types';

interface SkillChipProps {
  label: string;
  category: SkillCategory;
  onDeleteConfirm?: () => void;
}

const tones: Record<SkillCategory, string> = {
  BACKEND: 'border-blue-400/40 bg-blue-500/10 text-blue-200',
  FRONTEND: 'border-orange-400/40 bg-orange-500/10 text-orange-200',
  DADOS: 'border-green-400/40 bg-green-500/10 text-green-200',
  DEVOPS: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300',
  IA: 'border-violet-400/40 bg-violet-500/10 text-violet-200',
  METODOLOGIAS: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200',
  MENSAGERIA: 'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200',
  TESTES: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
};

export function SkillChip({
  label,
  category,
  onDeleteConfirm,
}: SkillChipProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirm() {
    setConfirmOpen(false);
    onDeleteConfirm?.();
  }

  return (
    <>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-2 text-xs font-bold ${tones[category]}`}
      >
        {label}
        {onDeleteConfirm && (
          <button
            type="button"
            aria-label={`Remover ${label}`}
            onClick={() => setConfirmOpen(true)}
            className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold opacity-60 transition hover:opacity-100"
          >
            X
          </button>
        )}
      </span>

      {confirmOpen && (
        <ConfirmModal
          title="Excluir habilidade"
          body={`Excluir "${label}" das suas habilidades?`}
          confirmLabel="Excluir"
          confirmVariant="danger"
          onConfirm={handleConfirm}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
