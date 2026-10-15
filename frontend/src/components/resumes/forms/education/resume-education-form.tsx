import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import type { ResumeEducation } from '@/types/resumes/resume.types';
import {
  AddButton,
  Card,
  Field,
  ItemActions,
  SectionHeader,
  inputClassName,
  textareaClassName,
} from '../shared/resume-form-controls';

type ResumeEducationFormProps = {
  educations: ResumeEducation[];
  onChange: (
    id: string,
    patch: Partial<ResumeEducation>,
  ) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
};

export function ResumeEducationForm({
  educations,
  onChange,
  onAdd,
  onRemove,
  onMove,
}: ResumeEducationFormProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface/70 p-5">
      <SectionHeader title="Formação" count={educations.length} />

      <div className="flex flex-col gap-4">
        {educations.map((education, index) => (
          <Card
            key={education.localId}
            actions={
              <ItemActions
                canMoveUp={index > 0}
                canMoveDown={index < educations.length - 1}
                onMoveUp={() => onMove(index, -1)}
                onMoveDown={() => onMove(index, 1)}
                onRemove={() => onRemove(education.localId)}
              />
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Curso">
                <Input
                  className={inputClassName}
                  value={education.course}
                  onChange={(event) =>
                    onChange(education.localId, {
                      course: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Instituição">
                <Input
                  className={inputClassName}
                  value={education.institution}
                  onChange={(event) =>
                    onChange(education.localId, {
                      institution: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Início">
                <Input
                  className={inputClassName}
                  type="month"
                  value={education.startedAt.slice(0, 7)}
                  onChange={(event) =>
                    onChange(education.localId, {
                      startedAt: `${event.target.value}-01`,
                    })
                  }
                />
              </Field>

              <Field label="Fim">
                <Input
                  className={inputClassName}
                  type="month"
                  value={(education.endedAt ?? education.expectedEnd)?.slice(0, 7) ?? ''}
                  onChange={(event) =>
                    onChange(education.localId, {
                      ...(education.endedAt !== null
                        ? {
                            endedAt: event.target.value
                              ? `${event.target.value}-01`
                              : null,
                          }
                        : {
                            expectedEnd: event.target.value
                              ? `${event.target.value}-01`
                              : null,
                          }),
                    })
                  }
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Descrição">
                <Textarea
                  className={textareaClassName}
                  value={education.description}
                  onChange={(event) =>
                    onChange(education.localId, {
                      description: event.target.value,
                    })
                  }
                />
              </Field>
            </div>
          </Card>
        ))}
      </div>

      <AddButton onClick={onAdd}>Adicionar nova formação</AddButton>
    </section>
  );
}
