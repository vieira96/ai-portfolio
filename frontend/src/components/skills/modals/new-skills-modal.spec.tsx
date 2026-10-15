import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NewSkillsModal } from './new-skills-modal';

describe('NewSkillsModal', () => {
  const unknownSkills = ['Rust', 'Docker'];
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    render(
      <NewSkillsModal
        unknownSkills={unknownSkills}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
  });

  it('renders a select for each unknown skill', () => {
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
    expect(screen.getByText('Rust')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
  });

  it('defaults category to BACKEND', () => {
    const selects = screen.getAllByRole('combobox');
    expect(selects[0]).toHaveValue('BACKEND');
    expect(selects[1]).toHaveValue('BACKEND');
  });

  it('calls onConfirm with skills and selected categories', () => {
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'FRONTEND' } });
    fireEvent.change(selects[1], { target: { value: 'DEVOPS' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar' }));

    expect(onConfirm).toHaveBeenCalledWith([
      { name: 'Rust', category: 'FRONTEND' },
      { name: 'Docker', category: 'DEVOPS' },
    ]);
  });

  it('calls onCancel when clicking Voltar', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onCancel when pressing Escape', () => {
    fireEvent.keyDown(screen.getByRole('dialog'), {
      key: 'Escape',
      code: 'Escape',
    });
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders an accessible dialog named by its title (Radix locks body scroll natively)', () => {
    expect(
      screen.getByRole('dialog', { name: 'Categorizar novas skills' }),
    ).toBeInTheDocument();
  });

  it('renders the error when provided', () => {
    const { unmount } = render(
      <NewSkillsModal
        unknownSkills={unknownSkills}
        error="Não foi possível salvar. Tente novamente."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(
      screen.getByText('Não foi possível salvar. Tente novamente.'),
    ).toBeInTheDocument();
    unmount();
  });
});