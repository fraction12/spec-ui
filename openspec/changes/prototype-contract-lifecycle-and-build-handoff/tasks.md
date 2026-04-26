## 1. Foundation And Compatibility

- [ ] 1.1 Inventory current CLI, package-source, validation, status, handoff, renderer, templates, docs, and tests before implementation.
- [ ] 1.2 Add lifecycle terminology to docs/help: prototype contract, canonical package, derived artifact, viewer handoff, implementation handoff, prototype change, archive, variant, adapter profile.
- [ ] 1.3 Preserve existing single-file compile behavior and existing package compile behavior.
- [ ] 1.4 Preserve existing commands: `init`, `list`, `show`, `status`, `validate`, `instructions`, `compile`, and `compile --status` compatibility.
- [ ] 1.5 Extend `.spec-ui/config.json` defaults to include `prototypeChangesDir`, `adapterProfilesDir`, `handoffDir`, and lifecycle template paths.
- [ ] 1.6 Update init templates without hiding canonical prototype source inside `.spec-ui/`.

## 2. Package Contract Roles

- [ ] 2.1 Add optional `states` role support in package manifests and readiness reporting.
- [ ] 2.2 Add `data` role support in package manifests, with `contracts` as an alias only if documented and tested.
- [ ] 2.3 Parse state definitions for empty/loading/error/success/populated and target references.
- [ ] 2.4 Parse data/contracts definitions for entities, fields, sample records, API assumptions, form payloads, state shape, and sensitivity notes.
- [ ] 2.5 Preserve states and data/contracts in IR, status, source maps, and handoff metadata.
- [ ] 2.6 Require data/contracts for implementation handoff when a prototype contains data-driven blocks such as tables, forms, metrics, collection lists, detail panels, or settings.
- [ ] 2.7 Add valid and invalid fixtures for states/data roles.
- [ ] 2.8 Reject raw code, secrets, SQL driver snippets, network calls, framework code, scripts, styles, classes, or component names in states/data roles.

## 3. Readiness Model

- [ ] 3.1 Extend status output with `sourceReady`, `reviewReady`, `archiveReady`, and `handoffReady`.
- [ ] 3.2 Keep human status concise and JSON status stable/parseable.
- [ ] 3.3 Ensure `validate` remains artifact-free and exits with 0 valid, 1 invalid/blocked, 2 usage error.
- [ ] 3.4 Add source references to readiness errors and warnings.
- [ ] 3.5 Add tests for review-ready-but-not-handoff-ready packages.

## 4. Prototype Change Workflow

- [ ] 4.1 Implement `spec-ui change new <change-id> --target <prototype>`.
- [ ] 4.2 Scaffold `prototype-changes/<change-id>/proposal.md`, `design.md`, `tasks.md`, `target.md`, and `deltas/` deterministically.
- [ ] 4.3 Implement `spec-ui change status <change-id> [--json]`.
- [ ] 4.4 Implement `spec-ui change validate <change-id> [--strict]`.
- [ ] 4.5 Resolve target packages by explicit path, configured prototype name, and built-in examples where appropriate.
- [ ] 4.6 Validate missing target, stale base hash, unsupported delta roles, unsafe paths, raw implementation detail, unresolved references, and archive conflicts.
- [ ] 4.7 Add command help and usage errors for the change command group.

## 5. Change Preview

- [ ] 5.1 Implement `spec-ui change preview <change-id> --out <artifact.html> [--ir <artifact.ir.json>]`.
- [ ] 5.2 Merge canonical target package plus role deltas into an effective preview source model without mutating canonical files.
- [ ] 5.3 Include target package, change id, base source hash, delta source hash, changed roles, and preview status in handoff metadata.
- [ ] 5.4 Ensure preview HTML remains standalone, deterministic, portable, and offline-capable.
- [ ] 5.5 Add tests proving preview does not modify canonical package source.

## 6. Archive / Promote

- [ ] 6.1 Define first implementation archive strategy: whole-role replacement, structured patch blocks, or both.
- [ ] 6.2 Implement `spec-ui change archive <change-id>` with confirmation or explicit non-interactive flag if needed.
- [ ] 6.3 Validate target package before applying deltas.
- [ ] 6.4 Validate change archive safety before applying deltas.
- [ ] 6.5 Verify base source hash when present and fail on stale source unless explicitly refreshed.
- [ ] 6.6 Apply deltas deterministically and refuse ambiguous/conflicting edits.
- [ ] 6.7 Validate target package after applying deltas.
- [ ] 6.8 Record archive provenance: change id, target package, applied roles, before/after source hashes, timestamp, generated artifact refs.
- [ ] 6.9 Move archived changes to a deterministic archive location or mark them archived.
- [ ] 6.10 Add tests for success, stale base, conflict, validation failure, rollback/failure reporting, and provenance.

## 7. Implementation Handoff

