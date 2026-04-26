## ADDED Requirements

### Requirement: Marketing and Landing Page Prototype Semantics
Spec UI SHALL support structured semantic constructs for landing pages and marketing-site surfaces.

#### Scenario: Compile marketing-page structure
- **WHEN** a spec declares supported marketing structures such as hero sections, feature bands, pricing sections, testimonial groups, FAQ sections, CTA blocks, navigation, or footers
- **THEN** the system SHALL preserve those semantics in validation, intermediate representation, and rendering

#### Scenario: Compile bounded marketing shell structure
- **WHEN** a spec declares `shell="marketing"` with supported regions `navbar`, `main`, or `footer`
- **THEN** validation SHALL accept the structure and the IR SHALL preserve the screen shell, screen kind, ordered regions, and ordered blocks

#### Scenario: Compile marketing semantic blocks
- **WHEN** a spec declares supported marketing blocks `navbar`, `hero`, `logo-cloud`, `feature-grid`, `feature-band`, `pricing`, `testimonial-group`, `faq`, `cta`, `footer`, `contact-form`, or `signup-form`
- **THEN** the compiler SHALL preserve each block type, stable id, label, variant, ordered items, actions, and conversion-flow metadata in the IR

#### Scenario: Reject unsupported marketing block
- **WHEN** a spec declares an unknown marketing block type or an app-only block inside a marketing-only region
- **THEN** validation SHALL fail with an explicit semantic type or nesting error

#### Scenario: Review public-facing page flow
- **WHEN** a rendered prototype contains supported page navigation and CTA patterns
- **THEN** the user SHALL be able to inspect those flows interactively in the generated artifact

#### Scenario: Render landing-page review surface
- **WHEN** a valid landing-page prototype contains a navbar, hero, logo cloud or social proof, feature content, pricing, testimonial, FAQ, CTA, and footer semantics
- **THEN** the renderer SHALL produce a standalone HTML artifact where messaging hierarchy and conversion actions are visually legible

### Requirement: Decision-Grade Marketing Prototypes
Spec UI SHALL produce landing-page prototypes that are useful for messaging, hierarchy, and conversion-flow review.

#### Scenario: Evaluate a landing page for product direction
- **WHEN** a user reviews a generated landing-page prototype during product or go-to-market planning
- **THEN** the prototype SHALL make the intended page structure, content hierarchy, and conversion actions legible enough for decision-making

#### Scenario: Keep implementation detail out of marketing source
- **WHEN** a landing-page spec uses raw HTML, JSX, CSS class names, framework components, or script/style blocks as canonical structure
- **THEN** validation SHALL reject that source with an explicit implementation-detail error
