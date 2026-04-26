## ADDED Requirements

### Requirement: Identify source mode in handoff metadata
The system SHALL identify whether a generated artifact came from a single-file spec or a prototype package.

#### Scenario: Handoff for package source
- **WHEN** the compiler emits handoff metadata for a prototype package
- **THEN** the metadata SHALL include source mode, manifest path, ordered included files with roles, source hash, package title, fidelity, and package readiness status

#### Scenario: Handoff for single-file source
- **WHEN** the compiler emits handoff metadata for a single-file spec
- **THEN** the metadata SHALL continue to include input path and source hash without requiring package-only fields

### Requirement: Identify adapter and library provenance
The system SHALL record adapter identity, adapter version, resolved library identity, and asset provenance in IR and handoff metadata.

#### Scenario: Handoff includes adapter identity
- **WHEN** HTML is rendered through the default library-backed adapter
- **THEN** the handoff metadata SHALL include adapter target, adapter version, resolved library name, resolved library version or pinned major version, and whether assets were inline or vendored

#### Scenario: Handoff rejects unknown asset provenance
- **WHEN** adapter assets cannot be traced to a known vendored or inline source
- **THEN** generation SHALL fail rather than emitting ambiguous portability metadata

### Requirement: Preserve viewer compatibility
The system SHALL continue to report browser and Micro Canvas compatibility for generated standalone HTML artifacts when the artifact has no external runtime dependency.

#### Scenario: Compatible standalone artifact
- **WHEN** the generated artifact is standalone and has no external network dependency
- **THEN** handoff metadata SHALL include `browser` and `microcanvas` viewer compatibility

#### Scenario: Incompatible artifact blocked
- **WHEN** an adapter output would require external network dependencies
- **THEN** generation SHALL fail before reporting browser or Micro Canvas compatibility

### Requirement: Preserve package source map for agents
The system SHALL preserve enough package source mapping in IR and handoff metadata for agents to trace rendered prototype behavior back to the source file and role that authored it.

#### Scenario: Source map includes role files
- **WHEN** a package-generated IR contains screens, blocks, flows, content records, layout controls, tokens, or acceptance invariants
- **THEN** each record SHALL include or reference source file, source role, and source line metadata

#### Scenario: Handoff includes acceptance summary
- **WHEN** a package includes acceptance notes or structured invariants
- **THEN** handoff metadata SHALL include an acceptance summary with counts and source references
