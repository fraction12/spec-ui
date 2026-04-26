## Context

Spec UI now supports a useful semantic grammar for SaaS and marketing prototypes, but the authoring unit is still primarily one markdown file. That is fine for small examples. It becomes brittle for a real user/agent prototype loop where the user inspects HTML, asks for changes, and expects those changes to remain grounded in a clean spec rather than in renderer patches.

The product direction is to make the spec document the durable prototype source of truth. Agents should update focused files for screens, flows, content, layout, theme tokens, and acceptance feedback. The compiler should merge those files deterministically into the same semantic model and render portable HTML.

The second pressure is visual quality. Spec UI should not spend its energy building a full custom component library. A default open-source UI library gives us a better baseline for common components while the spec remains semantic and library-neutral. The adapter owns translation from Spec UI IR to concrete library markup and inline/vendored assets.

## Goals / Non-Goals

**Goals:**

- Add a prototype package input mode for larger prototypes.
- Use an OpenSpec-inspired package structure: one manifest plus focused source files.
- Preserve deterministic compilation from package files into IR and HTML.
- Keep single-file specs working for small prototypes and backward compatibility.
- Introduce one default open-source UI-library adapter as the supported default rendering target.
- Keep source specs semantic; no raw classes, component imports, JSX, framework-specific tags, or library-specific markup as canonical input.
- Capture UAT feedback in package-level acceptance notes that validation and future agents can use.
- Make adapter identity, version, source mode, and portability metadata visible in IR and handoff output.

**Non-Goals:**

- Supporting arbitrary UI libraries in this change.
- Production React/Vue/Svelte export.
- Allowing package files to import remote resources at compile or render time.
- Turning Spec UI semantic block names into a large bespoke component library.
- Building a visual editor.
- Adding backend data, persistence, live API integrations, or production form submission.
- Allowing raw CSS, Tailwind classes, Bootstrap classes, HTML, JSX, or JavaScript in spec files.

## Decisions

### Decision: Add a package manifest as the only package entry point

Prototype packages will compile from a manifest file, not from directory globbing. The manifest declares package metadata, adapter selection, fidelity, target viewers, and the ordered source files to include.

Example:

```md
# Prototype: Revenue Workspace [surface="app" adapter="library-default" target="standalone-html" fidelity="prototype"]

Includes:
- screens.md
- flows.md
- content.md
- layout.md
- tokens.md
- acceptance.md
```

**Rationale:** Deterministic include order is essential. A manifest also gives agents one obvious place to inspect before editing a package.

**Alternatives considered:**
- Directory globbing: less ceremony, but file-system order and accidental files become product behavior.
- One giant markdown file forever: simple, but does not scale to iterative prototype work.

### Decision: Keep package files role-oriented but compile to one semantic model

The package format will define conventional file roles:

- `screens.md`: screens, regions, blocks, and states.
- `flows.md`: navigation, modal/drawer behavior, form behavior, and journey paths.
- `content.md`: reusable copy, sample data, metrics, rows, FAQs, testimonials, and pricing data.
- `layout.md`: density, gap, padding, width, columns, responsive collapse, text wrapping, and overflow intent.
- `tokens.md`: semantic tones, theme profile, and brand-neutral visual knobs.
- `acceptance.md`: UAT findings, invariants, and prototype acceptance constraints.

These are source organization boundaries, not separate output models. The compiler resolves them into one validated IR.

**Rationale:** Agents can update the right file without scope creep, while the renderer still receives a single coherent contract.

**Alternatives considered:**
- Separate mini-compilers per file: too much architecture and likely inconsistent validation.
- Free-form arbitrary files: flexible, but hard for agents and validation to reason about.

### Decision: Use Bootstrap-backed standalone HTML as the first default adapter

The change will introduce one default adapter named `bootstrap-html`. It will map semantic IR to a pinned Bootstrap 5 distribution for common layout, controls, forms, tables, nav, cards, modals, and responsive behavior.

`bootstrap-html` becomes the default package adapter for new serious prototypes. `baseline` remains supported for existing single-file examples and lightweight output. Source specs still cannot use Bootstrap class names; the adapter owns that translation.

**Rationale:** We want better default components without making source specs depend on a particular library vocabulary.

**Alternatives considered:**
- Use `library-default`: less implementation-specific, but too vague for agents and users trying to reason about rendered output.
- Keep only `baseline`: deterministic but keeps us responsible for every component behavior and visual primitive.
- Support many adapters now: too broad and likely to break determinism.

### Decision: Vendor or inline adapter assets for portability

Generated HTML must continue to open offline in a browser or Micro Canvas. The adapter may use library CSS/JS only if the renderer can vendor or inline the required assets into the artifact deterministically. No CDN or runtime network dependency is allowed.

