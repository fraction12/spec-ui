## ADDED Requirements

### Requirement: Product review variants
Spec UI SHALL support intentional prototype variants for comparing materially different product-surface directions.

#### Scenario: Declare variant metadata
- **WHEN** a variant is created or loaded
- **THEN** it SHALL include id, target package or brief, hypothesis, structural strategy, hierarchy strategy, density strategy, flow strategy, adapter/profile target, and acceptance criteria

#### Scenario: Keep variant source visible
- **WHEN** variants are stored on disk
- **THEN** user-authored variant source SHALL live in visible project directories rather than hidden inside `.spec-ui/`

#### Scenario: Resolve variant target
- **WHEN** a variant references a target package, change, profile, or brief
- **THEN** validation SHALL resolve those references or fail with clear source-referenced errors

#### Scenario: Preview variant
- **WHEN** a variant is valid and preview-ready
- **THEN** the system SHALL compile a deterministic standalone preview artifact with variant provenance

### Requirement: Meaningful variant difference
Spec UI SHALL help users avoid variants that are only copy changes over the same structure.

#### Scenario: Compare variants structurally
- **WHEN** variants for the same target are compared
- **THEN** the system SHALL report differences in shell, screen set, region ordering, block sequence, layout controls, density, content hierarchy, flow model, state model, profile strategy, or adapter target

#### Scenario: Warn on copy-only variants
- **WHEN** variants share the same shell, regions, blocks, layout controls, density, and flow model and only differ in copy/content
- **THEN** comparison SHALL warn that the variants may not be meaningfully distinct

#### Scenario: Preserve review hypothesis
- **WHEN** a variant is previewed, validated, compared, handed off, or promoted
- **THEN** metadata SHALL include the variant hypothesis and acceptance criteria

### Requirement: Variant promotion
Spec UI SHALL allow a selected variant to be promoted into the prototype change/archive lifecycle.

#### Scenario: Promote selected variant
- **WHEN** a user selects a variant as the approved direction
- **THEN** the system SHALL create or update a prototype change that can be previewed and archived into canonical package source

#### Scenario: Preserve rejected variants as history
- **WHEN** a variant is not selected
- **THEN** it MAY remain as review history but SHALL NOT affect canonical package output unless explicitly promoted or archived

#### Scenario: Include variant in implementation handoff
- **WHEN** implementation handoff is generated from a selected variant or a change derived from it
- **THEN** handoff metadata SHALL include the selected variant id, hypothesis, and decision provenance

### Requirement: Distinct TradeSpec-style proof case
Spec UI SHALL be capable of representing three visibly distinct review variants for a compact tool detail page using one shared adapter profile.

#### Scenario: Case-study ledger variant
- **WHEN** a case-study-led tool page variant is authored
- **THEN** it SHALL be able to prioritize narrative setup, workflow timeline, output artifacts, and compact evidence cards

#### Scenario: Signal-desk variant
- **WHEN** a signal-desk tool page variant is authored
- **THEN** it SHALL be able to prioritize terminal/proof rails, operational signals, artifact cards, and dense observability-style hierarchy

#### Scenario: Founder-proof memo variant
- **WHEN** a proof-memo tool page variant is authored
- **THEN** it SHALL be able to prioritize investor/recruiter proof, status, constraints, traction signals, and implementation credibility
