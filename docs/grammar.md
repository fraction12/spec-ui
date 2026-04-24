# Spec UI V1 Grammar

Spec UI V1 compiles constrained markdown into a validated intermediate representation, then into deterministic portable HTML. The markdown is the human-authored source format, but the validated IR is the rendering contract.

Raw HTML is unsupported as canonical structure. Specs that rely on raw HTML for screens, sections, elements, actions, states, or layout intent are invalid.

## Document Shape

The first non-empty heading MUST be the document title:

```markdown
# Spec: <title>
```

The title is required and MUST be non-empty.

Top-level prose before the first heading is ignored only if it is blank whitespace. Any non-empty content before `# Spec: <title>` is invalid.

## Screens

Screens are second-level headings:

```markdown
## Screen: <title> [id="screen-id"]
## Screen: <title> [id: screen-id]
```

Each screen requires a non-empty title and a stable `id`. The two attribute forms are equivalent. Screen IDs are unique across the document and are the targets for `navigate` actions.

## Sections

Sections are third-level headings inside screens:

```markdown
### Section: <title> [id="section-id"]
### Section: <title> [id: section-id]
```

Each section requires a non-empty title and a stable `id`. Section IDs are unique across the document. Elements and explicit actions are declared as list items inside a section.

## Elements

Elements are list items inside sections or states:

```markdown
- <type>#<id>: <label> [key="value" action="action-type:target"]
```

Supported element types:

- `text`
- `button`
- `input`
- `field`
- `list`
- `card`
- `badge`
- `empty`
- `loading`
- `success`
- `error`

Each element requires a supported type, a stable `id`, and a non-empty label. Element IDs are unique across the document.

Attributes are optional. Attribute order is preserved in parsing but MUST NOT change rendering semantics. Attribute keys use lowercase kebab-case or snake_case. Attribute values are quoted unless the bracket form explicitly defines an ID, as in `[id: screen-id]`.

The shorthand `action` attribute is allowed on elements:

```markdown
- button#new-task: New task [action="open-modal:new-task-modal"]
```

The value is `<supported-action>:<target>`. The target meaning depends on the action type.

## Explicit Actions

Explicit actions are list items inside sections:

```markdown
- action#<id>: <label> [type="navigate" target="screen-id"]
```

Explicit actions require an `id`, non-empty label, supported `type`, and any required `target`. They are useful when the interaction is part of the flow model but should not be rendered as a semantic UI element type.

## States

States are fourth-level headings inside screens:

```markdown
#### State: <label> [id="state-id" type="modal"]
```

States require a non-empty label, stable `id`, and supported `type`. State IDs are unique across the document. State bodies use the same element grammar as sections.

Supported state types:

- `default`
- `loading`
- `empty`
- `success`
- `error`
- `modal`
- `tab`
- `revealed`

## Actions

Supported action types:

- `navigate`
- `open-modal`
- `close-modal`
- `toggle`
- `show-state`
- `set-tab`

Action target rules:

- `navigate` targets a screen ID.
- `open-modal` targets a modal state ID.
- `close-modal` targets a modal state ID.
- `toggle` targets a revealed state ID or element ID.
- `show-state` targets a state ID.
- `set-tab` targets a tab state ID.

Invalid or unresolved action targets fail validation. The compiler does not invent missing screens, states, or elements.

## Deterministic Fallbacks

Spec UI favors validation errors over guessing. V1 fallbacks are intentionally narrow:

- Missing optional attributes compile as absent metadata.
- Missing optional action attributes compile as non-interactive elements.
- Empty sections compile as present but empty sections.
- Empty states compile as present states with no child elements.

The following are invalid:

- Missing `# Spec: <title>` as the first non-empty heading.
- Screens, sections, states, elements, or actions without required IDs.
- Duplicate IDs anywhere in the spec.
- Unsupported heading levels used as canonical structure.
- Unsupported element, action, or state types.
- Unresolved action targets.
- Raw HTML used as canonical UI structure.
- Freeform prose used as the only source of screen, section, element, action, or state meaning.

## Minimal Valid Spec

```markdown
# Spec: Minimal

## Screen: Home [id="home"]

### Section: Main [id="main"]
- text#welcome: Welcome
- button#continue: Continue [action="navigate:details"]

## Screen: Details [id="details"]

### Section: Summary [id: summary]
- text#done: Details screen
```
