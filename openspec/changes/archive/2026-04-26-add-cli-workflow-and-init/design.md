## Context

Spec UI now supports single-file specs, manifest-driven prototype packages, readiness status, package examples, handoff provenance, and a Bootstrap-backed standalone HTML adapter. The implementation is capable enough for real prototype loops, but the CLI surface still exposes that capability through one overloaded `compile` command and one compatibility `--status` flag.

OpenSpec's CLI is a useful model because it separates intent into small verbs, defaults to readable human output, and offers JSON for automation. Spec UI should borrow that workflow discipline while staying focused on prototypes: initialize repo conventions, list known inputs, inspect a prototype, check readiness, get role guidance, validate, and compile portable handoff HTML.

The design intentionally borrows OpenSpec techniques, not OpenSpec's domain model:

- Use a short command tree with direct verbs instead of hiding workflow concepts behind flags.
- Treat `--help` as a maintained interface with usage, options, and examples.
- Default to human-readable summaries, with `--json` reserved for tools and agents.
- Keep JSON stdout clean and stable.
- Give validation/status commands stable readiness/error language so another agent can act without guessing.
- Keep initialization optional and deterministic.

## Goals / Non-Goals

**Goals:**

- Make `spec-ui --help` and command help discoverable and clean.
- Add first-class commands for `init`, `list`, `show`, `status`, `validate`, `instructions`, and `compile`.
- Keep human-readable output concise and OpenSpec-like while preserving structured `--json` output.
- Preserve the current compile command and existing package/single-file behavior.
- Add optional `.spec-ui/` repo initialization for defaults, templates, and local agent guidance.
- Keep actual prototype packages in visible project directories, not hidden inside `.spec-ui/`.
- Ensure repo-local instructions describe standalone, deterministic, portable HTML without naming a specific viewer as the contract.

**Non-Goals:**

- Replacing OpenSpec or copying OpenSpec's change/spec/archive domain model.
- Requiring `.spec-ui/` before single-file or package compilation works.
- Adding interactive prompts in this change.
- Adding a visual editor, watcher, dev server, or browser automation command.
- Adding production React/Vue/Svelte export or arbitrary UI-library selection.
- Allowing raw HTML/CSS/JS, remote assets, or runtime network dependencies through CLI configuration.
- Adding command-specific parsing shortcuts that bypass the shared Spec UI parser, compiler, package resolver, adapter registry, or status logic.

## Decisions

### Decision: Use a small command router with OpenSpec-style help

`bin/spec-ui.mjs` should route by command name and give each command its own usage text. The top-level help should look like a product CLI, not a single script usage line.

Initial command tree:

```text
spec-ui [--version] [--help]
spec-ui help [command]
spec-ui init [path] [--examples] [--force] [--json]
spec-ui list [--examples | --packages | --adapters] [--json]
spec-ui show <input-or-name> [--json]
spec-ui status <input-or-name> [--json]
spec-ui validate <input-or-name> [--strict] [--json]
spec-ui instructions [role] --input <input-or-name> [--json]
spec-ui compile <input-or-name> --out <output.html> [--ir <output.json>] [--json]
```

**Rationale:** Separate verbs make the prototype loop self-documenting. Users should not need to treat the compatibility `compile --status` flag as the primary way to inspect readiness.

**Alternatives considered:**
- Keep one `compile` command with flags: less code, but it keeps workflow concepts hidden.
- Add many nested subcommands immediately: too much ceremony for the current product.

**Implementation guidance:**

- Keep `bin/spec-ui.mjs` as the bin entry point, but move reusable command behavior into source modules if the file starts growing beyond a simple router.
- Implement one parse path for global options and one parse path per command. Do not let individual commands silently ignore unknown options.
- Support `spec-ui help <command>` as the same content as `spec-ui <command> --help`.
- `--version` should read from `package.json` or a single exported version constant so output does not drift.
- Usage/help must not instantiate the compiler or read prototype files.

### Decision: Human output by default, JSON on request

Workflow commands should default to concise human output. `--json` should produce stable machine-readable output for agents and tests.

Examples:

```text
Prototype: Revenue Workspace
Source: package
Adapter: bootstrap-html
Readiness: ready

Includes: 6/6 resolved
Acceptance: 5 invariants, 2 notes

[x] screens.md      screens
[x] flows.md        flows
[x] content.md      content
[x] layout.md       layout
[x] tokens.md       tokens optional
[x] acceptance.md   acceptance

Ready to compile.
```

