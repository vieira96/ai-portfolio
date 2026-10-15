import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { resumeFixture } from '../../data/resume-fixture';
import { ResumeSkillForm } from './resume-skill-form';

describe('ResumeSkillForm', () => {
  it('edits skills, changes categories and exposes add/remove actions', () => {
    const onChange = vi.fn();
    const onRemove = vi.fn();
    const onAdd = vi.fn();

    render(
      <ResumeSkillForm
        data={resumeFixture}
        draggedItem={null}
        onChange={onChange}
        onRemove={onRemove}
        onAdd={onAdd}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onCategoryDrop={vi.fn()}
        onSkillDrop={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByDisplayValue('NestJS'), {
      target: { value: 'NestJS Atualizado' },
    });
    fireEvent.change(screen.getAllByLabelText('Categoria da habilidade')[1], {
      target: { value: 'MENSAGERIA' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar nova habilidade' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Remover item' })[1]);

    expect(onChange).toHaveBeenCalledWith('skill-nest', {
      name: 'NestJS Atualizado',
    });
    expect(onChange).toHaveBeenCalledWith('skill-nest', {
      category: 'MENSAGERIA',
    });
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith('skill-nest');
  });

  it('starts category drag only from the category handle', () => {
    const onDragStart = vi.fn();

    render(
      <ResumeSkillForm
        data={resumeFixture}
        draggedItem={null}
        onChange={vi.fn()}
        onRemove={vi.fn()}
        onAdd={vi.fn()}
        onDragStart={onDragStart}
        onDragEnd={vi.fn()}
        onCategoryDrop={vi.fn()}
        onSkillDrop={vi.fn()}
      />,
    );

    fireEvent.dragStart(
      screen.getByRole('button', { name: 'Arrastar categoria Backend' }),
      { dataTransfer: { setData: vi.fn() } },
    );

    expect(onDragStart).toHaveBeenCalledOnce();
    expect(onDragStart.mock.calls[0][1]).toEqual({
      type: 'category',
      category: 'BACKEND',
    });
  });
});
