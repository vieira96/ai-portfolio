import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectForm } from "./project-form.js";
import type { Skill } from "@/types/skills/skills.types";

const knownSkills: Skill[] = [
  { id: "1", name: "NestJS", category: "BACKEND" },
  { id: "2", name: "React", category: "FRONTEND" },
];

function savedProjectWith(technologies: Skill[]) {
  return {
    id: "p1",
    name: "Auth API",
    description: "API de autenticação com JWT.",
    repositoryUrl: null,
    demoUrl: null,
    technologies,
    createdAt: "",
    updatedAt: "",
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ProjectForm", () => {
  const onSkillsCreated = vi.fn();
  const onSaved = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  function renderForm() {
    return render(
      <ProjectForm
        project={null}
        skills={knownSkills}
        onSkillsCreated={onSkillsCreated}
        onSaved={onSaved}
        onClose={onClose}
      />,
    );
  }

  function skillsDisplay() {
    return screen.getByRole("combobox", {
      name: "Selecione ou digite uma ou mais habilidade(s)",
    });
  }

  it("applies an AI suggestion to the project description only on confirmation", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, { suggestion: "Descrição revisada do projeto." }),
    );
    renderForm();
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "API de autenticação com JWT." },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Aprimorar texto com IA" }),
    );
    expect(
      await screen.findByText("Descrição revisada do projeto."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toHaveValue(
      "API de autenticação com JWT.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Usar sugestão" }));
    expect(screen.getByLabelText("Descrição")).toHaveValue(
      "Descrição revisada do projeto.",
    );
  });

  it("shows validation errors without submitting", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(
        screen.getByText("Nome precisa de ao menos 2 caracteres."),
      ).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  it("clears the field error once the user fixes the input", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(
        screen.getByText("Nome precisa de ao menos 2 caracteres."),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Ex: Auth API"), {
      target: { value: "Auth API" },
    });

    await waitFor(() => {
      expect(
        screen.queryByText("Nome precisa de ao menos 2 caracteres."),
      ).not.toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits known skills with ids and notifies", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, savedProjectWith([knownSkills[0]])),
    );
    renderForm();

    fireEvent.change(screen.getByPlaceholderText("Ex: Auth API"), {
      target: { value: "Auth API" },
    });
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "API de autenticação com JWT." },
    });
    fireEvent.click(skillsDisplay());
    fireEvent.click(screen.getByRole("option", { name: "NestJS" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/projects",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "Auth API",
            description: "API de autenticação com JWT.",
            skills: [{ id: "1", name: "NestJS", category: "BACKEND" }],
          }),
        }),
      );
      expect(onSkillsCreated).toHaveBeenCalledWith([knownSkills[0]]);
      expect(onSaved).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("asks the category of unknown skills before posting", async () => {
    const created = {
      id: "9",
      name: "NovaSkill",
      category: "FRONTEND",
    } as Skill;
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, savedProjectWith([created])),
    );
    render(
      <ProjectForm
        project={null}
        skills={[]}
        onSkillsCreated={onSkillsCreated}
        onSaved={onSaved}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Ex: Auth API"), {
      target: { value: "Auth API" },
    });
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "API de autenticação com JWT." },
    });
    fireEvent.click(skillsDisplay());
    fireEvent.change(screen.getByLabelText("Buscar skills"), {
      target: { value: "NovaSkill" },
    });
    fireEvent.click(screen.getByRole("option", { name: "Habilidade nova" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(screen.getByText("Categorizar novas skills")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Categoria de NovaSkill"), {
      target: { value: "FRONTEND" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar e salvar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/projects",
        expect.objectContaining({
          body: JSON.stringify({
            name: "Auth API",
            description: "API de autenticação com JWT.",
            skills: [{ name: "NovaSkill", category: "FRONTEND" }],
          }),
        }),
      );
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it("closes without submitting on Cancelar", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
