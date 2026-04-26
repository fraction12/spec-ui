## Why

Spec UI can already turn one structured markdown document into deterministic standalone HTML, but serious prototype loops will outgrow a single-file spec quickly. Agents need a clearer authoring surface where user feedback can be captured as durable layout, flow, content, and acceptance constraints, while rendering still stays deterministic and portable.

At the same time, Spec UI should not become a bespoke component library. The right next step is to make prototype specs easier to split and maintain, then render them through one default open-source UI-library adapter that can be replaced later without making source specs library-specific.

## What Changes

- Introduce a prototype package format modeled after OpenSpec-style change packages, with a canonical manifest and focused source files for screens, flows, content, layout, theme/tokens, and acceptance notes.
- Preserve the existing single-file markdown path for small prototypes, but allow larger prototypes to compile from a directory package.
- Add a Bootstrap-backed standalone HTML adapter as the default open-source UI-library rendering target for portable HTML prototypes.
- Keep source specs semantic and adapter-neutral: users and agents describe product intent, not raw library class names, raw HTML/CSS/JS, or framework-specific components.
- Define a constrained adapter registry and adapter metadata model so future libraries can be added intentionally.
- Expand validation so package manifests, included files, adapter selection, and user-authored prototype controls fail clearly when incomplete or unsupported.
- Update docs, examples, fixtures, and tests to show the intended agent/user prototype loop: edit spec package, compile, inspect HTML, capture UAT feedback in acceptance notes, repeat.

## Capabilities

### New Capabilities

- `prototype-spec-packages`: Multi-file prototype source packages with a manifest, deterministic include order, package-level metadata, and focused files for screens, flows, content, layout, tokens, and acceptance.
- `ui-library-adapter-contract`: A bounded adapter model that maps semantic Spec UI IR to a default Bootstrap-backed standalone HTML output while keeping source specs adapter-neutral.
- `prototype-package-layout-and-flow`: Package-authored layout, responsive behavior, flow paths, and acceptance constraints that compile into the semantic IR without raw implementation detail.
- `prototype-handoff-metadata`: Handoff metadata for package source mode, included files, adapter identity, vendored/inline asset provenance, and viewer compatibility.

### Modified Capabilities

None. The repo does not yet have archived base specs under `openspec/specs/`, so this change introduces new capabilities that build on the active Spec UI direction.

## Impact

- Parser/compiler input handling must accept both a single markdown file and a prototype package directory.
- Validation must enforce manifest integrity, deterministic file ordering, supported adapter values, adapter-neutral source grammar, and package-level acceptance constraints.
- IR and handoff metadata must identify source mode, package files, adapter target, adapter version, resolved library, and portability guarantees.
- Renderer code must add the default Bootstrap-backed adapter while still producing standalone HTML with no network dependency.
- Docs, examples, fixtures, and CLI scripts will need updates for package creation, compilation, and UAT iteration.
