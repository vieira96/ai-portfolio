import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddSkillForm } from "./add-skill-form.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("AddSkillForm", () => {
  const onAdded = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(201, { id: "1" })),
    );
  });

  function fillName(value: string) {
    fireEvent.change(screen.getByPlaceholderText("Ex: Rust"), {
      target: { value },
    });
  }

  function submit() {
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
  }

  it("creates and reports the new skill on success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, { id: "tech-1", name: "Rust", category: "BACKEND" }),
    );
    render(<AddSkillForm onAdded={onAdded} onClose={onClose} />);

    fillName("Rust");
    submit();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/skills",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "Rust", category: "BACKEND" }),
        }),
      );
      expect(onAdded).toHaveBeenCalledWith({
        id: "tech-1",
        name: "Rust",
        category: "BACKEND",
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("blocks short names without calling the api", async () => {
    render(<AddSkillForm onAdded={onAdded} onClose={onClose} />);

    fillName("R");
    submit();

    await waitFor(() => {
      expect(
        screen.getByText("Nome precisa de ao menos 2 caracteres."),
      ).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
      expect(onAdded).not.toHaveBeenCalled();
    });
  });

  it.each([
    ["Metodologias", "METODOLOGIAS"],
    ["Mensageria", "MENSAGERIA"],
    ["Testes", "TESTES"],
  ])("creates a skill in the %s category", async (label, category) => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, { id: "tech-new", name: "New Skill", category }),
    );
    render(<AddSkillForm onAdded={onAdded} onClose={onClose} />);
    fillName("New Skill");
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: category },
    });
    submit();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/skills",
        expect.objectContaining({
          body: JSON.stringify({ name: "New Skill", category }),
        }),
      );
      expect(onAdded).toHaveBeenCalledWith({
        id: "tech-new",
        name: "New Skill",
        category,
      });
    });
    expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
  });

  it("clears the name error once the user fixes the input", async () => {
    render(<AddSkillForm onAdded={onAdded} onClose={onClose} />);

    fillName("R");
    submit();

    await waitFor(() => {
      expect(
        screen.getByText("Nome precisa de ao menos 2 caracteres."),
      ).toBeInTheDocument();
    });

    fillName("Rust");

    await waitFor(() => {
      expect(
        screen.queryByText("Nome precisa de ao menos 2 caracteres."),
      ).not.toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows a specific message on duplicate", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(409, {}));
    render(<AddSkillForm onAdded={onAdded} onClose={onClose} />);

    fillName("PHP");
    submit();

    await waitFor(() => {
      expect(
        screen.getByText("Essa habilidade já existe."),
      ).toBeInTheDocument();
      expect(onAdded).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
