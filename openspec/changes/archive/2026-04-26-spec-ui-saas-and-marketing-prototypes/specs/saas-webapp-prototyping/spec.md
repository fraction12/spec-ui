## ADDED Requirements

### Requirement: SaaS/Web-App Prototype Semantics
Spec UI SHALL support structured semantic constructs for authenticated SaaS and web-app product interfaces.

#### Scenario: Compile app-oriented product structure
- **WHEN** a spec declares supported app-oriented structures such as shells, navigation, collections, detail views, forms, settings, onboarding, or workflow pages
- **THEN** the system SHALL preserve those semantics in validation, intermediate representation, and rendering

#### Scenario: Compile bounded app shell structure
- **WHEN** a spec declares `shell="app"` with supported regions `sidebar`, `topbar`, `content`, `aside`, or `footer`
- **THEN** validation SHALL accept the structure and the IR SHALL preserve the screen shell, screen kind, ordered regions, and ordered blocks

#### Scenario: Compile app semantic blocks
- **WHEN** a spec declares supported app blocks `nav`, `page-header`, `metric-row`, `data-table`, `collection-list`, `detail-panel`, `form`, `settings-group`, `onboarding-steps`, `activity-feed`, `tabs`, `filters`, `state-panel`, `modal`, `drawer`, or `confirmation`
- **THEN** the compiler SHALL preserve each block type, stable id, label, variant, ordered items, actions, and state-flow metadata in the IR

#### Scenario: Reject unsupported app block
- **WHEN** a spec declares an unknown app block type or a marketing-only block inside an app-only region
- **THEN** validation SHALL fail with an explicit semantic type or nesting error

#### Scenario: Explore common signed-in product flows
- **WHEN** a rendered prototype contains supported app navigation and state transitions
- **THEN** the user SHALL be able to inspect those flows interactively in the generated artifact

#### Scenario: Render app review surface
- **WHEN** a valid app prototype contains sidebar navigation, page header, metrics, a data table or collection list, a detail panel, a form or settings group, and at least one stateful flow
- **THEN** the renderer SHALL produce a standalone HTML artifact where those structures are visually distinct and interactively inspectable

### Requirement: Rich Product Decision Support
Spec UI SHALL render app-oriented prototypes with enough structure and interaction fidelity to support product and engineering review.

#### Scenario: Review prototype for planning
- **WHEN** a user evaluates a SaaS/web-app prototype generated from a valid spec
- **THEN** the prototype SHALL expose enough hierarchy, workflow structure, and state behavior to reduce ambiguity about intended behavior

#### Scenario: Preserve existing foundation behavior
- **WHEN** an existing foundation-style spec uses `Screen`, `Section`, `State`, elements, and actions without vNext app shell constructs
- **THEN** the compiler and renderer SHALL continue to support that spec without requiring migration to the app shell grammar
