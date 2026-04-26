## Why

Spec UI has proven the important part: constrained markdown can compile into deterministic interactive HTML. It now has package mode, role files, readiness/status, validation, adapters, portable artifacts, and an OpenSpec-style CLI. That is enough for a compiler. It is not yet enough for a first-class spec-to-prototype tool.

The final product goal is bigger:

> Spec UI should be the canonical source-of-truth system for product-surface intent before code exists.

OpenSpec answers: **what must the system do?**  
Spec UI should answer: **what should the user experience?**

For UI-heavy products, agents and humans should be able to work in a disciplined loop:

```text
init repo conventions
→ create canonical prototype package
→ validate readiness
→ compile deterministic interactive prototype
→ review with humans
→ create proposed UX change or variant
→ preview without mutating canonical source
→ archive approved deltas into canonical package
→ generate implementation handoff for coding agents
→ optionally export OpenSpec-ready behavior deltas
```

Today Spec UI still treats package mode mostly as compile input. The next step is to make packages, changes, variants, archive, and implementation handoff first-class. This change defines that lifecycle.

## What Changes

This change establishes Spec UI as a product-surface specification system with five connected capabilities:

1. **Canonical prototype contracts**
   - `prototypes/<name>/` packages become durable product-surface contracts.
   - Generated HTML/IR/screenshots are derived review artifacts, never canonical source.
   - Package source remains semantic markdown, adapter-neutral, and implementation-free.

2. **Prototype change workflow**
   - `prototype-changes/<change-id>/` captures proposed UX deltas against canonical packages.
   - Changes can be created, inspected, validated, previewed, and archived.
   - Preview compiles canonical source plus deltas without mutating canonical source.
   - Archive promotes approved deltas into canonical package source deterministically.

3. **Implementation handoff**
   - Spec UI can emit a build handoff packet for coding agents.
   - Handoff includes screens, flows, states, data/contracts, content, layout, tokens, acceptance criteria, adapter/profile constraints, provenance, open questions, and non-goals.
   - Generated HTML remains a reference artifact only, not code to reverse-engineer.

4. **Adapter profiles for real repo visual systems**
   - Projects can define semantic visual-system profiles without putting classes/components into source specs.
   - Profiles describe typography roles, density, treatments, tone, component families, constraints, and forbidden implementation details.
   - This solves the current “three variants all look like Bootstrap” problem without breaking adapter neutrality.

5. **Product review variants**
   - Spec UI can manage multiple intentionally different prototype directions.
   - Variants must differ in structure, hierarchy, density, flow, visual strategy, or adapter profile — not just copy.
   - Approved variants can become prototype changes and be archived into canonical source.

## Command Shape

This change is allowed to refine exact command spelling during implementation, but the expected product shape is:

```bash
# Canonical package lifecycle
spec-ui init --examples
spec-ui list
spec-ui status <prototype> [--json]
spec-ui validate <prototype> [--strict]
spec-ui compile <prototype> --out artifacts/<name>.html [--ir artifacts/<name>.ir.json]

# Prototype changes
spec-ui change new <change-id> --target <prototype>
spec-ui change status <change-id> [--json]
spec-ui change validate <change-id> [--strict]
spec-ui change preview <change-id> --out artifacts/<change-id>.html
spec-ui change archive <change-id>

# Handoff
spec-ui handoff <prototype> --for implementation --out handoff/<name>.md --json handoff/<name>.json
spec-ui change handoff <change-id> --for implementation --out handoff/<change-id>.md

# Variants
spec-ui variant new <prototype> --name <variant-id>
spec-ui variant status <prototype> [--json]
spec-ui variant compare <prototype> [--json]
spec-ui variant preview <prototype>/<variant-id> --out artifacts/<variant-id>.html

# Profiles
spec-ui profile list [--json]
spec-ui profile validate <profile> [--strict]
```

Existing commands from `add-cli-workflow-and-init` remain valid. `compile --status` remains a compatibility alias for status JSON.

## Directory Model

Default initialized layout should become:

```text
.spec-ui/
  config.json
  instructions.md
  templates/
    prototype.md
    screens.md
    flows.md
    states.md
    data.md
    content.md
    layout.md
    tokens.md
    acceptance.md
    change-proposal.md
    change-design.md
    change-tasks.md
    adapter-profile.md

prototypes/
  <prototype-name>/
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
  <generated review artifacts>

handoff/
  <implementation packets>
```

`.spec-ui/` stores conventions, config, instructions, and templates. User-authored prototype source stays visible outside `.spec-ui/`.

## Scope

### In Scope

- Canonical package lifecycle terminology and validation.
- `states.md` and `data.md` / contracts role support.
- Prototype change scaffold/status/validate/preview/archive semantics.
- Implementation handoff schema and markdown packet.
- Adapter profile contract and validation.
- Product review variants and samey-variant warnings.
- Optional OpenSpec interop/export.
- Docs, examples, fixtures, tests, and CLI help for the full loop.

### Out of Scope

- Production React/Vue/Svelte export.
- Visual editor.
- Treating generated HTML as source.
- Arbitrary component libraries without a supported adapter/profile contract.
- Raw HTML, JSX, Tailwind strings, CSS classes, component names, scripts, styles, remote runtime assets, or CDN dependencies in canonical source.
- Backend execution, persistence, auth, database migrations, or deployment automation.
- Replacing OpenSpec for system behavior and non-UI requirements.

## Impact

- Adds new CLI groups for `change`, `handoff`, `variant`, and likely `profile`.
- Extends package grammar with `states` and `data` / contracts role.
- Extends status/readiness to distinguish viewer readiness, review readiness, archive readiness, and implementation handoff readiness.
- Adds archive/promote mechanics for role-scoped deltas.
- Adds implementation handoff output distinct from viewer handoff.
- Adds semantic adapter profile validation.
- Adds variant comparison and meaningful-difference checks.
- Updates docs, examples, tests, fixtures, and package templates.

## Success Criteria

This change is done when a fresh repo can run the full loop:

```text
spec-ui init --examples
→ validate starter prototype
→ compile review artifact
→ create prototype change
→ preview change
→ archive change into canonical package
→ generate implementation handoff
→ validate that package source remains canonical and generated HTML remains disposable
```

And when the system can support the real target use case:

- A portfolio-style adapter profile can be described semantically.
- Three TradeSpec detail-page variants can be authored with genuinely different structures.
- Spec UI can warn if variants are only copy swaps.
- The chosen variant can be archived into canonical prototype source.
- A coding agent can receive a handoff packet that explains exactly what to build without reverse-engineering generated HTML.
