import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillsSection } from './skills-section.js';
import type { Skill } from '@/types/skills/skills.types';

const initial: Skill[] = [
  { id: '1', name: 'PHP', category: 'BACKEND' },
  { id: '2', name: 'React', category: 'FRONTEND' },
];

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderWithState(initialSkills: Skill[] = initial) {
  function Harness() {
    const [skills, setSkillsState] = useState<Skill[]>(initialSkills);

    function onAddSkills(newSkills: Skill[]) {
      setSkillsState((current) => [...current, ...newSkills]);
    }

    function onSetSkills(
      next: Skill[] | ((current: Skill[]) => Skill[]),
    ) {
      setSkillsState(next);
    }

    return (
      <SkillsSection
        skills={skills}
        onAddSkills={onAddSkills}
        onSetSkills={onSetSkills}
      />
    );
  }

  return render(<Harness />);
}

describe('SkillsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('deletes through confirm and removes from the list', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    renderWithState();

    fireEvent.click(screen.getByRole('button', { name: 'Remover PHP' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/skills/1', {
        method: 'DELETE',
      });
      expect(screen.queryByText('PHP')).not.toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });

  it('restores on delete failure', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 500 }));
    renderWithState();

    fireEvent.click(screen.getByRole('button', { name: 'Remover PHP' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(screen.getByText('PHP')).toBeInTheDocument();
    });
  });

  it('adds through the modal', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, { id: '3', name: 'Rust', category: 'BACKEND' }),
    );
    renderWithState();

    fireEvent.click(
      screen.getByRole('button', { name: 'Adicionar habilidade' }),
    );
    fireEvent.change(screen.getByPlaceholderText('Ex: Rust'), {
      target: { value: 'Rust' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => {
      expect(screen.getByText('Rust')).toBeInTheDocument();
    });
  });
});
