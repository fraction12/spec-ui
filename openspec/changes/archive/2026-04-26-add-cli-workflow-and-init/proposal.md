## Why

Spec UI now has the core prototype package model, package examples, Bootstrap-backed rendering, handoff provenance, and a compatibility `compile --status` path. The CLI still feels like a narrow compiler script instead of a clean prototype workflow tool. Users and agents need the same calm, discoverable command feel that works well in OpenSpec: inspect status, ask for role-specific guidance, validate, compile, and initialize repo-local conventions without memorizing hidden flags.

The next change should make Spec UI easier to adopt in any repository while preserving the zero-init path for quick single-file and package compilation.

## What Changes

- Add an OpenSpec-inspired CLI command layer with first-class `list`, `show`, `status`, `validate`, `instructions`, `compile`, and `init` commands.
- Make human-readable output the default for workflow commands, with `--json` available for agent/tool integration and valid JSON as the only stdout content in JSON mode.
- Preserve the existing `compile <input> --out ... [--ir ...]` behavior and keep `compile <input> --status` as a compatibility alias for `status <input> --json`.
- Build on the merged package APIs and registries (`getPackageStatus`, `compilePackageToIr`, `parsePackageManifest`, `detectSourceInput`, `loadPackageSource`, handoff metadata, and HTML adapter metadata) instead of creating parallel package parsing or adapter lists inside the CLI.
- Add optional repo initialization through `spec-ui init`, creating `.spec-ui/` config, local instructions, templates, and optional starter prototype packages.
- Keep `.spec-ui/` focused on repo-local defaults and agent guidance; actual prototype source packages remain visible in a configured prototypes directory.
- Standardize CLI help, unknown-command handling, usage errors, structured error JSON, and readiness language.
- Document that handoff HTML must remain standalone, deterministic, and portable without naming any specific viewer as the general contract.
- Add a bounded implementation plan that requires thin CLI commands over shared parser/compiler/status/config helpers rather than one-off command-specific parsing hacks.
- Add a test matrix for human output, JSON output, exit codes, config discovery, init file protection, package status, and backward-compatible compilation.

## Capabilities

### New Capabilities

- `cli-workflow-layer`: OpenSpec-like command surface for discovering, inspecting, validating, compiling, and getting guidance for Spec UI prototypes.
- `repo-initialization`: Optional repository initialization that creates `.spec-ui/` project conventions, templates, and local agent instructions without making initialization mandatory.

### Modified Capabilities

None. The repo does not yet have archived base specs under `openspec/specs/`, so this change introduces new capabilities that build on the active Spec UI direction.

## Impact

- `bin/spec-ui.mjs` will grow from a compile-only entry point into a small command router with consistent help and output modes.
- New shared helpers will likely be needed for CLI option parsing, output formatting, repo config discovery, input resolution, status normalization, and initialization file generation.
- Existing package compilation/status helpers may need small refactors so the CLI can share one source-loading path across `status`, `show`, `validate`, `instructions`, and `compile`.
- CLI tests will need coverage for command help, human output, JSON output, exit codes, compatibility aliases, config discovery, and init file generation.
- Docs and README will need updated workflow examples.
- New templates and repo-local initialization assets will be added.
- Existing single-file/package compile behavior and generated portable HTML contracts must remain backward compatible.
