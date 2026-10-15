'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import type { Skill } from '@/types/skills/skills.types';
import type { Project } from '@/types/projects/projects.types';
import { ProjectForm } from '../forms/project-form';

interface ProjectModalProps {
  project?: Project | null;
  skills: Skill[];
  onSkillsCreated: (newSkills: Skill[]) => void;
  onSaved: () => void;
  onClose: () => void;
}

export function ProjectModal({
  project,
  skills,
  onSkillsCreated,
  onSaved,
  onClose,
}: ProjectModalProps) {
  const editing = project !== null && project !== undefined;

  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-200 overflow-y-auto rounded-2xl border border-line bg-surface p-6">
        <DialogTitle className="text-lg font-bold text-white">
          {editing ? 'Editar projeto' : 'Novo projeto'}
        </DialogTitle>
        <ProjectForm
          project={project}
          skills={skills}
          onSkillsCreated={onSkillsCreated}
          onSaved={onSaved}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
