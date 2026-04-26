## Context

Spec UI foundation established the deterministic core: structured markdown -> parser -> validated IR -> deterministic HTML -> portable handoff. That core is sound, but the current vocabulary is still closer to a proof of concept than a serious product-prototyping system.

The product direction for this next change is clear:
- target real SaaS/web-app product prototypes
- include landing/marketing pages in the same expansion
- avoid building and maintaining an internal component library as a central product responsibility

This last point matters. Spec UI should own semantic intent, compilation rules, validation, deterministic rendering, and adapter boundaries. It should not become a clone of every open-source design system on the internet. Existing component libraries already solve a different problem: concrete UI implementation. Spec UI’s job is to express intent in a spec-first way and render that intent predictably.

The architecture therefore needs a middle path:
- rich semantic grammar
- stable IR contract
- deterministic renderer behavior
- a small baseline rendering target
- a supported way to bind semantic elements to external component libraries or provided adapters later

## Goals / Non-Goals

**Goals:**
- Expand the grammar so agents can author serious SaaS/web-app and landing-page prototypes.
- Add semantic constructs for common product surfaces without forcing raw HTML or CSS into the spec.
- Support richer layout and navigation intent for dashboards, detail pages, settings, onboarding, pricing, hero sections, testimonials, FAQs, and CTA flows.
- Preserve deterministic compilation and rendering semantics.
- Define an adapter contract so Spec UI can target a supported external component style/layer without owning a large in-house component library.
- Keep the output as portable interactive HTML artifacts.

**Non-Goals:**
- Building production React export in this change.
- Supporting arbitrary npm packages or arbitrary component libraries at runtime.
- Letting specs embed raw Tailwind/HTML/JSX as the canonical structure.
- Building a visual editor.
- Solving backend persistence, real data loading, or production API behavior.
- Creating a giant bespoke in-repo component design system.
- Supporting unbounded visual theming, arbitrary CSS classes, arbitrary JavaScript, JSX, or library-specific component names as canonical spec input.
- Replacing the existing portable HTML handoff path; generated artifacts must still open as standalone HTML in a browser and Micro Canvas.

## Scope Lock

This change has one implementation target: compile a bounded vNext semantic markdown grammar into deterministic, portable HTML prototypes for two example surfaces:

1. A signed-in SaaS product prototype.
2. A public marketing/landing-page prototype.

Implementation MUST stay inside this target. Do not add production framework export, package-manager runtime dependencies, visual editors, live data integrations, broad theming systems, or arbitrary component-library support. If a semantic block is not listed in this document, implementation should reject it with a clear error rather than silently rendering an improvised pattern.

## Subagent Ownership Model

The implementation should be split across lanes with mostly disjoint write ownership:

- **Grammar/docs/fixtures lane:** `docs/grammar.md`, `docs/handoff.md`, `fixtures/**`, `examples/**`, and generated example artifacts under `artifacts/**`.
- **Parser/validation lane:** `src/contracts.js`, `src/parser.js`, `src/validation.js`, and `test/parser-validation.test.js`.
- **IR/compiler/adapter lane:** `src/ir-schema.js`, `src/compiler.js`, `src/handoff.js`, and `test/compiler-ir.test.js`.
- **Renderer lane:** `src/render-html.js`, `test/render-html.test.js`, golden output fixtures if added, and generated example artifacts when needed for renderer verification.
- **Integration lane:** `bin/spec-ui.mjs`, `README.md`, cross-lane test repair, OpenSpec task updates, final checks, browser/Micro Canvas verification.

Workers should not rewrite files owned by another lane unless integration requires a small compatibility patch. Workers must preserve existing foundation behavior while adding vNext behavior.

## Decisions

### Decision: Expand one product step around common product surfaces
This change will deliberately target two adjacent but high-value surface types in one step:
1. SaaS/web-app signed-in product interfaces
2. Marketing/landing pages

**Rationale:**
- They cover a huge share of real product design work.
- They share enough layout and content semantics to benefit from one coherent grammar evolution.
- They make Spec UI materially more useful without wandering into native/mobile or arbitrary application codegen.

