import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test } from "node:test";

import {
  compilePackageToIr,
  compileSourceToIr,
  compileToIr,
  CompilationError,
  getPackageStatus,
  serializeIr
} from "../src/compiler.js";
import { createHandoffResult } from "../src/handoff.js";
import { IR_SCHEMA } from "../src/ir-schema.js";
import { SPEC_UI_VERSION } from "../src/contracts.js";

const validSpec = `# Spec: Task Board

## Screen: Dashboard [id="dashboard"]
### Section: Queue [id: queue]
- text#headline: Today's work
- button#openDetails: Review details [action="open-modal:details"]
- action#toSettings: Settings [type="navigate" target="settings"]
#### State: Details modal [id="details" type="modal"]
- text#detailsBody: Full task detail
- button#closeDetails: Close details [action="close-modal:details"]

## Screen: Settings [id: settings]
### Section: Preferences [id="preferences"]
- input#timezone: Time zone [placeholder="America/New_York"]
`;

const sourceHash = (markdown) =>
  createHash("sha256").update(markdown).digest("hex");

const baselineMetadata = {
  adapter: {
    target: "baseline",
    version: SPEC_UI_VERSION,
    resolvedTarget: "baseline"
  },
  resolvedLibrary: {
    name: "spec-ui-baseline",
    version: SPEC_UI_VERSION
  },
  assetProvenance: {
    mode: "inline",
    source: "spec-ui-render-html"
  }
};

