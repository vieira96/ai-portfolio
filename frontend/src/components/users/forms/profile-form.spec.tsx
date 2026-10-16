import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { AuthenticatedUserProfile } from "@/types/users/users.types";
import { ProfileForm } from "./profile-form.js";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const initial: AuthenticatedUserProfile = {
  id: "user-id-1",
  name: "Test User",
  email: "voce@example.com",
  headline: "Old Headline",
  bio: null,
  location: null,
  githubUrl: null,
  linkedinUrl: null,
  portfolioUrl: null,
  avatarUrl: null,
  phone: null,
};

function fieldByLabel(label: string): HTMLElement {
  const labels = screen.getAllByText(label, { selector: "span" });
  const container = labels[0].closest("label");
  if (!container) {
    throw new Error(`Field not found: ${label}`);
  }
  const input = container.querySelector("input,textarea");
  if (!input) {
    throw new Error(`Input not found: ${label}`);
  }
  return input as HTMLElement;
}

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    );
  });

  it("prefills fields with the initial profile", () => {
    render(<ProfileForm initial={initial} />);

    expect(fieldByLabel("Nome")).toHaveValue("Test User");
    expect(fieldByLabel("Headline")).toHaveValue("Old Headline");
    expect(fieldByLabel("Bio")).toHaveValue("");
    expect(fieldByLabel("Telefone")).toHaveValue("");
  });

  it("applies an AI headline suggestion only after confirmation", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ suggestion: "Headline revisada" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<ProfileForm initial={initial} />);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Aprimorar texto com IA" })[0],
    );
    expect(await screen.findByText("Headline revisada")).toBeInTheDocument();
    expect(fieldByLabel("Headline")).toHaveValue("Old Headline");

    fireEvent.click(screen.getByRole("button", { name: "Usar sugestão" }));
    expect(fieldByLabel("Headline")).toHaveValue("Headline revisada");
  });

  it("applies an AI bio suggestion to the form state without saving", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ suggestion: "Bio revisada." }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<ProfileForm initial={{ ...initial, bio: "Bio original." }} />);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Aprimorar texto com IA" })[1],
    );
    expect(await screen.findByText("Bio revisada.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Usar sugestão" }));

    expect(fieldByLabel("Bio")).toHaveValue("Bio revisada.");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("prefills, edits and submits the authenticated phone value", async () => {
    render(
      <ProfileForm initial={{ ...initial, phone: "+55 21 99999-9999" }} />,
    );

    expect(fieldByLabel("Telefone")).toHaveValue("+55 21 99999-9999");
    fireEvent.change(fieldByLabel("Telefone"), {
      target: { value: "+55 21 98888-8888" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/users/me",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"phone":"+55 21 98888-8888"'),
        }),
      );
    });
  });

  it("submits an empty phone so the backend can remove it", async () => {
    render(
      <ProfileForm initial={{ ...initial, phone: "+55 21 99999-9999" }} />,
    );

    fireEvent.change(fieldByLabel("Telefone"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/users/me",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"phone":""'),
        }),
      );
    });
  });

  it("blocks a phone longer than 30 characters without calling the api", async () => {
    render(<ProfileForm initial={initial} />);

    fireEvent.change(fieldByLabel("Telefone"), {
      target: { value: "1".repeat(31) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(
        screen.getByText("Telefone deve ter no máximo 30 caracteres."),
      ).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  it("saves edited values and shows confirmation", async () => {
    render(<ProfileForm initial={initial} />);

    fireEvent.change(fieldByLabel("Headline"), {
      target: { value: "New Headline" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/users/me",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"headline":"New Headline"'),
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Perfil atualizado com sucesso.",
        { duration: 5000 },
      );
    });
  });

  it("shows an error when saving fails", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 500 }));
    render(<ProfileForm initial={initial} />);

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível salvar. Tente novamente.",
        { duration: 5000 },
      );
    });
  });

  it("blocks submit on invalid url without calling the api", async () => {
    render(<ProfileForm initial={initial} />);

    fireEvent.change(fieldByLabel("GitHub"), {
      target: { value: "not-a-url" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(screen.getByText("Informe uma URL válida.")).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  it("clears the field error once the user fixes the input", async () => {
    render(<ProfileForm initial={initial} />);

    fireEvent.change(fieldByLabel("GitHub"), {
      target: { value: "not-a-url" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(screen.getByText("Informe uma URL válida.")).toBeInTheDocument();
    });

    fireEvent.change(fieldByLabel("GitHub"), {
      target: { value: "https://github.com/user" },
    });

    await waitFor(() => {
      expect(
        screen.queryByText("Informe uma URL válida."),
      ).not.toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
