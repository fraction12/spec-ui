# spec-ui

Spec UI turns agent-authored markdown specs into standalone, deterministic,
portable HTML prototypes for review and handoff.

## Status

Spec UI has a dependency-free foundation compiler plus a bounded vNext semantic
grammar for SaaS/web-app and marketing-page prototypes. The active CLI workflow
change adds OpenSpec-style commands for initialization, discovery, status,
role-specific instructions, validation, and compilation while preserving the
current single-file flow.

## Compile Flow

```text
structured markdown or prototype package -> parser -> validation -> IR -> deterministic HTML
```

Spec UI treats the generated HTML file as the handoff contract. Viewers open
that artifact; they do not own parsing, validation, or compilation semantics.

## CLI Workflow

The CLI is organized around the same calm loop used by OpenSpec: discover what
exists, inspect readiness, get focused edit guidance, validate, then compile the
handoff artifact.

```bash
spec-ui init --examples
spec-ui list
spec-ui status revenue-workspace
spec-ui instructions layout --input revenue-workspace
spec-ui validate revenue-workspace --strict
spec-ui compile revenue-workspace --out artifacts/revenue-workspace.html
```

Use `--json` on workflow commands when an agent or script needs stable
machine-readable output. JSON mode writes valid JSON only to stdout.

`spec-ui compile <input> --status` remains a compatibility alias for
`spec-ui status <input> --json`, so existing package-readiness scripts can move
to the first-class `status` command when convenient.

## Grammar Scope

Spec UI source is structured markdown. The foundation grammar supports screens,
sections, states, elements, and explicit actions. The vNext grammar adds semantic
regions and blocks for two surfaces:

- SaaS/web-app prototypes with app shells, navigation, page headers, metrics,
  tables, forms, settings groups, panels, drawers, and modal/state flows.
- Marketing/landing-page prototypes with navbars, hero sections, logo clouds,
  feature grids, pricing, testimonials, FAQs, CTAs, forms, and footers.

The source grammar deliberately rejects raw HTML, JSX, CSS classes, scripts,
styles, arbitrary component names, production framework export, runtime package
loading, backend behavior, and broad theming. Existing single-file examples use
the `baseline` target; package examples declare the semantic `bootstrap-html`
adapter target while keeping source files adapter-neutral. Generated handoff
metadata records the resolved target and portability details.

See `docs/grammar.md`, `docs/cli.md`, and `docs/handoff.md` for the full
contract.

## Source Modes

Use single-file mode for small prototypes, compatibility checks, and quick
experiments. The existing examples in `examples/*.md` remain canonical
single-file specs.

Use package mode when a prototype needs a durable user/agent loop:

```text
prototype.md -> screens.md + flows.md + content.md + layout.md + tokens.md + acceptance.md
```

The manifest controls metadata and deterministic include order. Agents should
edit the focused role file, compile the package, inspect the portable HTML,
capture UAT findings in `acceptance.md`, and repeat.

Canonical package examples live in:

- `examples/revenue-workspace-package/`
- `examples/launchlayer-marketing-package/`

## Project Layout

- `src/` contains the parser, validator, IR compiler, renderer, and handoff helpers.
- `bin/spec-ui.mjs` provides the CLI entry point.
- `docs/` documents the v1 grammar and portable HTML handoff contract.
- `examples/` contains canonical specs users can compile.
- `fixtures/` contains test inputs for valid and invalid specs.
- `artifacts/` is the local output directory for generated HTML and IR JSON.
- `.spec-ui/` is optional repo-local configuration created by `spec-ui init`;
  it stores conventions and templates, not prototype source packages.

## Development

```bash
npm test
npm run lint
npm run check
npm run compile:example
npm run compile:saas
npm run compile:marketing
```

The first implementation intentionally uses Node ESM and built-in test tooling
with no runtime dependencies.
