import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SkillList } from "./skill-list.js";
import type { Skill } from "@/types/skills/skills.types";

const technologies: Skill[] = [
  { id: "1", name: "PHP", category: "BACKEND" },
  { id: "2", name: "React", category: "FRONTEND" },
  { id: "3", name: "Laravel", category: "BACKEND" },
];

describe("SkillList", () => {
  it("groups by category", () => {
    render(
      <SkillList
        technologies={[
          ...technologies,
          { id: "4", name: "Scrum", category: "METODOLOGIAS" },
          { id: "5", name: "RabbitMQ", category: "MENSAGERIA" },
          { id: "6", name: "Vitest", category: "TESTES" },
        ]}
        onDeleteConfirm={() => {}}
      />,
    );

    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Metodologias")).toBeInTheDocument();
    expect(screen.getByText("Mensageria")).toBeInTheDocument();
    expect(screen.getByText("Testes")).toBeInTheDocument();
    expect(screen.getByText("PHP")).toBeInTheDocument();
    expect(screen.getByText("Laravel")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Scrum")).toBeInTheDocument();
    expect(screen.getByText("RabbitMQ")).toBeInTheDocument();
    expect(screen.getByText("Vitest")).toBeInTheDocument();
  });

  it("forwards the id on delete confirm", () => {
    const onDeleteConfirm = vi.fn();
    render(
      <SkillList
        technologies={technologies}
        onDeleteConfirm={onDeleteConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remover PHP" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(onDeleteConfirm).toHaveBeenCalledWith("1");
  });
});
