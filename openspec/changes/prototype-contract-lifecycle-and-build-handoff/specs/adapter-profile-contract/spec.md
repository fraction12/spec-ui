## ADDED Requirements

### Requirement: Semantic adapter profiles
Spec UI SHALL support semantic adapter profiles for targeting real repo visual systems without embedding implementation markup in canonical source.

#### Scenario: Define profile directory
- **WHEN** an adapter profile is stored on disk
- **THEN** it SHALL live in a visible adapter profile directory such as `adapter-profiles/<profile-id>/`
- **AND** MAY include `profile.md`, `tokens.md`, `components.md`, and `constraints.md`

#### Scenario: Parse profile metadata
- **WHEN** a profile is loaded
- **THEN** the system SHALL parse profile id, display name, supported surfaces, supported adapter target, typography roles, tone vocabulary, density values, panel/card treatments, layout archetypes, semantic component families, accessibility constraints, responsive constraints, and forbidden details

#### Scenario: Reference profile from package
- **WHEN** a package manifest references a profile semantically
- **THEN** validation SHALL resolve the profile and preserve profile identity in status, IR, viewer handoff, and implementation handoff

#### Scenario: Reject missing profile
- **WHEN** a package, change, or variant references an unknown profile
- **THEN** validation SHALL fail with a missing-profile or unsupported-profile error

### Requirement: Implementation leakage prevention
Spec UI SHALL reject adapter profiles and profile-targeted source that tunnel implementation details into canonical Spec UI source.

#### Scenario: Reject implementation markup in profile
- **WHEN** a profile contains raw HTML, JSX, CSS class mappings, Tailwind strings, framework component imports, script/style blocks, CDN URLs, remote runtime assets, or executable code as canonical mapping input
- **THEN** profile validation SHALL fail with an implementation-detail error

#### Scenario: Reject implementation markup in package source
- **WHEN** package source targeting a profile uses raw HTML, JSX, class names, Tailwind utilities, component names, scripts, styles, or library-specific selectors as canonical source
- **THEN** package validation SHALL fail before compilation

#### Scenario: Allow semantic profile vocabulary
- **WHEN** package source references documented semantic profile values such as `tone="signal"`, `density="compact"`, `treatment="terminal-panel"`, or `layout="editorial-split"`
- **THEN** validation SHALL accept those values only if the referenced profile defines them

### Requirement: Profile-aware rendering and handoff
Spec UI SHALL preserve profile constraints through rendering and implementation handoff.

#### Scenario: Compile profile-targeted package
- **WHEN** a valid package targets a profile
- **THEN** the generated viewer artifact SHALL remain standalone, deterministic, portable, and offline-capable
- **AND** handoff metadata SHALL include profile id, profile source hash, selected adapter target, and profile constraints

#### Scenario: Include profile in implementation handoff
- **WHEN** implementation handoff is generated for a profile-targeted package
- **THEN** the handoff SHALL include semantic visual constraints, component families, token vocabulary, accessibility constraints, responsive constraints, and forbidden implementation details

#### Scenario: Warn on generic profile fallback
- **WHEN** a package requests a profile but rendering falls back to a generic adapter visual strategy
- **THEN** status or compile handoff SHALL warn that visual fidelity may not represent the requested repo visual system

### Requirement: Repo visual-system proof case
Spec UI SHALL support a proof-case profile for a dark editorial/signal-desk style portfolio without private implementation leakage.

#### Scenario: Validate portfolio-style profile fixture
- **WHEN** a fixture profile defines semantic values for dark editorial layout, monospace proof rails, apricot signal accents, terminal panels, card grids, sticky section heads, and observability-style metadata
- **THEN** profile validation SHALL accept it if it avoids raw implementation classes/components

#### Scenario: Use profile for distinct variants
- **WHEN** multiple variants target the portfolio-style profile
- **THEN** the variants SHALL be able to differ in layout archetype, density, proof hierarchy, and flow while sharing the same profile vocabulary
