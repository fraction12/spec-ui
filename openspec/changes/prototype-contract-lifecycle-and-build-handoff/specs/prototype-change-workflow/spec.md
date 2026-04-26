## ADDED Requirements

### Requirement: Prototype change scaffolding
Spec UI SHALL create deterministic proposed-change scaffolds for UX/product-surface changes against canonical prototype packages.

#### Scenario: Create change for target package
- **WHEN** a user runs `spec-ui change new <change-id> --target <prototype>`
- **THEN** the system SHALL create a change directory in the configured prototype changes directory
- **AND** SHALL include `proposal.md`, `design.md`, `tasks.md`, `target.md`, and a `deltas/` directory

#### Scenario: Record target metadata
- **WHEN** a change scaffold is created
- **THEN** `target.md` or equivalent metadata SHALL identify the target prototype package, target source path, and optional base source hash

#### Scenario: Refuse duplicate change id
- **WHEN** a change directory already exists for the requested id
- **THEN** change creation SHALL fail with a usage/conflict error and SHALL NOT overwrite user-authored files

#### Scenario: Keep change source visible
- **WHEN** a prototype change is created
- **THEN** user-authored change files SHALL live in visible project directories rather than inside `.spec-ui/`

### Requirement: Prototype change status and validation
Spec UI SHALL inspect and validate proposed changes without mutating canonical package source.

#### Scenario: Inspect change status
- **WHEN** a user runs `spec-ui change status <change-id>`
- **THEN** the system SHALL report target resolution, changed role files, base hash, readiness, validation errors, task completion, preview artifact status, and archive safety

#### Scenario: Validate change
- **WHEN** a user runs `spec-ui change validate <change-id>`
- **THEN** the system SHALL validate change structure, target package existence, delta role support, package compatibility, semantic validity, reference resolution, acceptance criteria, and archive safety
- **AND** SHALL NOT write preview artifacts or mutate package source

#### Scenario: Reject missing target
- **WHEN** a change lacks a target or the target cannot resolve
- **THEN** status and validation SHALL fail with a clear missing-target or unresolved-target error

#### Scenario: Reject unsupported delta role
- **WHEN** a change delta uses an unsupported role name
- **THEN** validation SHALL fail with a clear unsupported-role error

#### Scenario: Reject unsafe delta paths
- **WHEN** a change delta path escapes the change directory or attempts to mutate files outside declared role deltas
- **THEN** validation SHALL fail with an unsafe-path error

### Requirement: Change preview
Spec UI SHALL compile a proposed change preview from canonical package source plus declared deltas without mutating canonical source.

#### Scenario: Compile preview artifact
- **WHEN** a valid change is previewed with an output path
- **THEN** the system SHALL compile deterministic standalone HTML from the effective source model
- **AND** MAY emit optional IR when requested

#### Scenario: Preserve canonical files during preview
- **WHEN** preview succeeds or fails
- **THEN** canonical package files SHALL remain byte-identical to their pre-preview state

#### Scenario: Include preview provenance
- **WHEN** preview emits handoff metadata
- **THEN** metadata SHALL include change id, target prototype id/path, base source hash, delta source hash, changed roles, output paths, warnings, and errors

#### Scenario: Reject invalid preview deltas
- **WHEN** deltas contain raw HTML, JSX, scripts, styles, classes, unsupported semantic values, unresolved references, or unsupported profile references
- **THEN** preview SHALL fail before reporting review-ready output

### Requirement: Archive approved changes
Spec UI SHALL promote approved prototype changes into canonical package source through an explicit archive workflow.

#### Scenario: Archive valid change
- **WHEN** a change is valid and archive-ready
- **THEN** archive SHALL apply declared deltas to the target package deterministically
- **AND** validate the resulting package
- **AND** record archive provenance

#### Scenario: Refuse stale base archive
- **WHEN** a change records a base source hash and the target package source hash has changed since that base
- **THEN** archive SHALL fail with a stale-base error unless the user explicitly refreshes or rebases the change through a documented command

#### Scenario: Refuse ambiguous merge
- **WHEN** applying a delta would overwrite unrelated user-authored content, collide with newer package edits, or produce ambiguous merge results
- **THEN** archive SHALL fail and SHALL NOT silently drop canonical source content

#### Scenario: Roll back failed archive
- **WHEN** archive mutates files but post-archive validation fails
- **THEN** the system SHALL roll back the mutation or fail with explicit recovery information and the affected files

#### Scenario: Preserve archived record
- **WHEN** archive succeeds
- **THEN** the change SHALL be moved to an archive location or marked archived with timestamp, target package, applied roles, before/after source hashes, and artifact references

#### Scenario: Report post-archive status
- **WHEN** archive succeeds
- **THEN** the command SHALL report the resulting canonical package status and next suggested commands
