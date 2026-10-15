import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SkillChip } from './skill-chip.js';

describe('SkillChip', () => {
  it('renders the label without remove button by default', () => {
    render(<SkillChip label="PHP" category="BACKEND" />);

    expect(screen.getByText('PHP')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remover PHP' }),
    ).not.toBeInTheDocument();
  });

  it('emits the delete event on confirm', () => {
    const onDeleteConfirm = vi.fn();
    render(
      <SkillChip
        label="PHP"
        category="BACKEND"
        onDeleteConfirm={onDeleteConfirm}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remover PHP' }));

    expect(
      screen.getByRole('dialog', { name: 'Excluir habilidade' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(onDeleteConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes the confirm without emitting on cancel', () => {
    const onDeleteConfirm = vi.fn();
    render(
      <SkillChip
        label="PHP"
        category="BACKEND"
        onDeleteConfirm={onDeleteConfirm}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remover PHP' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onDeleteConfirm).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('dialog', { name: 'Excluir habilidade' }),
    ).not.toBeInTheDocument();
  });
});
