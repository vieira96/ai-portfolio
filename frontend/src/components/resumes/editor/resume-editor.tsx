'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileDown, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { createResumeDraft } from '../data/resume-mapper';
import { exportResumePdf } from '../pdf/resume-pdf-export';
import { resumeTemplateRegistry } from '../templates/resume-template-registry';
import { getSkillCategoryOrder } from '../skills/resume-skill-groups';
import { ResumePersonalForm } from '../forms/personal/resume-personal-form';
import { ResumeExperienceForm } from '../forms/experiences/resume-experience-form';
import { ResumeProjectForm } from '../forms/projects/resume-project-form';
import { ResumeEducationForm } from '../forms/education/resume-education-form';
import {
  ResumeSkillForm,
  type ResumeDragItem,
} from '../forms/skills/resume-skill-form';
import type {
  ResumeData,
  ResumeEducation,
  ResumeExperience,
  ResumePersonalData,
  ResumeProject,
  ResumeSkill,
  ResumeTemplateId,
} from '@/types/resumes/resume.types';
import type { SkillCategory } from '@/types/skills/skills.types';

type ExportStatus = 'idle' | 'exporting' | 'error';

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ResumeEditor({ initialData }: { initialData: ResumeData }) {
  const [data, setData] = useState<ResumeData>(() =>
    createResumeDraft(initialData),
  );
  const [templateId, setTemplateId] = useState<ResumeTemplateId>('classic');
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [draggedItem, setDraggedItem] = useState<ResumeDragItem | null>(null);
  const selectedTemplate = resumeTemplateRegistry[templateId];
  const Template = selectedTemplate.component;

  const orderedSections = useMemo(
    () => [...data.sections].sort((a, b) => a.order - b.order),
    [data.sections],
  );

  function updatePersonal(field: keyof ResumePersonalData, value: string) {
    setData((current) => ({
      ...current,
      personal: { ...current.personal, [field]: value },
    }));
  }

  function updateExperience(id: string, patch: Partial<ResumeExperience>) {
    setData((current) => ({
      ...current,
      experiences: current.experiences.map((item) =>
        item.localId === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function updateExperienceSkill(
    experienceId: string,
    skillId: string,
    patch: Partial<ResumeSkill>,
  ) {
    setData((current) => ({
      ...current,
      experiences: current.experiences.map((experience) =>
        experience.localId === experienceId
          ? {
              ...experience,
              technologies: experience.technologies.map((skill) =>
                skill.localId === skillId ? { ...skill, ...patch } : skill,
              ),
            }
          : experience,
      ),
    }));
  }

  function addExperienceSkill(experienceId: string) {
    setData((current) => ({
      ...current,
      experiences: current.experiences.map((experience) =>
        experience.localId === experienceId
          ? {
              ...experience,
              technologies: [
                ...experience.technologies,
                {
                  localId: createLocalId('experience-skill'),
                  name: '',
                  category: 'BACKEND',
                },
              ],
            }
          : experience,
      ),
    }));
  }

  function removeExperienceSkill(experienceId: string, skillId: string) {
    setData((current) => ({
      ...current,
      experiences: current.experiences.map((experience) =>
        experience.localId === experienceId
          ? {
              ...experience,
              technologies: experience.technologies.filter((skill) => skill.localId !== skillId),
            }
          : experience,
      ),
    }));
  }

  function updateProject(id: string, patch: Partial<ResumeProject>) {
    setData((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        item.localId === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function updateEducation(id: string, patch: Partial<ResumeEducation>) {
    setData((current) => ({
      ...current,
      educations: current.educations.map((item) =>
        item.localId === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function updateSkill(id: string, patch: Partial<ResumeSkill>) {
    setData((current) => ({
      ...current,
      skills: current.skills.map((item) =>
        item.localId === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function startDragging(
    event: React.DragEvent<HTMLButtonElement>,
    item: ResumeDragItem,
  ) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.type);
    setDraggedItem(item);
  }

  function stopDragging() {
    setDraggedItem(null);
  }

  function reorderSkillCategory(source: SkillCategory, target: SkillCategory) {
    setData((current) => {
      const order = getSkillCategoryOrder(current);
      const visibleCategories = order.filter((item) =>
        current.skills.some((skill) => skill.category === item),
      );
      const sourceIndex = visibleCategories.indexOf(source);
      const targetIndex = visibleCategories.indexOf(target);
      if (sourceIndex < 0 || targetIndex < 0 || source === target) return current;

      const nextVisibleCategories = [...visibleCategories];
      nextVisibleCategories.splice(sourceIndex, 1);
      nextVisibleCategories.splice(targetIndex, 0, source);
      const hiddenCategories = order.filter((category) => !visibleCategories.includes(category));

      return {
        ...current,
        skillCategoryOrder: [...nextVisibleCategories, ...hiddenCategories],
      };
    });
  }

  function reorderSkill(
    sourceCategory: SkillCategory,
    sourceSkillId: string,
    targetCategory: SkillCategory,
    targetSkillId: string,
  ) {
    if (sourceCategory !== targetCategory || sourceSkillId === targetSkillId) return;

    setData((current) => {
      const categorySkills = current.skills.filter((skill) => skill.category === sourceCategory);
      const sourceIndex = categorySkills.findIndex((skill) => skill.localId === sourceSkillId);
      const targetIndex = categorySkills.findIndex((skill) => skill.localId === targetSkillId);
      if (sourceIndex < 0 || targetIndex < 0) return current;

      const nextCategorySkills = [...categorySkills];
      const [sourceSkill] = nextCategorySkills.splice(sourceIndex, 1);
      nextCategorySkills.splice(targetIndex, 0, sourceSkill);
      let categoryIndex = 0;

      return {
        ...current,
        skills: current.skills.map((skill) => {
          if (skill.category !== sourceCategory) return skill;
          return nextCategorySkills[categoryIndex++];
        }),
      };
    });
  }

  function reorderExperienceSkill(
    experienceId: string,
    sourceSkillId: string,
    targetSkillId: string,
  ) {
    if (sourceSkillId === targetSkillId) return;

    setData((current) => ({
      ...current,
      experiences: current.experiences.map((experience) => {
        if (experience.localId !== experienceId) return experience;

        const sourceIndex = experience.technologies.findIndex(
          (skill) => skill.localId === sourceSkillId,
        );
        const targetIndex = experience.technologies.findIndex(
          (skill) => skill.localId === targetSkillId,
        );
        if (sourceIndex < 0 || targetIndex < 0) return experience;

        const technologies = [...experience.technologies];
        const [sourceSkill] = technologies.splice(sourceIndex, 1);
        technologies.splice(targetIndex, 0, sourceSkill);
        return { ...experience, technologies };
      }),
    }));
  }

  function handleSkillDrop(
    event: React.DragEvent<HTMLDivElement>,
    targetCategory: SkillCategory,
    targetSkillId: string,
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (draggedItem?.type === 'skill') {
      reorderSkill(draggedItem.category, draggedItem.skillId, targetCategory, targetSkillId);
    }
    stopDragging();
  }

  function handleExperienceSkillDrop(
    event: React.DragEvent<HTMLDivElement>,
    experienceId: string,
    targetSkillId: string,
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (
      draggedItem?.type === 'experience-skill'
      && draggedItem.experienceId === experienceId
    ) {
      reorderExperienceSkill(
        experienceId,
        draggedItem.skillId,
        targetSkillId,
      );
    }
    stopDragging();
  }

  function handleCategoryDrop(
    event: React.DragEvent<HTMLDivElement>,
    targetCategory: SkillCategory,
  ) {
    event.preventDefault();
    if (draggedItem?.type === 'category') {
      reorderSkillCategory(draggedItem.category, targetCategory);
    }
    stopDragging();
  }

  function removeItem(
    key: 'experiences' | 'projects' | 'educations' | 'skills',
    id: string,
  ) {
    setData((current) => ({
      ...current,
      [key]: current[key].filter((item) => item.localId !== id),
    }));
  }

  function moveItem(
    key: 'experiences' | 'projects' | 'educations' | 'skills',
    index: number,
    direction: -1 | 1,
  ) {
    setData((current) => {
      const next = [...current[key]];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, [key]: next };
    });
  }

  function addExperience() {
    setData((current) => ({
      ...current,
      experiences: [
        ...current.experiences,
        {
          localId: createLocalId('experience'),
          company: '',
          position: '',
          description: '',
          highlights: [],
          startedAt: '',
          endedAt: null,
          technologies: [],
        },
      ],
    }));
  }

  function addProject() {
    setData((current) => ({
      ...current,
      projects: [
        ...current.projects,
        {
          localId: createLocalId('project'),
          name: '',
          description: '',
          repositoryUrl: '',
          demoUrl: '',
          technologies: [],
        },
      ],
    }));
  }

  function addEducation() {
    setData((current) => ({
      ...current,
      educations: [
        ...current.educations,
        {
          localId: createLocalId('education'),
          institution: '',
          course: '',
          degree: null,
          description: '',
          startedAt: '',
          endedAt: null,
          expectedEnd: null,
        },
      ],
    }));
  }

  function addSkill() {
    setData((current) => ({
      ...current,
      skills: [
        ...current.skills,
        {
          localId: createLocalId('skill'),
          name: '',
          category: current.skillCategoryOrder[0] ?? 'BACKEND',
        },
      ],
    }));
  }

  async function handleExport() {
    setExportStatus('exporting');
    try {
      await exportResumePdf(data, templateId);
      setExportStatus('idle');
    } catch {
      setExportStatus('error');
    }
  }

  return (
    <main className="resume-editor-page mx-auto max-w-[1600px] px-4 pb-8 pt-4 sm:px-6 sm:pt-6">
      <div className="resume-editor-toolbar mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar para o dashboard
          </Link>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-300">Currículo ATS</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">Monte seu currículo</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Os dados começam preenchidos com o seu perfil. Edite esta versão sem alterar o cadastro original.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleExport} disabled={exportStatus === 'exporting'}>
            <FileDown data-icon="inline-start" aria-hidden="true" />
            {exportStatus === 'exporting' ? 'Gerando PDF...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>
      {exportStatus === 'error' && (
        <p className="mb-4 text-right text-sm text-red-300" role="alert">
          Não foi possível gerar o PDF. Tente novamente.
        </p>
      )}

      <div className="resume-editor-grid grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(420px,3fr)]">
        <div className="resume-form-panel flex flex-col gap-5">
          <ResumePersonalForm data={data.personal} onChange={updatePersonal} />
          <ResumeExperienceForm
            experiences={data.experiences}
            onChange={updateExperience}
            onChangeSkill={updateExperienceSkill}
            onAddSkill={addExperienceSkill}
            onRemoveSkill={removeExperienceSkill}
            draggedItem={draggedItem}
            onDragStart={startDragging}
            onDragEnd={stopDragging}
            onSkillDrop={handleExperienceSkillDrop}
            onAdd={addExperience}
            onRemove={(id) => removeItem('experiences', id)}
            onMove={(index, direction) =>
              moveItem('experiences', index, direction)
            }
          />
          <ResumeProjectForm
            projects={data.projects}
            onChange={updateProject}
            onAdd={addProject}
            onRemove={(id) => removeItem('projects', id)}
            onMove={(index, direction) =>
              moveItem('projects', index, direction)
            }
          />
          <ResumeEducationForm
            educations={data.educations}
            onChange={updateEducation}
            onAdd={addEducation}
            onRemove={(id) => removeItem('educations', id)}
            onMove={(index, direction) =>
              moveItem('educations', index, direction)
            }
          />
          <ResumeSkillForm
            data={data}
            draggedItem={draggedItem}
            onChange={updateSkill}
            onRemove={(id) => removeItem('skills', id)}
            onAdd={addSkill}
            onDragStart={startDragging}
            onDragEnd={stopDragging}
            onCategoryDrop={handleCategoryDrop}
            onSkillDrop={handleSkillDrop}
          />
        </div>

        <aside className="resume-preview-panel sticky top-40 flex flex-col gap-4">
          <section className="rounded-2xl border border-line bg-surface/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-blue-300">Preview ao vivo</p>
                <h2 className="mt-1 text-lg font-bold text-white">Escolha um modelo</h2>
              </div>
              <LayoutTemplate className="size-5 text-blue-300" aria-hidden="true" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(resumeTemplateRegistry) as ResumeTemplateId[]).map((id) => {
                const template = resumeTemplateRegistry[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTemplateId(id)}
                    aria-pressed={templateId === id}
                    className={`rounded-xl border p-2 text-left transition ${
                      templateId === id
                        ? 'border-blue-400 bg-blue-400/10'
                        : 'border-line bg-ink/30 hover:border-slate-500'
                    }`}
                  >
                    <span className="block text-xs font-semibold text-white">{template.name}</span>
                    <span className="mt-1 block text-[10px] leading-tight text-slate-500">{template.description}</span>
                  </button>
                );
              })}
            </div>
          </section>
          <div className="resume-paper-wrap rounded-2xl border border-line bg-slate-800/60 p-3 shadow-2xl shadow-black/20">
            <div className="resume-paper">
              <Template data={data} />
            </div>
          </div>
          <p className="text-center text-xs text-slate-500">Modelo atual: {selectedTemplate.name}. O conteúdo fica separado do seu cadastro original.</p>
        </aside>
      </div>
      <div className="sr-only" aria-live="polite">{orderedSections.length} seções configuradas</div>
    </main>
  );
}
