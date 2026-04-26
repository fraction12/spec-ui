# cli-workflow-layer Specification

## Purpose
TBD - created by archiving change add-cli-workflow-and-init. Update Purpose after archive.
## Requirements
### Requirement: Provide a discoverable command tree
The system SHALL expose an OpenSpec-inspired Spec UI command tree with clear top-level help and command-specific help.

#### Scenario: Show top-level help
- **WHEN** a user runs `spec-ui --help` or `spec-ui help`
- **THEN** the CLI SHALL print usage, a one-line product description, global options, and the supported commands `init`, `list`, `show`, `status`, `validate`, `instructions`, and `compile`
- **AND** the command SHALL exit with code `0`

#### Scenario: Show command help
- **WHEN** a user runs `spec-ui <command> --help` or `spec-ui help <command>`
- **THEN** the CLI SHALL print usage, a short command description, supported options, and examples for that command
- **AND** the command SHALL exit with code `0`

#### Scenario: Show version
- **WHEN** a user runs `spec-ui --version`
- **THEN** the CLI SHALL print the package version from the canonical package metadata or shared version constant
- **AND** the command SHALL exit with code `0`

#### Scenario: Reject unknown command
- **WHEN** a user runs `spec-ui <unknown-command>`
- **THEN** the CLI SHALL exit with code `2`
- **AND** print a concise unknown command error with code `unknown_command` and a hint to run `spec-ui --help`

#### Scenario: Reject unknown option
- **WHEN** a user runs a supported command with an unsupported option
- **THEN** the CLI SHALL exit with code `2`
- **AND** report a usage error with code `unknown_option` without a stack trace

### Requirement: Support human and JSON output modes
The system SHALL default workflow commands to human-readable output and SHALL provide stable JSON output through `--json`.

#### Scenario: Print human status by default
- **WHEN** a user runs `spec-ui status <package>`
- **THEN** the CLI SHALL print a concise summary with prototype title, source mode, adapter, readiness, include counts, acceptance counts, and role checklist
- **AND** the output SHALL use stable vocabulary for `ready`, `blocked`, `invalid`, `single-file`, `package`, `bootstrap-html`, and `standalone-html`
- **AND** the output SHALL distinguish renderer adapter targets such as `bootstrap-html` and `baseline` from package handoff target metadata such as `standalone-html`

#### Scenario: Print JSON status on request
- **WHEN** a user runs `spec-ui status <package> --json`
- **THEN** the CLI SHALL print machine-readable status JSON using the same readiness data as the human output
- **AND** the JSON SHALL include `command`, `ok`, `input`, `readiness`, `title` when known, `adapter` when known, package target when known, `roles`, `acceptance`, `errors`, and `warnings`

#### Scenario: Keep JSON parseable
- **WHEN** any command is run with `--json`
- **THEN** stdout SHALL contain only valid JSON and diagnostics SHALL NOT be mixed into stdout
- **AND** any non-JSON diagnostics SHALL be written only to stderr

#### Scenario: Print JSON errors
- **WHEN** any command fails with `--json`
- **THEN** stdout SHALL contain a valid JSON object with `ok: false` and an `errors` array
- **AND** each error SHALL include stable `code` and `message` fields plus `path` and `line` when available

### Requirement: Resolve command inputs consistently
The system SHALL use one shared input resolver for commands that accept prototype inputs.

#### Scenario: Reuse merged source detection
- **WHEN** a command resolves an explicit file or directory
- **THEN** it SHALL use or refactor the merged source detection/package loading helpers instead of keeping a separate command-specific package reader

#### Scenario: Resolve explicit file
- **WHEN** a user passes an existing markdown file path as `<input-or-name>`
- **THEN** `status`, `show`, `validate`, `instructions`, and `compile` SHALL treat it as a single-file input

#### Scenario: Resolve explicit package directory
- **WHEN** a user passes an existing directory path containing `prototype.md`
- **THEN** `status`, `show`, `validate`, `instructions`, and `compile` SHALL treat it as a package input

#### Scenario: Resolve configured package name
- **WHEN** a repo has `.spec-ui/config.json` and the user passes a package name that exists under the configured `prototypesDir`
- **THEN** `status`, `show`, `validate`, `instructions`, and `compile` SHALL resolve the name to that package directory

#### Scenario: Reject ambiguous input
- **WHEN** an input name matches more than one discoverable prototype source
- **THEN** the CLI SHALL exit with code `2`
- **AND** report an `ambiguous_input` error with the matching candidates

