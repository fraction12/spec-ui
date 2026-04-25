## 0. Scope And Coordination

- [ ] 0.1 Confirm implementation lanes and ownership before spawning workers:
  - Grammar/docs/fixtures: `docs/grammar.md`, `docs/handoff.md`, `fixtures/**`, `examples/**`, generated `artifacts/**`
  - Parser/validation: `src/contracts.js`, `src/parser.js`, `src/validation.js`, `test/parser-validation.test.js`
  - IR/compiler/adapter: `src/ir-schema.js`, `src/compiler.js`, `src/handoff.js`, `test/compiler-ir.test.js`
  - Renderer: `src/render-html.js`, `test/render-html.test.js`, golden output fixtures if added
  - Integration: `bin/spec-ui.mjs`, `README.md`, cross-lane fixes, verification, task updates
- [ ] 0.2 Preserve foundation behavior for existing `examples/task-board.md` and all current fixtures/tests.
- [ ] 0.3 Do not add production framework export, arbitrary runtime dependencies, arbitrary component-library support, raw HTML/CSS/JS authoring, backend behavior, or broad theming.

## 1. Grammar, Docs, And Fixtures

- [ ] 1.1 Update `docs/grammar.md` with the bounded vNext syntax:
  - `# Spec: <title> [surface="app|marketing" adapter="baseline"]`
  - `## Screen: <title> [id="..." shell="app|marketing|none" kind="..."]`
  - `### Region: <title> [id="..." type="..."]`
  - `#### Block: <title> [id="..." type="..." variant="..."]`
  - optional nested `##### State: <label> [id="..." type="..."]`
  - item lines `- <item-type>#<id>: <label> [key="value" action="<type>:<target>"]`
- [ ] 1.2 Document the exact supported app values:
  - regions: `sidebar`, `topbar`, `content`, `aside`, `footer`
  - blocks: `nav`, `page-header`, `metric-row`, `data-table`, `collection-list`, `detail-panel`, `form`, `settings-group`, `onboarding-steps`, `activity-feed`, `tabs`, `filters`, `state-panel`, `modal`, `drawer`, `confirmation`
  - screen kinds: `dashboard`, `list`, `detail`, `form`, `settings`, `onboarding`, `workflow`
- [ ] 1.3 Document the exact supported marketing values:
  - regions: `navbar`, `main`, `footer`
  - blocks: `navbar`, `hero`, `logo-cloud`, `feature-grid`, `feature-band`, `pricing`, `testimonial-group`, `faq`, `cta`, `footer`, `contact-form`, `signup-form`
  - screen kinds: `landing`, `feature`, `pricing`, `contact`, `signup`
- [ ] 1.4 Document supported item/action/state values and explicitly reject raw HTML, JSX, Tailwind/CSS classes, `component=`, `<script>`, and `<style>` as canonical structure.
- [ ] 1.5 Add valid fixtures:
  - `fixtures/valid/saas-dashboard.md`
  - `fixtures/valid/saas-settings.md` or equivalent app form/settings fixture
  - `fixtures/valid/marketing-landing.md`
- [ ] 1.6 Add invalid fixtures:
  - `fixtures/invalid/unsupported-adapter.md`
  - `fixtures/invalid/raw-implementation-detail.md`
  - `fixtures/invalid/invalid-semantic-nesting.md`
  - `fixtures/invalid/unknown-semantic-type.md`
- [ ] 1.7 Add serious examples:
  - `examples/saas-dashboard.md`
  - `examples/marketing-landing.md`
- [ ] 1.8 Update `docs/handoff.md` to explain rendering target metadata and the browser/Micro Canvas portability contract.

## 2. Parser And Validation

- [ ] 2.1 Extend `src/contracts.js` with finite sets for surfaces, shells, app/marketing screen kinds, region types, block types, item types, state types, action types, and adapter targets.
- [ ] 2.2 Extend `src/parser.js` to parse spec attributes, `Region`, `Block`, nested block states, and vNext item lines while retaining existing `Screen`, `Section`, `State`, element, and action parsing.
- [ ] 2.3 Preserve source line numbers and ordering for all parsed screens, regions, blocks, states, items, actions, and parse errors.
- [ ] 2.4 Extend `src/validation.js` to enforce:
  - required stable ids for screens, regions, blocks, states, items, and actions
  - global id uniqueness
  - valid surface, adapter, shell, screen kind, region, block, item, state, action, and variant values
  - legal app-vs-marketing nesting
  - legal action targets
  - item/block/region nesting rules
  - rejection of raw implementation detail
