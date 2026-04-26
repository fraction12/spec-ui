## ADDED Requirements

### Requirement: Component Adapter Contract
Spec UI SHALL define a constrained adapter contract that maps semantic spec elements onto a supported rendering target without requiring library-specific implementation markup in the source spec.

#### Scenario: Compile with supported rendering target metadata
- **WHEN** a spec or compile configuration selects a supported rendering target or adapter
- **THEN** the system SHALL apply deterministic mapping rules from semantic constructs to the chosen rendering target

#### Scenario: Compile baseline adapter metadata
- **WHEN** a spec omits adapter configuration or declares `adapter="baseline"`
- **THEN** the compiler SHALL resolve the rendering target to `baseline`
- **AND** the IR and handoff metadata SHALL include the resolved target, target version, and source of selection

#### Scenario: Reject unsupported adapter usage
- **WHEN** a user requests an unsupported or invalid adapter configuration
- **THEN** the system SHALL fail with explicit validation or configuration errors rather than silently degrading into arbitrary output

#### Scenario: Reject library-specific source markup
- **WHEN** a spec attempts to select arbitrary library components, pass raw component names, or encode library-specific markup in canonical structure
- **THEN** validation SHALL reject the source and explain that only supported adapter targets are allowed

### Requirement: Semantic Portability
Spec UI SHALL preserve semantic portability across supported rendering targets by keeping the spec source focused on intent rather than library-specific components.

#### Scenario: Reuse spec across rendering targets
- **WHEN** a valid spec is compiled against two different supported rendering targets
- **THEN** the system SHALL preserve the same core semantic structure while rendering target-specific presentation through deterministic adapter rules

#### Scenario: Preserve deterministic output for adapter-aware rendering
- **WHEN** the same spec is compiled with the same adapter configuration more than once
- **THEN** the serialized IR, handoff metadata, and rendered HTML SHALL remain byte-identical except for explicitly provided compile-time metadata

#### Scenario: Keep current adapter scope narrow
- **WHEN** this change is implemented
- **THEN** `baseline` SHALL be the only supported adapter target
- **AND** additional adapter targets SHALL require a separate OpenSpec change
