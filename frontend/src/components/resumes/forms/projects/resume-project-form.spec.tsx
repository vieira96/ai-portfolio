import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { resumeFixture } from '../../data/resume-fixture';
import { ResumeProjectForm } from './resume-project-form';

describe('ResumeProjectForm', () => {
  it('edits a project and exposes add, remove and move actions', () => {
    const onChange = vi.fn();
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onMove = vi.fn();

    render(
      <ResumeProjectForm
        projects={resumeFixture.projects.slice(0, 2)}
        onChange={onChange}
        onAdd={onAdd}
        onRemove={onRemove}
        onMove={onMove}
      />,
    );

    fireEvent.change(screen.getByDisplayValue('AI Portfolio'), {
      target: { value: 'AI Portfolio Atualizado' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar novo projeto' }));

    expect(onChange).toHaveBeenCalledWith('project-1', {
      name: 'AI Portfolio Atualizado',
    });
    expect(onAdd).toHaveBeenCalledOnce();

    const removeButtons = screen.getAllByRole('button', {
      name: 'Remover item',
    });
    fireEvent.click(removeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith('project-1');

    fireEvent.click(screen.getAllByRole('button', { name: 'Mover para baixo' })[0]);
    expect(onMove).toHaveBeenCalledWith(0, 1);
  });
});