**Alternatives considered:**
- **SaaS-only now, landing pages later:** cleaner scope, but artificially splits patterns users often need together.
- **Include mobile/app flows too:** too broad for this step.

### Decision: Use semantic blocks, not a Spec UI-owned component library
Spec UI will model semantic blocks such as app shell, sidebar nav, topbar, metric row, data table, form section, pricing tier, testimonial group, FAQ list, CTA band, and hero section. These are authoring/runtime semantics, not a permanent internal component library strategy.

**Rationale:**
- Specs need meaningful building blocks.
- Those blocks should describe intent, hierarchy, and behavior rather than visual implementation detail.
- The renderer can map semantic blocks to a baseline HTML representation now and to supported adapters later.

**Alternatives considered:**
- **Build our own reusable component library:** expensive, distracting, and likely mediocre versus existing libraries.
- **Allow only ultra-primitive elements forever:** too weak for serious agent-authored product prototypes.
- **Allow arbitrary library-specific component references in specs:** breaks portability and determinism too early.

### Decision: Introduce a constrained component adapter contract
Spec UI will define a constrained adapter layer where semantic elements can map to a supported rendering target. The default renderer remains built-in and deterministic, but the grammar/IR will be designed so adapters can later map semantic constructs onto approved library implementations.

**Rationale:**
- Keeps Spec UI from owning a giant component surface.
- Preserves deterministic semantics by constraining adapter inputs and outputs.
- Creates a future path for open-source or paid component-library integration without contaminating the core grammar.

**Alternatives considered:**
- **No adapter concept at all:** simpler today, but likely forces bespoke rendering forever.
- **Arbitrary user-supplied component libraries immediately:** too loose and likely to break determinism and portability.

### Decision: Keep style opinionated enough to be useful, but not the product center
The renderer should have credible default styling and hierarchy for both app and landing-page prototypes, but deep visual customization is not the center of this change.

**Rationale:**
- Ugly or shapeless output weakens decision-making.
- Over-investing in style systems now would distract from semantic power and determinism.
- Good enough defaults plus a future adapter path is the right trade.

### Decision: Extend the IR instead of bypassing it
All new SaaS and landing-page semantics will compile into the typed IR first, then render from that IR.

**Rationale:**
- Keeps the architecture honest.
- Preserves determinism and debuggability.
- Prevents the renderer from becoming a second parser.

### Decision: Use a bounded vNext grammar
The change will introduce explicit semantic headings, block types, and item types instead of accepting arbitrary labels. Supported grammar is intentionally narrow enough to validate.

**Canonical source shape:**

```md
# Spec: <title> [surface="app|marketing" adapter="baseline"]
## Screen: <title> [id="<screen-id>" shell="app|marketing|none" kind="<screen-kind>" gap="none|xs|sm|md|lg|xl"]
### Region: <title> [id="<region-id>" type="<region-type>" gap="none|xs|sm|md|lg|xl"]
#### Block: <title> [id="<block-id>" type="<block-type>" variant="<variant>" gap="none|xs|sm|md|lg|xl"]
- <item-type>#<item-id>: <label> [key="value" action="<action-type>:<target-id>"]
##### State: <label> [id="<state-id>" type="<state-type>"]
- <item-type>#<item-id>: <label> [key="value" action="<action-type>:<target-id>"]
```

The existing `### Section:` and `#### State:` grammar remains supported for backward compatibility. New specs should prefer `Region` and `Block` where they need richer semantics.

**Rationale:**
- Provides enough structure for serious prototypes.
- Gives parser and validation workers a finite target.
- Gives renderer workers semantic intent without becoming a component-library clone.

### Decision: Keep adapter support metadata-first in this change
The only supported rendering target in this change is `baseline`. The adapter contract will be represented in metadata and mapping tables so future render targets can be added without changing the source grammar.

**Rationale:**
- Prevents arbitrary component-library support from leaking into vNext.
- Lets the handoff describe which target rendered the artifact.
- Keeps implementation practical while preserving the architectural boundary.

## Required Semantic Expansion

The final grammar MUST cover the following bounded semantic families. Additions beyond this list should be treated as follow-on work unless they are tiny aliases needed for fixture readability.

