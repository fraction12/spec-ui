# Fixtures

Fixtures are small markdown specs used by tests.

- `valid/` contains specs that should compile into IR and HTML.
- `invalid/` contains specs that should fail validation with clear errors.

## Foundation Fixtures

- `valid/minimal.md`
- `valid/states.md`
- `valid/task-board.md`
- `invalid/missing-spec-heading.md`
- `invalid/raw-html.md`
- `invalid/unresolved-action-target.md`

## VNext Semantic Fixtures

- `valid/saas-dashboard.md`: app shell, sidebar, topbar, metric row, data table, detail panel, and modal/state flow.
- `valid/saas-settings.md`: app settings screen with settings group, form-like items, toggles, drawer, success, and error states.
- `valid/marketing-landing.md`: marketing shell with navbar, hero, logo cloud, feature grid, pricing, testimonial, FAQ, CTA, footer, signup, and contact flows.
- `invalid/unsupported-adapter.md`: rejects adapter targets other than `baseline`.
- `invalid/raw-implementation-detail.md`: rejects raw implementation details such as component selectors, classes, and script tags.
- `invalid/invalid-semantic-nesting.md`: rejects marketing-only semantics inside app-only structure.
- `invalid/unknown-semantic-type.md`: rejects unknown semantic block and item types.

## Prototype Package Fixtures

Package fixtures live in subdirectories so each package can include a manifest and focused role files.

- `invalid/packages/missing-include/`: manifest includes a required file that is not present.
- `invalid/packages/unsupported-role/`: manifest declares a role outside `screens`, `flows`, `content`, `layout`, `tokens`, or `acceptance`.
- `invalid/packages/include-outside-root/`: manifest include path escapes the package root.
- `invalid/packages/duplicate-ids/`: IDs collide across package role files.
- `invalid/packages/unresolved-flow-target/`: flow step references a missing screen or state target.
- `invalid/packages/unsupported-layout-control/`: layout file declares a control outside the supported finite set.
- `invalid/packages/undeclared-content-reference/`: screen block references content that is not declared in `content.md`.
