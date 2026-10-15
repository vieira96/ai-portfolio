'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import type { Skill } from '@/types/skills/skills.types';
import type { Experience } from '@/types/experiences/experiences.types';
import { ExperienceForm } from '../forms/experience-form';

interface ExperienceModalProps {
  experience?: Experience | null;
  skills: Skill[];
  onSkillsCreated: (newSkills: Skill[]) => void;
  onSaved: () => void;
  onClose: () => void;
}

export function ExperienceModal({
  experience,
  skills,
  onSkillsCreated,
  onSaved,
  onClose,
}: ExperienceModalProps) {
  const editing = experience !== null && experience !== undefined;

  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-200 overflow-y-auto rounded-2xl border border-line bg-surface p-6">
        <DialogTitle className="text-lg font-bold text-white">
          {editing ? 'Editar experiência' : 'Nova experiência'}
        </DialogTitle>
        <ExperienceForm
          experience={experience}
          skills={skills}
          onSkillsCreated={onSkillsCreated}
          onSaved={onSaved}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
