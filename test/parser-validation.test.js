import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, test } from "node:test";

import { parseSpec } from "../src/parser.js";
import { detectSourceInput, loadPackageSource } from "../src/package-source.js";
import { getPackageStatus, validateSource } from "../src/validation.js";

const validSpec = `# Spec: Task Board

## Screen: Dashboard [id="dashboard"]
### Section: Queue [id: queue]
- text#headline: Today's work
- button#openDetails: Review details [action="open-modal:details"]
- action#toSettings: Settings [type="navigate" target="settings"]
#### State: Details modal [id="details" type="modal"]
- text#detailsBody: Full task detail

## Screen: Settings [id: settings]
### Section: Preferences [id="preferences"]
- input#timezone: Time zone [placeholder="America/New_York"]
`;

describe("parseSpec", () => {
  test("parses the v1 source grammar into a deterministic source model", () => {
    const source = parseSpec(validSpec);

    assert.equal(source.title, "Task Board");
    assert.deepEqual(source.screens.map((screen) => screen.id), [
      "dashboard",
      "settings"
    ]);

    const [dashboard] = source.screens;
    assert.equal(dashboard.title, "Dashboard");
    assert.deepEqual(dashboard.sections.map((section) => section.id), ["queue"]);
    assert.deepEqual(dashboard.states.map((state) => state.id), ["details"]);

    const [queue] = dashboard.sections;
    assert.deepEqual(queue.elements.map((element) => element.id), [
      "headline",
      "openDetails"
    ]);
    assert.deepEqual(queue.actions.map((action) => action.id), ["toSettings"]);
    assert.deepEqual(queue.elements[1].action, {
      type: "open-modal",
      target: "details"
    });
    assert.deepEqual(queue.actions[0], {
      id: "toSettings",
      label: "Settings",
      type: "navigate",
      target: "settings",
      line: 7
    });

    assert.deepEqual(dashboard.states[0].items.map((item) => item.id), [
      "detailsBody"
    ]);
    assert.deepEqual(validateSource(source), []);
  });

  test("parses vNext app regions, blocks, nested states, and item order", () => {
    const source = parseSpec(`# Spec: Team Ops [surface="app" adapter="baseline"]

## Screen: Dashboard [id="dashboard" shell="app" kind="dashboard" gap="md"]
### Region: Sidebar [id="sidebar" type="sidebar" gap="md"]
#### Block: Primary nav [id="primaryNav" type="nav" gap="md"]
- nav-item#navDashboard: Dashboard [action="navigate:dashboard"]
### Region: Main [id="mainContent" type="content" gap="md"]
#### Block: Header [id="dashHeader" type="page-header" gap="md"]
- headline#headerTitle: Pipeline health
- action#newTask: New task [type="open-modal" target="newTaskModal"]
#### Block: Metrics [id="metrics" type="metric-row" variant="compact" gap="md"]
- metric#activeDeals: Active deals [value="42" description="Open accounts"]
##### State: New task modal [id="newTaskModal" type="modal"]
- field#taskName: Task name [placeholder="Follow up"]
- button#closeTask: Close [action="close-modal:newTaskModal"]
`);

    assert.equal(source.title, "Team Ops");
    assert.equal(source.surface, "app");
    assert.equal(source.adapter, "baseline");
    assert.equal(source.line, 1);

    const [screen] = source.screens;
    assert.equal(screen.id, "dashboard");
    assert.equal(screen.shell, "app");
    assert.equal(screen.kind, "dashboard");
    assert.equal(screen.line, 3);
    assert.deepEqual(screen.regions.map((region) => region.id), [
      "sidebar",
      "mainContent"
    ]);

    const [sidebar, main] = screen.regions;
    assert.equal(sidebar.line, 4);
    assert.deepEqual(sidebar.blocks.map((block) => block.id), ["primaryNav"]);
    assert.equal(sidebar.blocks[0].line, 5);
    assert.deepEqual(sidebar.blocks[0].items.map((item) => item.id), [
      "navDashboard"
    ]);
    assert.equal(sidebar.blocks[0].items[0].line, 6);

    assert.deepEqual(main.blocks.map((block) => block.id), [
      "dashHeader",
      "metrics"
    ]);
    assert.deepEqual(main.blocks[0].actions.map((action) => action.id), [
      "newTask"
    ]);
    assert.equal(main.blocks[0].actions[0].line, 10);
    assert.deepEqual(main.blocks[1].states.map((state) => state.id), [
      "newTaskModal"
    ]);
    assert.equal(main.blocks[1].states[0].line, 13);
    assert.deepEqual(main.blocks[1].states[0].items.map((item) => item.id), [
      "taskName",
      "closeTask"
    ]);
    assert.deepEqual(validateSource(source), []);
  });

  test("parses and validates a bounded marketing landing page", () => {
    const source = parseSpec(`# Spec: Launch Site [surface="marketing" adapter="baseline"]

## Screen: Landing [id="landing" shell="marketing" kind="landing" gap="md"]
### Region: Navbar [id="siteNav" type="navbar" gap="md"]
#### Block: Navbar [id="navbarBlock" type="navbar" gap="md"]
- nav-item#featuresNav: Features [href="#features"]
- button#signupNav: Sign up [action="navigate:signup"]
### Region: Main [id="main" type="main" gap="md"]
#### Block: Hero [id="hero" type="hero" variant="split" gap="md"]
- headline#heroHeadline: Plan products faster
- subhead#heroSubhead: Turn structured specs into reviewable prototypes.
#### Block: Pricing [id="pricing" type="pricing" gap="md"]
- pricing-tier#proTier: Pro [price="$29"]
- faq-item#pricingFaq: Can I export HTML? [answer="Yes"]
### Region: Footer [id="footerRegion" type="footer" gap="md"]
#### Block: Footer [id="footerBlock" type="footer" gap="md"]
- text#copyright: Copyright 2026

## Screen: Signup [id="signup" shell="marketing" kind="signup" gap="md"]
### Region: Main [id="signupMain" type="main" gap="md"]
#### Block: Signup form [id="signupForm" type="signup-form" gap="md"]
- field#email: Work email [placeholder="you@example.com"]
`);

    assert.deepEqual(
      source.screens[0].regions[1].blocks.map((block) => block.type),
      ["hero", "pricing"]
    );
    assert.deepEqual(validateSource(source), []);
  });
});

