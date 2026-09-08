---
name: ketryx-cli
description: Install, configure, and use the Ketryx CLI for validation of git-based Ketryx items and traceability in markdown, Cucumber, and JS/TS source. Use when working with ketryx.json, authentication, item queries, itemId/itemType metadata, relation fields, @id/@tests tags, or Ketryx CLI diagnostics.
---

# Ketryx CLI

## Install

Prefer an existing `ketryx` command:

```bash
ketryx --help
```

If unavailable, install the published package in the workspace:

```bash
npm i @ketryx/cli
```

Then run either `ketryx ...` when it is on `PATH`, or `npx ketryx ...` from the workspace.

## Configure a workspace

Initialize or update configuration from the workspace root:

```bash
ketryx init .
```

A workspace is configured by `ketryx.json`. Important fields:

- `projectIds`: Ketryx project IDs to validate/query against.
- `sources`: local directories scanned for git-based items.
- `languages`: enabled parsers, e.g. `markdown`, `cucumber`, `js-ts`.
- `apiBaseUrl`: optional Ketryx instance URL.

Configure authentication with one of:

```bash
ketryx token set .
export KETRYX_API_TOKEN=...
```

If authentication is missing or invalid, prompt the user to set up credentials in the terminal/session they are using, or to provide `KETRYX_API_TOKEN` in the environment. Do not ask the user to paste secrets into chat. `KETRYX_API_TOKEN` overrides stored credentials and is best for non-interactive automation.

## Check status and refresh workspace data

Inspect configuration, git state, authentication, and workspace readiness:

```bash
ketryx status --json .
```

Refresh Ketryx workspace data when validation or status indicates it is needed:

```bash
ketryx cache refresh --progress off .
```

If refresh state appears corrupt, clear it and refresh again:

```bash
ketryx cache clear .
ketryx cache refresh --progress off .
```

## Validate traceability

Run validation from the workspace root, or pass the workspace path explicitly:

```bash
ketryx validate --progress off .
```

Validation scans configured sources and reports diagnostics as `path:line:column` with a code frame. A non-zero exit means issues were found or validation could not run.

Recommended loop:

1. Run `ketryx status --json .`.
2. Refresh workspace data if needed.
3. Run `ketryx validate --progress off .`.
4. Fix diagnostics using the reported file/line/code frame.
5. Re-run validation until it succeeds, or report any remaining ambiguous issues.

## Query items

List items discovered in the workspace:

```bash
ketryx items local .
```

Get the content of a particular item by Ketryx ID or external key:

```bash
ketryx items get <identifier> .
```

Query items via KQL:

```bash
ketryx items query "type:Requirement" . --limit 10
ketryx items query "externalId:ABC-123" . --limit 5
```

`items query` requires authentication.

## Interpret common diagnostics

- Refresh/setup errors such as `Cache not initialized`, `Cache DB not found`, or `Cache metadata missing`: run `ketryx cache refresh --progress off .`.
- Sync errors such as `Cache sync failed`: inspect the message, verify network/auth/config, then refresh again. Use `ketryx status --json .` for details. If auth is the issue, ask the user to run `ketryx token set .` in their current terminal/session or set `KETRYX_API_TOKEN`.
- Interactive authentication errors such as `Cache refresh requires an interactive terminal`: ask the user to run the command in a TTY with credentials configured, or set `KETRYX_API_TOKEN` for the session.
- `Item with id "..." does not exist.`: verify the intended item with `ketryx items local .`, `ketryx items get <identifier> .`, or `ketryx items query ...`; then fix the typo, add the missing item, or retarget the reference.
- `Duplicate itemId`: ensure each git-based item ID is unique in configured sources.
- `Invalid <relation> target`: the referenced item exists but has the wrong target type for that relation. Check the target `itemType` and either change the target or correct the relationship.
- Frontmatter/YAML scalar or list errors: use scalar values where required; relation fields may be scalar IDs, comma-separated scalar IDs, or YAML lists of scalar IDs.
- Cucumber `@tests` errors: ensure tags have values and reference existing items.

Do not change regulated content or traceability intent solely to silence the CLI. If the correct fix is unclear, report the diagnostic and ask for guidance.
