## 1. Package Format And Docs

- [x] 1.1 Document the prototype package manifest syntax, supported metadata, include ordering, and focused file roles in `docs/grammar.md`.
- [x] 1.2 Document the user/agent prototype loop: edit package files, compile, inspect HTML, capture UAT feedback in `acceptance.md`, and repeat.
- [x] 1.3 Document the OpenSpec comparison: manifest, artifact dependencies, status, instructions, strict validation, task tracking, and archive-style handoff.
- [x] 1.4 Add valid package examples under `examples/` covering a SaaS prototype and a marketing prototype with `prototype.md`, `screens.md`, `flows.md`, `content.md`, `layout.md`, `tokens.md`, and `acceptance.md`.
- [x] 1.5 Add invalid package fixtures for missing includes, unsupported file roles, include paths outside package root, duplicate IDs across files, unresolved flow targets, unsupported layout controls, and undeclared content references.
- [x] 1.6 Preserve the existing single-file examples and document when to use single-file versus package mode.

## 2. Package Parsing And Validation

- [x] 2.1 Add package input detection for manifest paths and package directories while preserving single-file input behavior.
- [x] 2.2 Parse `prototype.md` manifests into deterministic metadata: title, surface, adapter, target, fidelity, include paths, roles, required flags, and source hash inputs.
- [x] 2.3 Parse focused package files into one source model while preserving source file, source role, source line, and manifest include order.
- [x] 2.4 Validate manifest integrity, supported file roles, include containment inside the package directory, missing includes, and optional include rules.
- [x] 2.5 Validate cross-file ID uniqueness, flow targets, content references, layout override targets, token controls, and acceptance invariant targets.
- [x] 2.6 Add stable validation error codes for package failures: `missing_package_manifest`, `missing_package_include`, `unsupported_package_role`, `package_include_outside_root`, `duplicate_package_id`, `unresolved_content_reference`, `unresolved_layout_target`, `unresolved_flow_target`, `unsupported_layout_control`, `unsupported_token_control`, and `adapter_asset_provenance_unknown`.
- [x] 2.7 Add parser and validation tests for valid package examples and invalid package fixtures.

## 3. Package Layout, Flow, Content, And Acceptance

- [x] 3.1 Define finite contracts for layout controls: padding, density, width, align, columns, responsive collapse, text wrapping, and overflow.
- [x] 3.2 Compile package layout declarations into semantic IR without raw CSS or library classes.
- [x] 3.3 Define package flow syntax for navigation paths, modal/drawer behavior, form transitions, tabs, toggles, and state changes.
- [x] 3.4 Resolve package content records into block items for reusable copy, sample data, pricing, FAQ, testimonials, and metrics.
- [x] 3.5 Parse and preserve acceptance notes, including structured invariants for stable navigation labels, single modal stack, reachable flows, and overflow containment.
- [x] 3.6 Parse package tokens for semantic tone, radius, density, and treatment controls while rejecting raw CSS variables, raw library classes, and arbitrary color/CSS values.
- [x] 3.7 Add compiler tests proving package layout, flow, content, tokens, and acceptance metadata are deterministic.

## 4. Package Status And Agent Guidance

- [x] 4.1 Add package readiness status generation modeled after OpenSpec status: metadata, included files, role status, missing includes, unresolved references, validation errors, acceptance invariant counts, and readiness state.
- [x] 4.2 Expose package status through a tested API or CLI flag so agents can inspect package health before rendering.
- [x] 4.3 Document role-specific agent guidance: which file to edit for copy, layout, flows, tokens, screens, and UAT feedback.
- [x] 4.4 Add tests for ready, blocked, and invalid package status output.

## 5. Bootstrap HTML Adapter

- [x] 5.1 Add adapter registry entries for the existing `baseline` target and the new `bootstrap-html` target.
- [x] 5.2 Pin the Bootstrap asset source in the repo and document license/provenance without using CDN links or runtime network loading.
- [x] 5.3 Reject unsupported adapter values and all adapter-specific source details such as raw classes, component names, JSX, raw HTML, raw CSS, and custom JavaScript.
- [x] 5.4 Implement semantic block mappings for `bootstrap-html` across existing SaaS and marketing block families.
- [x] 5.5 Translate semantic layout controls, tokens, and interaction behavior into deterministic Bootstrap-compatible markup and inline support CSS/JS.
- [x] 5.6 Add renderer tests proving `bootstrap-html` output is standalone, deterministic, and mapped from semantic IR only.

## 6. IR, Handoff, And CLI

- [x] 6.1 Extend IR metadata with source mode, package manifest path, ordered included files with roles, package title, fidelity, adapter target, adapter version, resolved library, asset provenance, and acceptance summary.
- [x] 6.2 Preserve package source mapping for screens, blocks, flows, content records, layout controls, tokens, and acceptance invariants.
- [x] 6.3 Extend handoff metadata with package source details, viewer compatibility, adapter identity, resolved library identity, inline/vendored asset provenance, and package readiness status.
- [x] 6.4 Update CLI compile behavior so file input compiles as single-file and manifest/package input compiles as package mode.
- [x] 6.5 Add package compile scripts for canonical package examples.
- [x] 6.6 Ensure generated package artifacts remain portable HTML that opens in browser and Micro Canvas.

## 7. Verification And UAT Loop

- [x] 7.1 Run `openspec validate prototype-spec-packages-and-ui-adapters --strict`.
- [x] 7.2 Run `npm run check`.
- [x] 7.3 Compile single-file SaaS and marketing examples to confirm backward compatibility.
- [x] 7.4 Compile package SaaS and marketing examples twice and confirm unchanged IR and HTML are deterministic.
- [x] 7.5 Manually inspect package-generated HTML in the browser.
- [x] 7.6 Manually inspect package-generated HTML in Micro Canvas.
- [x] 7.7 Update task statuses and final implementation notes with any deferred adapter or acceptance-invariant work.

## Final Implementation Notes

- `openspec validate prototype-spec-packages-and-ui-adapters --strict` reports the change as valid; the CLI logs PostHog flush network errors afterward in the restricted sandbox, but exits successfully.
- `npm run check` passes with syntax validation and 44 node tests.
- Single-file examples compile successfully through the preserved baseline path: task board, SaaS dashboard, and marketing landing page.
- Package examples compile successfully through `bootstrap-html`, report browser and Micro Canvas compatibility, and produce byte-identical HTML/IR across repeated compiles.
- Browser inspection loaded both generated package artifacts from `artifacts/`; the only console error was the local dev server's missing `/favicon.ico`.
- Micro Canvas verified both package-generated artifacts in the native viewer: `revenue-workspace.html` and `launchlayer-marketing.html`.
- Acceptance invariants are parsed and preserved in IR/handoff/status metadata for future agents; this change does not mechanically enforce every natural-language UAT note beyond the structured validations described in the specs.
