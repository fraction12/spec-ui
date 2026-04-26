# ui-library-adapter-contract Specification

## Purpose
TBD - created by archiving change prototype-spec-packages-and-ui-adapters. Update Purpose after archive.
## Requirements
### Requirement: Provide one default Bootstrap-backed HTML adapter
The system SHALL provide `bootstrap-html` as the supported default open-source UI-library-backed adapter for standalone HTML prototype rendering.

#### Scenario: Resolve default library adapter
- **WHEN** a package or single-file spec requests `adapter="bootstrap-html"`
- **THEN** the compiler SHALL resolve it to the supported Bootstrap-backed adapter implementation and record the resolved adapter identity in IR metadata

#### Scenario: Default package adapter
- **WHEN** a prototype package omits an adapter value
- **THEN** the compiler SHALL default the package to `bootstrap-html`

#### Scenario: Reject unsupported adapter
- **WHEN** a spec requests an adapter that is not in the supported adapter registry
- **THEN** validation SHALL fail with a clear unsupported adapter error

### Requirement: Keep source specs adapter-neutral
The system SHALL reject source syntax that directly references UI-library classes, raw framework components, JSX, raw HTML, raw CSS, or custom JavaScript as canonical prototype structure.

#### Scenario: Reject library class names
- **WHEN** a source file uses implementation-specific class attributes or raw UI-library class strings as canonical structure
- **THEN** validation SHALL fail with a raw implementation detail error

#### Scenario: Reject framework component references
- **WHEN** a source file names framework-specific components or imports as canonical structure
- **THEN** validation SHALL fail with a raw implementation detail error

### Requirement: Render Bootstrap-backed output as portable HTML
The `bootstrap-html` adapter SHALL render a standalone HTML artifact that can open without network access in a browser and Micro Canvas.

#### Scenario: No external runtime dependencies
- **WHEN** the renderer emits HTML with `bootstrap-html`
- **THEN** the artifact SHALL NOT require CDN links, external fonts, remote scripts, remote stylesheets, package-manager runtime loading, or network calls

#### Scenario: Inline or vendor required assets
- **WHEN** the adapter requires library CSS or JavaScript for the selected semantic blocks
- **THEN** the renderer SHALL inline or vendor those assets deterministically inside the portable artifact

#### Scenario: Report pinned Bootstrap provenance
- **WHEN** the renderer emits HTML with `bootstrap-html`
- **THEN** the IR and handoff metadata SHALL identify the pinned Bootstrap major version, adapter version, and asset provenance

### Requirement: Keep adapter mapping bounded
The default adapter SHALL map only documented semantic screens, regions, blocks, items, states, and actions.

#### Scenario: Reject unsupported semantic block
- **WHEN** IR contains a semantic block type that the default adapter does not support
- **THEN** rendering or validation SHALL fail with a clear unsupported semantic block error rather than improvising markup

### Requirement: Preserve baseline adapter compatibility
The system SHALL keep the existing `baseline` adapter available for current single-file examples and lightweight portable HTML output.

#### Scenario: Resolve baseline adapter
- **WHEN** a single-file spec requests `adapter="baseline"` or relies on existing baseline behavior
- **THEN** the compiler and renderer SHALL preserve the existing deterministic baseline output path

