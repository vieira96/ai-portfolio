import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { resumeFixture } from '../../data/resume-fixture';
import { ResumePersonalForm } from './resume-personal-form';

describe('ResumePersonalForm', () => {
  it('renders the contact data and reports field changes', () => {
    const onChange = vi.fn();

    render(
      <ResumePersonalForm
        data={resumeFixture.personal}
        onChange={onChange}
      />,
    );

    expect(screen.getByDisplayValue('Samuel Vieira')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('samuelvieiradasilva96@hotmail.com'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('Samuel Vieira'), {
      target: { value: 'Samuel Atualizado' },
    });

    expect(onChange).toHaveBeenCalledWith('name', 'Samuel Atualizado');
  });
});
