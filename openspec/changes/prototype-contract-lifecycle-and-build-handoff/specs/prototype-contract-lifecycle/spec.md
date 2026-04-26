## ADDED Requirements

### Requirement: Canonical prototype packages
Spec UI SHALL treat prototype packages as canonical product-surface contracts and generated artifacts as derived outputs.

#### Scenario: Identify package source as canonical
- **WHEN** a package contains `prototype.md` and supported role files
- **THEN** status, validation, compile, preview, archive, and handoff commands SHALL identify the package source as canonical
- **AND** generated HTML, IR, screenshots, and viewer runtime copies SHALL be identified as derived artifacts

#### Scenario: Direct edits to source files
- **WHEN** Spec UI provides instructions, errors, warnings, or handoff guidance
- **THEN** it SHALL direct users and agents to edit package source files rather than generated HTML

#### Scenario: Reproduce derived artifact from source
- **WHEN** a package is compiled twice with unchanged source and unchanged config
- **THEN** the generated artifact SHALL be reproducible from package source and SHALL NOT be required as future input

#### Scenario: Preserve existing source modes
- **WHEN** an existing single-file spec or current package-mode prototype is compiled
- **THEN** the system SHALL continue to support it without requiring lifecycle directories

### Requirement: Lifecycle directory conventions
Spec UI SHALL support visible lifecycle directories for canonical packages, proposed changes, adapter profiles, artifacts, and handoff output.

#### Scenario: Initialize lifecycle directories
- **WHEN** a user initializes Spec UI conventions with examples or lifecycle templates
- **THEN** the system SHALL create or document visible directories for `prototypes`, `prototype-changes`, `adapter-profiles`, `artifacts`, and `handoff`
- **AND** SHALL keep `.spec-ui/` limited to config, instructions, and templates

#### Scenario: Reject hidden canonical source
- **WHEN** init creates starter prototype source
- **THEN** starter source SHALL live in the configured prototypes directory rather than inside `.spec-ui/`

#### Scenario: Load lifecycle config defaults
- **WHEN** no repo config is present
- **THEN** built-in defaults SHALL still allow package status, validation, compile, change preview, and handoff commands to operate on explicit paths

### Requirement: States role
Spec UI SHALL support a focused package role for user-visible state definitions.

#### Scenario: Declare states include
- **WHEN** a package manifest includes a file with role `states`
- **THEN** package loading and validation SHALL recognize it as a supported role

#### Scenario: Parse state definitions
- **WHEN** the states role declares empty, loading, error, success, populated, selected, expanded, collapsed, or disabled states using documented syntax
- **THEN** the compiler SHALL preserve those states with ids, labels, targets, source references, and ordering

#### Scenario: Resolve state targets
- **WHEN** a state references a screen, region, block, item, action, flow, or data record
- **THEN** validation SHALL require that target to resolve or fail with a source-referenced error

#### Scenario: Preserve state role in handoff
- **WHEN** implementation handoff is generated
- **THEN** state definitions SHALL be included as implementation-relevant product intent

### Requirement: Data contract role
Spec UI SHALL support a focused package role for implementation-relevant product data contracts.

#### Scenario: Declare data include
- **WHEN** a package manifest includes a file with role `data`
- **THEN** package loading and validation SHALL recognize it as a supported role

#### Scenario: Support contracts alias when documented
- **WHEN** the implementation documents `contracts` as an alias for `data`
- **THEN** validation SHALL support the alias consistently in manifest loading, status, validation, and handoff
- **AND** SHALL report the canonical role as `data`

#### Scenario: Parse entities and fields
- **WHEN** the data role declares entities, fields, field types, sample rows, form payloads, API assumptions, state shape, or privacy/sensitivity notes using supported syntax
- **THEN** the compiler SHALL preserve those records with ids, attributes, source references, and ordering

#### Scenario: Resolve data references
- **WHEN** screens, blocks, flows, states, or acceptance criteria reference data records
- **THEN** validation SHALL require those data records to exist

#### Scenario: Require data contracts for implementation handoff
- **WHEN** a package contains data-driven blocks such as data tables, forms, metrics, collection lists, detail panels, activity feeds, settings groups, or pricing/data records
- **THEN** implementation handoff readiness SHALL require relevant data contracts or SHALL report a blocked/warning state with source references

#### Scenario: Reject unsafe data role content
- **WHEN** a data role contains raw runtime code, SQL driver snippets, network calls, framework code, secrets, raw HTML, JSX, scripts, styles, classes, or component names as canonical source
- **THEN** validation SHALL fail with an implementation-detail or unsafe-contract error

### Requirement: Readiness states
Spec UI SHALL distinguish source, review, archive, and implementation handoff readiness.

#### Scenario: Report source readiness
- **WHEN** status inspects a package
- **THEN** it SHALL report whether package source parses, includes resolve, semantic values are supported, and references resolve

#### Scenario: Report review readiness
- **WHEN** status inspects a package
- **THEN** it SHALL report whether the package can produce a deterministic viewer artifact useful for review

#### Scenario: Report archive readiness
- **WHEN** status inspects a prototype change
- **THEN** it SHALL report whether the change can be safely archived into the target package

#### Scenario: Report handoff readiness
- **WHEN** status or handoff inspects a package
- **THEN** it SHALL report whether implementation handoff has enough screens, flows, states, data/contracts, content, layout/tokens, acceptance criteria, and profile constraints

#### Scenario: Keep JSON status stable
- **WHEN** readiness is requested in JSON mode
- **THEN** stdout SHALL contain valid JSON only and include stable readiness keys, errors, warnings, and source references