### App / SaaS semantics
- `shell="app"` screen layout with `sidebar`, `topbar`, `content`, `aside`, and `footer` regions.
- Blocks: `nav`, `page-header`, `metric-row`, `data-table`, `collection-list`, `detail-panel`, `form`, `settings-group`, `onboarding-steps`, `activity-feed`, `tabs`, `filters`, `state-panel`, `modal`, `drawer`, and `confirmation`.
- Items: `nav-item`, `action`, `button`, `text`, `metric`, `column`, `row`, `field`, `select`, `toggle`, `badge`, `step`, `activity`, `tab`, `empty`, `loading`, `success`, and `error`.
- Screen kinds: `dashboard`, `list`, `detail`, `form`, `settings`, `onboarding`, and `workflow`.
- State types: existing state types plus `drawer` and `confirmation`.

### Landing / marketing semantics
- `shell="marketing"` screen layout with `navbar`, `main`, and `footer` regions.
- Blocks: `navbar`, `hero`, `logo-cloud`, `feature-grid`, `feature-band`, `pricing`, `testimonial-group`, `faq`, `cta`, `footer`, `contact-form`, and `signup-form`.
- Items: `nav-item`, `action`, `button`, `text`, `headline`, `subhead`, `logo`, `feature`, `pricing-tier`, `price`, `testimonial`, `quote`, `faq-item`, `field`, and `badge`.
- Screen kinds: `landing`, `feature`, `pricing`, `contact`, and `signup`.

### Cross-cutting semantics
- Stable IDs are required for screens, regions, blocks, states, and items.
- VNext screens, regions, and blocks must specify symbolic `gap` values from `none`, `xs`, `sm`, `md`, `lg`, or `xl`; the renderer translates these values into deterministic CSS.
- Supported action types remain deterministic and explicit: `navigate`, `open-modal`, `close-modal`, `toggle`, `show-state`, and `set-tab`.
- Block variants are optional and must come from documented finite sets.
- Item props are string key/value pairs only. Props may express semantic data such as `value`, `description`, `status`, `tone`, `placeholder`, `href`, `featured`, or `price`, but not raw CSS/JS/framework implementation.
- Adapter metadata must include at least `target`, `version`, and `resolvedTarget` in the IR/handoff output.

## Validation Rules

Parser and validation work should enforce these rules:

- The first non-empty line remains `# Spec: <title>` with optional attributes.
- `surface` must be `app` or `marketing` when present.
- `adapter` must be `baseline` when present; unsupported adapters fail explicitly.
- A screen must have a stable `id`.
- A vNext screen with semantic regions must specify a supported `gap`.
- A vNext screen using `shell="app"` may only contain app-compatible region and block types.
- A vNext screen using `shell="marketing"` may only contain marketing-compatible region and block types.
- Regions must be inside screens.
- Regions must specify a supported `gap`.
- Blocks must be inside regions, or inside legacy sections only when rendered as backward-compatible sections.
- Blocks must specify a supported `gap`.
- Items must be inside blocks, states, or legacy sections.
- State headings inside vNext blocks must compile as stateful flow content scoped to the current screen.
- IDs must be globally unique across the spec.
- Raw HTML, JSX, Tailwind class strings, `<script>`, `<style>`, `class=`, `component=`, and implementation-specific component references are rejected unless a future grammar explicitly isolates them.
- Unknown region, block, item, state, action, surface, shell, variant, or adapter values fail with clear error codes.

## IR Contract

The IR should keep the existing top-level shape where practical and add semantic fields rather than replacing the foundation model wholesale.

Required additions:

- `metadata.renderingTarget`: `{ target, version, resolvedTarget }`.
- `metadata.surface`: `app`, `marketing`, or inferred fallback.
- `screens[].shell`: `app`, `marketing`, or `none`.
- `screens[].kind`: bounded screen kind.
- `screens[].gap`: symbolic spacing intent when semantic regions are present.
- `screens[].regions[]`: ordered semantic regions.
- `regions[].gap`: symbolic spacing between blocks.
- `regions[].blocks[]`: ordered semantic blocks.
- `blocks[].type`, `blocks[].variant`, `blocks[].gap`, `blocks[].items[]`, `blocks[].actions[]`, and optional `blocks[].states[]`.
- Existing `sections[]` and `states[]` continue to exist for backward compatibility unless the compiler can provide a compatibility adapter with tests.

