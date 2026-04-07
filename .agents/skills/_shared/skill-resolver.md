# Skill Resolution Protocol

## Purpose

This document defines how the orchestrator resolves skills from the registry and injects compact rules into sub-agent prompts.

## Flow

1. At session start (or before first delegation), the orchestrator:
   - Calls `mem_search(query: "skill-registry", project: "{project}")` to get registry content
   - Falls back to reading `.atl/skill-registry.md` if engram unavailable
   - Caches the **Compact Rules** section and **User Skills** trigger table

2. For each sub-agent launch that involves reading/writing/reviewing code:
   - Match relevant skills by **code context** (file extensions/paths) AND **task context** (actions to perform)
   - Copy matching compact rule blocks into the sub-agent prompt as `## Project Standards (auto-resolved)`
   - Inject BEFORE the sub-agent's task-specific instructions

3. After each delegation returns a result:
   - Check the `skill_resolution` field in the result
   - If `fallback-registry`, `fallback-path`, or `none` → re-read registry immediately

## Key Rules

- Sub-agents do NOT read SKILL.md files or the registry directly
- Rules arrive pre-digested via the orchestrator's injection
- This compaction-safe approach ensures context isn't inflated