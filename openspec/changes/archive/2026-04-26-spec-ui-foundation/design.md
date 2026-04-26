## Context

Spec UI is a new system intended to turn structured markdown into deterministic, interactive prototype HTML. The immediate problem is not that AI tools cannot generate prototypes at all; it is that they generate different prototypes from the same spec depending on prompt phrasing, model choice, or rerun timing. That instability creates ambiguity and erodes trust.

Micro Canvas already exists as a useful rendering and viewing surface. It should not become the owner of parsing, grammar, or compilation semantics for Spec UI, and it should not be the only way to inspect output. Instead, Spec UI should own the spec format, compilation pipeline, deterministic rendering model, and portable HTML artifact handoff. Those artifacts should be openable in Micro Canvas, a browser, or another compatible viewer.

The main constraints are:
- the source format must remain human-readable and agent-friendly
- compilation must be deterministic for unchanged input
- interaction support must be strong enough for serious prototyping
- v1 scope must stay much narrower than a general frontend framework or arbitrary UI code generator

Stakeholders include builders working with AI agents, PM/founder-style users who think in specs first, and developers who want a stable prototype artifact before implementation.

## Goals / Non-Goals

**Goals:**
- Define Spec UI as a distinct system that emits portable HTML artifacts rather than embedding compilation semantics into any specific viewer.
- Establish a deterministic pipeline: structured markdown -> parser -> validated IR -> prototype HTML.
- Support a constrained grammar centered on screens, sections, elements, actions, states, and transitions.
- Produce portable interactive prototype HTML suitable for product/design review and development planning.
- Preserve stability so unchanged specs re-render to unchanged prototype behavior.
- Keep the system inspectable and debuggable by exposing validation and structure through the compiler pipeline.

**Non-Goals:**
- Building a production application generator in the foundation change.
- Supporting arbitrary React libraries, npm ecosystems, or custom runtime code execution in the foundation change.
- Solving pixel-perfect design tooling or replacing dedicated high-fidelity design tools.
- Embedding compilation semantics directly into Micro Canvas.
- Allowing unconstrained prose-to-UI interpretation with model-driven improvisation.

## Decisions

### Decision: Spec UI emits portable HTML artifacts
Spec UI will live as its own repo/project and emit prototype HTML artifacts that can be opened in Micro Canvas, a browser, or another compatible viewer.

**Rationale:**
- Micro Canvas has a clean job: stage, render, show, verify, snapshot.
- Spec UI has a different job: parse grammar, validate structure, compile deterministic prototypes.
- Portable HTML keeps the output easy to inspect without coupling the compiler to a single presentation surface.
- Separating compiler and viewer responsibilities keeps Spec UI, Micro Canvas, and future viewers easier to evolve.

**Alternatives considered:**
- **Embed Spec UI directly in Micro Canvas:** convenient short-term, but it muddies product boundaries and turns Micro Canvas into an opinionated compiler.
- **Emit a Micro Canvas-only artifact:** easier to integrate at first, but too coupled for a tool whose core promise is stable, inspectable prototype output.
- **Loose manual workflow only:** simpler initially, but weaker integration and poorer developer ergonomics.

### Decision: Use structured markdown plus a typed IR
Spec UI will not render directly from freeform markdown prose. It will compile structured markdown into a typed intermediate representation that becomes the canonical rendering contract.

**Rationale:**
- Determinism requires structure.
- Validation requires structure.
- Stable rendering semantics require a fixed contract between authoring and output.
- A typed IR makes future tooling, debugging, and alternate outputs easier.

**Alternatives considered:**
- **Freeform markdown heuristics:** more pleasant initially, but too ambiguous and unstable.
- **Raw HTML/JSX as the spec format:** too implementation-heavy and defeats the goal of staying spec-first.

### Decision: Optimize for decision-grade prototypes
The renderer will target prototypes that are good enough for review, exploration, and implementation planning rather than production application output.

**Rationale:**
- This solves the immediate user problem with less scope.
- It keeps the product useful before solving export, framework integration, or app runtime concerns.
- It reduces the temptation to overbuild into a full frontend stack.

**Alternatives considered:**
- **Production-ready code generation first:** attractive on paper, but too broad and too easy to derail.
- **Pure static mock rendering:** simpler, but fails the interaction and flow-validation goal.

### Decision: Determinism is a first-class requirement
Prototype generation will be governed by parser, validation, IR, and renderer rules, not unconstrained generative interpretation at render time.

**Rationale:**
- Stable outputs are central to the product value.
- Users need to trust that rerunning the same spec does not change the prototype arbitrarily.
- This differentiates Spec UI from “prompt again and get a new version.”

**Alternatives considered:**
- **LLM-assisted runtime rendering:** flexible, but reintroduces instability.
- **Soft deterministic aspirations only:** insufficient for trust and comparison workflows.

### Decision: Keep v1 interaction vocabulary intentionally small
The foundation should support a bounded interaction set such as navigation, modal open/close, toggle reveal, tab switching, and common states.

**Rationale:**
- These cover a large portion of prototyping needs.
- A smaller vocabulary is easier to specify, validate, and render consistently.
- It keeps the grammar compact and teachable.

**Alternatives considered:**
- **Broad behavior model from day one:** too complex and likely to produce ambiguous specs.
- **No interactions in foundation:** too weak to validate the product thesis.

## Risks / Trade-offs

- **[Risk] Grammar becomes too rigid to enjoy using** -> Mitigation: keep the first grammar small, readable, and close to natural product structure rather than low-level layout syntax.
- **[Risk] Generated prototypes feel too generic** -> Mitigation: optimize for clarity, hierarchy, and deterministic behavior first; style/theming can evolve later.
- **[Risk] Pressure to support arbitrary component libraries arrives too early** -> Mitigation: defer adapters and registries until the semantic core is stable.
- **[Risk] Portable viewer support weakens integration focus** -> Mitigation: design a thin HTML artifact handoff contract first, then make Micro Canvas one polished supported viewer path.
- **[Risk] Users expect production code export immediately** -> Mitigation: position the product clearly around spec-to-prototype determinism and decision support.

## Migration Plan

This is a net-new project, so there is no legacy production system to migrate.

Initial rollout path:
1. Define and validate the foundation behavior via OpenSpec.
2. Implement the first constrained grammar and parser.
3. Implement typed IR generation and deterministic HTML renderer.
4. Hand generated HTML artifacts to Micro Canvas, browsers, and other compatible viewers for inspection.
5. Test the loop with canonical specs and repeat renders to verify deterministic behavior.

Rollback strategy:
- If a specific grammar or rendering decision proves wrong, the project can revise the compiler and specs before declaring broader external contracts.
- Because the system is new, rollback is primarily artifact and behavior rollback within the repo rather than production migration.

## Open Questions

- What is the minimum viable grammar that feels structured without becoming annoying?
- What exact fields belong in the first IR schema?
- How should layout intent be expressed in v1 without collapsing into raw frontend syntax?
- What deterministic fallback behavior is acceptable when the spec is incomplete?
- Should the first CLI output only HTML artifacts, or also emit inspectable IR/JSON alongside them?
- What minimum metadata should accompany each HTML artifact so viewers can present generation context and validation errors clearly?
