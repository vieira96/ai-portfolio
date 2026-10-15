import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { resumeFixture } from '../../data/resume-fixture';
import { ResumeExperienceForm } from './resume-experience-form';

describe('ResumeExperienceForm', () => {
  it('edits current status, experience fields and experience skills', () => {
    const onChange = vi.fn();
    const onChangeSkill = vi.fn();
    const onAddSkill = vi.fn();
    const onRemoveSkill = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const onSkillDrop = vi.fn();

    render(
      <ResumeExperienceForm
        experiences={resumeFixture.experiences}
        onChange={onChange}
        onChangeSkill={onChangeSkill}
        onAddSkill={onAddSkill}
        onRemoveSkill={onRemoveSkill}
        draggedItem={null}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onSkillDrop={onSkillDrop}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onMove={vi.fn()}
      />,
    );

    expect(screen.getAllByLabelText('Fim')).toHaveLength(1);
    fireEvent.click(
      screen.getAllByRole('checkbox', { name: 'Trabalho atual' })[0],
    );
    expect(onChange).toHaveBeenCalledWith('experience-1', { endedAt: '' });

    fireEvent.change(screen.getAllByLabelText('Skill da experiência')[0], {
      target: { value: 'NestJS Atualizado' },
    });
    expect(onChangeSkill).toHaveBeenCalledWith('experience-1', 'skill-nest', {
      name: 'NestJS Atualizado',
    });

    expect(screen.queryByText('Realizações e impacto')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Adicionar realização' })).not.toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole('button', {
        name: '+ Adicionar skill na experiência',
      })[0],
    );
    expect(onAddSkill).toHaveBeenCalledWith('experience-1');

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Remover skill da experiência',
      })[0],
    );
    expect(onRemoveSkill).toHaveBeenCalledWith('experience-1', 'skill-nest');

    expect(screen.getByRole('button', { name: 'Arrastar tecnologia NestJS' })).toBeInTheDocument();
    fireEvent.dragStart(screen.getByRole('button', { name: 'Arrastar tecnologia NestJS' }));
    expect(onDragStart).toHaveBeenCalled();
  });
});
