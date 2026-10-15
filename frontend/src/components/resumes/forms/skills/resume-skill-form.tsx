import type { DragEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import type { ResumeData, ResumeSkill } from '@/types/resumes/resume.types';
import type { SkillCategory } from '@/types/skills/skills.types';
import {
  AddButton,
  DragHandle,
  SectionHeader,
  SkillCategorySelect,
  inputClassName,
} from '../shared/resume-form-controls';
import {
  getSkillCategoryOrder,
  skillCategoryLabels,
} from '../../skills/resume-skill-groups';

export type ResumeDragItem =
  | { type: 'category'; category: SkillCategory }
  | { type: 'skill'; category: SkillCategory; skillId: string }
  | { type: 'experience-skill'; experienceId: string; skillId: string };

type Props = {
  data: ResumeData;
  draggedItem: ResumeDragItem | null;
  onChange: (id: string, patch: Partial<ResumeSkill>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onDragStart: (
    event: DragEvent<HTMLButtonElement>,
    item: ResumeDragItem,
  ) => void;
  onDragEnd: () => void;
  onCategoryDrop: (
    event: DragEvent<HTMLDivElement>,
    category: SkillCategory,
  ) => void;
  onSkillDrop: (
    event: DragEvent<HTMLDivElement>,
    category: SkillCategory,
    skillId: string,
  ) => void;
};

export function ResumeSkillForm({
  data,
  draggedItem,
  onChange,
  onRemove,
  onAdd,
  onDragStart,
  onDragEnd,
  onCategoryDrop,
  onSkillDrop,
}: Props) {
  const visibleCategories = getSkillCategoryOrder(data).filter((category) =>
    data.skills.some((skill) => skill.category === category),
  );

  return (
    <section className="rounded-2xl border border-line bg-surface/70 p-5">
      <SectionHeader title="Habilidades" count={data.skills.length} />

      <div className="flex flex-col gap-4">
        {visibleCategories.map((category) => {
          const categorySkills = data.skills.filter(
            (skill) => skill.category === category,
          );
          const isDraggedCategory =
            draggedItem?.type === 'category' &&
            draggedItem.category === category;

          return (
            <div
              key={category}
              data-skill-category={category}
              className={`rounded-xl border border-line/70 bg-ink/20 p-3 transition ${
                isDraggedCategory ? 'opacity-50' : ''
              }`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onCategoryDrop(event, category)}
            >
              <div className="mb-3 flex items-center gap-1">
                <DragHandle
                  label={`Arrastar categoria ${skillCategoryLabels[category]}`}
                  onDragStart={(event) =>
                    onDragStart(event, { type: 'category', category })
                  }
                  onDragEnd={onDragEnd}
                />
                <h3 className="text-sm font-semibold text-slate-200">
                  {skillCategoryLabels[category]}
                </h3>
              </div>

              <div className="flex flex-col gap-2">
                {categorySkills.map((skill) => {
                  const isDraggedSkill =
                    draggedItem?.type === 'skill' &&
                    draggedItem.skillId === skill.localId;

                  return (
                    <div
                      key={skill.localId}
                      data-skill-row={skill.localId}
                      className={`flex items-center gap-2 rounded-lg transition ${
                        isDraggedSkill ? 'opacity-50' : ''
                      }`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) =>
                        onSkillDrop(event, category, skill.localId)
                      }
                    >
                      <DragHandle
                        label={`Arrastar habilidade ${skill.name || 'sem nome'}`}
                        onDragStart={(event) =>
                          onDragStart(event, {
                            type: 'skill',
                            category,
                            skillId: skill.localId,
                          })
                        }
                        onDragEnd={onDragEnd}
                      />
                      <Input
                        aria-label="Nome da habilidade"
                        className={inputClassName}
                        value={skill.name}
                        onChange={(event) =>
                          onChange(skill.localId, {
                            name: event.target.value,
                          })
                        }
                      />
                      <SkillCategorySelect
                        ariaLabel="Categoria da habilidade"
                        value={skill.category}
                        onChange={(nextCategory) =>
                          onChange(skill.localId, {
                            category: nextCategory,
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Remover item"
                        className="ml-1 size-7 shrink-0 text-red-300 hover:bg-red-400/10 hover:text-red-200"
                        onClick={() => onRemove(skill.localId)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <AddButton onClick={onAdd}>Adicionar nova habilidade</AddButton>
    </section>
  );
}
