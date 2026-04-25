# Spec UI CLI Workflow

Spec UI's CLI follows an OpenSpec-style loop for prototype packages:

```text
init -> list -> status -> instructions -> validate -> compile
```

Initialization is optional. Existing single-file specs and explicit package
directories continue to compile, validate, and report status with built-in
defaults when a repo has no `.spec-ui/` directory.

## Commands

```bash
spec-ui init [path] [--examples] [--force] [--json]
spec-ui list [--examples | --packages | --adapters] [--json]
spec-ui show <input-or-name> [--json]
spec-ui status <input-or-name> [--json]
spec-ui instructions [role] --input <input-or-name> [--json]
spec-ui validate <input-or-name> [--strict] [--json]
spec-ui compile <input-or-name> --out <output.html> [--ir <output.json>] [--json]
```

- `init` creates repo-local conventions under `.spec-ui/`.
- `list` discovers built-in examples, configured prototype packages, and
  renderer adapters.
- `show` prints package or single-file metadata without writing artifacts.
- `status` reports readiness as `ready`, `blocked`, or `invalid`.
- `instructions` gives bounded role-specific guidance for the file to edit.
- `validate` checks source correctness without writing HTML, IR, config,
  templates, or examples.
- `compile` is the artifact-producing command.

Workflow commands default to human-readable output. `--json` is for agents and
automation; stdout must contain only valid JSON in that mode. Exit code `0`
means success or ready/valid, `1` means blocked, invalid, runtime failure, or
init conflict, and `2` means a usage error.

## Input Resolution

Commands that accept `<input-or-name>` resolve inputs consistently:

1. Existing markdown file paths are single-file inputs.
2. Existing directories containing `prototype.md` are package inputs.
3. Names under the configured `prototypesDir` resolve when `.spec-ui/config.json`
   is present.
4. Built-in example names resolve when exposed by `spec-ui list --examples`.

Ambiguous names fail with `ambiguous_input`. Missing names fail with
`input_not_found`. Explicit paths are the clearest way to bypass ambiguity.

## Initialized Repo Structure

`spec-ui init` creates deterministic, reviewable files:

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

Prototype source packages stay in a visible directory such as `prototypes/`.
`spec-ui init --examples` may create a starter package there; default
initialization does not create prototype source packages.

## `.spec-ui/` File Meanings

- `.spec-ui/config.json` stores repo-local defaults for adapter selection,
  handoff target metadata, prototype discovery, artifact output conventions,
  and required or optional roles.
- `.spec-ui/instructions.md` stores local operational guidance for agents and
  users. It should tell contributors to edit source package files, record UAT
  feedback in `acceptance.md`, use configured defaults, and keep generated HTML
  standalone, deterministic, and portable.
- `.spec-ui/templates/` stores starter markdown for new packages. Templates
  teach the supported semantic grammar and stay adapter-neutral.

The `.spec-ui/` directory is configuration and guidance. Generated HTML and IR
belong in the configured artifacts directory, and user-authored package source
belongs in the configured prototypes directory.

## Default Config

The default config is deterministic JSON with stable key order and a trailing
newline:

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

`defaultAdapter` selects the renderer adapter target, such as `bootstrap-html`.
`defaultTarget` records package handoff target metadata, such as
`standalone-html`.

Configured directories must be repo-relative and must not escape the repo root.
Unsupported adapters, unsupported targets, malformed JSON, absolute directories,
or escaping paths fail validation.

## Template Roles

- `prototype.md` is the package manifest. It declares title, surface, adapter,
  target, fidelity, and the ordered include list.
- `screens.md` owns screens, regions, blocks, items, and states.
- `flows.md` owns navigation, modal and drawer behavior, form transitions, tab
  selection, toggles, and state changes.
- `content.md` owns copy, reusable rows, metrics, pricing tiers, FAQs,
  testimonials, and other sample data.
- `layout.md` owns semantic layout controls such as symbolic gaps, density,
  padding, width, alignment, columns, collapse behavior, wrapping, and overflow.
- `tokens.md` owns semantic tone, radius, density, and treatment controls.
- `acceptance.md` owns UAT notes and structured invariants.

Templates must use supported Spec UI grammar only. They must not include raw
HTML, CSS classes, framework component names, JavaScript, CDN references, remote
assets, or viewer-specific code.

## Status And Compile Compatibility

`spec-ui status <input>` is the primary readiness preflight. Human output is the
default; `--json` returns the same readiness data for tools.

`spec-ui compile <input> --status` remains supported for existing scripts and
behaves as an alias for `spec-ui status <input> --json`. It must write valid JSON
to stdout without deprecation prose.

`compile` remains explicit about artifact writes:

```bash
spec-ui compile examples/task-board.md --out artifacts/task-board.html --ir artifacts/task-board.ir.json
```

Unless a documented initialized default output path is implemented and tested,
`--out` is required.

## Handoff Wording

The generated HTML artifact is the portability contract. It must remain
standalone, deterministic, and portable: no runtime network dependencies, remote
scripts, remote stylesheets, remote fonts, package-manager loading, live backend,
or viewer-specific APIs are required to display the prototype.
