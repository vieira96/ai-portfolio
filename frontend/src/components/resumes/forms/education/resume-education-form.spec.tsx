import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { resumeFixture } from '../../data/resume-fixture';
import { ResumeEducationForm } from './resume-education-form';

describe('ResumeEducationForm', () => {
  it('edits education fields and exposes list actions', () => {
    const onChange = vi.fn();
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onMove = vi.fn();

    render(
      <ResumeEducationForm
        educations={resumeFixture.educations}
        onChange={onChange}
        onAdd={onAdd}
        onRemove={onRemove}
        onMove={onMove}
      />,
    );

    fireEvent.change(screen.getByDisplayValue('Análise e Desenvolvimento de Sistemas'), {
      target: { value: 'Engenharia de Software' },
    });
    fireEvent.change(screen.getByDisplayValue('2029-06'), {
      target: { value: '2029-07' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar nova formação' }));

    expect(onChange).toHaveBeenCalledWith('education-1', {
      course: 'Engenharia de Software',
    });
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('education-1', {
      expectedEnd: '2029-07-01',
    });
  });
});
