## Context

Spec UI started as a markdown-to-deterministic-HTML compiler. That foundation matters, but the final product should not be “markdown renderer with opinions.” It should be a first-class spec-to-prototype workflow for product surfaces.

The durable boundary is:

```text
OpenSpec = what the system must do
Spec UI  = what the user should experience
```

A generated prototype is not the source of truth. The source of truth is the semantic package that produced it. The HTML is the executable review artifact: portable, deterministic, offline-capable, and easy for Microcanvas/browser to present. Coding agents should build from the source contract and implementation handoff, not from the rendered DOM.

This change upgrades Spec UI from compiler workflow to product lifecycle workflow.

## Design Principles

1. **Source over artifact** — package markdown is canonical; HTML/IR/screenshots are derived.
2. **Semantics over implementation** — source expresses product intent, not framework syntax.
3. **Review before code** — prototypes exist to make product/design decisions earlier.
4. **Determinism over vibes** — unchanged source/config produces unchanged output and handoff.
5. **Visible source** — prototype packages and changes live in normal project directories, not hidden tool state.
6. **Adapter-aware, adapter-neutral** — profiles can describe visual systems, but source cannot tunnel class names or components.
7. **Lifecycle discipline** — proposed changes are previewed and archived into canonical source.
8. **Handoff without reverse-engineering** — coding agents receive structured product intent, not generated HTML as pseudo-code.

## Goals / Non-Goals

### Goals

- Make prototype packages canonical product-surface contracts.
- Add a Spec UI-native change lifecycle: new/status/validate/preview/archive.
- Add implementation handoff packets for coding agents.
- Add first-class data/contracts and states roles.
- Add semantic adapter profiles for real repo visual systems.
- Add product review variants and samey-variant detection.
- Preserve single-file and existing package compile flows.
- Preserve standalone deterministic HTML as viewer handoff.
- Provide optional OpenSpec interop without requiring OpenSpec.

### Non-Goals

- Production app codegen.
- Arbitrary library/component selection.
- A visual editor.
- Backend/runtime orchestration.
- Replacing OpenSpec for system behavior.
- Letting raw HTML/JSX/CSS/classes/Tailwind/component imports/scripts/styles into canonical source.

## Current State

Spec UI already has:

- Single-file source mode.
- Package source mode via `prototype.md` and role includes.
- Roles for screens, flows, content, layout, tokens, and acceptance.
- Semantic app/marketing grammar.
- `baseline` and `bootstrap-html` rendering targets.
- Deterministic standalone HTML output.
- Handoff metadata for viewer/browser/Microcanvas use.
- CLI workflow: init, list, show, status, validate, instructions, compile.

Gaps:

- Package mode is not yet explicitly a lifecycle source-of-truth model.
- There is no proposed-change directory model.
- There is no archive/promote operation.
- There is no implementation handoff packet.
- There is no first-class data/contracts role.
- There is no repo visual-system profile contract.
- There is no way to assert that variants are structurally different.

## Target Source Model

Initialized repos should have this shape by default:

```text
.spec-ui/
  config.json
  instructions.md
  templates/

prototypes/
  <name>/
    prototype.md
    screens.md
    flows.md
    states.md
    data.md
    content.md
    layout.md
    tokens.md
    acceptance.md

prototype-changes/
  <change-id>/
    proposal.md
    design.md
    tasks.md
    target.md
    deltas/
      screens.md
      flows.md
      states.md
      data.md
      content.md
      layout.md
      tokens.md
      acceptance.md

adapter-profiles/
  <profile-id>/
    profile.md
    tokens.md
    components.md
    constraints.md

artifacts/
handoff/
```

`.spec-ui/` remains repo-local tool configuration and guidance. It must not hide canonical prototype source.

## Package Contract

A prototype package represents one product surface, flow family, or page family. `prototype.md` is the manifest and defines metadata plus deterministic include order.

Recommended roles:

