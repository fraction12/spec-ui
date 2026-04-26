## ADDED Requirements

### Requirement: Source layout controls from package files
The system SHALL allow package-authored layout controls to define spacing, padding, density, width, alignment, column count, responsive collapse, wrapping, and overflow behavior without raw CSS.

#### Scenario: Validate finite layout controls
- **WHEN** a package declares layout controls
- **THEN** every control name and value SHALL come from documented finite sets for `gap`, `padding`, `density`, `width`, `align`, `columns`, `collapse`, `collapseAt`, `text`, and `overflow`

#### Scenario: Apply package layout controls
- **WHEN** a package declares supported layout controls for a screen, region, or block
- **THEN** the compiler SHALL preserve those controls in semantic IR and the renderer SHALL translate them into deterministic output behavior

#### Scenario: Reject unsupported layout value
- **WHEN** a package declares a layout value outside the documented finite set
- **THEN** validation SHALL fail with a clear unsupported layout value error

### Requirement: Source user-visible flows from package files
The system SHALL allow package-authored flow files to define navigation paths, modal and drawer behavior, form transitions, tab selection, and state changes.

#### Scenario: Parse flow step syntax
- **WHEN** a flow file declares `## Flow: <title> [id="..." start="..."]` and `- Step: <label> [from="..." action="..." to="..."]` lines
- **THEN** the compiler SHALL preserve ordered flow steps with source file and line metadata

#### Scenario: Compile reachable flow path
- **WHEN** a flow file declares a path from one screen to another through a supported action
- **THEN** validation SHALL verify that the referenced source screen, action, and target screen or state exist

#### Scenario: Reject unresolved flow target
- **WHEN** a flow file references a missing screen, block, state, or action target
- **THEN** validation SHALL fail with a clear unresolved flow target error

### Requirement: Capture acceptance notes as prototype constraints
The system SHALL parse and preserve package acceptance notes so agents can use UAT feedback as durable prototype constraints.

#### Scenario: Parse structured acceptance invariant
- **WHEN** acceptance content declares `- Invariant: <name> [target="..."]`
- **THEN** the compiler SHALL preserve the invariant name, target, source file, and source line in machine-readable metadata

#### Scenario: Preserve acceptance notes
- **WHEN** a package includes acceptance notes
- **THEN** the compiler SHALL include them in IR or handoff metadata with source file and line references

#### Scenario: Compile structured acceptance invariant
- **WHEN** an acceptance note uses a supported structured invariant such as stable navigation labels, single modal stack, reachable flow, or overflow containment
- **THEN** validation SHALL preserve the invariant in a machine-readable form for tests and future agents

### Requirement: Resolve package content references
The system SHALL allow screens and blocks to reference package-authored content records such as sample data rows, pricing tiers, FAQ entries, testimonials, and reusable copy.

#### Scenario: Parse content record syntax
- **WHEN** content declares `## Content: <title> [id="..." type="..."]` with ordered record lines
- **THEN** the compiler SHALL preserve content records with IDs, types, properties, order, source file, and source line metadata

#### Scenario: Resolve content record
- **WHEN** a block references a content record declared in `content.md`
- **THEN** the compiler SHALL inline the resolved semantic content into IR deterministically

#### Scenario: Reject missing content record
- **WHEN** a block references a content record that is not declared in the package
- **THEN** validation SHALL fail with a clear unresolved content reference error

### Requirement: Source semantic token controls from package files
The system SHALL allow package-authored token controls for semantic tone, radius, density, and treatment without exposing raw CSS variables or UI-library class names.

#### Scenario: Apply supported token control
- **WHEN** `tokens.md` declares a supported token control such as brand tone, control radius, or card treatment
- **THEN** the compiler SHALL preserve that semantic token in IR and the adapter SHALL translate it deterministically

#### Scenario: Reject raw token implementation detail
- **WHEN** `tokens.md` declares raw CSS variables, raw color values outside supported semantic sets, or UI-library class names
- **THEN** validation SHALL fail with a raw implementation detail or unsupported token control error