**Rationale:** Portable handoff is core to the product. A library-backed adapter is useful only if it preserves that property.

**Alternatives considered:**
- CDN links: easy, but violates standalone handoff and makes output non-deterministic under network changes.
- npm runtime loading in the browser: not acceptable for handoff HTML.

### Decision: Acceptance notes become first-class prototype constraints

`acceptance.md` will capture UAT feedback as durable, testable constraints. The system does not need to prove every sentence mechanically in this change, but it must parse, preserve, and expose acceptance notes in IR/handoff metadata so agents can iterate against them.

**Rationale:** The prototype loop lives or dies by whether feedback turns into the source of truth, not one-off renderer hacks.

**Alternatives considered:**
- Keep acceptance notes outside the package: easier initially, but loses continuity across agent sessions.
- Convert every acceptance note into a strict validation rule immediately: too ambitious and brittle.

### Decision: Single-file specs remain supported

Existing examples and single-file compile paths remain valid. Package input is additive.

**Rationale:** Small prototypes should stay lightweight, and existing tests/docs should not break.

### Decision: Borrow OpenSpec's workflow mechanics, not its exact domain model

Local OpenSpec behavior gives us a good pattern to copy:

- A tiny manifest, `.openspec.yaml`, identifies the workflow schema for a change.
- The schema defines artifacts, output paths, dependencies, templates, and apply readiness.
- `openspec status --change --json` reports which artifacts are ready, blocked, or done.
- `openspec instructions <artifact> --json` gives artifact-specific guidance and dependency context.
- Specs use explicit delta sections and testable `Requirement` / `Scenario` blocks.
- `tasks.md` uses parseable checkbox tasks, and apply mode tracks progress from that file.
- `openspec validate --strict` checks structure before implementation.
- `openspec archive` promotes completed deltas into canonical specs.

Spec UI prototype packages should copy the useful techniques:

- Manifest-driven package shape instead of filesystem guessing.
- Role dependency checks so agents know what is missing before rendering.
- Parseable package status output for readiness and validation errors.
- Focused role instructions in docs so agents know which file to edit for a user request.
- Structured acceptance invariants that act like prototype-specific scenarios.
- A future archive/handoff step that freezes an accepted prototype package as build input.

Spec UI should not copy OpenSpec's exact artifact names or delta/archive semantics in this change. Prototype packages are product UI source documents, not repository change proposals. The borrowed idea is the workflow discipline: explicit inputs, dependency-aware status, strict validation, and trackable implementation tasks.

### Decision: Define a canonical package shape for agents

Agents should be able to create and update package files without inventing structure. The canonical package layout is:

```txt
examples/revenue-workspace/
  prototype.md
  screens.md
  flows.md
  content.md
  layout.md
  tokens.md
  acceptance.md
```

The manifest is always `prototype.md` for this change. It uses markdown because the rest of Spec UI is markdown-first:

```md
# Prototype: Revenue Workspace [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

Includes:
- screens.md [role="screens" required="true"]
- flows.md [role="flows" required="true"]
- content.md [role="content" required="true"]
- layout.md [role="layout" required="true"]
- tokens.md [role="tokens" required="false"]
- acceptance.md [role="acceptance" required="true"]
```

Rules:

- Include paths are package-relative POSIX-style paths.
- Include paths must stay inside the package directory.
- Include order is canonical merge order.
- Unknown roles fail validation.
- Unlisted files do not affect output.
- Missing required files fail validation.
- Optional files may be omitted only when the manifest marks them optional.

### Decision: Use simple markdown sections inside role files

Role files should stay readable to users while remaining parseable.

`screens.md` owns the existing vNext screen grammar:

```md
## Screen: Executive Dashboard [id="executive-dashboard" shell="app" kind="dashboard" gap="md"]
### Region: Sidebar [id="sidebar" type="sidebar" gap="md"]
#### Block: Navigation [id="primary-nav" type="nav" gap="sm"]
```

`flows.md` owns explicit user-visible paths:

```md
## Flow: Primary Review [id="primary-review" start="executive-dashboard"]
- Step: Open Pipeline [from="executive-dashboard" action="navigate:pipeline-review" to="pipeline-review"]
- Step: Open Forecast Modal [from="pipeline-review" action="open-modal:forecast-modal" to="forecast-modal"]
```

`content.md` owns reusable records:

```md
## Content: Opportunity Rows [id="opportunity-rows" type="table-rows"]
- Row: Acme Expansion [stage="Commit" owner="Rae" value="$82k"]
- Row: Northwind Pilot [stage="Best Case" owner="Ira" value="$41k"]
```

`layout.md` owns controls that would otherwise tempt agents into CSS:

```md
## Layout: Dashboard Density [target="screen:executive-dashboard"]
- Control: density [value="compact"]
- Control: padding [value="md"]
- Control: collapse [value="stack" at="tablet"]
- Control: overflow [value="contain"]
```

