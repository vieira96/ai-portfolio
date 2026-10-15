import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  SkillsSelection,
  dedupeSkillNames,
  findKnownSkill,
  removeSkillToken,
  splitSkillNames,
} from './skills-selection';
import type { SelectedSkill } from './skills-selection';
import type { Skill } from '@/types/skills/skills.types';

const skills: Skill[] = [
  { id: '1', name: 'NestJS', category: 'BACKEND' },
  { id: '2', name: 'React', category: 'FRONTEND' },
  { id: '3', name: 'Docker', category: 'DEVOPS' },
];

describe('skill matching helpers', () => {
  it('splits comma text trimming empties', () => {
    expect(splitSkillNames('NestJS, Docker ,, ')).toEqual([
      'NestJS',
      'Docker',
    ]);
  });

  it('dedupes case-insensitively keeping the first occurrence', () => {
    expect(dedupeSkillNames(['NestJS', 'nestjs', 'React'])).toEqual([
      'NestJS',
      'React',
    ]);
  });

  it('finds known skills case-insensitively with canonical data', () => {
    expect(findKnownSkill(skills, 'nestjs')).toEqual(skills[0]);
    expect(findKnownSkill(skills, 'Unknown')).toBeUndefined();
  });

  it('removes the matching token keeping the comma format', () => {
    expect(removeSkillToken('NestJS, React, ', 'NestJS')).toBe('React, ');
    expect(removeSkillToken('NestJS, ', 'nestjs')).toBe('');
    expect(removeSkillToken('React, ', 'NestJS')).toBe('React, ');
  });
});

describe('SkillsSelection', () => {
  function renderSelection(initial: SelectedSkill[] = []) {
    function Harness() {
      const [selected, setSelected] = useState<SelectedSkill[]>(initial);
      return (
        <SkillsSelection
          skills={skills}
          selected={selected}
          onChange={setSelected}
        />
      );
    }
    return render(<Harness />);
  }

  function display() {
    return screen.getByRole('combobox', {
      name: 'Selecione ou digite uma ou mais habilidade(s)',
    });
  }

  it('shows placeholder text when nothing is selected', () => {
    renderSelection();

    expect(
      screen.getByText('Ex: NestJS, Docker, Redis'),
    ).toBeInTheDocument();
  });

  it('does not open suggestions on focus alone', () => {
    renderSelection();

    fireEvent.focus(display());

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('opens suggestions when clicking the display', () => {
    renderSelection();

    fireEvent.click(display());

    expect(screen.getByRole('option', { name: 'NestJS' })).toBeInTheDocument();
  });

  it('clears the search text when the popover closes and reopens empty', () => {
    renderSelection();

    fireEvent.click(display());
    fireEvent.change(screen.getByLabelText('Buscar skills'), {
      target: { value: 'zzz' },
    });
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    fireEvent.click(display());

    expect(screen.getByLabelText('Buscar skills')).toHaveValue('');
  });

  it('selects an option via click without duplicating', () => {
    renderSelection();

    fireEvent.click(display());
    fireEvent.click(screen.getByRole('option', { name: 'NestJS' }));
    fireEvent.click(screen.getByRole('option', { name: 'React' }));

    expect(display()).toHaveTextContent('NestJS');
    expect(display()).toHaveTextContent('React');
  });

  it('marks selected options checked and unchecks on second click', () => {
    renderSelection();

    fireEvent.click(display());
    fireEvent.click(screen.getByRole('option', { name: 'NestJS' }));
    expect(screen.getByRole('option', { name: 'NestJS' })).toHaveAttribute(
      'data-checked',
      'true',
    );

    fireEvent.click(screen.getByRole('option', { name: 'NestJS' }));
    expect(
      screen.queryByRole('button', { name: 'Remover NestJS' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'NestJS' })).toHaveAttribute(
      'data-checked',
      'false',
    );
  });

  it('removes a chip with its X button', () => {
    renderSelection([{ id: '1', name: 'NestJS', category: 'BACKEND' }]);

    fireEvent.click(screen.getByRole('button', { name: 'Remover NestJS' }));

    expect(
      screen.queryByRole('button', { name: 'Remover NestJS' }),
    ).not.toBeInTheDocument();
  });

  it('shows a neutral chip for skills without category', () => {
    renderSelection([{ name: 'NovaSkill' }]);

    expect(screen.getByText('NovaSkill')).toBeInTheDocument();
  });

  it('shows +N overflow and opens from it', () => {
    renderSelection([
      { id: '1', name: 'NestJS', category: 'BACKEND' },
      { id: '2', name: 'React', category: 'FRONTEND' },
      { id: '3', name: 'Docker', category: 'DEVOPS' },
    ]);

    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('+1'));

    expect(screen.getByRole('option', { name: 'NestJS' })).toBeInTheDocument();
  });

  it('creates an uncategorized skill from unmatched search text', () => {
    renderSelection();

    fireEvent.click(display());
    const search = screen.getByLabelText('Buscar skills');
    fireEvent.change(search, { target: { value: 'Rust' } });

    expect(screen.queryByText('Criar "Rust"')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'Habilidade nova' }));

    expect(display()).toHaveTextContent('Rust');
  });

  it('shows an empty state when nothing matches', () => {
    renderSelection();

    fireEvent.click(display());
    const search = screen.getByLabelText('Buscar skills');
    fireEvent.change(search, { target: { value: 'zzz-no-match' } });

    expect(
      screen.getByText('Habilidade nova'),
    ).toBeInTheDocument();
  });
});
