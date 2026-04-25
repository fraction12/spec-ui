## 1. CLI Foundation

- [x] 1.1 Inventory the existing CLI, compiler, renderer, handoff, package, and validation helpers before editing, including `getPackageStatus`, `compilePackageToIr`, `parsePackageManifest`, `detectSourceInput`, `loadPackageSource`, `HTML_ADAPTER_REGISTRY`, and current package CLI tests.
- [x] 1.2 Refactor `bin/spec-ui.mjs` into a small command router while preserving the current `compile <input> --out <html> [--ir <json>]` path.
- [x] 1.3 Add reusable CLI helpers for option parsing, command dispatch, usage errors, JSON/human output formatting, and stable process exit codes.
- [x] 1.4 Add top-level `--help`, `help`, `help <command>`, `--version`, and unknown-command behavior with concise OpenSpec-style usage output.
- [x] 1.5 Add command-specific help for `init`, `list`, `show`, `status`, `validate`, `instructions`, and `compile`, including examples and supported options.
- [x] 1.6 Standardize error objects and exit codes: `0` success/ready/valid, `1` blocked/invalid/runtime/init conflict, and `2` usage errors.
- [x] 1.7 Ensure `--json` mode writes valid JSON only to stdout and never mixes human prose, color escapes, hints, or deprecation text into stdout.
- [x] 1.8 Add CLI tests for help output, command help aliases, version output, unknown commands, unknown options, missing arguments, and usage errors.

## 2. Shared Input, Config, And Status Model

- [x] 2.1 Add a shared input resolver used by `status`, `show`, `validate`, `instructions`, and `compile` for explicit markdown files, explicit package directories, configured package names, and built-in examples.
- [x] 2.1.1 Refactor or reuse the merged package source helpers so package loading is not duplicated in `bin/spec-ui.mjs`.
- [x] 2.2 Add ambiguity and missing-input handling with stable `ambiguous_input` and `input_not_found` errors.
- [x] 2.3 Add a shared result/status object that captures command name, input, source mode, title, readiness, adapter target, package handoff target, role checklist, include counts, acceptance summary, errors, and warnings.
- [x] 2.3.1 Normalize the merged package status shape, including `validationErrors`, into the CLI result object's `errors` field without breaking existing `compile --status` consumers.
- [x] 2.4 Promote package readiness to `spec-ui status <input>` with human output by default and JSON with `--json`.
- [x] 2.5 Preserve `spec-ui compile <input> --status` as a compatibility alias for `spec-ui status <input> --json`, with no deprecation prose in stdout.
- [x] 2.6 Add tests for ready package, blocked package, invalid package, valid single-file, invalid single-file, missing input, and ambiguous input.

## 3. Validate, Show, And List Commands

- [x] 3.1 Add `spec-ui validate <input> [--strict] [--json]` using shared parser/compiler validation without writing HTML, IR, config, template, or example files.
- [x] 3.2 Implement strict validation checks for initialized config shape, safe configured directories, package metadata, adapter support, role completeness, and portable handoff constraints.
- [x] 3.3 Add `spec-ui show <input> [--json]` for package/single-file metadata, manifest path, include structure, adapter details, source mode, fidelity, and acceptance summary.
- [x] 3.4 Add `spec-ui list [--examples | --packages | --adapters] [--json]` using built-in examples, initialized config when present, and shared adapter metadata from the compiler/render path.
- [x] 3.5 Ensure list output is deterministic and reports empty package lists cleanly when no configured prototypes exist.
- [x] 3.6 Add tests for human and JSON output for `validate`, `show`, and `list`, including invalid config and no-config fallback behavior.

## 4. Instructions Command

- [x] 4.1 Add role guidance data for `screens`, `flows`, `content`, `layout`, `tokens`, and `acceptance`, deriving supported roles and control names from source constants where practical.
- [x] 4.2 Make guidance bounded and operational: edit the role file, use supported semantic grammar, avoid raw HTML/CSS/JS/library classes, and avoid changing unrelated role files.
- [x] 4.3 Include layout-specific guidance for symbolic gaps, wrapping behavior, modal/dialog alignment, filters, navigation labels, and nested-card overflow expectations.
- [x] 4.4 Implement `spec-ui instructions [role] --input <input> [--json]` with package readiness context and role file path when available.
- [x] 4.5 Include local `.spec-ui/instructions.md` guidance when initialized config exists, while keeping generated guidance viewer-neutral.
- [x] 4.6 Reject unsupported roles with code `unsupported_role`, exit code `2`, and supported role suggestions.
- [x] 4.7 Add tests for role guidance, package context, local instructions inclusion, JSON output, missing input, and unsupported roles.

