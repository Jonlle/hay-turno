# Skill Registry

**Generated**: 2026-03-29
**Project**: hay-turno
**Mode**: engram

## User Skills (global)

| Name           | Trigger                                                                                         | Location                                          |
| -------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| issue-creation | When creating a GitHub issue, reporting a bug, or requesting a feature                          | ~/.config/opencode/skills/issue-creation/SKILL.md |
| branch-pr      | When creating a pull request, opening a PR, or preparing changes for review                     | ~/.config/opencode/skills/branch-pr/SKILL.md      |
| judgment-day   | "judgment day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | ~/.config/opencode/skills/judgment-day/SKILL.md   |
| skill-creator  | When user asks to create a new skill, add agent instructions, or document patterns for AI       | ~/.config/opencode/skills/skill-creator/SKILL.md  |
| go-testing     | When writing Go tests, using teatest, or adding test coverage                                   | ~/.config/opencode/skills/go-testing/SKILL.md     |

## SDD Skills (managed by SDD framework)

| Name        | Trigger                                                            |
| ----------- | ------------------------------------------------------------------ |
| sdd-init    | "sdd init", "iniciar sdd", "openspec init"                         |
| sdd-explore | Investigate codebase, think through features, clarify requirements |
| sdd-propose | Create or update change proposals                                  |
| sdd-spec    | Write or update specifications                                     |
| sdd-design  | Write or update technical design                                   |
| sdd-tasks   | Break down change into task checklist                              |
| sdd-apply   | Implement tasks from a change                                      |
| sdd-verify  | Validate implementation matches specs                              |
| sdd-archive | Archive completed changes                                          |

## Shared Skills

- `_shared/skill-resolver.md` — Skill resolution protocol for sub-agents
- `_shared/engram-convention.md` — Engram persistence naming conventions
- `_shared/openspec-convention.md` — OpenSpec directory conventions
- `_shared/persistence-convention.md` — Persistence contract between modes

## Project Conventions

- **AGENTS.md**: Project-level agent rules and domain vocabulary, referenced by `.gga`
- **Stack**: TypeScript + React 18 + Vite + Tailwind CSS v4 + Supabase + TanStack Query + Zustand
- **SDD Artifacts**: `docs/sdd/` (proposal, design, spec, tasks)
- **Skills directory**: `.agents/skills/` — project-level skills (added in foundation branch)
