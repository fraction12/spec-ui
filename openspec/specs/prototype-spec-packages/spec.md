# prototype-spec-packages Specification

## Purpose
TBD - created by archiving change prototype-spec-packages-and-ui-adapters. Update Purpose after archive.
## Requirements
### Requirement: Compile prototype packages from a manifest
The system SHALL compile a prototype package from an explicit manifest that declares package metadata and a deterministic include list.

#### Scenario: Parse canonical markdown manifest
- **WHEN** the compiler receives `prototype.md` whose first line is `# Prototype: <title>` with supported metadata attributes
- **THEN** it SHALL parse package title, surface, adapter, target, fidelity, and ordered include records from the manifest

#### Scenario: Compile package manifest
- **WHEN** the compiler receives a valid prototype package manifest with ordered included files
- **THEN** it SHALL read only the declared files in manifest order and compile them into one semantic source model

#### Scenario: Reject undeclared package files
- **WHEN** a package directory contains markdown files that are not listed in the manifest
- **THEN** those files SHALL NOT affect compilation output

#### Scenario: Reject missing included file
- **WHEN** the manifest includes a file path that does not exist inside the package
- **THEN** validation SHALL fail with a clear missing package include error

#### Scenario: Reject include outside package root
- **WHEN** the manifest includes an absolute path or a relative path that escapes the package directory
- **THEN** validation SHALL fail with a clear package include outside root error

### Requirement: Preserve single-file spec compatibility
The system SHALL continue to compile existing single-file markdown specs without requiring a package manifest.

#### Scenario: Compile existing single file
- **WHEN** the compiler receives a valid single-file Spec UI markdown document
- **THEN** it SHALL compile through the existing single-file path and produce the same deterministic IR and HTML behavior as before

### Requirement: Support focused package file roles
The system SHALL support focused package files for screens, flows, content, layout, tokens, and acceptance notes.

#### Scenario: Validate supported role set
- **WHEN** a package manifest declares include roles
- **THEN** every role SHALL be one of `screens`, `flows`, `content`, `layout`, `tokens`, or `acceptance`

#### Scenario: Merge focused package files
- **WHEN** a package manifest includes `screens.md`, `flows.md`, `content.md`, `layout.md`, `tokens.md`, and `acceptance.md`
- **THEN** the compiler SHALL merge them into one validated semantic model while preserving source file and source line metadata

#### Scenario: Reject unsupported package role
- **WHEN** a manifest declares a package role outside the supported role set
- **THEN** validation SHALL fail with a clear unsupported package role error

### Requirement: Keep package sources deterministic
The system SHALL produce byte-identical serialized IR and HTML for unchanged package files, unchanged manifest order, and unchanged compile options.

#### Scenario: Recompile unchanged package
- **WHEN** the same package is compiled twice with the same options
- **THEN** the serialized IR and rendered HTML SHALL be identical

#### Scenario: Reorder includes changes source order
- **WHEN** the manifest include order changes
- **THEN** the compiler SHALL treat that as an intentional source-order change and reflect the new order deterministically

### Requirement: Report package readiness status
The system SHALL expose package readiness status so agents can identify missing files, blocked references, validation failures, and package metadata before rendering.

#### Scenario: Report ready package
- **WHEN** a package has a valid manifest, all required includes, supported roles, resolved references, and supported adapter metadata
- **THEN** package status SHALL report readiness as `ready` with included files and structured acceptance invariant counts

#### Scenario: Report blocked package
- **WHEN** a package is missing required includes or has unresolved content, layout, or flow references
- **THEN** package status SHALL report readiness as `blocked` or `invalid` with stable error codes and source file references

