import { Button } from '@/components/ui/shadcn/button';
import { SkillChip } from '@/components/skills/skill-chip';
import type { Project } from '@/types/projects/projects.types';

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  return (
    <article className="rounded-2xl border border-line bg-surface/60 p-6">
      <h3 className="text-lg font-bold tracking-tight text-white">
        {project.name}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">
        {project.description}
      </p>

      {(project.repositoryUrl || project.demoUrl) && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold">
          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-200 transition hover:text-white"
            >
              GitHub ↗
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-200 transition hover:text-white"
            >
              Demo ↗
            </a>
          )}
        </div>
      )}

      {project.technologies.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          {project.technologies.map((item) => (
            <SkillChip
              key={item.id}
              label={item.name}
              category={item.category}
            />
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