- `screens` — screens, regions, blocks, items, actions, and inline state hooks.
- `flows` — navigation paths, modal/drawer behavior, form transitions, tabs, toggles, and state changes.
- `states` — screen/block/state definitions such as empty/loading/error/success/populated and state transition intent.
- `data` — entities, fields, rows, form payloads, state shape, API assumptions, privacy/sensitivity notes.
- `content` — reusable copy, labels, metrics, rows, FAQs, testimonials, pricing tiers.
- `layout` — semantic density, columns, width, collapse, alignment, spacing, overflow.
- `tokens` — semantic tone, typography role, radius, treatment, density; optional but recommended.
- `acceptance` — UAT notes, invariants, review decisions, must-pass behavior and visual constraints.

During implementation, `data` may be named `contracts` only if the implementation explicitly aliases it. The product recommendation is `data.md` because it is shorter and less overloaded than contracts.

## Change Workflow

A prototype change is a proposed UX/product-surface delta against a canonical package.

### Create

```bash
spec-ui change new improve-tradespec-tool-page --target tradespec-tool-page
```

Creates deterministic scaffold:

```text
prototype-changes/improve-tradespec-tool-page/
  proposal.md
  design.md
  tasks.md
  target.md
  deltas/
```

`target.md` should include:

```markdown
# Target: improve-tradespec-tool-page
Prototype: tradespec-tool-page
Base Source Hash: <optional, filled when known>
Mode: change
```

### Status

```bash
spec-ui change status improve-tradespec-tool-page --json
```

Reports:

- change id/path
- target prototype path
- target source hash
- changed role files
- readiness: draft / blocked / preview-ready / archive-ready / archived
- validation errors/warnings
- unresolved references
- task state
- preview artifact metadata
- archive safety

### Validate

Validates change structure and target compatibility without writing artifacts or mutating package source.

### Preview

Compiles effective source:

```text
canonical target package + declared role deltas = preview source model
```

Preview must not mutate canonical source. Preview handoff metadata must identify both base package and change id.

### Archive

Archives approved deltas into canonical package source.

Initial implementation should prefer safe whole-role replacement or explicit structured patch blocks over clever freeform merging. Archive must refuse ambiguous conflicts.

Archive process:

1. Resolve target package.
2. Validate target package.
3. Validate change.
4. Verify base hash if present.
5. Apply deltas deterministically.
6. Validate resulting package.
7. Record provenance.
8. Mark/move change as archived.
9. Report resulting package status.

If post-archive validation fails, archive must rollback or fail with explicit recovery instructions.

## Implementation Handoff

Viewer handoff and implementation handoff are different products.

Viewer handoff says:

> Open this generated HTML artifact and review it.

Implementation handoff says:

> Build this experience from this source contract.

Expected command:

```bash
spec-ui handoff tradespec-tool-page --for implementation --out handoff/tradespec-tool-page.md --json handoff/tradespec-tool-page.json
```

Handoff JSON should include:

```json
{
  "schema": "spec-ui.implementation-handoff.v1",
  "prototype": {
    "id": "tradespec-tool-page",
    "path": "prototypes/tradespec-tool-page",
    "sourceHash": "...",
    "surface": "marketing",
    "adapter": "bootstrap-html",
    "profile": "portfolio-signal-desk"
  },
  "readiness": "ready",
  "source": {
    "manifest": "prototype.md",
    "includes": []
  },
  "screens": [],
  "flows": [],
  "states": [],
  "data": {
    "entities": [],
    "fields": [],
    "sampleRecords": [],
    "apiAssumptions": [],
    "stateShape": []
  },
  "content": [],
  "layout": [],
  "tokens": [],
  "acceptance": [],
  "adapterProfile": {
    "id": "portfolio-signal-desk",
    "constraints": [],
    "forbiddenDetails": []
  },
  "artifacts": {
    "html": "artifacts/tradespec-tool-page.html",
    "ir": "artifacts/tradespec-tool-page.ir.json",
    "usage": "review-reference-only"
  },
  "nonGoals": [],
  "openQuestions": [],
  "warnings": [],
  "errors": []
}
```

Markdown handoff should be readable by coding agents and humans. It should contain the same core sections and explicitly say not to reverse-engineer generated HTML.

## Adapter Profiles

The TradeSpec prototype failure exposed a key need: if the renderer is generic, variants look generic. Spec UI needs a way to target a real visual system while keeping source semantic.