- [ ] 2.5 Add parser/validation tests covering every valid and invalid fixture from section 1.
- [ ] 2.6 Add regression tests proving existing foundation fixtures still parse and validate.

## 3. IR, Compiler, And Adapter Metadata

- [ ] 3.1 Extend `src/ir-schema.js` for:
  - `metadata.surface`
  - `metadata.renderingTarget`
  - `screens[].shell`
  - `screens[].kind`
  - `screens[].regions[]`
  - `regions[].blocks[]`
  - `blocks[].type`, `variant`, `items`, `actions`, and optional `states`
- [ ] 3.2 Keep compatibility fields for existing `screens[].sections[]` and `screens[].states[]` unless replacement is explicitly covered by tests.
- [ ] 3.3 Update `src/compiler.js` to compile vNext source into semantic IR without renderer-specific markup.
- [ ] 3.4 Resolve adapter/rendering target deterministically:
  - default target: `baseline`
  - supported explicit target: `baseline`
  - unsupported target: validation/config error
  - metadata includes target, version, resolved target, and selection source
- [ ] 3.5 Update `src/handoff.js` so CLI output includes rendering target metadata and keeps `viewerCompatibility: ["browser", "microcanvas"]`.
- [ ] 3.6 Add IR tests proving:
  - vNext SaaS fixture compiles to stable semantic IR
  - vNext marketing fixture compiles to stable semantic IR
  - unchanged input and unchanged options produce identical serialized IR
  - adapter metadata participates in deterministic output
  - foundation fixtures still compile

## 4. Renderer

- [ ] 4.1 Extend `src/render-html.js` to render app shells from semantic regions:
  - sidebar/topbar/content/aside/footer regions
  - nav, page-header, metric-row, data-table, collection-list, detail-panel, form, settings-group, onboarding-steps, activity-feed, tabs, filters, state-panel, modal, drawer, confirmation blocks
- [ ] 4.2 Extend `src/render-html.js` to render marketing shells from semantic regions:
  - navbar/main/footer regions
  - navbar, hero, logo-cloud, feature-grid, feature-band, pricing, testimonial-group, faq, cta, footer, contact-form, signup-form blocks
- [ ] 4.3 Keep rendered HTML standalone: inline deterministic CSS/JS only, no external fonts, scripts, stylesheets, network calls, or package runtime.
- [ ] 4.4 Preserve existing interaction behavior for `navigate`, `open-modal`, `close-modal`, `toggle`, `show-state`, and `set-tab`.
- [ ] 4.5 Add renderer tests or golden assertions for:
  - SaaS app shell structure
  - marketing landing structure
  - action data attributes and state interactions
  - byte-identical HTML for unchanged IR
  - foundation render compatibility

## 5. CLI, Examples, And Handoff

- [ ] 5.1 Update `bin/spec-ui.mjs` only if needed to pass compile options or adapter metadata; keep the existing compile command shape unless a documented option is necessary.
- [ ] 5.2 Ensure the CLI can compile:
  - `examples/saas-dashboard.md` to `artifacts/saas-dashboard.html` and `artifacts/saas-dashboard.ir.json`
  - `examples/marketing-landing.md` to `artifacts/marketing-landing.html` and `artifacts/marketing-landing.ir.json`
- [ ] 5.3 Update `README.md` with the vNext compile flow, scope boundaries, adapter stance, and example commands.
- [ ] 5.4 Ensure CLI/handoff JSON reports artifact path, IR path, input path, source hash, viewer compatibility, and rendering target metadata.

## 6. Verification

- [ ] 6.1 Run `openspec validate spec-ui-saas-and-marketing-prototypes --strict`.
- [ ] 6.2 Run `npm run check`.
- [ ] 6.3 Run the SaaS and marketing example compile commands and confirm generated HTML/IR artifacts exist.
- [ ] 6.4 Re-run the same compile commands and confirm unchanged outputs are deterministic.
- [ ] 6.5 Manually inspect generated SaaS and marketing HTML in a browser.
- [ ] 6.6 Manually inspect generated SaaS and marketing HTML in Micro Canvas.
- [ ] 6.7 Update this task list as items complete and record any deferred work in the final implementation summary.