Determinism requirements:

- Unchanged markdown plus unchanged compile options must produce byte-identical serialized IR.
- Adapter target must participate in deterministic metadata and handoff output.
- The default compile path must not add wall-clock timestamps unless `compiledAt` is explicitly provided, matching foundation behavior.

## Renderer Contract

The renderer should map the semantic IR to one standalone HTML document with inline deterministic CSS and JS.

Required behavior:

- App shells should render a recognizable sidebar/topbar/content layout when semantic regions are present.
- Marketing shells should render a recognizable navbar/main/footer page when semantic regions are present.
- Data-table blocks should render deterministic table-like structure from `column` and `row` items.
- Forms should render labels and inputs/selects/toggles from field-like items.
- Pricing, testimonial, FAQ, hero, feature, CTA, and footer blocks should render with enough hierarchy for product review.
- Existing action behavior must keep working for navigation, modal/state reveal, tabs, and toggles.
- Rendered HTML must not depend on external CSS, JS, network requests, fonts, or packages.
- Renderer output must be deterministic for unchanged IR.

## Fixture Requirements

Add canonical fixtures before broad implementation:

- `fixtures/valid/saas-dashboard.md`: app shell, sidebar, topbar, metric row, data table, detail panel, modal/state flow.
- `fixtures/valid/saas-settings.md` or equivalent: settings group, form fields, toggles, success/error state.
- `fixtures/valid/marketing-landing.md`: navbar, hero, logo cloud, feature grid, pricing, testimonials, FAQ, CTA, footer.
- `fixtures/invalid/unsupported-adapter.md`: invalid adapter request.
- `fixtures/invalid/raw-implementation-detail.md`: raw HTML/JSX/CSS/class/component usage.
- `fixtures/invalid/invalid-semantic-nesting.md`: marketing block inside app-only region or item outside block/section.
- `fixtures/invalid/unknown-semantic-type.md`: unknown block/item/region type.

Generated artifacts should include at least:

- `artifacts/saas-dashboard.html` and `artifacts/saas-dashboard.ir.json`.
- `artifacts/marketing-landing.html` and `artifacts/marketing-landing.ir.json`.

Artifacts may remain ignored by git if that is the existing repo convention, but the compile scripts and examples must make them reproducible.

## Risks / Trade-offs

- **[Risk] Scope gets bloated by mixing SaaS and landing pages** -> Mitigation: limit scope to common semantic patterns, not full website/framework coverage.
- **[Risk] Adapter design gets too abstract too early** -> Mitigation: keep adapter contract narrow and make the default renderer the reference implementation.
- **[Risk] Semantic blocks quietly become a bespoke component library anyway** -> Mitigation: define them as authoring/runtime semantics, not as a forever design-system surface.
- **[Risk] Output remains too generic for credible review** -> Mitigation: improve baseline layout and hierarchy defaults enough for serious decision work.
- **[Risk] People expect production export next** -> Mitigation: keep docs blunt that this is still decision-grade prototyping.

## Migration Plan

This is an additive evolution on top of foundation.

1. Extend grammar docs and fixtures for SaaS and landing-page structures.
2. Expand parser and validation rules.
3. Extend IR schema for richer page and app semantics.
4. Expand deterministic renderer behavior for the new semantics.
5. Introduce adapter contract metadata and baseline mapping rules.
6. Add canonical examples for a SaaS product flow and a landing page.
7. Verify repeatability, artifact output, and Micro Canvas/browser viewing.

Rollback path:
- If a new semantic family proves awkward, it can be removed or simplified before archive.
- If adapter work becomes too broad, preserve the baseline renderer and trim adapters to metadata-only groundwork.

## Open Questions

- Reusable section aliases/macros are intentionally deferred.
- Production framework export is intentionally deferred.
- Additional adapters beyond `baseline` are intentionally deferred.
- Additional semantic families beyond the required lists above should become separate OpenSpec changes.
