'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { ConfirmModal } from '@/components/ui/modals/confirm-modal';
import type { Project } from '@/types/projects/projects.types';
import type { ProjectsPage } from '@/lib/projects/projects';
import type { Skill } from '@/types/skills/skills.types';
import { ProjectModal } from '../modals/project-modal';
import { ProjectCard } from '../cards/project-card';

interface ProjectsSectionProps {
  initialPage: ProjectsPage;
  skills: Skill[];
  onSkillsCreated: (newSkills: Skill[]) => void;
}

const PAGE_SIZE = 4;

export function ProjectsSection({
  initialPage,
  skills,
  onSkillsCreated,
}: ProjectsSectionProps) {
  const [page, setPage] = useState(initialPage);
  const [current, setCurrent] = useState(initialPage.page);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<
    | { mode: 'closed' }
    | { mode: 'create' }
    | { mode: 'edit'; project: Project }
  >({ mode: 'closed' });
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  async function loadPage(next: number) {
    try {
      const response = await fetch(
        `/api/projects?page=${next}&size=${PAGE_SIZE}`,
      );
      if (!response.ok) {
        throw new Error('load failed');
      }
      const data = (await response.json()) as ProjectsPage;
      setPage(data);
      setCurrent(next);
      setError(null);
    } catch {
      setError('Não foi possível carregar os projetos. Tente novamente.');
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    const deleted = pendingDelete;
    setPendingDelete(null);

    const remaining = page.data.filter((item) => item.id !== deleted.id);
    const total = Math.max(0, page.total - 1);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    setPage({ ...page, data: remaining, total, totalPages });

    try {
      const response = await fetch(`/api/projects/${deleted.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('delete failed');
      }
      setError(null);
      if (remaining.length === 0 && current > 1) {
        await loadPage(current - 1);
      } else if (current > totalPages) {
        await loadPage(totalPages);
      }
    } catch {
      await loadPage(current);
      setError('Não foi possível excluir o projeto. Tente novamente.');
    }
  }

  return (
    <section id="projetos" className="mt-8 scroll-mt-24">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Projetos
        </h1>
        <Button
          type="button"
          onClick={() => setModal({ mode: 'create' })}
          className="h-auto rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400"
        >
          Novo projeto
        </Button>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-400">
          {error}
        </p>
      )}

      {page.data.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface/60 p-6 text-sm text-slate-400">
          Nenhum projeto ainda. Crie o primeiro.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {page.data.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => setModal({ mode: 'edit', project })}
              onDelete={() => setPendingDelete(project)}
            />
          ))}
        </div>
      )}

      {page.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="secondary"
            disabled={current <= 1}
            onClick={() => void loadPage(current - 1)}
            className="h-auto rounded-full border-line bg-transparent px-4 py-2.5 text-sm font-bold text-slate-300 hover:border-blue-400/40 hover:bg-transparent hover:text-white"
          >
            Anterior
          </Button>
          <span className="font-mono text-xs text-slate-500">
            {current} / {page.totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={current >= page.totalPages}
            onClick={() => void loadPage(current + 1)}
            className="h-auto rounded-full border-line bg-transparent px-4 py-2.5 text-sm font-bold text-slate-300 hover:border-blue-400/40 hover:bg-transparent hover:text-white"
          >
            Próxima
          </Button>
        </div>
      )}

      {modal.mode !== 'closed' && (
        <ProjectModal
          key={modal.mode === 'edit' ? modal.project.id : 'create'}
          project={modal.mode === 'edit' ? modal.project : null}
          skills={skills}
          onSkillsCreated={onSkillsCreated}
          onSaved={() => void loadPage(current)}
          onClose={() => setModal({ mode: 'closed' })}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Excluir projeto"
          body={`Excluir "${pendingDelete.name}"?`}
          confirmLabel="Excluir"
          confirmVariant="danger"
          onConfirm={() => void confirmDelete()}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
}
