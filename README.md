# spec-ui

Spec UI turns agent-authored markdown specs into portable, interactive, decision-grade HTML prototypes that can be opened in Micro Canvas, a browser, or another compatible viewer.

## Status
OpenSpec foundation in progress.

## Compile Flow

```text
structured markdown -> parser -> validation -> IR -> deterministic HTML
```

Spec UI treats the generated HTML file as the handoff contract. Viewers open
that artifact; they do not own parsing, validation, or compilation semantics.

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
```

The first implementation intentionally uses Node ESM and built-in test tooling
with no runtime dependencies.