describe("validateSource", () => {
  test("reports explicit errors for malformed structure and references", () => {
    const source = parseSpec(`Intro prose

### Section: Orphan [id="orphan-section"]
- button#orphanButton: Orphan [action="navigate:missing"]
## Screen: Home [id="home"]
### Section: Main [id="main"]
- chart#badChart: Unsupported chart
- text#duplicate: First
- text#duplicate: Second
- button#missingTarget: Missing target [action="navigate"]
- button#badAction: Bad action [action="launch:home"]
- button#badNav: Bad nav [action="navigate:settings"]
- button#badState: Bad state [action="open-modal:not-a-state"]
- action#badExplicit: Explicit bad [type="show-state" target="ghost"]
#### State: Mystery [id="mystery" type="floating"]
- card#stateCard: State card
<div>raw html</div>
`);

    const codes = validateSource(source).map((error) => error.code);

    assert.deepEqual(codes, [
      "missing_spec_title",
      "unrecognized_structure",
      "section_outside_screen",
      "element_outside_section_or_state",
      "unsupported_element_type",
      "duplicate_id",
      "missing_action_target",
      "invalid_action_type",
      "invalid_navigation_target",
      "invalid_state_target",
      "invalid_state_target",
      "unsupported_state_type",
      "raw_html"
    ]);
  });

  test("reports no screens and rejects duplicate ids across the full spec", () => {
    const source = parseSpec(`# Spec: Empty

## Screen: One [id="same"]
### Section: Duplicate Screen Id [id="same"]
- text#same: Duplicate element id
`);

    assert.deepEqual(validateSource(parseSpec("# Spec: Empty")), [
      {
        code: "no_screens",
        message: "Spec must include at least one screen.",
        line: 1
      }
    ]);

    assert.deepEqual(
      validateSource(source).filter((error) => error.code === "duplicate_id"),
      [
        {
          code: "duplicate_id",
          message: 'Duplicate id "same".',
          line: 4
        },
        {
          code: "duplicate_id",
          message: 'Duplicate id "same".',
          line: 5
        }
      ]
    );
  });

  test("requires stable ids for structural nodes", () => {
    const source = parseSpec(`# Spec: Missing IDs

## Screen: Home
### Section: Main
- text: Missing element id
- text#copy: Copy
- action#next: Next [type="navigate"]
#### State: Modal [type="modal"]
- text#modalCopy: Modal copy
`);

    assert.deepEqual(
      validateSource(source).map((error) => error.code),
      [
        "unrecognized_structure",
        "missing_screen_id",
        "missing_section_id",
        "missing_action_target",
        "missing_state_id"
      ]
    );
  });

  test("treats action lines inside states as unsupported elements", () => {
    const source = parseSpec(`# Spec: State Actions

## Screen: Home [id="home"]
#### State: Loading [id="loading" type="loading"]
- action#retry: Retry [type="navigate" target="home"]
`);

    assert.deepEqual(validateSource(source), [
      {
        code: "unsupported_element_type",
        message: 'Unsupported element type "action".',
        line: 5
      }
    ]);
  });

  test("rejects unsupported adapters and raw implementation details", () => {
    const source = parseSpec(`# Spec: Bad Details [surface="app" adapter="shadcn"]

## Screen: Home [id="home" shell="app" kind="dashboard" gap="md"]
### Region: Main [id="main" type="content" gap="md"]
#### Block: Header [id="header" type="page-header" gap="md"]
- button#styled: Save [class="bg-blue-500" component="Button"]
<script>alert("nope")</script>
`);

    assert.deepEqual(validateSource(source).map((error) => error.code), [
      "implementation_detail",
      "unsupported_adapter",
      "raw_html"
    ]);
  });

  test("rejects invalid semantic nesting and unknown semantic values", () => {
    const source = parseSpec(`# Spec: Bad Semantics [surface="desktop" adapter="baseline"]

## Screen: Home [id="home" shell="app" kind="landing" gap="md"]
### Region: Marketing nav [id="marketingNav" type="navbar" gap="md"]
#### Block: Hero [id="hero" type="hero" variant="cinematic" gap="md"]
- chart#badChart: Unsupported chart
- button#badAction: Bad action [action="launch:home"]
##### State: Popover [id="popover" type="popover"]
- text#popoverCopy: Popover copy

## Screen: Bad Shell [id="badShell" shell="mobile" kind="unknown" gap="md"]
`);

    assert.deepEqual(validateSource(source).map((error) => error.code), [
      "unsupported_surface",
      "invalid_screen_kind",
      "invalid_semantic_nesting",
      "unsupported_block_variant",
      "invalid_semantic_nesting",
      "unsupported_item_type",
      "invalid_action_type",
      "unsupported_state_type",
      "unsupported_shell",
      "unsupported_screen_kind"
    ]);
  });

  test("requires bounded gap values on vNext layout structures", () => {
    const missing = parseSpec(`# Spec: Missing Gaps [surface="app" adapter="baseline"]

## Screen: Dashboard [id="dashboard" shell="app" kind="dashboard"]
### Region: Main [id="main" type="content"]
#### Block: Header [id="header" type="page-header"]
- text#copy: Missing layout gaps
`);

    assert.deepEqual(validateSource(missing).map((error) => error.code), [
      "missing_screen_gap",
      "missing_region_gap",
      "missing_block_gap"
    ]);

    const unsupported = parseSpec(`# Spec: Bad Gap [surface="app" adapter="baseline"]

## Screen: Dashboard [id="dashboard" shell="app" kind="dashboard" gap="huge"]
### Region: Main [id="main" type="content" gap="md"]
#### Block: Header [id="header" type="page-header" gap="xs"]
- text#copy: Unsupported screen gap
`);

    assert.deepEqual(validateSource(unsupported).map((error) => error.code), [
      "unsupported_gap"
    ]);
  });

  test("reports parser errors for illegal vNext nesting with source lines", () => {
    const source = parseSpec(`# Spec: Bad Nesting

### Region: Orphan region [id="orphanRegion" type="content" gap="md"]
#### Block: Orphan block [id="orphanBlock" type="page-header" gap="md"]
##### State: Orphan state [id="orphanState" type="modal"]
- text#orphanText: Orphan text
`);

    assert.deepEqual(source.errors, [
      {
        code: "region_outside_screen",
        message: "Region must be declared inside a screen.",
        line: 3
      },
      {
        code: "block_outside_region_or_section",
        message: "Block must be declared inside a region or legacy section.",
        line: 4
      },
      {
        code: "state_outside_block",
        message: "Nested block state must be declared inside a block.",
        line: 5
      },
      {
        code: "element_outside_section_or_state",
        message: "Element must be declared inside a block, section, or state.",
        line: 6
      }
    ]);
  });

  test("validates current vNext fixture files from the grammar lane", () => {
    const fixturePaths = [
      "fixtures/valid/saas-dashboard.md",
      "fixtures/valid/saas-settings.md",
      "fixtures/valid/marketing-landing.md"
    ];

    for (const fixturePath of fixturePaths) {
      const source = parseSpec(readFileSync(fixturePath, "utf8"));
      assert.deepEqual(validateSource(source), [], fixturePath);
    }
  });

  test("rejects current invalid vNext fixture files from the grammar lane", () => {
    const expectedCodesByFixture = {
      "fixtures/invalid/unsupported-adapter.md": ["unsupported_adapter"],
      "fixtures/invalid/raw-implementation-detail.md": [
        "implementation_detail",
        "implementation_detail",
        "raw_html"
      ],
      "fixtures/invalid/invalid-semantic-nesting.md": [
        "invalid_semantic_nesting"
      ],
      "fixtures/invalid/unknown-semantic-type.md": [
        "unsupported_block_type",
        "unsupported_item_type"
      ]
    };

    for (const [fixturePath, expectedCodes] of Object.entries(expectedCodesByFixture)) {
      const source = parseSpec(readFileSync(fixturePath, "utf8"));
      assert.deepEqual(
        validateSource(source).map((error) => error.code),
        expectedCodes,
        fixturePath
      );
    }
  });

  test("regresses current foundation fixtures through parser and validation", () => {
    const fixturePaths = [
      "fixtures/valid/minimal.md",
      "fixtures/valid/states.md",
      "fixtures/valid/task-board.md"
    ];

    for (const fixturePath of fixturePaths) {
      const source = parseSpec(readFileSync(fixturePath, "utf8"));
      assert.deepEqual(validateSource(source), [], fixturePath);
    }
  });
});

