'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import type { Education } from '@/types/educations/educations.types';
import { EducationForm } from '../forms/education-form';

interface EducationModalProps {
  education?: Education | null;
  onSaved: () => void;
  onClose: () => void;
}

export function EducationModal({
  education,
  onSaved,
  onClose,
}: EducationModalProps) {
  const editing = education !== null && education !== undefined;

  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-200 overflow-y-auto rounded-2xl border border-line bg-surface p-6">
        <DialogTitle className="text-lg font-bold text-white">
          {editing ? 'Editar formação' : 'Nova formação'}
        </DialogTitle>
        <EducationForm
          education={education}
          onSaved={onSaved}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
