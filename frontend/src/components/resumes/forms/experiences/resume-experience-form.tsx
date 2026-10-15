import type { DragEvent } from 'react';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { Button } from '@/components/ui/shadcn/button';
import { Trash2 } from 'lucide-react';
import type { ResumeExperience, ResumeSkill } from '@/types/resumes/resume.types';
import type { ResumeDragItem } from '../skills/resume-skill-form';
import {
  AddButton,
  Card,
  DragHandle,
  Field,
  ItemActions,
  SectionHeader,
  SkillCategorySelect,
  inputClassName,
  textareaClassName,
} from '../shared/resume-form-controls';

type Props = {
  experiences: ResumeExperience[];
  onChange: (id: string, patch: Partial<ResumeExperience>) => void;
  onChangeSkill: (experienceId: string, skillId: string, patch: Partial<ResumeSkill>) => void;
  onAddSkill: (experienceId: string) => void;
  onRemoveSkill: (experienceId: string, skillId: string) => void;
  draggedItem: ResumeDragItem | null;
  onDragStart: (
    event: DragEvent<HTMLButtonElement>,
    item: ResumeDragItem,
  ) => void;
  onDragEnd: () => void;
  onSkillDrop: (
    event: DragEvent<HTMLDivElement>,
    experienceId: string,
    skillId: string,
  ) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
};

export function ResumeExperienceForm({
  experiences,
  onChange,
  onChangeSkill,
  onAddSkill,
  onRemoveSkill,
  draggedItem,
  onDragStart,
  onDragEnd,
  onSkillDrop,
  onAdd,
  onRemove,
  onMove,
}: Props) {
  return (
    <section className="rounded-2xl border border-line bg-surface/70 p-5">
      <SectionHeader title="Experiências" count={experiences.length} />
      <div className="flex flex-col gap-4">
        {experiences.map((experience, index) => (
          <Card
            key={experience.localId}
            actions={
              <ItemActions
                canMoveUp={index > 0}
                canMoveDown={index < experiences.length - 1}
                onMoveUp={() => onMove(index, -1)}
                onMoveDown={() => onMove(index, 1)}
                onRemove={() => onRemove(experience.localId)}
              />
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cargo">
                <Input
                  className={inputClassName}
                  value={experience.position}
                  onChange={(event) =>
                    onChange(experience.localId, {
                      position: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Empresa">
                <Input
                  className={inputClassName}
                  value={experience.company}
                  onChange={(event) =>
                    onChange(experience.localId, {
                      company: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Início">
                <Input
                  className={inputClassName}
                  type="month"
                  value={experience.startedAt.slice(0, 7)}
                  onChange={(event) =>
                    onChange(experience.localId, {
                      startedAt: `${event.target.value}-01`,
                    })
                  }
                />
              </Field>
              {experience.endedAt !== null && (
                <Field label="Fim">
                  <Input
                    className={inputClassName}
                    type="month"
                    value={experience.endedAt.slice(0, 7)}
                    onChange={(event) =>
                      onChange(experience.localId, {
                        endedAt: event.target.value
                          ? `${event.target.value}-01`
                          : null,
                      })
                    }
                  />
                </Field>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
                <input
                  type="checkbox"
                  aria-label="Trabalho atual"
                  checked={experience.endedAt === null}
                  onChange={(event) =>
                    onChange(experience.localId, {
                      endedAt: event.target.checked ? null : '',
                    })
                  }
                  className="size-4 rounded border-line bg-ink/60 accent-blue-500"
                />
                Trabalho atual
              </label>
            </div>

            <div className="mt-4">
              <Field label="Descrição">
                <Textarea
                  className={textareaClassName}
                  value={experience.description}
                  onChange={(event) =>
                    onChange(experience.localId, {
                      description: event.target.value,
                    })
                  }
                />
              </Field>
            </div>

            <div className="mt-4 border-t border-line/70 pt-4">
              <p className="mb-3 text-sm text-slate-400">Tecnologias utilizadas</p>
              <div className="flex flex-col gap-2">
                {experience.technologies.map((skill) => (
                  <div
                    className={`flex items-center gap-2 rounded-lg transition ${
                      draggedItem?.type === 'experience-skill'
                      && draggedItem.skillId === skill.localId
                        ? 'opacity-50'
                        : ''
                    }`}
                    key={skill.localId}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) =>
                      onSkillDrop(event, experience.localId, skill.localId)
                    }
                  >
                    <DragHandle
                      label={`Arrastar tecnologia ${skill.name || 'sem nome'}`}
                      onDragStart={(event) =>
                        onDragStart(event, {
                          type: 'experience-skill',
                          experienceId: experience.localId,
                          skillId: skill.localId,
                        })
                      }
                      onDragEnd={onDragEnd}
                    />
                    <Input
                      aria-label="Skill da experiência"
                      className={inputClassName}
                      value={skill.name}
                      placeholder="Ex.: NestJS"
                      onChange={(event) =>
                        onChangeSkill(experience.localId, skill.localId, {
                          name: event.target.value,
                        })
                      }
                    />
                    <SkillCategorySelect
                      ariaLabel="Categoria da skill da experiência"
                      value={skill.category}
                      onChange={(category) =>
                        onChangeSkill(experience.localId, skill.localId, {
                          category,
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="size-7 shrink-0 text-red-300 hover:bg-red-400/10 hover:text-red-200"
                      aria-label="Remover skill da experiência"
                      onClick={() =>
                        onRemoveSkill(experience.localId, skill.localId)
                      }
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-blue-300 transition hover:text-blue-200"
                onClick={() => onAddSkill(experience.localId)}
              >
                + Adicionar skill na experiência
              </button>
            </div>
          </Card>
        ))}
      </div>
      <AddButton onClick={onAdd}>Adicionar nova experiência</AddButton>
    </section>
  );
}