describe("prototype package parsing and validation", () => {
  test("detects package inputs and preserves package role source metadata", () => {
    const packageDir = writePackage({
      "prototype.md": `# Prototype: Revenue Workspace [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

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
- nav-item#navPipeline: Pipeline [action="navigate:pipeline-review"]
### Region: Main [id="main" type="content" gap="md"]
#### Block: Metrics [id="metrics" type="metric-row" gap="md" content="opportunity-rows"]
- metric#pipelineValue: Pipeline [value="$123k"]

## Screen: Pipeline Review [id="pipeline-review" shell="app" kind="list" gap="md"]
### Region: Main [id="pipeline-main" type="content" gap="md"]
#### Block: Forecast [id="forecast" type="data-table" gap="md"]
- action#openForecast: Open forecast [type="open-modal" target="forecast-modal"]
##### State: Forecast Modal [id="forecast-modal" type="modal"]
- text#forecastCopy: Review commit movement
`,
      "flows.md": `## Flow: Primary Review [id="primary-review" start="dashboard"]
- Step: Open Pipeline [from="dashboard" action="navigate:pipeline-review" to="pipeline-review"]
- Step: Open Forecast Modal [from="pipeline-review" action="open-modal:forecast-modal" to="forecast-modal"]
`,
      "content.md": `## Content: Opportunity Rows [id="opportunity-rows" type="table-rows"]
- Row: Acme Expansion [stage="Commit" owner="Rae" value="$82k"]
- Row: Northwind Pilot [stage="Best Case" owner="Ira" value="$41k"]
`,
      "layout.md": `## Layout: Dashboard Density [target="screen:dashboard"]
- Control: gap [value="md"]
- Control: padding [value="md"]
- Control: density [value="compact"]
- Control: width [value="wide"]
- Control: align [value="start"]
- Control: columns [value="2"]
- Control: collapse [value="stack" at="tablet"]
- Control: text [value="wrap"]
- Control: overflow [value="contain"]
`,
      "tokens.md": `## Tokens: Theme [id="default-theme"]
- Tone: brand [value="blue"]
- Radius: controls [value="sm"]
- Density: interface [value="compact"]
- Treatment: cards [value="outlined"]
`,
      "acceptance.md": `## Acceptance
- Invariant: Stable navigation labels [target="block:primary-nav"]
- Invariant: Single modal stack [target="screen:*"]
- Invariant: Reachable flow [target="flow:primary-review"]
- Note: Long account names must wrap inside cards without spilling.
`
    });

    try {
      assert.equal(detectSourceInput(packageDir).sourceMode, "package");
      assert.equal(
        detectSourceInput(path.join(packageDir, "prototype.md")).sourceMode,
        "package"
      );
      assert.equal(
        detectSourceInput(path.join(packageDir, "screens.md")).sourceMode,
        "single-file"
      );

      const source = loadPackageSource(packageDir);
      assert.equal(source.sourceMode, "package");
      assert.equal(source.title, "Revenue Workspace");
      assert.equal(source.adapter, "bootstrap-html");
      assert.deepEqual(source.package.includes.map((include) => include.role), [
        "screens",
        "flows",
        "content",
        "layout",
        "tokens",
        "acceptance"
      ]);

      assert.equal(source.screens[0].sourceFile, "screens.md");
      assert.equal(source.screens[0].sourceRole, "screens");
      assert.equal(source.screens[0].sourceLine, 1);
      assert.equal(source.flows[0].steps[1].sourceFile, "flows.md");
      assert.equal(source.contentRecords[0].records[0].sourceRole, "content");
      assert.equal(source.layout[0].controls[0].sourceRole, "layout");
      assert.equal(source.tokens[0].controls[0].sourceRole, "tokens");
      assert.equal(source.acceptance.invariants[0].sourceRole, "acceptance");

      assert.deepEqual(validateSource(source), []);
      assert.deepEqual(getPackageStatus(source), {
        sourceMode: "package",
        title: "Revenue Workspace",
        manifestPath: path.join(packageDir, "prototype.md"),
        adapter: "bootstrap-html",
        fidelity: "prototype",
        includedFiles: [
          includeStatus("screens.md", "screens", true, "parsed", 4),
          includeStatus("flows.md", "flows", true, "parsed", 5),
          includeStatus("content.md", "content", true, "parsed", 6),
          includeStatus("layout.md", "layout", true, "parsed", 7),
          includeStatus("tokens.md", "tokens", false, "parsed", 8),
          includeStatus("acceptance.md", "acceptance", true, "parsed", 9)
        ],
        missingIncludes: [],
        validationErrors: [],
        acceptanceInvariantCount: 3,
        readiness: "ready"
      });
    } finally {
      rmSync(packageDir, { recursive: true, force: true });
    }
  });

  test("reports stable package validation codes and blocked status", () => {
    const packageDir = writePackage({
      "prototype.md": `# Prototype: Broken [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype" assetProvenance="cdn"]

Includes:
- screens.md [role="screens" required="true"]
- missing.md [role="content" required="true"]
- ../outside.md [role="layout" required="true"]
- mystery.md [role="mystery" required="true"]
- flows.md [role="flows" required="true"]
- content.md [role="content" required="true"]
- layout.md [role="layout" required="true"]
- tokens.md [role="tokens" required="true"]
- acceptance.md [role="acceptance" required="true"]
`,
      "screens.md": `## Screen: Dashboard [id="dashboard" shell="app" kind="dashboard" gap="md"]
### Region: Main [id="main" type="content" gap="md"]
#### Block: Metrics [id="metrics" type="metric-row" gap="md" content="missing-content"]
- metric#pipelineValue: Pipeline [value="$123k"]
`,
      "mystery.md": "## Mystery\n",
      "flows.md": `## Flow: Missing Path [id="missing-path" start="dashboard"]
- Step: Missing target [from="dashboard" action="navigate:not-a-screen" to="not-a-screen"]
`,
      "content.md": `## Content: Duplicate Dashboard [id="dashboard" type="table-rows"]
- Row: Acme [stage="Commit"]
`,
      "layout.md": `## Layout: Missing Target [target="block:not-found"]
- Control: density [value="tiny"]
`,
      "tokens.md": `## Tokens: Theme [id="theme"]
- Tone: brand [value="#0055ff"]
`,
      "acceptance.md": `## Acceptance
- Invariant: Missing flow [target="flow:not-found"]
`
    });

    try {
      const source = loadPackageSource(packageDir);
      const codes = validateSource(source).map((error) => error.code);

      assert.ok(codes.includes("missing_package_include"));
      assert.ok(codes.includes("package_include_outside_root"));
      assert.ok(codes.includes("unsupported_package_role"));
      assert.ok(codes.includes("duplicate_package_id"));
      assert.ok(codes.includes("unresolved_content_reference"));
      assert.ok(codes.includes("unresolved_layout_target"));
      assert.ok(codes.includes("unresolved_flow_target"));
      assert.ok(codes.includes("unsupported_layout_control"));
      assert.ok(codes.includes("unsupported_token_control"));
      assert.ok(codes.includes("adapter_asset_provenance_unknown"));

      const status = getPackageStatus(source);
      assert.equal(status.readiness, "blocked");
      assert.equal(status.acceptanceInvariantCount, 1);
      assert.deepEqual(status.missingIncludes, ["missing.md"]);
    } finally {
      rmSync(packageDir, { recursive: true, force: true });
    }
  });

  test("reports missing manifests for package directories", () => {
    const packageDir = mkdtempSync(path.join(tmpdir(), "spec-ui-package-"));

    try {
      const source = loadPackageSource(packageDir);
      const errors = validateSource(source);

      assert.equal(source.sourceMode, "package");
      assert.equal(errors[0].code, "missing_package_manifest");
      assert.equal(getPackageStatus(source).readiness, "invalid");
    } finally {
      rmSync(packageDir, { recursive: true, force: true });
    }
  });
});

function writePackage(files) {
  const packageDir = mkdtempSync(path.join(tmpdir(), "spec-ui-package-"));

  for (const [filePath, content] of Object.entries(files)) {
    writeFileSync(path.join(packageDir, filePath), content);
  }

  return packageDir;
}

function includeStatus(filePath, role, required, parseStatus, line) {
  return {
    path: filePath,
    role,
    required,
    exists: true,
    parseStatus,
    sourceFile: "prototype.md",
    line
  };
}
