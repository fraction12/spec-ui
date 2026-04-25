export const TEMPLATE_FILE_NAMES = Object.freeze([
  "prototype.md",
  "screens.md",
  "flows.md",
  "content.md",
  "layout.md",
  "tokens.md",
  "acceptance.md"
]);

export const DEFAULT_CONFIG = Object.freeze({
  schemaVersion: 1,
  defaultAdapter: "bootstrap-html",
  defaultTarget: "standalone-html",
  prototypesDir: "prototypes",
  artifactsDir: "artifacts",
  requiredRoles: ["screens", "flows", "content", "layout", "acceptance"],
  optionalRoles: ["tokens"]
});

export function defaultConfigJson() {
  return `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`;
}

export const INSTRUCTIONS_MD = `# Spec UI Instructions

- Edit package source files, not generated HTML.
- Put UAT feedback, acceptance risks, and review notes in acceptance.md.
- Use the configured default adapter unless the user asks otherwise.
- Compile accepted prototypes to the configured artifacts directory.
- Keep handoff HTML standalone, deterministic, and portable.
- Keep prototype source in visible project directories such as prototypes/.
`;

export const TEMPLATES = Object.freeze({
  "prototype.md": `# Prototype: Prototype Name [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

Includes:
- screens.md [role="screens" required="true"]
- flows.md [role="flows" required="true"]
- content.md [role="content" required="true"]
- layout.md [role="layout" required="true"]
- tokens.md [role="tokens" required="false"]
- acceptance.md [role="acceptance" required="true"]
`,

  "screens.md": `## Screen: Dashboard [id="dashboard" shell="app" kind="dashboard" gap="md"]

### Region: Sidebar [id="sidebar" type="sidebar" gap="md"]
#### Block: Navigation [id="primary-nav" type="nav" gap="sm"]
- nav-item#nav-dashboard: Dashboard [action="navigate:dashboard"]

### Region: Content [id="main-content" type="content" gap="md"]
#### Block: Page Header [id="page-header" type="page-header" gap="sm"]
- text#headline: Prototype heading
- button#open-details: Review details [action="open-modal:details-modal"]

#### Block: Summary [id="summary-card" type="detail-panel" gap="md" content="summary-copy"]

##### State: Details Modal [id="details-modal" type="modal"]
- text#details-copy: Add the review details here.
- button#close-details: Close [action="close-modal:details-modal"]
`,

  "flows.md": `## Flow: Primary Review [id="primary-review" start="dashboard"]
- Step: Open Details [from="dashboard" action="open-modal:details-modal" to="details-modal"]
- Step: Close Details [from="details-modal" action="close-modal:details-modal" to="dashboard"]
`,

  "content.md": `## Content: Summary Copy [id="summary-copy" type="copy"]
- Text: Replace this with the core prototype message.
- Badge: Draft [tone="info"]
`,

  "layout.md": `## Layout: Dashboard Content [target="region:main-content"]
- Control: gap [value="md"]
- Control: padding [value="md"]
- Control: width [value="wide"]
- Control: collapse [value="stack" at="tablet"]
- Control: text [value="wrap"]
- Control: overflow [value="contain"]

## Layout: Summary Card [target="block:summary-card"]
- Control: gap [value="sm"]
- Control: align [value="start"]
`,

  "tokens.md": `## Tokens: Prototype Theme [id="prototype-theme"]
- Tone: brand [value="blue"]
- Tone: info [value="teal"]
- Radius: controls [value="sm"]
- Density: interface [value="comfortable"]
- Treatment: cards [value="outlined"]
`,

  "acceptance.md": `## Acceptance
- Invariant: Stable navigation labels [target="block:primary-nav"]
- Invariant: Reachable flow [target="flow:primary-review"]
- Invariant: Single modal stack [target="screen:*"]
- Invariant: Overflow containment [target="region:main-content"]
- Note: Add UAT notes that affect source files or acceptance decisions.
`
});

export const STARTER_PACKAGE = Object.freeze({
  "prototype.md": `# Prototype: Starter Prototype [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

Includes:
- screens.md [role="screens" required="true"]
- flows.md [role="flows" required="true"]
- content.md [role="content" required="true"]
- layout.md [role="layout" required="true"]
- tokens.md [role="tokens" required="false"]
- acceptance.md [role="acceptance" required="true"]
`,

  "screens.md": `## Screen: Dashboard [id="dashboard" shell="app" kind="dashboard" gap="md"]

### Region: Sidebar [id="sidebar" type="sidebar" gap="md"]
#### Block: Primary Navigation [id="primary-nav" type="nav" gap="sm"]
- nav-item#nav-dashboard: Dashboard [action="navigate:dashboard"]

### Region: Content [id="main-content" type="content" gap="md"]
#### Block: Page Header [id="page-header" type="page-header" gap="sm"]
- text#dashboard-title: Starter prototype
- button#open-review: Open review [action="open-modal:review-modal"]

#### Block: Summary Panel [id="summary-panel" type="detail-panel" gap="md" content="summary-copy"]
- button#show-summary: Show summary [action="show-state:summary-state"]

##### State: Summary State [id="summary-state" type="revealed"]
- text#summary-state-copy: Summary details are visible.

##### State: Review Modal [id="review-modal" type="modal"]
- text#review-copy: Confirm the starter flow.
- button#close-review: Close review [action="close-modal:review-modal"]
`,

  "flows.md": `## Flow: Primary Review [id="primary-review" start="dashboard"]
- Step: Open Review [from="dashboard" action="open-modal:review-modal" to="review-modal"]
- Step: Close Review [from="review-modal" action="close-modal:review-modal" to="dashboard"]
- Step: Reveal Summary [from="dashboard" action="show-state:summary-state" to="summary-state"]
`,

  "content.md": `## Content: Summary Copy [id="summary-copy" type="copy"]
- Text: This starter package keeps source files visible and reviewable.
- Badge: Ready for iteration [tone="success"]
`,

  "layout.md": `## Layout: Dashboard Content [target="region:main-content"]
- Control: density [value="comfortable"]
- Control: padding [value="md"]
- Control: gap [value="md"]
- Control: width [value="wide"]
- Control: collapse [value="stack" at="tablet"]
- Control: text [value="wrap"]
- Control: overflow [value="contain"]

## Layout: Summary Panel [target="block:summary-panel"]
- Control: gap [value="sm"]
- Control: align [value="start"]
`,

  "tokens.md": `## Tokens: Starter Theme [id="starter-theme"]
- Tone: brand [value="blue"]
- Tone: success [value="green"]
- Radius: controls [value="sm"]
- Density: interface [value="comfortable"]
- Treatment: cards [value="outlined"]
`,

  "acceptance.md": `## Acceptance
- Invariant: Stable navigation labels [target="block:primary-nav"]
- Invariant: Reachable flow [target="flow:primary-review"]
- Invariant: Single modal stack [target="screen:*"]
- Invariant: Overflow containment [target="region:main-content"]
- Note: Keep generated HTML out of source edits.
`
});
