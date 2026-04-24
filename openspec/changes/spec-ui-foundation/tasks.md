## 1. Project Foundation

- [x] 1.1 Choose the initial implementation stack and repository layout for the Spec UI compiler, renderer, examples, and tests
- [x] 1.2 Add package metadata, developer scripts, and baseline lint/type/test tooling for repeatable local development
- [x] 1.3 Define where generated artifacts, inspectable IR output, fixtures, and golden outputs will live

## 2. Structured Markdown Grammar

- [x] 2.1 Define the v1 markdown grammar for screens, sections, elements, actions, states, and transitions
- [x] 2.2 Document supported syntax, unsupported constructs, and deterministic fallback behavior for incomplete specs
- [x] 2.3 Add canonical valid and invalid markdown fixture specs that exercise the v1 grammar

## 3. Parser and Validation

- [x] 3.1 Implement structured markdown parsing into a source-level syntax model
- [x] 3.2 Implement validation errors for missing required structure, unsupported constructs, duplicate identifiers, and invalid references
- [x] 3.3 Add parser and validation tests covering valid fixtures, invalid fixtures, and clear error output

## 4. Intermediate Representation

- [x] 4.1 Define the typed IR schema for screens, sections, elements, actions, states, transitions, and metadata
- [x] 4.2 Implement markdown-to-IR compilation using the validated source model
- [x] 4.3 Add IR snapshot tests to prove the same source spec produces the same IR
- [x] 4.4 Provide an inspectable IR/JSON output path for debugging and downstream tooling

## 5. Deterministic HTML Renderer

- [x] 5.1 Implement deterministic HTML generation from the IR without reinterpreting markdown prose at render time
- [x] 5.2 Implement the bounded interaction vocabulary for navigation, modal open/close, tab switching, toggle reveal, and common states
- [x] 5.3 Ensure generated markup, script behavior, asset references, IDs, and ordering are stable for unchanged input
- [x] 5.4 Add golden HTML tests and repeat-render tests for deterministic structure and behavior

## 6. Portable HTML Handoff

- [x] 6.1 Emit generated prototypes as portable HTML artifacts that can be opened directly in a standards-based browser
- [x] 6.2 Return artifact location, generation metadata, and validation failure details for downstream viewer or orchestration layers
- [x] 6.3 Verify generated HTML can be opened through Micro Canvas without making Micro Canvas responsible for compilation semantics
- [x] 6.4 Document the viewer-agnostic handoff contract for browsers, Micro Canvas, and other compatible viewers

## 7. Developer Experience and Examples

- [x] 7.1 Add a CLI or script entry point that compiles a markdown spec into HTML and optional IR/JSON
- [x] 7.2 Add canonical example specs with generated prototype outputs for review
- [x] 7.3 Update the README with the product scope, compile flow, artifact handoff model, and current limitations

## 8. Verification

- [x] 8.1 Run strict OpenSpec validation for the foundation change
- [x] 8.2 Run the project test, type, and lint checks once tooling exists
- [x] 8.3 Manually inspect at least one generated prototype in a browser and one additional viewer path
