import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExperienceForm } from './experience-form.js';
import type { Skill } from '@/types/skills/skills.types';

const knownSkills: Skill[] = [
  { id: '1', name: 'NestJS', category: 'BACKEND' },
  { id: '2', name: 'React', category: 'FRONTEND' },
];

function savedExperienceWith(technologies: Skill[]) {
  return {
    id: 'e1',
    company: 'Levante Lab',
    position: 'Backend Developer',
    description: 'APIs com NestJS e PostgreSQL.',
    startedAt: '2023-01-15',
    endedAt: null,
    technologies,
    createdAt: '',
    updatedAt: '',
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ExperienceForm', () => {
  const onSkillsCreated = vi.fn();
  const onSaved = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  function renderForm() {
    return render(
      <ExperienceForm
        experience={null}
        skills={knownSkills}
        onSkillsCreated={onSkillsCreated}
        onSaved={onSaved}
        onClose={onClose}
      />,
    );
  }

  function fillForm() {
    fireEvent.change(screen.getByPlaceholderText('Ex: Levante Lab'), {
      target: { value: 'Levante Lab' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ex: Backend Developer'), {
      target: { value: 'Backend Developer' },
    });
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'APIs com NestJS e PostgreSQL.' },
    });
    fireEvent.change(screen.getByLabelText('Início'), {
      target: { value: '2023-01-15' },
    });
  }

  function skillsDisplay() {
    return screen.getByRole('combobox', {
      name: 'Selecione ou digite uma ou mais habilidade(s)',
    });
  }

  it('shows validation errors without submitting', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(
        screen.getByText('Empresa precisa de ao menos 2 caracteres.'),
      ).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  it('clears the field error once the user fixes the input', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(
        screen.getByText('Empresa precisa de ao menos 2 caracteres.'),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Ex: Levante Lab'), {
      target: { value: 'Levante Lab' },
    });

    await waitFor(() => {
      expect(
        screen.queryByText('Empresa precisa de ao menos 2 caracteres.'),
      ).not.toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits known skills with ids and notifies', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, savedExperienceWith([knownSkills[0]])),
    );
    renderForm();

    fillForm();
    fireEvent.click(skillsDisplay());
    fireEvent.click(screen.getByRole('option', { name: 'NestJS' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/experiences',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            company: 'Levante Lab',
            position: 'Backend Developer',
            description: 'APIs com NestJS e PostgreSQL.',
            startedAt: '2023-01-15',
            endedAt: null,
            skills: [{ id: '1', name: 'NestJS', category: 'BACKEND' }],
          }),
        }),
      );
      expect(onSkillsCreated).toHaveBeenCalledWith([knownSkills[0]]);
      expect(onSaved).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('asks the category of unknown skills before posting', async () => {
    const created = { id: '9', name: 'Rust', category: 'BACKEND' } as Skill;
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, savedExperienceWith([created])),
    );
    render(
      <ExperienceForm
        experience={null}
        skills={[]}
        onSkillsCreated={onSkillsCreated}
        onSaved={onSaved}
        onClose={onClose}
      />,
    );

    fillForm();
    fireEvent.click(skillsDisplay());
    fireEvent.change(screen.getByLabelText('Buscar skills'), {
      target: { value: 'Rust' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Habilidade nova' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(
        screen.getByText('Categorizar novas skills'),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Categoria de Rust'), {
      target: { value: 'BACKEND' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/experiences',
        expect.objectContaining({
          body: JSON.stringify({
            company: 'Levante Lab',
            position: 'Backend Developer',
            description: 'APIs com NestJS e PostgreSQL.',
            startedAt: '2023-01-15',
            endedAt: null,
            skills: [{ name: 'Rust', category: 'BACKEND' }],
          }),
        }),
      );
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it('closes without submitting on Cancelar', () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
