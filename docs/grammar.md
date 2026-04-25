# Spec UI Grammar

Spec UI compiles constrained markdown into a validated intermediate representation, then into deterministic portable HTML. The markdown source expresses product intent. It is not a place for raw implementation markup.

This document covers the foundation grammar and the bounded vNext grammar for SaaS/web-app and marketing prototypes.

Raw HTML, JSX, CSS classes, Tailwind utility strings, `<script>`, `<style>`, `class=`, `component=`, and library-specific component names are unsupported as canonical structure. Specs that rely on those details for screens, regions, blocks, elements, actions, states, or layout intent are invalid.

## Document Shape

Spec UI supports two source modes:

- Single-file mode for small prototypes, compatibility fixtures, and quick experiments.
- Package mode for serious prototype loops that need separate files for screens, flows, content, layout, tokens, and acceptance feedback.

Single-file mode remains the lightest path when one person can understand the whole prototype in one markdown file. Use package mode when multiple agents may edit the prototype, when UAT feedback needs to survive handoff, or when copy, layout, and flow changes should be reviewed independently.

The first non-empty heading MUST be the document title:

```markdown
# Spec: <title>
# Spec: <title> [surface="app|marketing" adapter="baseline"]
```

The title is required and MUST be non-empty.

Optional vNext attributes:

- `surface`: `app` or `marketing`.
- `adapter`: `baseline`. This is the only supported adapter target for this change.

Top-level prose before the first heading is ignored only if it is blank whitespace. Any non-empty content before `# Spec: <title>` is invalid.

## Prototype Package Manifest

Package mode uses a manifest named `prototype.md` as the only package entry point. The manifest declares package metadata and the ordered files to compile:

```markdown
# Prototype: Revenue Workspace [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

Includes:
- screens.md [role="screens" required="true"]
- flows.md [role="flows" required="true"]
- content.md [role="content" required="true"]
- layout.md [role="layout" required="true"]
- tokens.md [role="tokens" required="false"]
- acceptance.md [role="acceptance" required="true"]
```

Supported manifest metadata:

- `surface`: `app` or `marketing`.
- `adapter`: `bootstrap-html` for package prototypes, or `baseline` for lightweight output. Package mode defaults to `bootstrap-html` when omitted.
- `target`: `standalone-html`.
- `fidelity`: `prototype`.

Include rules:

- Include paths are package-relative POSIX-style paths.
- Include paths must stay inside the package directory.
- Include order is the canonical merge order.
- Only files listed in `prototype.md` participate in compilation.
- Required includes must exist.
- Optional includes may be omitted only when declared with `required="false"`.
- Supported roles are `screens`, `flows`, `content`, `layout`, `tokens`, and `acceptance`.

## Focused Package Files

Package files are organization boundaries for users and agents. They compile into one semantic source model.

- `screens.md` owns screens, regions, blocks, items, and states.
- `flows.md` owns user-visible navigation paths, modal/drawer behavior, form transitions, tab selection, toggles, and state changes.
- `content.md` owns reusable copy, sample data, pricing tiers, FAQ entries, testimonials, metrics, and table rows.
- `layout.md` owns semantic layout controls for density, spacing, width, alignment, columns, responsive collapse, wrapping, and overflow.
- `tokens.md` owns semantic tone, radius, density, and treatment controls.
- `acceptance.md` owns UAT findings, notes, and structured invariants.

### Package Flow Syntax

```markdown
## Flow: Primary Review [id="primary-review" start="executive-dashboard"]
- Step: Open Pipeline [from="executive-dashboard" action="navigate:pipeline-review" to="pipeline-review"]
- Step: Open Forecast Modal [from="pipeline-review" action="open-modal:forecast-modal" to="forecast-modal"]
```

Flow `from`, `to`, and action targets must resolve to known screens, states, blocks, or actions. The compiler preserves step order.

### Package Content Syntax

```markdown
## Content: Opportunity Rows [id="opportunity-rows" type="table-rows"]
- Row: Acme Expansion [stage="Commit" owner="Rae" value="$82k"]
- Row: Northwind Pilot [stage="Best Case" owner="Ira" value="$41k"]
```

Screens and blocks may reference declared content records with semantic attributes such as `content="opportunity-rows"`. Missing content records fail validation.