#### Scenario: Reject missing input
- **WHEN** a user passes an input that cannot be resolved
- **THEN** the CLI SHALL exit nonzero
- **AND** report an `input_not_found` error

### Requirement: Report prototype status as a first-class command
The system SHALL expose `status` as the primary readiness preflight for single-file specs and prototype packages.

#### Scenario: Status for ready package
- **WHEN** a package has a valid manifest, all required includes, resolved references, supported roles, and supported adapter metadata
- **THEN** `spec-ui status <package>` SHALL exit with code `0` and report readiness `ready`
- **AND** SHALL report source mode `package`, manifest path, ordered roles, resolved include count, missing include count, and acceptance summary
- **AND** SHALL be derived from the shared package status model, including the merged `getPackageStatus` behavior where applicable

#### Scenario: Status for blocked package
- **WHEN** a package is missing required includes or has unresolved package references
- **THEN** `spec-ui status <package>` SHALL exit with code `1`
- **AND** report readiness `blocked` with stable error codes and source file references

#### Scenario: Status for single-file spec
- **WHEN** a user runs `spec-ui status <single-file-spec>`
- **THEN** the CLI SHALL report source mode `single-file`, readiness `ready` for valid input, and any validation errors for invalid input

#### Scenario: Status does not write artifacts
- **WHEN** a user runs `spec-ui status <input>`
- **THEN** the CLI SHALL NOT write HTML, IR, config, template, or example files

### Requirement: Validate prototypes without writing artifacts
The system SHALL expose a `validate` command that checks source correctness without producing HTML or IR artifacts.

#### Scenario: Validate valid source
- **WHEN** a user runs `spec-ui validate <input>`
- **THEN** the CLI SHALL parse and validate the input, exit with code `0`, and report validation success
- **AND** SHALL NOT write HTML, IR, config, template, or example files
- **AND** for package input SHALL use the same package preparation and validation behavior as package compilation/status

#### Scenario: Validate invalid source
- **WHEN** a user runs `spec-ui validate <input>` for invalid source
- **THEN** the CLI SHALL exit with code `1`
- **AND** report stable validation errors with code, message, source file, and line when available

#### Scenario: Strict validation
- **WHEN** a user runs `spec-ui validate <input> --strict`
- **THEN** the CLI SHALL include strict checks for initialized repo config, package metadata, adapter support, role completeness, and portable handoff constraints
- **AND** strict validation SHALL reject unsupported configured defaults before compiling artifacts

### Requirement: Show prototype metadata and source structure
The system SHALL expose a `show` command for inspecting a prototype without compiling artifacts.

#### Scenario: Show package summary
- **WHEN** a user runs `spec-ui show <package>`
- **THEN** the CLI SHALL display package title, manifest path, source mode, surface, adapter, target, fidelity, included files, and acceptance summary
- **AND** SHALL NOT write HTML, IR, config, template, or example files

#### Scenario: Show JSON summary
- **WHEN** a user runs `spec-ui show <input> --json`
- **THEN** the CLI SHALL print the same summary as structured JSON
- **AND** SHALL include source paths in a deterministic order

### Requirement: List discoverable Spec UI resources
The system SHALL expose a `list` command for discovering examples, prototype packages, and adapters.

#### Scenario: List default resources
- **WHEN** a user runs `spec-ui list`
- **THEN** the CLI SHALL list known examples and prototype packages discoverable from the current repo and initialized config when present
- **AND** SHALL NOT require `.spec-ui/` to exist

#### Scenario: List adapters
- **WHEN** a user runs `spec-ui list --adapters`
- **THEN** the CLI SHALL list supported adapters with adapter name, target name, adapter version, resolved library when applicable, and portability provenance
- **AND** the list SHALL be derived from the shared adapter metadata used by compilation/rendering rather than duplicated CLI-only constants

#### Scenario: List packages only
- **WHEN** a user runs `spec-ui list --packages`
- **THEN** the CLI SHALL list discoverable package directories from initialized config when present
- **AND** SHALL report an empty list rather than failing when no packages are found

#### Scenario: List examples only
- **WHEN** a user runs `spec-ui list --examples`
- **THEN** the CLI SHALL list built-in example specs with names and paths

#### Scenario: List JSON resources
- **WHEN** a user runs `spec-ui list --json`
- **THEN** the CLI SHALL print a stable JSON object containing discovered resources in deterministic order

### Requirement: Provide role-specific prototype instructions
The system SHALL expose an `instructions` command that helps users and agents edit the correct package role file without scope creep.

