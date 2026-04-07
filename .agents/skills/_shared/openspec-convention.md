# OpenSpec Directory Conventions

## Purpose

This document defines the directory structure for SDD artifacts when using OpenSpec as the persistence backend.

## Directory Structure

```
openspec/
├── changes/
│   └── {change-name}/
│       ├── state.yaml          # DAG state and phase progress
│       ├── proposal.md         # Change proposal
│       ├── spec.md             # Detailed specifications
│       ├── design.md           # Technical design
│       ├── tasks.md            # Implementation task checklist
│       ├── apply-progress.md   # Execution progress notes
│       ├── verify-report.md    # Verification results
│       └── archive-report.md   # Final archive summary
└── config.yaml                 # OpenSpec configuration
```

## State File Format

```yaml
change: {change-name}
phase: apply|verify|archive
dependencies:
  - proposal
  - spec
  - tasks
status: pending|in_progress|completed
artifacts:
  proposal: {timestamp}
  spec: {timestamp}
  # ...
```

## Key Rules

- Each change gets its own subdirectory under `changes/`
- All artifacts are file-based for persistence across sessions
- State tracks DAG dependencies between phases