### Package Layout Syntax

```markdown
## Layout: Dashboard Density [target="screen:executive-dashboard"]
- Control: density [value="compact"]
- Control: padding [value="md"]
- Control: collapse [value="stack" at="tablet"]
- Control: overflow [value="contain"]
```

Supported layout controls are `gap`, `padding`, `density`, `width`, `align`, `columns`, `collapse`, `collapseAt`, `text`, and `overflow`. Values must come from finite semantic sets; raw CSS lengths, class names, and arbitrary values are invalid.

### Package Token Syntax

```markdown
## Tokens: Theme [id="default"]
- Tone: brand [value="blue"]
- Radius: controls [value="sm"]
- Density: interface [value="comfortable"]
- Treatment: cards [value="outlined"]
```

Tokens are semantic knobs. Raw CSS variables, raw color values, Bootstrap classes, Tailwind utilities, and arbitrary component-library tokens are invalid.

### Package Acceptance Syntax

```markdown
## Acceptance
- Invariant: Stable navigation labels [target="block:primary-nav"]
- Invariant: Single modal stack [target="screen:*"]
- Invariant: Reachable flow [target="flow:primary-review"]
- Invariant: Overflow containment [target="screen:executive-dashboard"]
- Note: Long account names must wrap inside cards without spilling.
```

Acceptance notes capture UAT feedback as durable prototype constraints. Structured invariants preserve the invariant name, target, source file, and line for tests and future agents.

## Foundation Screens And Sections

Foundation screens are second-level headings:

```markdown
## Screen: <title> [id="screen-id"]
## Screen: <title> [id: screen-id]
```

Each screen requires a non-empty title and a stable `id`. Screen IDs are unique across the document and are the targets for `navigate` actions.

Foundation sections are third-level headings inside screens:

```markdown
### Section: <title> [id="section-id"]
### Section: <title> [id: section-id]
```

Each section requires a non-empty title and stable `id`. Section IDs are unique across the document. Foundation elements and explicit actions are declared as list items inside a section.

The foundation `Screen`, `Section`, `State`, element, and action grammar remains supported for backward compatibility.

## VNext Screens

VNext screens add shell and kind metadata:

```markdown
## Screen: <title> [id="<screen-id>" shell="app|marketing|none" kind="<screen-kind>" gap="none|xs|sm|md|lg|xl"]
```

Supported app screen kinds:

- `dashboard`
- `list`
- `detail`
- `form`
- `settings`
- `onboarding`
- `workflow`

Supported marketing screen kinds:

- `landing`
- `feature`
- `pricing`
- `contact`
- `signup`

`shell="none"` is allowed for simple or compatibility screens. Rich vNext app screens should use `shell="app"`. Rich vNext marketing screens should use `shell="marketing"`.

## VNext Regions

Regions are third-level headings inside screens:

```markdown
### Region: <title> [id="<region-id>" type="<region-type>" gap="none|xs|sm|md|lg|xl"]
```

Each region requires a non-empty title, stable `id`, supported `type`, and supported `gap`.

Supported app region types:

- `sidebar`
- `topbar`
- `content`
- `aside`
- `footer`

Supported marketing region types:

- `navbar`
- `main`
- `footer`

Regions must be inside screens. App regions belong in app screens. Marketing regions belong in marketing screens.

## VNext Spacing

VNext specs must declare layout spacing instead of letting the renderer guess it.
Use `gap` on semantic screens, regions, and blocks:

- screen `gap` controls spacing between regions
- region `gap` controls spacing between blocks
- block `gap` controls spacing between rendered items, cards, fields, or actions

Supported values:

- `none` -> no gap
- `xs` -> very tight
- `sm` -> compact
- `md` -> default
- `lg` -> loose
- `xl` -> spacious

The compiler preserves the symbolic gap in IR. The baseline renderer translates
the symbolic value into deterministic CSS custom properties; specs must not
provide raw CSS lengths, utility classes, or inline styles.

## VNext Blocks

Blocks are fourth-level headings inside regions:

```markdown
#### Block: <title> [id="<block-id>" type="<block-type>" variant="<variant>" gap="none|xs|sm|md|lg|xl"]
```

Each block requires a non-empty title, stable `id`, supported `type`, and supported `gap`. `variant` is optional. When present, it must be one of the documented variants for that block type.

