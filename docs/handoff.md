# Portable HTML Handoff

Spec UI owns parsing, validation, IR generation, and HTML artifact generation. Viewers own opening and presenting generated artifacts. A viewer must not reinterpret Spec UI markdown or become responsible for compiler semantics.

## Handoff Artifact

Successful compilation produces a portable HTML file. The file is the primary handoff contract for browsers, Micro Canvas, and other compatible viewers.

The artifact must be openable without a running Spec UI compiler process. It may contain embedded CSS and JavaScript needed for supported interactions, as long as unchanged input and unchanged configuration produce stable output.

Generated HTML must not require external fonts, stylesheets, scripts, package runtimes, network calls, browser extensions, Micro Canvas-specific APIs, or a live backend.

## Handoff Metadata

A successful compile should expose deterministic handoff metadata to orchestration or viewer layers:

- `artifactPath`: path to the generated HTML file.
- `irPath`: path to the generated IR file when requested.
- `inputPath`: path to the markdown spec when available.
- `sourceHash`: deterministic hash of the markdown source.
- `viewerCompatibility`: supported viewer classes, currently `["browser", "microcanvas"]`.
- `warnings`: deterministic warning list.
- `renderingTarget`: rendering target metadata.

The `renderingTarget` object describes the semantic adapter used to render the artifact:

```json
{
  "target": "baseline",
  "version": "0.1.0",
  "resolvedTarget": "baseline",
  "selectionSource": "source|default|config"
}
```

The existing single-file path resolves to `baseline` by default and still accepts `adapter="baseline"`. Package mode introduces `bootstrap-html` as the default library-backed standalone HTML adapter. Unsupported adapter targets fail validation instead of falling back to arbitrary rendering.

Package-generated handoff metadata extends the single-file contract with source and adapter provenance:

- `sourceMode`: `package`.
- `manifestPath`: path to `prototype.md`.
- `packageTitle`: manifest title.
- `fidelity`: package fidelity metadata.
- `includedFiles`: ordered package files with role, required flag, existence, and parse status.
- `packageReadiness`: `ready`, `blocked`, or `invalid`.
- `acceptanceSummary`: counts and source references for notes and structured invariants.
- `adapterTarget`: requested adapter such as `bootstrap-html`.
- `adapterVersion`: Spec UI adapter implementation version.
- `resolvedLibrary`: library identity for library-backed output, such as pinned Bootstrap major version.
- `assetProvenance`: whether required assets are inline or vendored.

Package output must remain portable: the adapter may translate semantic IR into library-backed markup, but generated HTML must not depend on CDN links, remote fonts, package-manager loading, or runtime network calls.

A failed compile should expose validation failure metadata:

- `inputPath`: path to the markdown spec when available.
- `errors`: ordered validation errors with code, message, source line when known, and source column when known.
- `artifactPath`: absent.

## Browser Portability Contract

A standards-based browser should be able to open the generated HTML artifact directly from disk or through a static file server. Browser inspection is the baseline portability check.

The browser viewer should:

- Open the generated HTML artifact as-is.
- Present supported interactions implemented inside the artifact.
- Avoid adding network-only assumptions to artifact display.
- Treat Spec UI metadata as descriptive, not as instructions to recompile source markdown.

## Micro Canvas Portability Contract

Micro Canvas may stage, show, verify, or snapshot the generated HTML artifact. It remains a viewing surface. Spec UI remains responsible for source grammar, validation, IR, rendering target resolution, and renderer semantics.

Micro Canvas compatibility means:

- The artifact is standalone HTML.
- The artifact uses deterministic inline CSS and JavaScript only.
- The artifact does not call Micro Canvas APIs to render basic content.
- The artifact can be verified as a displayed prototype without requiring the original markdown source.

## Viewer Responsibilities

Compatible viewers should:

- Open the generated HTML artifact as-is.
- Present supported interactions implemented inside the artifact.
- Surface compile metadata or validation failures supplied by Spec UI.
- Preserve the artifact's selected rendering target metadata.
- Treat Spec UI as the owner of grammar and compilation behavior.

Compatible viewers should not:

- Parse markdown specs as a substitute for Spec UI compilation.
- Rewrite unsupported structures into new UI semantics.
- Select arbitrary component libraries based on source markup.
- Add non-deterministic behavior that changes the intended prototype flow.
- Require Micro Canvas-specific APIs for basic artifact inspection.

## Agent Handoff Loop

For package prototypes, agents should treat the generated HTML and handoff metadata as the review artifact, and the package files as the durable source of truth:

1. Inspect `prototype.md` for package metadata, include order, roles, adapter, target, and fidelity.
2. Edit the focused file for the requested change.
3. Compile the package and inspect generated HTML.
4. Record UAT feedback in `acceptance.md`.
5. Recompile until readiness and review feedback agree.

Role-specific edit guidance:

- Edit `screens.md` for screens, regions, blocks, states, and visible structural hierarchy.
- Edit `flows.md` for navigation, modal/drawer behavior, form transitions, tabs, toggles, and journey paths.
- Edit `content.md` for copy, sample data, reusable rows, pricing, FAQ, testimonials, and metrics.
- Edit `layout.md` for padding, density, width, alignment, columns, responsive collapse, wrapping, and overflow intent.
- Edit `tokens.md` for semantic tone, radius, density, and treatment controls.
- Edit `acceptance.md` for UAT notes, stable navigation labels, reachable flows, single modal stack, and overflow containment constraints.

This mirrors the useful parts of OpenSpec: explicit inputs, dependency-aware status, strict validation, task tracking, and archive-style handoff. It does not require viewers to understand OpenSpec deltas or package source syntax.

## Other Viewer Handoff

Other compatible viewers may accept the same HTML artifact if they can present the standard HTML, CSS, and JavaScript used by Spec UI output. They do not need to understand Spec UI markdown to display a successfully generated prototype.
