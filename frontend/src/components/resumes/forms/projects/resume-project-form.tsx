import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import type { ResumeProject } from '@/types/resumes/resume.types';
import {
  AddButton,
  Card,
  Field,
  ItemActions,
  SectionHeader,
  inputClassName,
  textareaClassName,
} from '../shared/resume-form-controls';

type ResumeProjectFormProps = {
  projects: ResumeProject[];
  onChange: (
    id: string,
    patch: Partial<ResumeProject>,
  ) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
};

export function ResumeProjectForm({
  projects,
  onChange,
  onAdd,
  onRemove,
  onMove,
}: ResumeProjectFormProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface/70 p-5">
      <SectionHeader title="Projetos" count={projects.length} />

      <div className="flex flex-col gap-4">
        {projects.map((project, index) => (
          <Card
            key={project.localId}
            actions={
              <ItemActions
                canMoveUp={index > 0}
                canMoveDown={index < projects.length - 1}
                onMoveUp={() => onMove(index, -1)}
                onMoveDown={() => onMove(index, 1)}
                onRemove={() => onRemove(project.localId)}
              />
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome">
                <Input
                  className={inputClassName}
                  value={project.name}
                  onChange={(event) =>
                    onChange(project.localId, {
                      name: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Demo">
                <Input
                  className={inputClassName}
                  value={project.demoUrl}
                  onChange={(event) =>
                    onChange(project.localId, {
                      demoUrl: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Repositório">
                <Input
                  className={inputClassName}
                  value={project.repositoryUrl}
                  onChange={(event) =>
                    onChange(project.localId, {
                      repositoryUrl: event.target.value,
                    })
                  }
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Descrição">
                <Textarea
                  className={textareaClassName}
                  value={project.description}
                  onChange={(event) =>
                    onChange(project.localId, {
                      description: event.target.value,
                    })
                  }
                />
              </Field>
            </div>
          </Card>
        ))}
      </div>

      <AddButton onClick={onAdd}>Adicionar novo projeto</AddButton>
    </section>
  );
}