#### Scenario: Instructions for package role
- **WHEN** a user runs `spec-ui instructions layout --input <package>`
- **THEN** the CLI SHALL print focused guidance for editing `layout.md`, including supported semantic controls, symbolic `gap` values, wrapping expectations, modal/dialog placement requirements, and a reminder to avoid raw CSS or library classes
- **AND** supported controls and values SHALL match the current source constants rather than a hand-written divergent list

#### Scenario: Instructions include package health
- **WHEN** a user runs `spec-ui instructions <role> --input <package>`
- **THEN** the CLI SHALL include current package readiness context and the role file path when the package can be inspected
- **AND** SHALL NOT write HTML, IR, config, template, or example files

#### Scenario: Reject unsupported instruction role
- **WHEN** a user requests instructions for an unsupported role
- **THEN** the CLI SHALL exit with code `2`
- **AND** list supported roles `screens`, `flows`, `content`, `layout`, `tokens`, and `acceptance`

#### Scenario: Instructions JSON output
- **WHEN** a user runs `spec-ui instructions content --input <package> --json`
- **THEN** the CLI SHALL print valid JSON with `command`, `ok`, `role`, `input`, `roleFile`, `readiness`, and `instructions`

### Requirement: Compile remains the artifact-producing command
The system SHALL keep `compile` focused on producing deterministic portable HTML and optional IR output.

#### Scenario: Compile with explicit outputs
- **WHEN** a user runs `spec-ui compile <input> --out <output.html> --ir <output.json>`
- **THEN** the CLI SHALL compile the input, write the requested HTML and IR artifacts, and print handoff metadata
- **AND** SHALL create parent directories for requested artifact paths when needed
- **AND** SHALL reuse the merged `compileToIr` or `compilePackageToIr`, `renderHtml`, `serializeIr`, and `createHandoffResult` paths

#### Scenario: Compile JSON output
- **WHEN** a user runs `spec-ui compile <input> --out <output.html> --json`
- **THEN** the CLI SHALL print handoff metadata as valid JSON
- **AND** the metadata SHALL include resolved input, artifact path, source mode, source hash, adapter identity, target, warnings, and portability status when available

#### Scenario: Reject compile missing output
- **WHEN** a user runs `spec-ui compile <input>` without `--out` and no documented initialized default output applies
- **THEN** the CLI SHALL exit with code `2`
- **AND** report a `missing_output` error

#### Scenario: Preserve compile status compatibility
- **WHEN** a user runs `spec-ui compile <input> --status`
- **THEN** the CLI SHALL behave as a compatibility alias for `spec-ui status <input> --json`
- **AND** stdout SHALL contain valid JSON without deprecation prose

### Requirement: Standardize CLI exit codes
The system SHALL use consistent exit codes for CLI outcomes.

#### Scenario: Successful command
- **WHEN** a command succeeds or a prototype is ready/valid
- **THEN** the CLI SHALL exit with code `0`

#### Scenario: Blocked or invalid prototype
- **WHEN** status or validation finds a blocked or invalid prototype
- **THEN** the CLI SHALL exit with code `1`

#### Scenario: Usage error
- **WHEN** required arguments are missing or unsupported options are provided
- **THEN** the CLI SHALL exit with code `2`
- **AND** report a usage error without a stack trace

#### Scenario: Stable error codes
- **WHEN** a command reports an error
- **THEN** the error SHALL use a stable code from the documented CLI error-code set or a compiler validation code passed through from shared validation logic

### Requirement: Reuse shared implementation paths
The system SHALL implement CLI commands as thin wrappers over shared Spec UI parsing, package, validation, adapter, rendering, and handoff logic.

#### Scenario: Avoid command-specific source parsing
- **WHEN** `status`, `show`, `validate`, `instructions`, or `compile` inspects a prototype source
- **THEN** it SHALL use the shared input resolver and parser/compiler/package validation path rather than ad hoc markdown or HTML scraping

#### Scenario: Replace existing CLI-only package reader
- **WHEN** implementing first-class `status`, `show`, `validate`, `instructions`, and the updated `compile`
- **THEN** the existing package reading behavior in the CLI entry point SHALL be refactored behind shared helpers or replaced by shared helpers
- **AND** package compilation and `compile --status` SHALL remain backward compatible

#### Scenario: Share result objects
- **WHEN** human and JSON output are produced for the same command
- **THEN** both outputs SHALL be derived from the same internal result object

#### Scenario: Preserve dependency-light CLI
- **WHEN** implementing the command router and option parsing
- **THEN** the system SHALL avoid adding a CLI framework dependency unless the implementation documents why the dependency is necessary and tests lock the output contract

