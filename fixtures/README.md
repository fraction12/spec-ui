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