const saasMarkdown = `# Spec: SaaS Ops [surface="app" adapter="baseline"]`;
const saasSource = {
  title: "SaaS Ops",
  line: 1,
  attrs: {
    surface: "app",
    adapter: "baseline"
  },
  screens: [
    {
      id: "dashboard",
      title: "Dashboard",
      shell: "app",
      kind: "dashboard",
      regions: [
        {
          id: "sidebar",
          title: "Sidebar",
          type: "sidebar",
          blocks: [
            {
              id: "mainNav",
              title: "Main nav",
              type: "nav",
              items: [
                {
                  id: "navDashboard",
                  type: "nav-item",
                  label: "Dashboard",
                  attrs: {
                    href: "#dashboard",
                    action: "navigate:dashboard"
                  }
                }
              ]
            }
          ]
        },
        {
          id: "content",
          title: "Content",
          type: "content",
          blocks: [
            {
              id: "metrics",
              title: "Metrics",
              type: "metric-row",
              variant: "compact",
              items: [
                {
                  id: "openDeals",
                  type: "metric",
                  label: "Open deals",
                  props: {
                    value: "42",
                    tone: "positive"
                  }
                }
              ]
            },
            {
              id: "pipeline",
              title: "Pipeline",
              type: "data-table",
              items: [
                {
                  id: "companyColumn",
                  type: "column",
                  label: "Company"
                },
                {
                  id: "acmeRow",
                  type: "row",
                  label: "Acme",
                  attrs: {
                    status: "review",
                    action: "open-modal:dealDetails"
                  }
                }
              ],
              states: [
                {
                  id: "dealDetails",
                  type: "modal",
                  label: "Deal details",
                  items: [
                    {
                      id: "dealBody",
                      type: "text",
                      label: "ACME is ready for review."
                    },
                    {
                      id: "closeDealDetails",
                      type: "button",
                      label: "Close",
                      attrs: {
                        action: "close-modal:dealDetails"
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const marketingMarkdown = `# Spec: Launch Site [surface="marketing" adapter="baseline"]`;
const marketingSource = {
  title: "Launch Site",
  line: 1,
  attrs: {
    surface: "marketing",
    adapter: "baseline"
  },
  screens: [
    {
      id: "landing",
      title: "Landing",
      shell: "marketing",
      kind: "landing",
      regions: [
        {
          id: "main",
          title: "Main",
          type: "main",
          blocks: [
            {
              id: "hero",
              title: "Hero",
              type: "hero",
              items: [
                {
                  id: "headline",
                  type: "headline",
                  label: "Ship decision-grade prototypes"
                },
                {
                  id: "primaryCta",
                  type: "button",
                  label: "Start now",
                  attrs: {
                    action: "navigate:signup",
                    tone: "primary"
                  }
                }
              ]
            },
            {
              id: "pricing",
              title: "Pricing",
              type: "pricing",
              items: [
                {
                  id: "proTier",
                  type: "pricing-tier",
                  label: "Pro",
                  attrs: {
                    featured: "true",
                    price: "$29"
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "signup",
      title: "Signup",
      shell: "marketing",
      kind: "signup",
      regions: []
    }
  ]
};

const packageInput = {
  manifestPath: "/tmp/revenue-workspace/prototype.md",
  packageRoot: "/tmp/revenue-workspace",
  manifestMarkdown: `# Prototype: Revenue Workspace [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

Includes:
- screens.md [role="screens" required="true"]
- flows.md [role="flows" required="true"]
- content.md [role="content" required="true"]
- layout.md [role="layout" required="true"]
- tokens.md [role="tokens" required="true"]
- acceptance.md [role="acceptance" required="true"]
`,
  files: [
    {
      path: "screens.md",
      contents: `## Screen: Executive Dashboard [id="executive-dashboard" shell="app" kind="dashboard" gap="md"]
### Region: Workspace [id="workspace" type="content" gap="md"]
#### Block: Pipeline [id="pipeline" type="data-table" gap="md" content="opportunity-rows"]
- column#accountColumn: Account
- column#stageColumn: Stage
##### State: Forecast Modal [id="forecast-modal" type="modal"]
- text#forecastBody: Forecast details stay readable.
`
    },
    {
      path: "flows.md",
      contents: `## Flow: Primary Review [id="primary-review" start="executive-dashboard"]
- Step: Open Forecast [from="executive-dashboard" action="open-modal:forecast-modal" to="forecast-modal"]
`
    },
    {
      path: "content.md",
      contents: `## Content: Opportunity Rows [id="opportunity-rows" type="table-rows"]
- Row: Acme Expansion [accountColumn="Acme" stageColumn="Commit" value="$82k"]
- Row: Northwind Pilot [accountColumn="Northwind" stageColumn="Best Case" value="$41k"]
`
    },
    {
      path: "layout.md",
      contents: `## Layout: Pipeline Density [target="block:pipeline"]
- Control: density [value="compact"]
- Control: padding [value="md"]
- Control: collapse [value="stack" at="tablet"]
- Control: overflow [value="contain"]
`
    },
    {
      path: "tokens.md",
      contents: `## Tokens: Theme [id="default"]
- Tone: brand [value="blue"]
- Radius: controls [value="sm"]
- Density: interface [value="compact"]
- Treatment: cards [value="outlined"]
`
    },
    {
      path: "acceptance.md",
      contents: `## Acceptance
- Invariant: Single modal stack [target="screen:*"]
- Invariant: Reachable flow [target="flow:primary-review"]
- Invariant: Overflow containment [target="block:pipeline"]
- Note: Long account names must wrap inside cards without spilling.
`
    }
  ]
};

describe("IR_SCHEMA", () => {
  test("describes the v1 IR contract with deterministic top-level fields", () => {
    assert.deepEqual(Object.keys(IR_SCHEMA), [
      "$schema",
      "title",
      "type",
      "required",
      "additionalProperties",
      "properties",
      "definitions"
    ]);

    assert.deepEqual(IR_SCHEMA.required, [
      "version",
      "title",
      "metadata",
      "screens"
    ]);
    assert.deepEqual(Object.keys(IR_SCHEMA.definitions), [
      "metadata",
      "packageMetadata",
      "includedFile",
      "renderingTarget",
      "adapter",
      "resolvedLibrary",
      "assetProvenance",
      "acceptanceSummary",
      "sourceRef",
      "layout",
      "screen",
      "region",
      "block",
      "section",
      "element",
      "action",
      "state",
      "transition",
      "flow",
      "contentRecord",
      "layoutDeclaration",
      "tokenGroup",
      "acceptance"
    ]);
  });
});

describe("compileToIr", () => {
  test("compiles valid markdown into stable renderer-facing IR", () => {
    const ir = compileToIr(validSpec);

    const expected = {
      version: SPEC_UI_VERSION,
      title: "Task Board",
      metadata: {
        generatedBy: "spec-ui",
        sourceMode: "single-file",
        sourceHash: sourceHash(validSpec),
        compiledAt: null,
        surface: "app",
        renderingTarget: {
          target: "baseline",
          version: SPEC_UI_VERSION,
          resolvedTarget: "baseline",
          selectionSource: "default"
        },
        ...baselineMetadata
      },
      screens: [
        {
          id: "dashboard",
          title: "Dashboard",
          shell: "none",
          kind: "default",
          regions: [],
          sections: [
            {
              id: "queue",
              title: "Queue",
              elements: [
                {
                  id: "headline",
                  type: "text",
                  label: "Today's work",
                  props: {}
                },
                {
                  id: "openDetails",
                  type: "button",
                  label: "Review details",
                  props: {},
                  action: "openDetails"
                }
              ],
              actions: [
                {
                  id: "openDetails",
                  label: "Review details",
                  type: "open-modal",
                  target: "details"
                },
                {
                  id: "toSettings",
                  label: "Settings",
                  type: "navigate",
                  target: "settings"
                }
              ]
            }
          ],
          states: [
            {
              id: "details",
              type: "modal",
              label: "Details modal",
              items: [
                {
                  id: "detailsBody",
                  type: "text",
                  label: "Full task detail",
                  props: {}
                },
                {
                  id: "closeDetails",
                  type: "button",
                  label: "Close details",
                  props: {},
                  action: {
                    id: "closeDetails",
                    label: "Close details",
                    type: "close-modal",
                    target: "details"
                  }
                }
              ]
            }
          ]
        },
        {
          id: "settings",
          title: "Settings",
          shell: "none",
          kind: "default",
          regions: [],
          sections: [
            {
              id: "preferences",
              title: "Preferences",
              elements: [
                {
                  id: "timezone",
                  type: "input",
                  label: "Time zone",
                  props: {
                    placeholder: "America/New_York"
                  }
                }
              ],
              actions: []
            }
          ],
          states: []
        }
      ]
    };

    assert.deepEqual(ir, expected);
    assert.deepEqual(Object.keys(ir), ["version", "title", "metadata", "screens"]);
    assert.equal(serializeIr(ir), `${JSON.stringify(expected, null, 2)}\n`);
    assert.equal(serializeIr(compileToIr(validSpec)), serializeIr(ir));
  });

  test("throws CompilationError with validation errors for invalid markdown", () => {
    assert.throws(
      () => compileToIr("# Spec: Empty"),
      (error) => {
        assert.ok(error instanceof CompilationError);
        assert.equal(error.message, "Spec UI compilation failed.");
        assert.deepEqual(error.errors, [
          {
            code: "no_screens",
            message: "Spec must include at least one screen.",
            line: 1
          }
        ]);
        return true;
      }
    );
  });

  test("compiles vNext SaaS parser output into stable semantic IR", () => {
    const ir = compileSourceToIr(saasSource, saasMarkdown);

    assert.deepEqual(ir.metadata, {
      generatedBy: "spec-ui",
      sourceMode: "single-file",
      sourceHash: sourceHash(saasMarkdown),
      compiledAt: null,
      surface: "app",
      renderingTarget: {
        target: "baseline",
        version: SPEC_UI_VERSION,
        resolvedTarget: "baseline",
        selectionSource: "source"
      },
      ...baselineMetadata
    });
    assert.deepEqual(ir.screens[0], {
      id: "dashboard",
      title: "Dashboard",
      shell: "app",
      kind: "dashboard",
      regions: [
        {
          id: "sidebar",
          title: "Sidebar",
          type: "sidebar",
          blocks: [
            {
              id: "mainNav",
              title: "Main nav",
              type: "nav",
              variant: null,
              items: [
                {
                  id: "navDashboard",
                  type: "nav-item",
                  label: "Dashboard",
                  props: {
                    href: "#dashboard"
                  },
                  action: "navDashboard"
                }
              ],
              actions: [
                {
                  id: "navDashboard",
                  label: "Dashboard",
                  type: "navigate",
                  target: "dashboard"
                }
              ],
              states: []
            }
          ]
        },
        {
          id: "content",
          title: "Content",
          type: "content",
          blocks: [
            {
              id: "metrics",
              title: "Metrics",
              type: "metric-row",
              variant: "compact",
              items: [
                {
                  id: "openDeals",
                  type: "metric",
                  label: "Open deals",
                  props: {
                    tone: "positive",
                    value: "42"
                  }
                }
              ],
              actions: [],
              states: []
            },
            {
              id: "pipeline",
              title: "Pipeline",
              type: "data-table",
              variant: null,
              items: [
                {
                  id: "companyColumn",
                  type: "column",
                  label: "Company",
                  props: {}
                },
                {
                  id: "acmeRow",
                  type: "row",
                  label: "Acme",
                  props: {
                    status: "review"
                  },
                  action: "acmeRow"
                }
              ],
              actions: [
                {
                  id: "acmeRow",
                  label: "Acme",
                  type: "open-modal",
                  target: "dealDetails"
                }
              ],
              states: [
                {
                  id: "dealDetails",
                  type: "modal",
                  label: "Deal details",
                  items: [
                    {
                      id: "dealBody",
                      type: "text",
                      label: "ACME is ready for review.",
                      props: {}
                    },
                    {
                      id: "closeDealDetails",
                      type: "button",
                      label: "Close",
                      props: {},
                      action: {
                        id: "closeDealDetails",
                        label: "Close",
                        type: "close-modal",
                        target: "dealDetails"
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      sections: [],
      states: []
    });
    assert.equal(serializeIr(ir), serializeIr(compileSourceToIr(saasSource, saasMarkdown)));
  });

  test("compiles vNext marketing parser output into stable semantic IR", () => {
    const ir = compileSourceToIr(marketingSource, marketingMarkdown);

    assert.equal(ir.metadata.surface, "marketing");
    assert.deepEqual(ir.metadata.renderingTarget, {
      target: "baseline",
      version: SPEC_UI_VERSION,
      resolvedTarget: "baseline",
      selectionSource: "source"
    });
    assert.deepEqual(ir.screens.map((screen) => ({
      id: screen.id,
      shell: screen.shell,
      kind: screen.kind,
      regionTypes: screen.regions.map((region) => region.type),
      blockTypes: screen.regions.flatMap((region) =>
        region.blocks.map((block) => block.type)
      )
    })), [
      {
        id: "landing",
        shell: "marketing",
        kind: "landing",
        regionTypes: ["main"],
        blockTypes: ["hero", "pricing"]
      },
      {
        id: "signup",
        shell: "marketing",
        kind: "signup",
        regionTypes: [],
        blockTypes: []
      }
    ]);
    assert.deepEqual(
      ir.screens[0].regions[0].blocks[0].actions,
      [
        {
          id: "primaryCta",
          label: "Start now",
          type: "navigate",
          target: "signup"
        }
      ]
    );
  });

  test("keeps adapter metadata deterministic for unchanged source and options", () => {
    const options = { adapter: "baseline" };
    const first = serializeIr(compileSourceToIr(saasSource, saasMarkdown, options));
    const second = serializeIr(compileSourceToIr(saasSource, saasMarkdown, options));
    const ir = JSON.parse(first);

    assert.equal(first, second);
    assert.deepEqual(ir.metadata.renderingTarget, {
      target: "baseline",
      version: SPEC_UI_VERSION,
      resolvedTarget: "baseline",
      selectionSource: "options"
    });
    assert.deepEqual(ir.metadata.adapter, baselineMetadata.adapter);
  });

  test("rejects unsupported adapter configuration before IR emission", () => {
    assert.throws(
      () => compileSourceToIr(saasSource, saasMarkdown, { adapter: "tailwind" }),
      (error) => {
        assert.ok(error instanceof CompilationError);
        assert.deepEqual(error.errors, [
          {
            code: "unsupported_rendering_target",
            message: 'Unsupported rendering target "tailwind". Supported targets: baseline, bootstrap-html.',
            line: 1
          }
        ]);
        return true;
      }
    );
  });

  test("adds rendering target metadata to handoff output", () => {
    const ir = compileSourceToIr(marketingSource, marketingMarkdown);
    const handoff = createHandoffResult({
      inputPath: "/tmp/marketing.md",
      outputPath: "/tmp/marketing.html",
      irPath: "/tmp/marketing.ir.json",
      html: "<!doctype html>\n",
      ir
    });

    assert.equal(handoff.sourceHash, sourceHash(marketingMarkdown));
    assert.deepEqual(handoff.viewerCompatibility, ["browser", "microcanvas"]);
    assert.deepEqual(handoff.renderingTarget, {
      target: "baseline",
      version: SPEC_UI_VERSION,
      resolvedTarget: "baseline",
      selectionSource: "source"
    });
    assert.equal(handoff.sourceMode, "single-file");
    assert.deepEqual(handoff.adapter, baselineMetadata.adapter);
  });

  test("compiles package layout, flow, content, tokens, and acceptance deterministically", () => {
    const first = serializeIr(compilePackageToIr(packageInput));
    const second = serializeIr(compilePackageToIr(packageInput));
    const ir = JSON.parse(first);

    assert.equal(first, second);
    assert.equal(ir.metadata.sourceMode, "package");
    assert.equal(ir.metadata.package.manifestPath, packageInput.manifestPath);
    assert.equal(ir.metadata.package.fidelity, "prototype");
    assert.deepEqual(ir.metadata.renderingTarget, {
      target: "bootstrap-html",
      version: SPEC_UI_VERSION,
      resolvedTarget: "bootstrap-html",
      selectionSource: "source"
    });
    assert.deepEqual(ir.metadata.resolvedLibrary, {
      name: "bootstrap",
      version: "5"
    });
    assert.deepEqual(ir.metadata.assetProvenance, {
      mode: "vendored",
      source: "bootstrap-5"
    });
    assert.deepEqual(
      ir.metadata.package.includedFiles.map((file) => [file.path, file.role, file.exists]),
      [
        ["screens.md", "screens", true],
        ["flows.md", "flows", true],
        ["content.md", "content", true],
        ["layout.md", "layout", true],
        ["tokens.md", "tokens", true],
        ["acceptance.md", "acceptance", true]
      ]
    );

    const pipeline = ir.screens[0].regions[0].blocks[0];
    assert.deepEqual(pipeline.layout, {
      density: "compact",
      padding: "md",
      collapse: {
        value: "stack",
        at: "tablet"
      },
      overflow: "contain"
    });
    assert.deepEqual(
      pipeline.items.map((item) => [item.id, item.type, item.source.role]),
      [
        ["accountColumn", "column", "screens"],
        ["stageColumn", "column", "screens"],
        ["pipeline-opportunity-rows-acme-expansion", "row", "content"],
        ["pipeline-opportunity-rows-northwind-pilot", "row", "content"]
      ]
    );
    assert.deepEqual(ir.flows[0].steps[0], {
      label: "Open Forecast",
      from: "executive-dashboard",
      action: "open-modal:forecast-modal",
      to: "forecast-modal",
      source: {
        file: "flows.md",
        role: "flows",
        line: 2
      }
    });
    assert.deepEqual(
      ir.tokens[0].controls.map((control) => [control.type, control.target, control.value]),
      [
        ["tone", "brand", "blue"],
        ["radius", "controls", "sm"],
        ["density", "interface", "compact"],
        ["treatment", "cards", "outlined"]
      ]
    );
    assert.deepEqual(ir.metadata.acceptanceSummary, {
      invariantCount: 3,
      noteCount: 1,
      invariants: ir.acceptance.invariants
    });
  });

  test("reports package readiness status without rendering", () => {
    const status = getPackageStatus(packageInput);

    assert.equal(status.readiness, "ready");
    assert.equal(status.title, "Revenue Workspace");
    assert.equal(status.adapter, "bootstrap-html");
    assert.equal(status.acceptance.invariantCount, 3);
    assert.equal(status.validationErrors.length, 0);
  });
});