Supported app block types:

- `nav`
- `page-header`
- `metric-row`
- `data-table`
- `collection-list`
- `detail-panel`
- `form`
- `settings-group`
- `onboarding-steps`
- `activity-feed`
- `tabs`
- `filters`
- `state-panel`
- `modal`
- `drawer`
- `confirmation`

Supported marketing block types:

- `navbar`
- `hero`
- `logo-cloud`
- `feature-grid`
- `feature-band`
- `pricing`
- `testimonial-group`
- `faq`
- `cta`
- `footer`
- `contact-form`
- `signup-form`

Supported app block variants:

- `nav`: `primary`, `compact`
- `page-header`: `default`, `with-actions`
- `metric-row`: `default`, `compact`
- `data-table`: `default`, `selectable`
- `collection-list`: `default`, `compact`
- `detail-panel`: `default`, `summary`
- `form`: `stacked`, `inline`
- `settings-group`: `default`, `danger`
- `onboarding-steps`: `horizontal`, `vertical`
- `activity-feed`: `default`, `compact`
- `tabs`: `default`, `segmented`
- `filters`: `inline`, `panel`
- `state-panel`: `default`, `empty`, `loading`, `success`, `error`
- `modal`: `default`, `danger`
- `drawer`: `default`, `right`
- `confirmation`: `default`, `danger`

Supported marketing block variants:

- `navbar`: `default`, `centered`
- `hero`: `default`, `split`, `compact`
- `logo-cloud`: `default`, `compact`
- `feature-grid`: `two-column`, `three-column`
- `feature-band`: `default`, `alternating`
- `pricing`: `two-tier`, `three-tier`
- `testimonial-group`: `default`, `featured`
- `faq`: `default`, `compact`
- `cta`: `default`, `band`
- `footer`: `default`, `dense`
- `contact-form`: `default`, `compact`
- `signup-form`: `default`, `inline`

## VNext Items

Items are list lines inside blocks, nested block states, or legacy sections:

```markdown
- <item-type>#<item-id>: <label> [key="value" action="<action-type>:<target-id>"]
```

Each item requires a supported type, stable `id`, and non-empty label. Item IDs are unique across the document.

Supported app item types:

- `nav-item`
- `action`
- `button`
- `text`
- `metric`
- `column`
- `row`
- `field`
- `select`
- `toggle`
- `badge`
- `step`
- `activity`
- `tab`
- `empty`
- `loading`
- `success`
- `error`

Supported marketing item types:

- `nav-item`
- `action`
- `button`
- `text`
- `headline`
- `subhead`
- `logo`
- `feature`
- `pricing-tier`
- `price`
- `testimonial`
- `quote`
- `faq-item`
- `field`
- `badge`

Foundation element types remain supported in foundation sections and states:

- `text`
- `button`
- `input`
- `field`
- `list`
- `card`
- `badge`
- `empty`
- `loading`
- `success`
- `error`

Item props are string key/value pairs only. Props may express semantic data such as `value`, `description`, `status`, `tone`, `placeholder`, `href`, `featured`, or `price`. Props must not express raw CSS, JavaScript, JSX, framework component names, Tailwind utilities, or library-specific implementation details.

## Explicit Actions

Explicit actions are list items inside foundation sections or vNext blocks:

```markdown
- action#<id>: <label> [type="navigate" target="screen-id"]
```

Explicit actions require an `id`, non-empty label, supported `type`, and any required `target`. They are useful when the interaction is part of the flow model but should not be rendered as another semantic item type.

## States

Foundation states are fourth-level headings inside screens:

```markdown
#### State: <label> [id="state-id" type="modal"]
```

VNext block states are fifth-level headings inside blocks:

```markdown
##### State: <label> [id="<state-id>" type="<state-type>"]
```

States require a non-empty label, stable `id`, and supported `type`. State IDs are unique across the document. State bodies use the same item grammar as their parent surface.

Supported state types:

- `default`
- `loading`
- `empty`
- `success`
- `error`
- `modal`
- `tab`
- `revealed`
- `drawer`
- `confirmation`

## Actions

Supported action types:

- `navigate`
- `open-modal`
- `close-modal`
- `toggle`
- `show-state`
- `set-tab`

