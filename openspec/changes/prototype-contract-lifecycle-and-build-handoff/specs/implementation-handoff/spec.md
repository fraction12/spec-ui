## ADDED Requirements

### Requirement: Implementation handoff output
Spec UI SHALL generate implementation handoff packets from canonical prototype contracts or approved prototype changes.

#### Scenario: Generate handoff markdown and JSON
- **WHEN** a user requests implementation handoff for a valid package
- **THEN** the system SHALL emit a human-readable markdown packet when `--out` is provided
- **AND** SHALL emit machine-readable JSON when a JSON output path or JSON mode is requested

#### Scenario: Use stable handoff schema
- **WHEN** implementation handoff JSON is generated
- **THEN** it SHALL include stable schema metadata such as `schema`, `version`, `prototype`, `readiness`, `source`, `screens`, `flows`, `states`, `data`, `content`, `layout`, `tokens`, `acceptance`, `adapterProfile`, `artifacts`, `nonGoals`, `openQuestions`, `warnings`, and `errors`

#### Scenario: Include source provenance
- **WHEN** implementation handoff is generated
- **THEN** it SHALL include prototype id, package path, manifest path, included files, source hash, source mode, adapter target, profile id when present, and archive/change provenance when present

#### Scenario: Include product-surface intent
- **WHEN** implementation handoff is generated
- **THEN** it SHALL include screens, regions, blocks, items, actions, flows, states, data/contracts, content records, layout controls, token controls, and acceptance invariants with source references

#### Scenario: Preserve JSON cleanliness
- **WHEN** handoff JSON is written to stdout
- **THEN** stdout SHALL contain valid JSON only

### Requirement: Generated artifacts are review references only
Implementation handoff SHALL NOT instruct coding agents to reverse-engineer generated HTML.

#### Scenario: Label artifact references
- **WHEN** handoff includes generated HTML, IR, screenshots, Microcanvas surfaces, or browser URLs
- **THEN** those entries SHALL be labeled as review references only

#### Scenario: Instruct agents to build from source intent
- **WHEN** markdown handoff is generated
- **THEN** it SHALL explicitly instruct coding agents to implement from package source, data/contracts, layout/tokens, adapter profile, and acceptance criteria rather than from generated DOM structure

#### Scenario: Reject generated HTML as source input
- **WHEN** a user requests implementation handoff from a generated HTML file without package source
- **THEN** the system SHALL fail or warn that implementation handoff requires canonical source

### Requirement: Handoff readiness
Spec UI SHALL determine whether a package is ready for implementation handoff separately from viewer compile readiness.

#### Scenario: Ready handoff
- **WHEN** a package has valid screens, flows, required states, required data/contracts, content, layout/tokens or defaults, acceptance criteria, and adapter/profile constraints
- **THEN** handoff readiness SHALL be `ready`

#### Scenario: Block handoff without data contracts
- **WHEN** a package contains data-driven UI but lacks corresponding data/contracts
- **THEN** handoff readiness SHALL be `blocked` or `warning` according to documented severity
- **AND** SHALL include source references for the data-driven blocks

#### Scenario: Block handoff without acceptance criteria
- **WHEN** a package lacks implementation-relevant acceptance criteria
- **THEN** handoff readiness SHALL report a clear acceptance gap

#### Scenario: Continue allowing viewer compile
- **WHEN** a package is review-ready but not handoff-ready
- **THEN** compile to viewer HTML MAY still succeed
- **AND** handoff/status SHALL clearly distinguish the readiness states

### Requirement: Handoff from changes
Spec UI SHALL support implementation handoff for approved or previewable prototype changes when source provenance is clear.

#### Scenario: Generate change handoff
- **WHEN** a user requests implementation handoff for a valid archived or preview-ready change
- **THEN** the handoff SHALL include target package provenance, change id, changed roles, base source hash, delta source hash, and archive status

#### Scenario: Reject ambiguous change handoff
- **WHEN** a change target is unresolved, stale, invalid, or not preview-ready
- **THEN** change handoff SHALL fail with clear errors and SHALL NOT imply implementation readiness

### Requirement: Optional OpenSpec interop
Spec UI SHALL provide optional OpenSpec interop while preserving product boundaries.

#### Scenario: Link OpenSpec references
- **WHEN** a package or change declares an OpenSpec change/spec reference
- **THEN** status and handoff SHALL preserve the reference without requiring OpenSpec to be installed

#### Scenario: Export OpenSpec-ready behavior notes
- **WHEN** a user requests an OpenSpec-oriented export
- **THEN** the system SHALL produce requirements/scenario-style markdown derived from flows, states, data/contracts, and acceptance criteria
- **AND** SHALL label it as an export for OpenSpec review, not a replacement for OpenSpec archiving
