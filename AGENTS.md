# Agent Instructions

## Skills

Shared skills live in `skills/<name>/SKILL.md`.
Use relevant skills for the task. Edit skills only in `skills/`.

Available local skills:

- `ketryx-cli`: install, configure, and use the Ketryx CLI for local validation of git-based items and traceability.

## Ketryx conventions for this repository

This repository contains `ketryx.json`; run Ketryx commands from the repository root unless passing the path explicitly.

- Use `skills/ketryx-cli/SKILL.md` when validating or fixing Ketryx items, traceability, cache/token setup, or CLI diagnostics.
- Markdown items use YAML frontmatter with at least `itemId`, `itemType`, and `itemTitle`.
- Local markdown relation fields include `itemFulfills`, `itemHasParent`, `itemIntroducesRisk`, `itemIsRiskControlledBy`, and related Ketryx relation keys.
- Cucumber scenarios use `@id:<test-case-id>` and `@tests:<target-id>` tags.
- JS/TS source may contain Ketryx trace tags in comments/docblocks. Validate after editing source tags because `ketryx.json` enables `js-ts`.
- Do not change regulated requirement/spec/risk meaning solely to appease validation. If traceability intent is ambiguous, report the diagnostic and ask before changing it.
