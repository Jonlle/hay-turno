# Persistence Contract

## Purpose

This document defines the contract between Engram and OpenSpec persistence modes.

## Mode Comparison

| Aspect | Engram | OpenSpec |
|--------|--------|----------|
| **Backend** | SQLite + FTS5 via MCP | File-based YAML |
| **Session recovery** | `mem_search` + `mem_get_observation` | Read `state.yaml` |
| **Artifact storage** | Observation with topic_key | Files in `changes/` |
| **Query** | Full-text search via FTS5 | Direct file read |

## Switching Modes

When changing persistence mode:

1. **Engram → OpenSpec**: Export observations to `openspec/changes/{name}/`
2. **OpenSpec → Engram**: Import files as observations with topic keys
3. **Hybrid**: Use both — Engram for decisions, OpenSpec for formal artifacts

## Recovery Protocol

### From Engram
```bash
mem_search(query: "{artifact}", project: "{project}")
mem_get_observation(id: {id})
```

### From OpenSpec
```bash
cat openspec/changes/{change-name}/state.yaml
cat openspec/changes/{change-name}/{artifact}.md
```

## Hybrid-First Approach

For maximum reliability:
1. Primary: Engram for runtime decisions and discoveries
2. Secondary: OpenSpec for formal SDD artifacts (proposal, spec, design, tasks)
3. Both backends should contain the same logical data for redundancy