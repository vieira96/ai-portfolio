import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resumeFixture } from '../data/resume-fixture';
import { ResumeEditor } from './resume-editor';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/curriculo',
}));

const exportResumePdfMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('../pdf/resume-pdf-export', () => ({
  exportResumePdf: exportResumePdfMock,
}));

function renderEditor() {
  return render(<ResumeEditor initialData={resumeFixture} />);
}

describe('ResumeEditor', () => {
  beforeEach(() => {
    exportResumePdfMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts with the resume data filled in', () => {
    renderEditor();

    expect(screen.getByDisplayValue('Samuel Vieira')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Levante Lab')).toBeInTheDocument();
    expect(screen.getByDisplayValue('AI Portfolio')).toBeInTheDocument();
    expect(screen.getAllByText('Samuel Vieira').length).toBeGreaterThan(0);
  });

  it('keeps phone edits local and does not patch the user profile', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderEditor();

    fireEvent.change(screen.getByLabelText('Telefone'), {
      target: { value: '+55 22 90000-0000' },
    });

    expect(screen.getByLabelText('Telefone')).toHaveValue('+55 22 90000-0000');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('adds a skill only to the local editor state', () => {
    renderEditor();

    expect(screen.getAllByLabelText('Nome da habilidade')).toHaveLength(23);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar nova habilidade' }));

    expect(screen.getAllByLabelText('Nome da habilidade')).toHaveLength(24);
  });

  it('allows adding and removing an experience from the local snapshot', () => {
    renderEditor();

    const initialRemoveCount = screen.getAllByRole('button', { name: 'Remover item' }).length;
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar nova experiência' }));
    expect(screen.getAllByRole('button', { name: 'Remover item' })).toHaveLength(
      initialRemoveCount + 1,
    );

    const removeButtons = screen.getAllByRole('button', { name: 'Remover item' });
    fireEvent.click(removeButtons[removeButtons.length - 1]);

    expect(screen.getAllByRole('button', { name: 'Remover item' })).toHaveLength(
      initialRemoveCount,
    );
    expect(screen.getByDisplayValue('Levante Lab')).toBeInTheDocument();
  });

  it('hides the end date for current experiences', () => {
    renderEditor();

    const currentCheckboxes = screen.getAllByRole('checkbox', { name: 'Trabalho atual' });
    expect(currentCheckboxes[0]).toBeChecked();
    expect(screen.getAllByLabelText('Fim')).toHaveLength(2);

    fireEvent.click(currentCheckboxes[0]);

    expect(currentCheckboxes[0]).not.toBeChecked();
    expect(screen.getAllByLabelText('Fim')).toHaveLength(3);
  });

  it('allows editing and adding skills to an experience', () => {
    renderEditor();

    const experienceSkills = screen.getAllByLabelText('Skill da experiência');
    expect(experienceSkills).toHaveLength(4);

    fireEvent.change(experienceSkills[0], { target: { value: 'NestJS 12' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Adicionar skill na experiência/ })[0]);

    expect(screen.getAllByLabelText('Skill da experiência')).toHaveLength(5);
    expect(screen.getByDisplayValue('NestJS 12')).toBeInTheDocument();
  });

  it('allows reordering skill categories independently', () => {
    renderEditor();

    const categoryHeadings = () =>
      screen
        .getAllByRole('heading', { level: 3 })
        .filter((heading) => ['Frontend', 'Backend', 'Dados'].includes(heading.textContent ?? ''));

    expect(categoryHeadings().map((heading) => heading.textContent)).toEqual([
      'Backend',
      'Frontend',
      'Dados',
    ]);

    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
    };
    fireEvent.dragStart(screen.getByRole('button', { name: 'Arrastar categoria Backend' }), {
      dataTransfer,
    });
    fireEvent.drop(document.querySelector('[data-skill-category="FRONTEND"]')!, {
      dataTransfer,
    });

    expect(categoryHeadings().map((heading) => heading.textContent)).toEqual([
      'Frontend',
      'Backend',
      'Dados',
    ]);
  });

  it('allows reordering skills only through their drag handles', () => {
    renderEditor();

    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
    };
    fireEvent.dragStart(screen.getByRole('button', { name: 'Arrastar habilidade NestJS' }), {
      dataTransfer,
    });
    fireEvent.drop(document.querySelector('[data-skill-row="skill-java"]')!, {
      dataTransfer,
    });

    const backendRows = Array.from(
      document.querySelectorAll('[data-skill-category="BACKEND"] [data-skill-row]'),
    );
    expect(backendRows.map((row) => row.getAttribute('data-skill-row'))).toEqual([
      'skill-node',
      'skill-java',
      'skill-nest',
      'skill-spring',
      'skill-jwt',
      'skill-rest',
      'skill-websockets',
      'skill-php',
      'skill-laravel',
    ]);
    expect(
      document.querySelector('[data-skill-category="TESTES"] [data-skill-row="skill-jest"]'),
    ).toBeInTheDocument();
  });

  it('switches templates without losing the edited data', () => {
    renderEditor();

    fireEvent.change(screen.getByDisplayValue('Samuel Vieira'), {
      target: { value: 'Nome Atualizado' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ATS Técnico/ }));

    expect(screen.getByDisplayValue('Nome Atualizado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ATS Técnico/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getAllByText('Nome Atualizado').length).toBeGreaterThan(0);
  });

  it('exports a PDF without opening the browser print dialog', async () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: /exportar pdf/i }));

    await waitFor(() => expect(exportResumePdfMock).toHaveBeenCalledOnce());
    expect(exportResumePdfMock).toHaveBeenCalledWith(
      expect.objectContaining({ personal: expect.any(Object) }),
      'classic',
    );
  });

});
