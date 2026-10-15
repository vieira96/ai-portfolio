import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadResumeInitialData } from './resume-api-loader';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getSkills: vi.fn(),
  getExperiences: vi.fn(),
  getProjects: vi.fn(),
  getEducations: vi.fn(),
}));

vi.mock('@/lib/auth/auth', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/skills/skills', () => ({ getSkills: mocks.getSkills }));
vi.mock('@/lib/experiences/experiences', () => ({
  getExperiences: mocks.getExperiences,
}));
vi.mock('@/lib/projects/projects', () => ({
  getProjects: mocks.getProjects,
}));
vi.mock('@/lib/educations/educations', () => ({
  getEducations: mocks.getEducations,
}));

describe('loadResumeInitialData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      id: 'user-1',
      name: 'Pessoa Teste',
      email: 'pessoa@example.com',
      headline: null,
      bio: null,
      location: null,
      githubUrl: null,
      linkedinUrl: null,
      portfolioUrl: null,
      avatarUrl: null,
    });
    mocks.getSkills.mockResolvedValue([]);
    mocks.getExperiences.mockImplementation((page: number) =>
      Promise.resolve({
        data: [{
          id: `experience-${page}`,
          company: `Empresa ${page}`,
          position: 'Desenvolvedor',
          description: '',
          startedAt: '2024-01-01',
          endedAt: null,
          technologies: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        }],
        total: 2,
        page,
        totalPages: 2,
      }),
    );
    mocks.getProjects.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });
    mocks.getEducations.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });
  });

  it('loads every page and preserves API order', async () => {
    const data = await loadResumeInitialData();

    expect(data.experiences.map((item) => item.company)).toEqual([
      'Empresa 1',
      'Empresa 2',
    ]);
    expect(mocks.getExperiences).toHaveBeenNthCalledWith(1, 1, 20, true);
    expect(mocks.getExperiences).toHaveBeenNthCalledWith(2, 2, 20, true);
    expect(mocks.getProjects).toHaveBeenCalledWith(1, 20, true);
    expect(mocks.getEducations).toHaveBeenCalledWith(1, 20, true);
    expect(mocks.getSkills).toHaveBeenCalledWith(true);
  });

  it('does not silently replace an API failure with the fixture', async () => {
    mocks.getSkills.mockRejectedValue(new Error('API indisponível'));

    await expect(loadResumeInitialData()).rejects.toThrow('API indisponível');
  });

  it('fails when the authenticated profile is unavailable', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(loadResumeInitialData()).rejects.toThrow(
      'Não foi possível carregar o perfil autenticado.',
    );
  });
});