Action target rules:

- `navigate` targets a screen ID.
- `open-modal` targets a modal state ID or modal block state ID.
- `close-modal` targets a modal state ID or modal block state ID.
- `toggle` targets a revealed or drawer state ID, or an element/item ID.
- `show-state` targets a state ID.
- `set-tab` targets a tab state ID.

Invalid or unresolved action targets fail validation. The compiler does not invent missing screens, states, or elements.

## Implementation Detail Rejections

The following are invalid in canonical source:

- Raw HTML tags such as `<div>`, `<button>`, or `<section>`.
- JSX-like component tags such as `<Card>` or `<PricingTable>`.
- `<script>` and `<style>` blocks.
- `class=`, `className=`, `style=`, or Tailwind/CSS utility strings as layout or component instructions.
- `component=`, `library=`, `provider=`, or arbitrary component-library selectors.
- Unsupported heading levels used as canonical structure.
- Items outside blocks, states, or legacy sections.
- Blocks outside regions.
- Regions outside screens.
- Unknown surface, shell, screen kind, region, block, item, state, action, variant, or adapter values.

Spec UI favors validation errors over guessing. If a semantic value is not listed in this document, it belongs in a future OpenSpec change.

## Prototype Package Loop

The package loop keeps the markdown source of truth ahead of renderer tweaks:

1. Edit the role file that matches the requested change.
2. Compile the manifest or package directory.
3. Inspect the generated standalone HTML in a browser or Micro Canvas.
4. Record UAT findings and durable constraints in `acceptance.md`.
5. Repeat until the package reaches acceptance.

Agents should prefer the smallest role-file edit that expresses the user request. Copy changes usually belong in `content.md`, navigation and interaction changes in `flows.md`, screen structure in `screens.md`, spacing and responsive behavior in `layout.md`, visual tone in `tokens.md`, and inspection feedback in `acceptance.md`.

## OpenSpec Workflow Comparison

Prototype packages borrow OpenSpec's workflow discipline without becoming OpenSpec changes:

- The manifest is the package entry point, like a small workflow descriptor.
- Include records declare artifact dependencies instead of relying on directory globbing.
- Package status should report ready, blocked, or invalid inputs before rendering.
- Role-specific instructions tell agents which file to edit for a user request.
- Strict validation rejects missing includes, unsupported roles, unresolved references, and raw implementation details.
- `acceptance.md` is the prototype equivalent of durable scenarios and UAT notes.
- Handoff metadata should preserve source mode, manifest path, package files, adapter identity, and acceptance summary for archive-style review.

Unlike OpenSpec, prototype packages are product UI source documents. They do not use delta sections, change IDs, or spec archive semantics as their canonical domain model.

## Minimal Foundation Spec

```markdown
# Spec: Minimal

## Screen: Home [id="home"]

### Section: Main [id="main"]
- text#welcome: Welcome
- button#continue: Continue [action="navigate:details"]

## Screen: Details [id="details"]

### Section: Summary [id: summary]
- text#done: Details screen
```

## Minimal VNext App Spec

```markdown
# Spec: App Example [surface="app" adapter="baseline"]

## Screen: Dashboard [id="dashboard" shell="app" kind="dashboard"]

### Region: Sidebar [id="dashboard-sidebar" type="sidebar"]
#### Block: Navigation [id="dashboard-nav" type="nav" variant="primary"]
- nav-item#nav-dashboard: Dashboard [action="navigate:dashboard"]

### Region: Content [id="dashboard-content" type="content"]
#### Block: Header [id="dashboard-header" type="page-header"]
- text#dashboard-title: Revenue overview
```

## Minimal VNext Marketing Spec

```markdown
# Spec: Marketing Example [surface="marketing" adapter="baseline"]

## Screen: Landing [id="landing" shell="marketing" kind="landing"]

### Region: Navbar [id="landing-navbar" type="navbar"]
#### Block: Navigation [id="landing-nav" type="navbar"]
- nav-item#nav-pricing: Pricing [action="navigate:pricing"]

### Region: Main [id="landing-main" type="main"]
#### Block: Hero [id="landing-hero" type="hero" variant="split"]
- headline#hero-title: Launch cleaner prototypes
- subhead#hero-copy: Turn semantic specs into portable HTML.
```
