import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WritingAssistance } from "./writing-assistance.js";

describe("WritingAssistance", () => {
  it("shows loading and lets the user apply a returned suggestion", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveResponse = resolve;
          }),
      ),
    );
    const onApply = vi.fn();
    render(
      <WritingAssistance
        fieldType="bio"
        fieldLabel="Bio"
        value="Texto original."
        onApply={onApply}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Aprimorar texto com IA/ }),
    );

    expect(screen.getByText("Preparando uma sugestão…")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/ai/writing-assistance",
      expect.objectContaining({
        body: JSON.stringify({ fieldType: "bio", text: "Texto original." }),
      }),
    );

    await act(async () => {
      resolveResponse?.(
        new Response(JSON.stringify({ suggestion: "Texto mais claro." }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    expect(await screen.findByText("Texto mais claro.")).toBeInTheDocument();
    expect(screen.getByText("Texto atual")).toBeInTheDocument();
    expect(screen.getByText("Sugestão")).toBeInTheDocument();
    expect(screen.getByText("Texto original.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Usar sugestão" }));
    expect(onApply).toHaveBeenCalledWith("Texto mais claro.");
  });

  it("keeps the original value when the suggestion is declined", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ suggestion: "Texto revisado." }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const onApply = vi.fn();
    render(
      <WritingAssistance
        fieldType="projectDescription"
        fieldLabel="descrição do projeto"
        value="Descrição original."
        onApply={onApply}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Aprimorar texto com IA/ }),
    );
    await screen.findByText("Texto revisado.");
    fireEvent.click(screen.getByRole("button", { name: "Manter texto atual" }));

    expect(onApply).not.toHaveBeenCalled();
    expect(screen.queryByText("Texto revisado.")).not.toBeInTheDocument();
  });

  it("does not apply a response generated for a value that changed in flight", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveResponse = resolve;
          }),
      ),
    );
    const onApply = vi.fn();
    const view = render(
      <WritingAssistance
        fieldType="headline"
        fieldLabel="headline"
        value="Texto antigo."
        onApply={onApply}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Aprimorar texto com IA/ }),
    );
    view.rerender(
      <WritingAssistance
        fieldType="headline"
        fieldLabel="headline"
        value="Texto atualizado."
        onApply={onApply}
      />,
    );
    await act(async () => {
      resolveResponse?.(
        new Response(JSON.stringify({ suggestion: "Sugestão antiga." }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    expect(
      await screen.findByText(/O campo foi editado durante a solicitação/),
    ).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("offers a retry after a request fails and disables the action for empty text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("offline")));
    const onApply = vi.fn();
    const { rerender } = render(
      <WritingAssistance
        fieldType="experienceDescription"
        fieldLabel="descrição da experiência"
        value="Descrição inicial."
        onApply={onApply}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Aprimorar texto com IA/ }),
    );
    expect(
      await screen.findByText(/Não foi possível gerar uma sugestão/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Manter texto atual" }));

    rerender(
      <WritingAssistance
        fieldType="experienceDescription"
        fieldLabel="descrição da experiência"
        value="   "
        onApply={onApply}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Aprimorar texto com IA/ }),
    ).toBeDisabled();
  });
});