```text
Prototype: Missing Include Package
Readiness: blocked

[!] content.md
    Required include was not found.
    Source: prototype.md:5

Fix the package manifest or add the missing file.
```

**Rationale:** OpenSpec's feel comes from making humans comfortable without weakening automation.

**Alternatives considered:**
- JSON-only output: great for agents, poor for users.
- Rich terminal UI: premature and harder to test.

**JSON contract:**

Successful JSON output should be a single object unless the command naturally returns a list-only result. Prefer this shape:

```json
{
  "command": "status",
  "ok": true,
  "input": {
    "path": "prototypes/revenue-workspace",
    "sourceMode": "package"
  },
  "readiness": "ready",
  "title": "Revenue Workspace",
  "adapter": {
    "target": "bootstrap-html",
    "version": "0.1.0",
    "resolvedTarget": "bootstrap-html"
  },
  "prototypeTarget": {
    "target": "standalone-html"
  },
  "roles": [
    { "role": "screens", "path": "screens.md", "required": true, "status": "resolved" }
  ],
  "acceptance": {
    "invariants": 5,
    "notes": 2
  },
  "errors": [],
  "warnings": []
}
```

Errors in JSON mode should use:

```json
{
  "command": "validate",
  "ok": false,
  "errors": [
    {
      "code": "missing_package_include",
      "message": "Required include was not found.",
      "path": "prototype.md",
      "line": 5
    }
  ]
}
```

`--json` mode must write no prose, hints, warnings, color escapes, or deprecation text to stdout. Non-JSON diagnostics may go to stderr only when they do not make stdout invalid.

**Human output guidance:**

- Keep summaries short and scannable.
- Use the same vocabulary as JSON: `ready`, `blocked`, `invalid`, `single-file`, `package`, `bootstrap-html`, `standalone-html`.
- Avoid color as the only signal; output must still read clearly with `--no-color` or in plain terminals.
- Keep adapter terminology precise: `bootstrap-html` and `baseline` are renderer adapter targets; `standalone-html` is package handoff target metadata from the manifest/config.

### Decision: Keep `compile` explicit, but allow initialized defaults later

The compatibility path remains:

```bash
spec-ui compile <input> --out <output.html> [--ir <output.json>]
```

In an initialized repo, the CLI may resolve named packages from `prototypesDir` and may derive default artifact paths when documented. That defaulting must be deterministic and visible in output.

**Rationale:** The current compile command is already used by scripts. The workflow CLI should improve ergonomics without breaking reliable automation.

**Alternatives considered:**
- Make `--out` optional everywhere: convenient, but risks surprising writes before repo conventions exist.
- Require init for all compilation: violates the lightweight source-file workflow.

**Implementation guidance:**

- In this change, keep `--out` required for `compile` unless the implementation also adds explicit, tested initialized default output resolution.
- If default output resolution is implemented, it must only happen when `.spec-ui/config.json` is discovered, and the resolved output path must be printed in human output and included in JSON output.
- `compile` should use the same input resolver as `status`, `show`, and `validate`, then call the existing compiler/render/handoff path.
- `compile --json` may keep the existing handoff metadata shape, but it must remain valid JSON and include enough source/config/adapter data for agents to trace the artifact back to source.
- Existing `compile --status` behavior already exists on main. Treat it as the compatibility baseline, but normalize it through the new shared status result instead of keeping a separate CLI-only package reader.

### Decision: Initialize `.spec-ui/` for repo conventions only

`spec-ui init` should create a lowercase hyphenated `.spec-ui/` directory in the selected repo root. This keeps naming aligned with the CLI and common tool config conventions.

Default files:

```text
.spec-ui/
  config.json
  instructions.md
  templates/
    prototype.md
    screens.md
    flows.md
    content.md
    layout.md
    tokens.md
    acceptance.md
```

The config should include defaults such as schema version, adapter, target, prototypes directory, artifacts directory, required roles, and optional roles.

Default `config.json`:

```json
{
  "schemaVersion": 1,
  "defaultAdapter": "bootstrap-html",
  "defaultTarget": "standalone-html",
  "prototypesDir": "prototypes",
  "artifactsDir": "artifacts",
  "requiredRoles": ["screens", "flows", "content", "layout", "acceptance"],
  "optionalRoles": ["tokens"]
}
```

Actual prototype packages should live in a visible directory such as `prototypes/`, created only when requested with `--examples` or a future `new prototype` command.

