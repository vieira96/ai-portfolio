"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/shadcn/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/shadcn/command";
import type { Skill, SkillCategory } from "@/types/skills/skills.types";

const categoryOrder: SkillCategory[] = [
  "BACKEND",
  "FRONTEND",
  "DADOS",
  "DEVOPS",
  "IA",
  "METODOLOGIAS",
  "MENSAGERIA",
  "TESTES",
];

const VISIBLE_DESKTOP_COUNT = 2;
const VISIBLE_MOBILE_COUNT = 1;

export interface SelectedSkill {
  id?: string;
  name: string;
  category?: SkillCategory;
}

interface SkillsSelectionProps {
  id?: string;
  label?: string;
  placeholder?: string;
  skills: Skill[];
  selected: SelectedSkill[];
  onChange: (next: SelectedSkill[]) => void;
}

export function splitSkillNames(value: string): string[] {
  return value
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

export function dedupeSkillNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(name);
    }
  }
  return result;
}

export function findKnownSkill(
  skills: Skill[],
  typedName: string,
): Skill | undefined {
  const key = typedName.toLowerCase();
  return skills.find((skill) => skill.name.toLowerCase() === key);
}

export function removeSkillToken(text: string, name: string): string {
  const key = name.toLowerCase();
  const remaining = splitSkillNames(text).filter(
    (token) => token.toLowerCase() !== key,
  );
  return remaining.length === 0 ? "" : `${remaining.join(", ")}, `;
}

function selectedKey(skill: { id?: string; name: string }): string {
  return skill.id ?? skill.name.toLowerCase();
}