## 5. Repo Initialization

- [x] 5.1 Implement `spec-ui init [path] [--examples] [--force] [--json]` without requiring initialization for existing compile/status/validate flows.
- [x] 5.2 Generate `.spec-ui/config.json` with deterministic JSON and default values: schema version `1`, default adapter `bootstrap-html`, default handoff target `standalone-html`, `prototypes`, `artifacts`, required roles, and optional roles.
- [x] 5.3 Generate `.spec-ui/instructions.md` with concise operational guidance that says handoff HTML must remain standalone, deterministic, and portable without naming a specific viewer.
- [x] 5.4 Generate `.spec-ui/templates/` files for `prototype.md`, `screens.md`, `flows.md`, `content.md`, `layout.md`, `tokens.md`, and `acceptance.md`.
- [x] 5.5 Keep templates adapter-neutral and free of raw HTML, CSS classes, framework component names, JavaScript, CDN references, remote assets, and viewer-specific code.
- [x] 5.6 Implement `--examples` to create one minimal starter prototype package in the configured visible prototypes directory, not inside `.spec-ui/`, using the same manifest and role-file grammar as the merged canonical package examples.
- [x] 5.7 Refuse to overwrite existing initialization files unless `--force` is provided; do not delete unknown files under `.spec-ui/`.
- [x] 5.8 Return structured JSON for init success and failure, including created, skipped, and overwritten files.
- [x] 5.9 Add tests for default init, explicit path init, JSON output, existing-config failure, existing-template failure, force behavior, examples generation, and starter package validation.

## 6. Config Loading And Defaults

- [x] 6.1 Add a config loader that discovers `.spec-ui/config.json` from the current repo context when present.
- [x] 6.2 Validate config shape and reject malformed JSON, unsupported adapter, unsupported handoff target, unsafe absolute paths, and paths that escape the repo root.
- [x] 6.3 Use initialized defaults for commands that discover prototypes, artifacts, adapters, role requirements, and named package inputs.
- [x] 6.4 Preserve built-in defaults when no `.spec-ui/config.json` exists.
- [x] 6.5 Keep `compile --out` required unless explicit config-derived output paths are implemented and covered by tests in this change.
- [x] 6.6 Add tests for config discovery, malformed config, unsupported defaults, unsafe directories, no-config fallback behavior, and named package resolution.

## 7. Compile And Handoff Compatibility

- [x] 7.1 Keep existing npm scripts and `spec-ui compile <input> --out <html> [--ir <json>]` behavior working.
- [x] 7.2 Ensure compile creates requested artifact parent directories and writes deterministic HTML/IR artifacts.
- [x] 7.3 Ensure `compile --json` prints valid handoff metadata with resolved input, artifact path, source mode, source hash, adapter identity, target, warnings, and portability status when available.
- [x] 7.4 Ensure `compile` uses the shared input resolver, package loader, validation path, renderer, and handoff metadata path rather than command-specific markdown parsing.
- [x] 7.5 Add tests for compile success, compile validation failure, compile missing output, compile JSON output, package compile, single-file compile, and `compile --status` compatibility.

## 8. Docs And Examples

- [x] 8.1 Update `README.md` with the OpenSpec-style CLI workflow: init, list, status, instructions, validate, compile.
- [x] 8.2 Update `docs/grammar.md` or a CLI-focused doc with initialized repo structure, `.spec-ui/` file meanings, config defaults, and template roles.
- [x] 8.3 Update `docs/handoff.md` to keep the artifact contract phrased as standalone, deterministic, and portable.
- [x] 8.4 Document compatibility behavior for `compile --status`.
- [x] 8.5 Ensure docs do not describe portability by naming a specific viewer as the general contract.

## 9. Verification

- [x] 9.1 Run `openspec validate add-cli-workflow-and-init --strict`.
- [x] 9.2 Run `npm run check`.
- [x] 9.3 Run representative CLI commands in human and JSON modes for `status`, `validate`, `show`, `instructions`, `list`, and `init`.
- [x] 9.4 Compile existing single-file examples to verify backward compatibility.
- [x] 9.5 Compile canonical package examples to verify package compatibility.
- [x] 9.6 Confirm generated handoff HTML remains standalone with no runtime network dependencies.
- [x] 9.7 Confirm generated `.spec-ui/instructions.md` and templates contain no viewer-specific contract language.
- [x] 9.8 Update task statuses and final implementation notes with any intentionally deferred CLI ergonomics.
