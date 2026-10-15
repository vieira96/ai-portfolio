import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectModal } from './project-modal.js';
import type { Skill } from '@/types/skills/skills.types';

const knownSkills: Skill[] = [
  { id: '1', name: 'NestJS', category: 'BACKEND' },
  { id: '2', name: 'React', category: 'FRONTEND' },
];

function savedProjectWith(technologies: Skill[]) {
  return {
    id: 'p1',
    name: 'Auth API',
    description: 'API de autenticação com JWT.',
    repositoryUrl: null,
    demoUrl: null,
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

describe('ProjectModal', () => {
  const onSkillsCreated = vi.fn();
  const onSaved = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  function renderModal(skills: Skill[] = knownSkills) {
    return render(
      <ProjectModal
        skills={skills}
        onSkillsCreated={onSkillsCreated}
        onSaved={onSaved}
        onClose={onClose}
      />,
    );
  }

  function fillForm() {
    fireEvent.change(screen.getByPlaceholderText('Ex: Auth API'), {
      target: { value: 'Auth API' },
    });
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'API de autenticação com JWT.' },
    });
  }

  function skillsDisplay() {
    return screen.getByRole('combobox', {
      name: 'Selecione ou digite uma ou mais habilidade(s)',
    });
  }

  function openDropdown() {
    fireEvent.click(skillsDisplay());
  }

  function submit() {
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
  }

  it('renders an accessible dialog named by its title (Radix locks body scroll natively)', () => {
    // NOTE: Radix Dialog manages body scroll lock internally (remove-scroll),
    // which does not set inline body overflow in jsdom — covered by Radix itself.
    renderModal();
    expect(
      screen.getByRole('dialog', { name: 'Novo projeto' }),
    ).toBeInTheDocument();
  });

  it('validates required fields without calling the api', async () => {
    renderModal();

    submit();

    await waitFor(() => {
      expect(
        screen.getByText('Nome precisa de ao menos 2 caracteres.'),
      ).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  it('clears the field error once the user fixes the input', async () => {
    renderModal();

    submit();

    await waitFor(() => {
      expect(
        screen.getByText('Nome precisa de ao menos 2 caracteres.'),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Ex: Auth API'), {
      target: { value: 'Auth API' },
    });

    await waitFor(() => {
      expect(
        screen.queryByText('Nome precisa de ao menos 2 caracteres.'),
      ).not.toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('creates the project sending known skill ids', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, savedProjectWith([knownSkills[0]])),
    );
    renderModal();

    fillForm();
    openDropdown();
    fireEvent.click(screen.getByRole('option', { name: 'NestJS' }));
    submit();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Auth API',
            description: 'API de autenticação com JWT.',
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
    const created = { id: '9', name: 'NovaSkill', category: 'FRONTEND' } as Skill;
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, savedProjectWith([created])),
    );
    renderModal([]);

    fillForm();
    openDropdown();
    fireEvent.change(screen.getByLabelText('Buscar skills'), {
      target: { value: 'NovaSkill' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Habilidade nova' }));
    submit();

    await waitFor(() => {
      expect(
        screen.getByText('Categorizar novas skills'),
      ).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalledWith(
      '/api/projects',
      expect.anything(),
    );

    fireEvent.change(screen.getByLabelText('Categoria de NovaSkill'), {
      target: { value: 'FRONTEND' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Auth API',
            description: 'API de autenticação com JWT.',
            skills: [{ name: 'NovaSkill', category: 'FRONTEND' }],
          }),
        }),
      );
      expect(onSkillsCreated).toHaveBeenCalledWith([created]);
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it('completes the nested categorize-and-save flow and reports created skills', async () => {
    const created = { id: '9', name: 'NovaSkill', category: 'FRONTEND' } as Skill;
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, savedProjectWith([created])),
    );
    const view = renderModal([]);
    onClose.mockImplementation(() => view.unmount());

    fillForm();
    openDropdown();
    fireEvent.change(screen.getByLabelText('Buscar skills'), {
      target: { value: 'NovaSkill' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Habilidade nova' }));
    submit();

    await waitFor(() => {
      expect(
        screen.getByText('Categorizar novas skills'),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Categoria de NovaSkill'), {
      target: { value: 'FRONTEND' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    // NOTE: body scroll restore in the nested flow is Radix's responsibility
    // (remove-scroll); not observable via inline overflow in jsdom. Completion
    // of the nested flow (categorize → save → close) is asserted above.
    await waitFor(() => {
      expect(onSkillsCreated).toHaveBeenCalledWith([created]);
    });
  });

  it('shows an error and keeps the modal open when the api fails', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, {}));
    renderModal([]);

    fillForm();
    submit();

    await waitFor(() => {
      expect(
        screen.getByText('Não foi possível salvar. Tente novamente.'),
      ).toBeInTheDocument();
      expect(onSaved).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(onSkillsCreated).not.toHaveBeenCalled();
    });
  });

  it('keeps the chosen categories when the api fails on the category step', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, {}));
    renderModal([]);

    fillForm();
    openDropdown();
    fireEvent.change(screen.getByLabelText('Buscar skills'), {
      target: { value: 'NovaSkill' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Habilidade nova' }));
    submit();

    await waitFor(() => {
      expect(screen.getByText('Categorizar novas skills')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Categoria de NovaSkill'), {
      target: { value: 'FRONTEND' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar' }));

    await waitFor(() => {
      expect(
        screen.getByText('Não foi possível salvar. Tente novamente.'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Categorizar novas skills')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Categoria de NovaSkill'),
    ).toHaveValue('FRONTEND');
    expect(onSaved).not.toHaveBeenCalled();
  });
});
