# repo-initialization Specification

## Purpose
TBD - created by archiving change add-cli-workflow-and-init. Update Purpose after archive.
## Requirements
### Requirement: Initialize repo-local Spec UI conventions
The system SHALL provide an optional `init` command that creates repo-local Spec UI configuration and guidance.

#### Scenario: Initialize current directory
- **WHEN** a user runs `spec-ui init`
- **THEN** the CLI SHALL create `.spec-ui/` in the current working directory with default config, instructions, and templates
- **AND** SHALL print a concise human summary of created and skipped files

#### Scenario: Initialize explicit path
- **WHEN** a user runs `spec-ui init <path>`
- **THEN** the CLI SHALL create `.spec-ui/` under the provided path
- **AND** SHALL NOT initialize a different ancestor directory through repo discovery

#### Scenario: Init is optional
- **WHEN** a repo has no `.spec-ui/` directory
- **THEN** existing single-file and package compile, status, and validate commands SHALL continue to work with built-in defaults

#### Scenario: Help describes init behavior
- **WHEN** a user runs `spec-ui init --help`
- **THEN** the CLI SHALL describe `path`, `--examples`, `--force`, and `--json`
- **AND** SHALL explain that `.spec-ui/` stores conventions while prototype source remains visible elsewhere

### Requirement: Write deterministic initialization files
The system SHALL create deterministic initialization files that can be reviewed and committed.

#### Scenario: Create config
- **WHEN** initialization succeeds
- **THEN** `.spec-ui/config.json` SHALL contain schema version, default adapter, default target, prototypes directory, artifacts directory, required roles, and optional roles
- **AND** the default config SHALL be deterministic JSON with stable key order and trailing newline
- **AND** `defaultAdapter` SHALL refer to the renderer adapter target and `defaultTarget` SHALL refer to package handoff target metadata
- **AND** the default values SHALL be:
  - `schemaVersion`: `1`
  - `defaultAdapter`: `bootstrap-html`
  - `defaultTarget`: `standalone-html`
  - `prototypesDir`: `prototypes`
  - `artifactsDir`: `artifacts`
  - `requiredRoles`: `screens`, `flows`, `content`, `layout`, `acceptance`
  - `optionalRoles`: `tokens`

#### Scenario: Create local instructions
- **WHEN** initialization succeeds
- **THEN** `.spec-ui/instructions.md` SHALL contain concise operational guidance for editing source files, capturing UAT feedback, using configured defaults, compiling accepted prototypes, and preserving standalone deterministic portability
- **AND** the instructions SHALL tell agents to edit package source files instead of generated HTML

#### Scenario: Avoid viewer-specific contract language
- **WHEN** `.spec-ui/instructions.md` is generated
- **THEN** it SHALL NOT name a specific viewer as the portability contract and SHALL instead describe the generated HTML as standalone, deterministic, and portable

#### Scenario: Create templates
- **WHEN** initialization succeeds
- **THEN** `.spec-ui/templates/` SHALL include templates for `prototype.md`, `screens.md`, `flows.md`, `content.md`, `layout.md`, `tokens.md`, and `acceptance.md`
- **AND** every template SHALL be deterministic markdown with a clear role heading and placeholders that use supported Spec UI grammar only
- **AND** template controls and examples SHALL match the current supported roles, layout controls, token controls, flow actions, and acceptance invariants exposed by the source contracts

#### Scenario: Template rejects implementation details by example
- **WHEN** `.spec-ui/templates/layout.md` or `.spec-ui/templates/tokens.md` is generated
- **THEN** the template SHALL demonstrate semantic blocks, symbolic gap values, and adapter-neutral intent
- **AND** SHALL NOT include raw HTML, CSS classes, framework component names, JavaScript, CDN references, or viewer-specific code

### Requirement: Keep prototype source visible
The system SHALL keep user-authored prototype packages outside the hidden `.spec-ui/` directory.

#### Scenario: Do not hide source packages
- **WHEN** `spec-ui init` creates default configuration
- **THEN** the configured prototypes directory SHALL be a visible path such as `prototypes`

