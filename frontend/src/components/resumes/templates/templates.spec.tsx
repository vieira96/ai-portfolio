import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { resumeFixture } from '../data/resume-fixture';
import { ClassicTemplate } from './classic-template';

describe('resume templates', () => {
  it('does not render empty sections', () => {
    const emptyData = {
      ...resumeFixture,
      personal: { ...resumeFixture.personal, summary: '' },
      experiences: [],
      projects: [],
      educations: [],
      skills: [],
    };

    render(<ClassicTemplate data={emptyData} />);

    expect(screen.getByText('Samuel Vieira')).toBeInTheDocument();
    expect(screen.queryByText('Experiência profissional')).not.toBeInTheDocument();
    expect(screen.queryByText('Projetos')).not.toBeInTheDocument();
    expect(screen.queryByText('Formação acadêmica')).not.toBeInTheDocument();
    expect(screen.queryByText('Competências')).not.toBeInTheDocument();
  });

  it('groups technical skills by category', () => {
    render(<ClassicTemplate data={resumeFixture} />);

    expect(screen.getByText(/Frontend:/)).toBeInTheDocument();
    expect(screen.getByText(/Backend:/)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Node.js, NestJS, Java, Spring Boot, JWT, APIs REST, WebSockets, PHP, Laravel',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Jest')).toBeInTheDocument();
  });

  it('renders the experience description without duplicating highlights', () => {
    render(<ClassicTemplate data={resumeFixture} />);

    expect(
      screen.getByText(
        'Desenvolvimento e manutenção de APIs REST e aplicações web em produção.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(
      'Atuei em plataforma com mais de 25.000 usuários e implementei recursos de gamificação utilizados por mais de 20.000 usuários.',
    )).not.toBeInTheDocument();
  });
});