**Rationale:** Hidden config is useful for conventions; user-authored prototype source should stay visible and reviewable.

**Alternatives considered:**
- Put prototypes inside `.spec-ui/`: keeps everything together, but hides the main source documents.
- Use `.specUI/`: matches the user's first phrase, but is less idiomatic for a CLI/project config directory.

**Implementation guidance:**

- Generated files must be deterministic: stable key order in JSON, stable template text, and a trailing newline.
- `init` should create parent directories as needed for the selected path but should not search upward and initialize a different directory than the one requested.
- `init` should fail when `.spec-ui/config.json` already exists unless `--force` is present.
- `--force` may overwrite generated default files, but it must not silently delete unknown user files under `.spec-ui/`.
- `init --examples` should create a minimal starter package under `prototypes/`, for example `prototypes/starter/prototype.md` plus role files. It must not create source packages inside `.spec-ui/`.

### Decision: Local instructions are operational, not viewer-branded

`.spec-ui/instructions.md` should guide agents and users:

```md
# Spec UI Instructions

- Edit package source files, not generated HTML.
- Put UAT feedback in acceptance.md.
- Use the configured default adapter unless the user asks otherwise.
- Compile accepted prototypes to the configured artifacts directory.
- Handoff HTML must remain standalone, deterministic, and portable.
- Do not add runtime network dependencies, remote scripts, remote stylesheets, or viewer-specific code.
```

**Rationale:** The contract is artifact portability. Naming a specific viewer in repo-local instructions makes the contract sound narrower and more brittle than it is.

**Alternatives considered:**
- Mention specific viewers: useful for current demos, but not appropriate as the general contract.

Templates should also avoid viewer-specific language. They should teach the role contract, not a renderer implementation. For example, `layout.md` should ask for semantic blocks, symbolic gaps, target states, and expected wrapping behavior; it should not ask for Bootstrap classes, CSS selectors, raw HTML, or JavaScript.

Generated templates and role instructions should derive supported controls from the merged source constants where practical. Current main exposes package roles, adapter targets, layout controls, token controls, and acceptance invariants through source modules such as `src/contracts.js`, with renderer-side adapter metadata in `src/render-html.js`. Do not hardcode a divergent set in CLI guidance.

### Decision: Status and validate share readiness logic

`status` should report package readiness and metadata. The merged implementation already exposes `getPackageStatus` for packages and handoff readiness metadata for compiled packages. `validate` should run the same core parser/compiler validation path and exit nonzero for blocked or invalid inputs. `validate --strict` may add stricter checks over initialized config and generated defaults, but must not write artifacts.

**Rationale:** Users need a cheap preflight before rendering. Agents need a stable JSON contract before editing or compiling.

**Alternatives considered:**
- Have `validate` compile and render to prove everything: stronger but slower and surprising for a validation command.

**Readiness model:**

- `ready`: input is parseable, required package files are present, required roles are satisfied, references resolve, adapter/target metadata is supported, and no strict validation errors are present.
- `blocked`: package structure or cross-file references are incomplete enough that an agent can fix source files before compilation.
- `invalid`: syntax, unsupported semantic types, unsupported adapter/target, raw implementation detail, malformed config, or other hard validation errors.

`status` should use `ready`, `blocked`, or `invalid`. `validate` may report `valid`/`invalid` in human prose, but JSON should still include a `readiness` value when the input can be inspected.

**No artifact writes:**

`status`, `show`, `validate`, `list`, and `instructions` must not write HTML, IR, generated examples, or config files. Only `compile` and `init` write files.

**Implementation guidance:**

- Reuse `getPackageStatus` for package readiness and normalize its current `validationErrors` field into the CLI result object's `errors` field.
- Reuse `compilePackageToIr`, `compileToIr`, `serializeIr`, `renderHtml`, and `createHandoffResult` for compile paths.
- Reuse or refactor `detectSourceInput` and `loadPackageSource` from `src/package-source.js` instead of preserving the current `bin/spec-ui.mjs` package read logic as another source of truth.
- If an existing helper lacks enough metadata for `show` or `instructions`, extend that helper or add a small shared status/inspection module rather than parsing role files again inside command handlers.

### Decision: Preserve compatibility aliases

`spec-ui compile <input> --status` should continue to work and should behave as an alias for `spec-ui status <input> --json`. It may print a deprecation hint only in human mode, but not in JSON output.

**Rationale:** Existing scripts and agents should not break while the cleaner command surface rolls out.

