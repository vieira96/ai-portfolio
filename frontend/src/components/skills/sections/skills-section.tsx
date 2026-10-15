'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { AddSkillModal } from '../modals/add-skill-modal';
import { SkillList } from '../skill-list';
import type { Skill } from '@/types/skills/skills.types';

interface SkillsSectionProps {
  skills: Skill[];
  onAddSkills: (newSkills: Skill[]) => void;
  onSetSkills: (next: Skill[] | ((current: Skill[]) => Skill[])) => void;
}

export function SkillsSection({
  skills,
  onAddSkills,
  onSetSkills,
}: SkillsSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  function addSkill(skill: Skill) {
    onAddSkills([skill]);
  }

  async function deleteSkill(id: string) {
    const previous = skills;
    onSetSkills((current) =>
      current.filter((technology) => technology.id !== id),
    );

    try {
      const response = await fetch(`/api/skills/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        onSetSkills(previous);
      }
    } catch {
      onSetSkills(previous);
    }
  }

  return (
    <section id="habilidades" className="mt-8 scroll-mt-24">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Habilidades
        </h1>
        <Button
          type="button"
          onClick={() => setModalOpen(true)}
          className="h-auto rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400"
        >
          Adicionar habilidade
        </Button>
      </div>
      <div className="rounded-2xl border border-line bg-surface/60 p-6">
        <SkillList technologies={skills} onDeleteConfirm={deleteSkill} />
      </div>

      {modalOpen && (
        <AddSkillModal
          onAdded={addSkill}
          onClose={() => setModalOpen(false)}
        />
      )}
    </section>
  );
}
