# spec-ui

Spec UI turns agent-authored markdown specs into portable, interactive, decision-grade HTML prototypes that can be opened in Micro Canvas, a browser, or another compatible viewer.

## Status
Spec UI has a dependency-free foundation compiler plus a bounded vNext semantic
grammar for SaaS/web-app and marketing-page prototypes.

## Compile Flow

```text
structured markdown -> parser -> validation -> IR -> deterministic HTML
```

Spec UI treats the generated HTML file as the handoff contract. Viewers open
that artifact; they do not own parsing, validation, or compilation semantics.

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
loading, backend behavior, and broad theming. The current rendering target is
`baseline`; generated handoff metadata records the resolved target.

See `docs/grammar.md` and `docs/handoff.md` for the full contract.

## Project Layout

- `src/` contains the parser, validator, IR compiler, renderer, and handoff helpers.
- `bin/spec-ui.mjs` provides the CLI entry point.
- `docs/` documents the v1 grammar and portable HTML handoff contract.
- `examples/` contains canonical specs users can compile.
- `fixtures/` contains test inputs for valid and invalid specs.
- `artifacts/` is the local output directory for generated HTML and IR JSON.

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