export function SkillsSelection({
  id = "skills-selection",
  label = "Selecione ou digite uma ou mais habilidade(s)",
  placeholder = "Ex: NestJS, Docker, Redis",
  skills,
  selected,
  onChange,
}: SkillsSelectionProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  const setRootElement = useCallback((element: HTMLDivElement | null) => {
    setPortalContainer(
      element?.closest<HTMLElement>('[data-slot="dialog-content"]') ?? null,
    );
  }, []);

  const selectedKeys = useMemo(
    () => new Set(selected.map((skill) => selectedKey(skill))),
    [selected],
  );

  const trimmedSearch = search.trim();
  const searchKey = trimmedSearch.toLowerCase();
  const exactMatch =
    trimmedSearch.length > 0 &&
    skills.some((skill) => skill.name.toLowerCase() === searchKey);

  const groupedSuggestions = useMemo(() => {
    const filtered =
      searchKey.length === 0
        ? skills
        : skills.filter((skill) =>
            skill.name.toLowerCase().includes(searchKey),
          );
    return categoryOrder
      .map((category) => ({
        category,
        items: filtered.filter((skill) => skill.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [skills, searchKey]);

  function toggleSkill(skill: Skill) {
    const key = selectedKey(skill);
    if (selectedKeys.has(key)) {
      onChange(selected.filter((item) => selectedKey(item) !== key));
    } else {
      onChange([
        ...selected,
        { id: skill.id, name: skill.name, category: skill.category },
      ]);
    }
    setOpen(true);
  }

  function removeAt(index: number) {
    onChange(selected.filter((_, itemIndex) => itemIndex !== index));
  }

  function createNew() {
    const name = search.trim();
    if (name.length === 0) {
      return;
    }
    if (
      selected.some((item) => item.name.toLowerCase() === name.toLowerCase())
    ) {
      setSearch("");
      return;
    }
    onChange([...selected, { name }]);
    setSearch("");
    setOpen(true);
  }

  const desktopOverflow = selected.length - VISIBLE_DESKTOP_COUNT;
  const mobileOverflow = selected.length - VISIBLE_MOBILE_COUNT;

  return (
    <div ref={setRootElement} className="flex flex-col gap-1.5 text-sm">
      <span id={`${id}-label`} className="text-slate-400">
        {label}
      </span>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setSearch("");
          }
        }}
      >
        <div className="relative">
          <PopoverAnchor asChild>
            <div
              role="combobox"
              aria-expanded={open}
              aria-controls={`${id}-listbox`}
              aria-labelledby={`${id}-label`}
              tabIndex={0}
              onClick={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  setOpen(true);
                }
              }}
              className="flex min-h-[42px] w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm outline-none transition focus:border-blue-400"
            >
              {selected.length === 0 ? (
                <span className="text-slate-500">{placeholder}</span>
              ) : (
                <>
                  {selected
                    .slice(0, VISIBLE_DESKTOP_COUNT)
                    .map((skill, index) => (
                      <SkillChip
                        key={skill.id ?? skill.name}
                        skill={skill}
                        className={index >= 1 ? "hidden md:inline-flex" : ""}
                        onRemove={() => removeAt(index)}
                      />
                    ))}
                  {desktopOverflow > 0 && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpen(true);
                      }}
                      className="hidden rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white md:inline-flex"
                    >
                      +{desktopOverflow}
                    </button>
                  )}
                  {mobileOverflow > 0 && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpen(true);
                      }}
                      className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
                    >
                      +{mobileOverflow}
                    </button>
                  )}
                </>
              )}
              <ChevronDown
                className="ml-auto size-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
            </div>
          </PopoverAnchor>
        </div>
        <PopoverContent
          id={`${id}-listbox`}
          align="start"
          portalContainer={portalContainer}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="w-(--radix-popover-trigger-width) border-line bg-surface p-1"
        >
          <Command shouldFilter={false} label="Buscar skills">
            <CommandInput
              placeholder="Buscar ou criar habilidade"
              aria-label="Buscar skills"
              value={search}
              onValueChange={setSearch}
            />
            <div className="skills-combobox-scroll">
              <CommandList className="p-2 max-h-none overflow-visible">
                {groupedSuggestions.length === 0 ? (
                  trimmedSearch.length > 0 && !exactMatch ? (
                    <CommandItem
                      value={`create-${trimmedSearch}`}
                      onSelect={createNew}
                      className="text-slate-200 data-selected:bg-transparent"
                    >
                      Habilidade nova
                    </CommandItem>
                  ) : (
                    <div className="py-6 text-center text-sm text-slate-400">
                      Habilidade nova
                    </div>
                  )
                ) : (
                  groupedSuggestions.map((group) => (
                    <CommandGroup key={group.category} heading={group.category}>
                      {group.items.map((skill) => (
                        <CommandItem
                          key={skill.id}
                          value={skill.name}
                          data-checked={selectedKeys.has(selectedKey(skill))}
                          onSelect={() => toggleSkill(skill)}
                          className="text-slate-200 data-selected:bg-white/5"
                        >
                          {skill.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))
                )}
                {groupedSuggestions.length > 0 &&
                  trimmedSearch.length > 0 &&
                  !exactMatch && (
                    <CommandItem
                      value={`create-${trimmedSearch}`}
                      onSelect={createNew}
                      className="text-slate-200 data-selected:bg-transparent"
                    >
                      Habilidade nova
                    </CommandItem>
                  )}
              </CommandList>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      <span className="text-xs text-slate-500">
        Escolha skills existentes ou digite uma nova — skills novas pedem a
        categoria na próxima etapa.
      </span>
    </div>
  );
}

function SkillChip({
  skill,
  className = "",
  onRemove,
}: {
  skill: SelectedSkill;
  className?: string;
  onRemove: () => void;
}) {
  const neutral = skill.category === undefined;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
        neutral
          ? "border-dashed border-slate-500 text-slate-400"
          : "border-line bg-white/5 text-slate-200"
      } ${className}`}
    >
      {skill.name}
      <button
        type="button"
        aria-label={`Remover ${skill.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="rounded-full transition hover:text-white"
      >
        <X className="size-3" aria-hidden="true" />
      </button>
    </span>
  );
}