Adapter profile directory:

```text
adapter-profiles/portfolio-signal-desk/
  profile.md
  tokens.md
  components.md
  constraints.md
```

Profile source may describe:

- Typography roles, not font import code.
- Semantic colors/tone names, not raw class strings.
- Density, rhythm, panel treatments, card treatments.
- Layout archetypes and navigation patterns.
- Allowed semantic component families.
- Accessibility and responsive constraints.
- Forbidden implementation leakage.

Profile source must not include:

- Raw HTML/JSX/component imports.
- CSS class names as mapping keys.
- Tailwind strings.
- Scripts/styles.
- CDN/runtime network assets.
- Framework-specific code.

A package may target a profile semantically, for example:

```markdown
# Prototype: TradeSpec Tool Page [surface="marketing" adapter="bootstrap-html" profile="portfolio-signal-desk"]
```

The source still says “editorial split hero” or “terminal proof rail,” not `.hero-grid` or `<ToolCard />`.

## Variants

A review variant is an intentionally different product direction. Variants should make tradeoffs visible.

Variant metadata:

```markdown
# Variant: Investor Proof [id="investor-proof" target="tradespec-tool-page"]
Hypothesis: Recruiters and early-stage investors need proof density before narrative.
Structure: proof-led dashboard case study
Density: high
Hierarchy: metrics and evidence first
Profile: portfolio-signal-desk
```

Spec UI should compare variants and warn when they are samey. Samey signals include identical shell, region order, block sequence, density, flow model, and layout strategy with only copy changes.

For the real TradeSpec use case, three good variants might be:

1. **Case Study Ledger** — editorial intro with compact evidence cards and workflow timeline.
2. **Signal Desk** — terminal/observability inspired dashboard with proof rails and artifacts.
3. **Founder Proof Memo** — dense memo/case-study hybrid optimized for early-startup credibility.

## Status And Readiness

Status should distinguish:

- `sourceReady` — package syntax and includes are valid.
- `reviewReady` — can compile a useful prototype artifact.
- `archiveReady` — a change can be promoted safely.
- `handoffReady` — implementation handoff has required data/contracts, acceptance, and profile constraints.

A package may be review-ready but not handoff-ready if it lacks data contracts or acceptance criteria.

## Validation Strategy

Validation should reject:

- Missing required roles.
- Unsafe include paths.
- Unsupported role names.
- Raw implementation markup.
- Unsupported semantic values.
- Unresolved screen/state/block/action/flow/data/content/profile references.
- Deltas that target nonexistent roles.
- Change archives against stale base hashes.
- Adapter profiles that tunnel classes/components.
- Variants that claim different hypotheses but have no structural differences, at least as warnings.

## OpenSpec Interop

Spec UI should not depend on OpenSpec. It should optionally interoperate:

- Link prototype packages to OpenSpec change ids.
- Export accepted prototype acceptance criteria as OpenSpec-ready requirements/scenarios.
- Include OpenSpec references in implementation handoff.
- Keep boundary language clear.

## Migration Strategy

1. Preserve existing CLI and package examples.
2. Add data/states role support without breaking packages that omit them.
3. Add lifecycle docs and status fields.
4. Add change preview before archive.
5. Add safe archive behavior.
6. Add implementation handoff.
7. Add adapter profiles.
8. Add variants and comparison warnings.

## Risks

- Archive merging gets too clever. Start conservative.
- Adapter profiles become implementation backdoors. Validate aggressively.
- Handoff becomes a prose dump. Require JSON schema plus markdown.
- Variants clutter repos. Keep visible lifecycle/status and archive semantics.
- Scope creeps into general SDD. Keep domain tightly on product surfaces and UX artifacts.

## Open Questions

- Should `states.md` be required for package mode or optional until used?
- Should `data.md` be required for all implementation handoff, or only when data-driven blocks exist?
- Should prototype changes default to whole-role deltas or structured patch blocks?
- Should adapter profiles live in `adapter-profiles/` or `.spec-ui/profiles/`? Product recommendation: visible `adapter-profiles/`.
- Should variant commands be first-class immediately or implemented as a special change type first?