#### Scenario: Optional starter examples
- **WHEN** a user runs `spec-ui init --examples`
- **THEN** the CLI SHALL create starter prototype package files in the configured visible prototypes directory, not inside `.spec-ui/`
- **AND** the starter package SHALL include `prototype.md`, `screens.md`, `flows.md`, `content.md`, `layout.md`, `tokens.md`, and `acceptance.md`
- **AND** the starter package SHALL validate with `spec-ui validate <starter-package> --strict`
- **AND** the starter package SHALL follow the same manifest and role-file grammar as the merged canonical package examples

#### Scenario: Do not create examples by default
- **WHEN** a user runs `spec-ui init` without `--examples`
- **THEN** the CLI SHALL NOT create starter prototype packages

### Requirement: Protect existing initialization files
The system SHALL avoid overwriting existing user files during initialization unless explicitly requested.

#### Scenario: Existing config without force
- **WHEN** `.spec-ui/config.json` already exists and a user runs `spec-ui init`
- **THEN** the CLI SHALL exit with code `1`
- **AND** report an `init_already_exists` error

#### Scenario: Existing config with force
- **WHEN** `.spec-ui/config.json` already exists and a user runs `spec-ui init --force`
- **THEN** the CLI SHALL update generated initialization files deterministically while preserving or reporting any user-owned files it does not overwrite
- **AND** SHALL NOT delete unknown files under `.spec-ui/`

#### Scenario: Existing template without force
- **WHEN** a generated template path already exists and a user runs `spec-ui init`
- **THEN** the CLI SHALL exit with code `1`
- **AND** report the existing path instead of partially overwriting generated files

#### Scenario: Atomic initialization result
- **WHEN** initialization fails because of existing files or invalid target path
- **THEN** the CLI SHALL avoid leaving a partially updated `.spec-ui/` tree when practical
- **AND** SHALL report any files that were created before failure if rollback is not possible

### Requirement: Support JSON output for initialization
The system SHALL provide structured initialization results for agents and automation.

#### Scenario: Init JSON output
- **WHEN** a user runs `spec-ui init --json`
- **THEN** stdout SHALL contain only valid JSON describing `command`, `ok`, created files, skipped files, overwritten files, config path, templates directory, prototypes directory, artifacts directory, and whether examples were created

#### Scenario: Init failure JSON output
- **WHEN** initialization fails with `--json`
- **THEN** stdout SHALL contain valid JSON with `ok: false` and stable error codes and messages
- **AND** stderr SHALL NOT contain additional text required to understand the failure

### Requirement: Load initialized defaults consistently
The system SHALL use `.spec-ui/config.json` as optional repo-local defaults for commands that need project conventions.

#### Scenario: Discover config from current repo
- **WHEN** a command runs inside a repo containing `.spec-ui/config.json`
- **THEN** the CLI SHALL load configured defaults for prototypes directory, artifacts directory, default adapter, target, and role requirements
- **AND** SHALL use those defaults consistently for `list`, named input resolution, `status`, `show`, `validate --strict`, `instructions`, and any documented compile default path behavior
- **AND** SHALL validate the configured default adapter against the shared adapter metadata used by compile/render

#### Scenario: Built-in defaults without config
- **WHEN** no `.spec-ui/config.json` is found
- **THEN** the CLI SHALL use built-in defaults equivalent to package mode today, including `bootstrap-html` as the package adapter default and the current built-in examples under `examples/`

#### Scenario: Reject invalid config
- **WHEN** `.spec-ui/config.json` is malformed or declares unsupported defaults
- **THEN** commands that rely on config SHALL fail with a clear configuration error and source path
- **AND** JSON mode SHALL report `config_malformed` or `unsupported_config`

#### Scenario: Reject unsafe configured directories
- **WHEN** `.spec-ui/config.json` declares an absolute prototypes directory, absolute artifacts directory, or a directory that escapes the repo root
- **THEN** commands that rely on config SHALL fail with `unsupported_config`

#### Scenario: Preserve zero-init behavior
- **WHEN** no config exists and a user runs `spec-ui compile examples/task-board.md --out artifacts/task-board.html`
- **THEN** the command SHALL continue to work with the same source compatibility expectations as before this change

