## Why

Spec UI foundation proved the core loop: structured markdown can compile into deterministic, portable HTML prototypes. That gets us to a real product nucleus, but it is still too narrow for the kinds of interfaces agents and product teams actually need to explore.

The next meaningful step is not arbitrary frontend generation and not a detour into building a component library. It is expanding Spec UI into a stronger product-prototyping system for the most common and useful surfaces: SaaS/web-app interfaces and marketing/landing pages.

These surfaces matter because they cover a huge percentage of real product exploration:
- signed-in dashboards, lists, detail views, forms, settings, onboarding, empty/loading/error states
- public-facing landing pages, feature pages, pricing blocks, social proof, CTAs, navigation, and page sections

The current grammar is too thin for serious app and landing-page work. At the same time, building an internal component library would be the wrong hill to die on. Good component libraries already exist. Spec UI should focus on semantic structure, deterministic compilation, and adapter-ready rendering contracts rather than reinventing buttons and cards forever.

## What Changes

- Expand Spec UI from foundation grammar into a stronger vNext grammar for SaaS/web-app UI and landing-page UI.
- Add richer semantic constructs for page layout, navigation patterns, content hierarchy, forms, collections, detail views, metrics, onboarding, and marketing sections.
- Define a clearer boundary between Spec UI semantics and presentation implementation so external or provided component libraries can be used without making Spec UI own a full component kit.
- Introduce a lightweight component adapter model so prototypes can render against a supported baseline library/theme contract rather than a bespoke in-repo component system.
- Keep output deterministic and portable: unchanged spec + unchanged adapter/config should yield unchanged prototype behavior.
- Preserve decision-grade prototypes as the target, not production code generation.

## Implementation Boundaries

This change should be implemented as a bounded semantic expansion, not an open-ended frontend generator.

In scope:
- A documented vNext grammar with explicit `Region`, `Block`, item, state, and adapter metadata rules.
- One supported adapter/rendering target: `baseline`.
- App/SaaS examples that prove dashboard/list/detail/form/settings/onboarding-style semantics can be compiled and reviewed.
- Marketing examples that prove landing-page hierarchy, pricing, social proof, FAQ, CTA, and footer semantics can be compiled and reviewed.
- Deterministic IR, deterministic HTML, and portable handoff metadata.

Out of scope:
- Production React, Vue, Svelte, JSX, or Tailwind export.
- Arbitrary npm package usage or runtime dependency loading.
- Arbitrary component-library selection.
- User-authored raw HTML/CSS/JS as canonical structure.
- Backend persistence, API integration, live data loading, or production form submission.
- A broad in-repo component library or design system.

## Acceptance Criteria

- OpenSpec validates strictly for this change.
- Existing foundation examples and tests continue to pass.
- The parser accepts documented vNext app and marketing fixtures and rejects documented invalid fixtures with clear error codes.
- The compiler emits stable semantic IR including rendering-target metadata.
- The renderer emits standalone HTML with no external network/runtime dependencies.
- The CLI can compile at least one SaaS example and one marketing example to HTML plus IR.
- Recompiling unchanged examples with unchanged options produces identical serialized IR and HTML.
- Generated SaaS and marketing HTML artifacts are manually inspected in a browser and Micro Canvas.
- The adapter contract documents that only `baseline` is supported in this change.

## Capabilities

### New Capabilities
- `saas-webapp-prototyping`: Generate richer deterministic prototypes for authenticated SaaS/web-app product flows.
- `marketing-page-prototyping`: Generate deterministic landing-page and marketing-site prototypes from structured specs.
- `semantic-layout-and-flow`: Express common app and page layout structures without collapsing into raw HTML/CSS authoring.
- `component-adapter-contract`: Map Spec UI semantic elements onto supported external or provided component render targets without making the spec depend on raw implementation markup.

### Modified Capabilities
- `spec-compilation`: Broaden grammar and validation rules to cover common SaaS and marketing UI structures.
- `prototype-rendering`: Expand renderer support for richer layout, hierarchy, and interaction patterns while preserving deterministic output.
- `prototype-determinism`: Extend determinism guarantees to include adapter-aware rendering semantics.
- `portable-html-handoff`: Continue emitting portable HTML artifacts while carrying enough metadata to explain the chosen rendering target or adapter.

## Impact

- New OpenSpec change for Spec UI product expansion.
- New/updated grammar, validation, IR, and rendering behavior covering app and landing-page surfaces.
- A stronger semantic model for pages, shells, navigation, forms, lists, sections, pricing, testimonials, CTAs, and related patterns.
- A clear architectural stance that Spec UI should not become its own heavy component library.
- Likely follow-on repo changes in examples, fixtures, renderer logic, adapter contracts, and docs.
- Better alignment with agent-authored product specs that need to become believable clickable prototypes quickly.