- [ ] 7.1 Define `spec-ui.implementation-handoff.v1` JSON schema.
- [ ] 7.2 Implement human markdown handoff packet format.
- [ ] 7.3 Implement `spec-ui handoff <prototype> --for implementation --out <file.md> [--json <file.json>]` or selected equivalent command.
- [ ] 7.4 Implement `spec-ui change handoff <change-id> --for implementation` for approved/previewable changes if feasible.
- [ ] 7.5 Include prototype identity, source hash, manifest/includes, screens, regions, blocks, states, actions, flows, data/contracts, content, layout, tokens, acceptance, adapter/profile constraints, non-goals, open questions, warnings, and errors.
- [ ] 7.6 Mark generated HTML/IR/screenshots/viewer URLs as review references only.
- [ ] 7.7 Fail or warn when handoff lacks required data/contracts, acceptance criteria, or profile constraints.
- [ ] 7.8 Add tests for JSON validity, markdown contents, artifact-reference-only language, and blocked handoff readiness.

## 8. Adapter Profiles

- [ ] 8.1 Define visible `adapter-profiles/<profile-id>/` directory shape.
- [ ] 8.2 Implement profile parsing for `profile.md`, `tokens.md`, `components.md`, and `constraints.md`.
- [ ] 8.3 Add semantic profile metadata: id, display name, supported surfaces, typography roles, tones, density, treatments, layout archetypes, component families, accessibility rules, responsive rules, forbidden details.
- [ ] 8.4 Allow packages/changes/variants to reference profiles semantically.
- [ ] 8.5 Preserve profile identity/provenance in status, IR, viewer handoff, and implementation handoff.
- [ ] 8.6 Reject raw HTML, JSX, Tailwind strings, CSS class maps, framework imports, script/style blocks, CDN links, or remote runtime assets in profiles.
- [ ] 8.7 Add a fixture profile inspired by a real dark editorial/signal-desk portfolio system.
- [ ] 8.8 Add tests for valid profile, missing profile, invalid profile, and profile-targeted package handoff.

## 9. Product Review Variants

- [ ] 9.1 Define variant metadata schema: id, target, hypothesis, structure strategy, hierarchy strategy, density strategy, profile/adapter target, acceptance criteria.
- [ ] 9.2 Decide whether variants are first-class directories or a special prototype-change type; document the choice.
- [ ] 9.3 Implement `spec-ui variant new`, `status`, `compare`, and `preview`, or implement equivalent through change workflow with clear docs.
- [ ] 9.4 Add structural comparison that checks shell, regions, block sequence, layout controls, density, flow model, and profile strategy.
- [ ] 9.5 Warn when variants appear to be copy-only changes.
- [ ] 9.6 Allow a selected variant to be promoted into a prototype change and archived.
- [ ] 9.7 Add tests for distinct variants, samey variants, invalid variants, and selected-variant promotion.

## 10. OpenSpec Interop

- [ ] 10.1 Document boundary: OpenSpec for behavior/system requirements; Spec UI for experience/product-surface contracts.
- [ ] 10.2 Allow optional OpenSpec references in prototype manifests and prototype changes.
- [ ] 10.3 Include OpenSpec references in implementation handoff metadata when present.
- [ ] 10.4 Add optional export of accepted prototype acceptance criteria/flows into OpenSpec-ready requirement/scenario markdown.
- [ ] 10.5 Ensure Spec UI lifecycle works without OpenSpec installed or initialized.

## 11. Docs And Examples

- [ ] 11.1 Update README with final first-class loop: init → package → status → validate → compile → review → change → preview → archive → handoff.
- [ ] 11.2 Update docs/grammar.md for states/data roles, prototype changes, profiles, and variants.
- [ ] 11.3 Add docs/lifecycle.md.
- [ ] 11.4 Add docs/implementation-handoff.md.
- [ ] 11.5 Add docs/adapter-profiles.md.
- [ ] 11.6 Add docs/variants.md.
- [ ] 11.7 Add an end-to-end example package plus change plus archived result plus implementation handoff.
- [ ] 11.8 Use the TradeSpec portfolio tool-page scenario as the design proof case, but avoid private internals.

## 12. Verification

- [ ] 12.1 Run `openspec validate prototype-contract-lifecycle-and-build-handoff --strict`.
- [ ] 12.2 Run `openspec validate --all --strict` if repository state allows.
- [ ] 12.3 Run `npm run check`.
- [ ] 12.4 Fix or isolate the existing built-in-example listing test failure caused by untracked TradeSpec example packages.
- [ ] 12.5 Run lifecycle command smoke tests in human and JSON modes.
- [ ] 12.6 Verify preview/archive never mutates canonical source except during explicit archive.
- [ ] 12.7 Verify generated HTML remains standalone and deterministic.
- [ ] 12.8 Verify implementation handoff is generated from source contracts and labels generated artifacts as references only.
- [ ] 12.9 Verify source specs and profiles still reject raw implementation details.