### Decision: Resolve inputs consistently

Every command that accepts `<input-or-name>` should use the same resolver.

Resolution order:

1. Existing file path.
2. Existing directory path containing `prototype.md`.
3. Named package under configured `prototypesDir` when `.spec-ui/config.json` is present.
4. Built-in example by known example name when `list --examples` exposes that name.

If multiple candidates match, the CLI should fail with an ambiguity error unless the user provides an explicit path.

**Rationale:** Agents should be able to use `status`, `show`, `validate`, and `compile` interchangeably without each command interpreting names differently.

### Decision: Standardize error codes and exit codes

Use stable error codes so subagents can branch on failures without parsing English:

- `unknown_command`
- `unknown_option`
- `missing_argument`
- `missing_input`
- `missing_output`
- `ambiguous_input`
- `input_not_found`
- `config_not_found`
- `config_malformed`
- `unsupported_config`
- `unsupported_role`
- `unsupported_adapter`
- `unsupported_target`
- `missing_package_manifest`
- `missing_package_include`
- `package_include_outside_root`
- `unsupported_package_role`
- `duplicate_package_id`
- `unsupported_layout_control`
- `unsupported_token_control`
- `validation_failed`
- `compile_failed`
- `init_already_exists`
- `init_write_failed`

Exit codes:

- `0`: successful command, ready status, or valid input.
- `1`: valid command ran but found blocked/invalid source, validation errors, compile errors, or init conflict.
- `2`: usage error such as unknown command, unknown option, missing argument, or ambiguous command syntax.

**Rationale:** OpenSpec is easy for agents because its validation and status commands produce stable concepts. Spec UI needs the same predictability.

### Decision: Keep implementation dependency-light

The current package is dependency-free ESM on Node 20. This change should preserve that unless a dependency is clearly justified and accepted in review.

**Implementation guidance:**

- Prefer small local helpers for argument parsing and help text.
- Do not add a CLI framework unless it materially reduces complexity and tests prove it does not change output unpredictably.
- Do not shell out to OpenSpec from Spec UI commands. OpenSpec informs the workflow style; Spec UI owns its own CLI behavior.
- Do not implement by scraping generated HTML; status/show/validate must come from source parsing, package metadata, compiler validation, and adapter metadata.
- Do not duplicate the adapter registry in CLI-only data. Adapter listing should come from a shared registry or a small exported projection of the existing compiler/render adapter metadata.

## Risks / Trade-offs

- **Risk: CLI scope creep** -> Keep this change to command routing, output formatting, init scaffolding, and validation/status reuse. Defer watch/dev-server/new-prototype commands.
- **Risk: Hidden config becomes another source of truth** -> `.spec-ui/` stores defaults and templates only; prototype package files remain the canonical source.
- **Risk: Human and JSON outputs drift** -> Back both with shared status/result objects and test both modes.
- **Risk: Init overwrites user files** -> Default `init` must refuse to overwrite existing files. `--force` must be explicit and tested.
- **Risk: Default output paths surprise users** -> Only derive artifact paths from initialized config when documented, and always print the resolved paths.
- **Risk: Repo-local instructions become too prescriptive** -> Keep generated instructions short and operational, with no product-specific viewer names.
- **Risk: Subagents implement divergent behavior per command** -> Require shared input resolution, shared status/result objects, shared error formatting, and tests that compare human/JSON modes.

## Migration Plan

- Add the new command router while preserving the existing `compile` command path.
- Implement commands in thin layers over existing parser/compiler/status/handoff functions, adding shared helpers only where needed.
- Add `.spec-ui/` scaffolding and templates without requiring them for existing examples.
- Update docs and README after command behavior is tested.
- Keep npm scripts working by using the unchanged `compile --out --ir` flow.

Rollback is straightforward: existing compile behavior remains the compatibility baseline. If a new command has issues, it can be fixed independently without changing the compile path.

## Open Questions

- Should `spec-ui list` discover only configured prototype directories, or also scan `examples/` by default? Default recommendation for this change: include built-in examples and configured prototypes because it mirrors OpenSpec's discoverability.
- Should `spec-ui compile <package>` derive output paths from config in this change, or should that wait for a later `new prototype` workflow? Default recommendation for this change: keep `--out` required unless implementing the explicit config-derived behavior and tests in the same change.
- Should `init --examples` create one minimal generic package or surface-specific app/marketing starter packages? Default recommendation for this change: create one minimal starter package to keep scope bounded.
