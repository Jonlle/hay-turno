# Engram Persistence Conventions

## Purpose

This document defines naming conventions and patterns for storing observations in Engram.

## Topic Key Format

| Artifact | Topic Key |
|----------|-----------|
| Project context | `sdd-init/{project}` |
| Exploration | `sdd/{change-name}/explore` |
| Proposal | `sdd/{change-name}/proposal` |
| Spec | `sdd/{change-name}/spec` |
| Design | `sdd/{change-name}/design` |
| Tasks | `sdd/{change-name}/tasks` |
| Apply progress | `sdd/{change-name}/apply-progress` |
| Verify report | `sdd/{change-name}/verify-report` |
| Archive report | `sdd/{change-name}/archive-report` |
| DAG state | `sdd/{change-name}/state` |

## Observation Types

- `decision` — Architectural or design decision made
- `bugfix` — Bug fix with root cause analysis
- `discovery` — Non-obvious finding about the codebase
- `pattern` — Naming or structural convention established
- `config` — Configuration or environment change
- `preference` — User constraint or preference learned
- `session_summary` — End-of-session summary

## Title Format

Use: **Verb + what** — short, searchable
- ✅ "Fixed N+1 query in UserList"
- ✅ "Chose Zustand over Redux"
- ❌ "Fixed the bug"