`tokens.md` owns semantic visual knobs only:

```md
## Tokens: Theme [id="default"]
- Tone: brand [value="blue"]
- Radius: controls [value="sm"]
- Treatment: cards [value="outlined"]
```

`acceptance.md` owns UAT feedback and invariants:

```md
## Acceptance
- Invariant: Stable navigation labels [target="block:primary-nav"]
- Invariant: Single modal stack [target="screen:*"]
- Invariant: Reachable flow [target="flow:primary-review"]
- Note: Long account names must wrap inside cards without spilling.
```

### Decision: Merge role files through a deterministic package model

Implementation should avoid making the renderer understand package files. The flow is:

```txt
package manifest
  -> package source model with include records
  -> role parsers
  -> merged semantic source model
  -> existing validation
  -> semantic IR
  -> adapter renderer
  -> standalone HTML + handoff metadata
```

Merge rules:

- Parse each included file independently with `sourceFile`, `sourceLine`, and `role`.
- Preserve manifest include order when appending role-derived records.
- Validate global IDs after merge, across all roles.
- Resolve content references before IR emission.
- Resolve layout target references before IR emission.
- Resolve flow target references after actions/states/screens are known.
- Preserve acceptance notes and structured invariants in metadata.
- Do not let later files silently override earlier structural declarations unless an explicit `target` rule exists for layout/tokens.

### Decision: Add package status before broad rendering work

OpenSpec's `status` command is useful because agents can see readiness before implementation. Spec UI should add equivalent package-level status during this change, even if it is initially internal/tested through parser APIs or a CLI flag.

The status model should report:

- package title, source mode, manifest path, adapter, and fidelity
- included files with role, required flag, existence, and parse status
- missing required files
- duplicate IDs
- unresolved content/layout/flow references
- unsupported adapter or layout values
- acceptance invariant count
- readiness: `ready`, `blocked`, or `invalid`

This gives future subagents a shared map instead of making each one rediscover package health.

### Decision: Split implementation lanes by package role and pipeline layer

For subagent work, ownership should be explicit:

- **Package/docs/examples lane:** docs, canonical package examples, role-file examples, fixtures.
- **Manifest/parser lane:** input detection, manifest parser, role dispatch, source metadata.
- **Validation/resolution lane:** role validation, reference resolution, error codes, package status.
- **IR/handoff lane:** package metadata, source map, adapter metadata, handoff provenance.
- **Bootstrap adapter lane:** adapter registry, vendored assets, renderer mapping, standalone HTML checks.
- **Integration/verification lane:** CLI scripts, deterministic compile checks, browser/Micro Canvas UAT.

Workers should not edit another lane's files except for narrow integration repairs.

### Decision: Use explicit validation error codes

Agents need stable failures to test against. The implementation should introduce error codes rather than relying on prose:

- `missing_package_manifest`
- `missing_package_include`
- `unsupported_package_role`
- `package_include_outside_root`
- `duplicate_package_id`
- `unresolved_content_reference`
- `unresolved_layout_target`
- `unresolved_flow_target`
- `unsupported_layout_control`
- `unsupported_token_control`
- `unsupported_adapter`
- `raw_implementation_detail`
- `adapter_asset_provenance_unknown`

## Risks / Trade-offs

- **[Risk] Adapter work drifts into full component-library maintenance** -> Mitigation: keep adapter mapping bounded to existing semantic blocks and reject unsupported library-specific source syntax.
- **[Risk] Package files create conflicting declarations** -> Mitigation: deterministic merge order plus validation for duplicate IDs, duplicate flow definitions, and incompatible layout overrides.
- **[Risk] Users expect arbitrary design-system swapping immediately** -> Mitigation: document one supported default adapter and a future adapter registry contract.
- **[Risk] Vendored library assets bloat HTML output** -> Mitigation: measure artifact size and include only required CSS/JS slices where practical.
- **[Risk] Acceptance notes are too free-form to test** -> Mitigation: preserve notes now, add structured invariants for high-value checks such as stable nav labels, modal stacking, overflow containment, and reachable flows.

## Migration Plan

This is additive:

1. Keep existing single-file examples and `baseline` rendering path working.
2. Add package parsing behind input detection: file path compiles as today, directory/manifest path compiles as a package.
3. Add the default library-backed adapter without making it mandatory for existing specs.
4. Add package examples and compile scripts.
5. Update docs so new serious prototypes prefer package mode.

Rollback is straightforward: package input and `bootstrap-html` adapter can be disabled while preserving the existing single-file `baseline` path.

## Open Questions

- Should a future change add a `prototype.yaml` manifest for tool-authored packages, or is markdown sufficient?
- Should a future archive command freeze an accepted package into implementation-ready docs outside `examples/`?
