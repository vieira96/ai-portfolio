'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import type { SkillCategory } from '@/types/skills/skills.types';
import { AddSkillForm } from '../forms/add-skill-form';

interface AddSkillModalProps {
  onAdded: (skill: { id: string; name: string; category: SkillCategory }) => void;
  onClose: () => void;
}

export function AddSkillModal({ onAdded, onClose }: AddSkillModalProps) {
  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border border-line bg-surface p-6">
        <DialogTitle className="text-lg font-bold text-white">
          Nova habilidade
        </DialogTitle>
        <AddSkillForm onAdded={onAdded} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
