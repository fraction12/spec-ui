## Why

AI agents are increasingly useful for writing product specs and exploring ideas, but there is still a major gap between a written spec and a visible prototype. Today, users either have to imagine the interface from markdown alone or ask the agent to generate bespoke HTML/code each time, which introduces friction and instability.

The core problem is that the same spec can produce slightly different prototypes across runs, tools, or agents, creating ambiguity and reducing trust. Spec UI exists to make structured markdown a stable source of truth that compiles into deterministic, interactive prototype HTML so users can quickly inspect, compare, and iterate on product ideas with confidence.

## What Changes

- Introduce Spec UI as a new tool/project for compiling structured markdown specs into deterministic, interactive prototype HTML.
- Define a constrained markdown authoring model focused on screens, sections, components, actions, states, and flows rather than freeform prose or raw HTML.
- Establish a typed intermediate representation (IR) that acts as the stable contract between markdown input and rendered prototype output.
- Require deterministic rendering semantics so the same unchanged spec produces the same prototype output across re-runs.
- Emit portable prototype HTML that can be opened in Micro Canvas, a browser, or another compatible viewer, while keeping Spec UI as a distinct system responsible for parsing and compilation.
- Create the initial product/spec foundation for future work on grammar, renderer behavior, canonical examples, and integration boundaries.

## Capabilities

### New Capabilities
- `spec-compilation`: Compile structured markdown specs into deterministic prototype outputs through a validated intermediate representation.
- `prototype-rendering`: Render compiled specs into interactive HTML prototypes that support decision-grade product exploration.
- `prototype-determinism`: Guarantee stable prototype output for unchanged specs so users can trust reruns and compare iterations without ambiguity.
- `portable-html-handoff`: Emit generated Spec UI prototypes as portable HTML artifacts that can be opened by Micro Canvas, browsers, and other compatible viewers.

### Modified Capabilities
- None.

## Impact

- New repo/project scaffold in `/Volumes/MacSSD/Projects/spec-ui`.
- New OpenSpec change documenting product behavior, system boundaries, and implementation direction.
- Future impact on markdown grammar design, IR schema, HTML renderer behavior, and Micro Canvas integration flow.
- Potential future CLI/API surface for compiling specs and handing rendered HTML artifacts to Micro Canvas, browsers, and other compatible viewers.
- Establishes deterministic spec-to-prototype generation as a core product requirement rather than a nice-to-have.
