import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  HTML_ADAPTER_REGISTRY,
  RenderHtmlError,
  renderHtml
} from "../src/render-html.js";

const prototypeIr = {
  metadata: {
    title: 'Roadmap <Review> & "Launch"'
  },
  screens: [
    {
      id: "dashboard",
      title: "Dashboard",
      sections: [
        {
          id: "queue",
          title: "Queue & Triage",
          elements: [
            {
              id: "headline",
              type: "text",
              label: "Today's <urgent> work"
            },
            {
              id: "open-details",
              type: "button",
              label: 'Open "details"',
              action: {
                type: "open-modal",
                target: "details"
              }
            },
            {
              id: "toggle-help",
              type: "button",
              label: "Toggle help",
              action: {
                type: "toggle",
                target: "help"
              }
            },
            {
              id: "show-empty",
              type: "button",
              label: "Show empty",
              action: {
                type: "show-state",
                target: "empty"
              }
            },
            {
              id: "tab-activity",
              type: "button",
              label: "Activity tab",
              action: {
                type: "set-tab",
                target: "activity"
              }
            }
          ],
          actions: [
            {
              id: "to-settings",
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
          label: "Details",
          items: [
            {
              id: "details-copy",
              type: "text",
              label: "Sensitive & escaped"
            },
            {
              id: "close-details",
              type: "button",
              label: "Close",
              action: {
                type: "close-modal",
                target: "details"
              }
            }
          ]
        },
        {
          id: "help",
          type: "revealed",
          label: "Help",
          items: [
            {
              id: "help-copy",
              type: "text",
              label: "Use the queue to review work."
            }
          ]
        },
        {
          id: "summary",
          type: "tab",
          label: "Summary",
          items: [
            {
              id: "summary-copy",
              type: "text",
              label: "Summary content"
            }
          ]
        },
        {
          id: "activity",
          type: "tab",
          label: "Activity",
          items: [
            {
              id: "activity-copy",
              type: "text",
              label: "Activity content"
            }
          ]
        },
        {
          id: "empty",
          type: "empty",
          label: "Empty",
          items: [
            {
              id: "empty-copy",
              type: "empty",
              label: "No work yet"
            }
          ]
        }
      ]
    },
    {
      id: "settings",
      title: "Settings",
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

const semanticSaasIr = {
  metadata: {
    title: "Ops Console",
    surface: "app",
    renderingTarget: {
      target: "baseline",
      version: "0.1.0",
      resolvedTarget: "baseline"
    }
  },
  screens: [
    {
      id: "overview",
      title: "Overview",
      shell: "app",
      kind: "dashboard",
      gap: "lg",
      regions: [
        {
          id: "primary-nav",
          title: "Navigation",
          type: "sidebar",
          gap: "sm",
          blocks: [
            {
              id: "main-nav",
              title: "Main nav",
              type: "nav",
              gap: "xs",
              items: [
                {
                  id: "nav-overview",
                  type: "nav-item",
                  label: "Overview",
                  props: {}
                },
                {
                  id: "nav-settings",
                  type: "nav-item",
                  label: "Settings",
                  props: {},
                  action: {
                    type: "navigate",
                    target: "settings"
                  }
                }
              ],
              actions: []
            }
          ]
        },
        {
          id: "topbar",
          title: "Topbar",
          type: "topbar",
          blocks: [
            {
              id: "page-title",
              title: "Pipeline health",
              type: "page-header",
              items: [
                {
                  id: "page-copy",
                  type: "text",
                  label: "Review live delivery risk.",
                  props: {}
                },
                {
                  id: "open-risk",
                  type: "button",
                  label: "Open risk drawer",
                  props: {},
                  action: "open-risk"
                }
              ],
              actions: [
                {
                  id: "open-risk",
                  label: "Open risk drawer",
                  type: "open-modal",
                  target: "risk-drawer"
                }
              ]
            }
          ]
        },
        {
          id: "main-content",
          title: "Content",
          type: "content",
          blocks: [
            {
              id: "metrics",
              title: "Metrics",
              type: "metric-row",
              items: [
                {
                  id: "mrr",
                  type: "metric",
                  label: "MRR",
                  props: {
                    value: "$128k",
                    description: "Up 8%"
                  }
                },
                {
                  id: "risk",
                  type: "metric",
                  label: "At risk",
                  props: {
                    value: "14",
                    description: "Needs attention"
                  }
                }
              ],
              actions: []
            },
            {
              id: "accounts",
              title: "Accounts",
              type: "data-table",
              items: [
                {
                  id: "account-column",
                  type: "column",
                  label: "Account",
                  props: {}
                },
                {
                  id: "status-column",
                  type: "column",
                  label: "Status",
                  props: {}
                },
                {
                  id: "row-acme",
                  type: "row",
                  label: "Acme",
                  props: {
                    "account-column": "Acme",
                    "status-column": "Healthy"
                  }
                }
              ],
              actions: []
            },
            {
              id: "risk-drawer-block",
              title: "Risk drawer",
              type: "drawer",
              items: [],
              actions: [],
              states: [
                {
                  id: "risk-drawer",
                  type: "drawer",
                  label: "Risk details",
                  items: [
                    {
                      id: "risk-copy",
                      type: "text",
                      label: "Expansion is blocked.",
                      props: {}
                    },
                    {
                      id: "close-risk",
                      type: "button",
                      label: "Close",
                      props: {},
                      action: {
                        id: "close-risk",
                        label: "Close",
                        type: "close-modal",
                        target: "risk-drawer"
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "activity",
          title: "Activity",
          type: "aside",
          blocks: [
            {
              id: "feed",
              title: "Feed",
              type: "activity-feed",
              items: [
                {
                  id: "activity-1",
                  type: "activity",
                  label: "Renewal call booked",
                  props: {
                    description: "Today"
                  }
                }
              ],
              actions: []
            }
          ]
        },
        {
          id: "app-footer",
          title: "Footer",
          type: "footer",
          blocks: [
            {
              id: "status",
              title: "Status",
              type: "state-panel",
              items: [
                {
                  id: "status-copy",
                  type: "success",
                  label: "All systems operational",
                  props: {}
                }
              ],
              actions: []
            }
          ]
        }
      ],
      sections: [],
      states: []
    },
    {
      id: "settings",
      title: "Settings",
      shell: "app",
      kind: "settings",
      regions: [
        {
          id: "settings-content",
          title: "Settings",
          type: "content",
          blocks: [
            {
              id: "workspace",
              title: "Workspace",
              type: "settings-group",
              items: [
                {
                  id: "workspace-name",
                  type: "field",
                  label: "Workspace name",
                  props: {
                    placeholder: "Acme"
                  }
                },
                {
                  id: "weekly-summary",
                  type: "toggle",
                  label: "Weekly summary",
                  props: {}
                }
              ],
              actions: []
            }
          ]
        }
      ],
      sections: [],
      states: []
    }
  ]
};

const semanticMarketingIr = {
  metadata: {
    title: "LaunchPad",
    surface: "marketing",
    renderingTarget: {
      target: "baseline",
      version: "0.1.0",
      resolvedTarget: "baseline"
    }
  },
  screens: [
    {
      id: "landing",
      title: "LaunchPad",
      shell: "marketing",
      kind: "landing",
      gap: "xl",
      regions: [
        {
          id: "site-nav",
          title: "Navigation",
          type: "navbar",
          gap: "lg",
          blocks: [
            {
              id: "navbar",
              title: "LaunchPad",
              type: "navbar",
              gap: "sm",
              items: [
                {
                  id: "features-link",
                  type: "nav-item",
                  label: "Features",
                  props: {}
                },
                {
                  id: "pricing-link",
                  type: "nav-item",
                  label: "Pricing",
                  props: {},
                  action: {
                    type: "show-state",
                    target: "pricing-note"
                  }
                }
              ],
              actions: []
            }
          ]
        },
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
                  label: "Ship product decisions faster",
                  props: {}
                },
                {
                  id: "subhead",
                  type: "subhead",
                  label: "Turn structured specs into reviewable prototypes.",
                  props: {}
                },
                {
                  id: "start-trial",
                  type: "button",
                  label: "Start trial",
                  props: {},
                  action: {
                    type: "navigate",
                    target: "signup"
                  }
                }
              ],
              actions: []
            },
            {
              id: "logos",
              title: "Trusted by",
              type: "logo-cloud",
              items: [
                {
                  id: "northstar",
                  type: "logo",
                  label: "Northstar",
                  props: {}
                }
              ],
              actions: []
            },
            {
              id: "features",
              title: "Features",
              type: "feature-grid",
              items: [
                {
                  id: "semantic-specs",
                  type: "feature",
                  label: "Semantic specs",
                  props: {
                    description: "Model intent without raw framework code."
                  }
                }
              ],
              actions: []
            },
            {
              id: "pricing",
              title: "Pricing",
              type: "pricing",
              items: [
                {
                  id: "team",
                  type: "pricing-tier",
                  label: "Team",
                  props: {
                    price: "$29",
                    description: "Per editor"
                  }
                }
              ],
              actions: []
            },
            {
              id: "proof",
              title: "Teams say",
              type: "testimonial-group",
              items: [
                {
                  id: "quote",
                  type: "testimonial",
                  label: "The prototype answered the hard questions.",
                  props: {
                    description: "PM, Finch Labs"
                  }
                }
              ],
              actions: []
            },
            {
              id: "faq",
              title: "FAQ",
              type: "faq",
              items: [
                {
                  id: "portable",
                  type: "faq-item",
                  label: "Does it run standalone?",
                  props: {
                    description: "Yes, as one HTML document."
                  }
                }
              ],
              actions: []
            },
            {
              id: "cta",
              title: "Ready",
              type: "cta",
              items: [
                {
                  id: "cta-copy",
                  type: "subhead",
                  label: "Prototype the next decision.",
                  props: {}
                }
              ],
              actions: [
                {
                  id: "cta-signup",
                  label: "Create account",
                  type: "navigate",
                  target: "signup"
                }
              ],
              states: [
                {
                  id: "pricing-note",
                  type: "revealed",
                  label: "Pricing note",
                  items: [
                    {
                      id: "pricing-copy",
                      type: "text",
                      label: "Annual discounts are available.",
                      props: {}
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "site-footer",
          title: "Footer",
          type: "footer",
          blocks: [
            {
              id: "footer",
              title: "Footer",
              type: "footer",
              items: [
                {
                  id: "copyright",
                  type: "text",
                  label: "LaunchPad 2026",
                  props: {}
                }
              ],
              actions: []
            }
          ]
        }
      ],
      sections: [],
      states: []
    },
    {
      id: "signup",
      title: "Signup",
      shell: "marketing",
      kind: "signup",
      regions: [
        {
          id: "signup-main",
          title: "Signup",
          type: "main",
          blocks: [
            {
              id: "signup-form",
              title: "Create account",
              type: "signup-form",
              items: [
                {
                  id: "email",
                  type: "field",
                  label: "Email",
                  props: {
                    placeholder: "you@example.com"
                  }
                }
              ],
              actions: []
            }
          ]
        }
      ],
      sections: [],
      states: []
    }
  ]
};

describe("renderHtml", () => {
  test("renders a complete deterministic HTML document from IR only", () => {
    const html = renderHtml(prototypeIr);

    assert.equal(html, renderHtml(prototypeIr));
    assert.ok(html.startsWith("<!doctype html>"));
    assert.ok(html.endsWith("\n"));
    assert.match(html, /<html lang="en">/);
    assert.match(html, /data-spec-ui-version="0\.1\.0"/);
    assert.match(html, /data-screen-id="dashboard"/);
    assert.match(html, /data-screen-id="settings"/);
    assert.match(html, /data-section-id="queue"/);
    assert.match(html, /data-element-id="headline"/);
    assert.match(html, /data-state-id="details"/);
  });

  test("escapes text and attribute content", () => {
    const html = renderHtml(prototypeIr);

    assert.match(html, /Roadmap &lt;Review&gt; &amp; &quot;Launch&quot;/);
    assert.match(html, /Today&#39;s &lt;urgent&gt; work/);
    assert.match(html, /Open &quot;details&quot;/);
    assert.doesNotMatch(html, /Today's <urgent> work/);
  });

  test("emits deterministic data-driven interaction hooks", () => {
    const html = renderHtml(prototypeIr);

    assert.match(
      html,
      /data-action-type="navigate" data-action-target="settings"/
    );
    assert.match(
      html,
      /data-action-type="open-modal" data-action-target="details"/
    );
    assert.match(html, /data-action-type="toggle" data-action-target="help"/);
    assert.match(
      html,
      /data-action-type="set-tab" data-action-target="activity"/
    );
    assert.match(
      html,
      /data-action-type="show-state" data-action-target="empty"/
    );
    assert.match(html, /document\.addEventListener\("click"/);
  });

  test("clears transient feedback when closing a modal from an overlay", () => {
    const html = renderHtml(prototypeIr);

    assert.match(html, /function clearTransientOverlayStates\(trigger\)/);
    assert.match(html, /trigger\.closest\("\[data-state-overlay\]"\)/);
    assert.match(
      html,
      /stateType === "success" \|\| stateType === "error" \|\| stateType === "empty" \|\| stateType === "loading"/
    );
    assert.match(
      html,
      /if \(type === "close-modal"\) \{[\s\S]*clearTransientOverlayStates\(trigger\);[\s\S]*\}/
    );
  });

  test("resolves compiled element action ids through section actions", () => {
    const html = renderHtml({
      title: "Compiled IR",
      screens: [
        {
          id: "home",
          title: "Home",
          sections: [
            {
              id: "main",
              title: "Main",
              elements: [
                {
                  id: "open-details",
                  type: "button",
                  label: "Open details",
                  action: "open-details"
                }
              ],
              actions: [
                {
                  id: "open-details",
                  label: "Open details",
                  type: "open-modal",
                  target: "details"
                }
              ]
            }
          ],
          states: [
            {
              id: "details",
              type: "modal",
              label: "Details",
              items: []
            }
          ]
        }
      ]
    });

    assert.match(
      html,
      /data-action-type="open-modal" data-action-target="details"/
    );
    assert.equal(html.match(/data-element-id="open-details"/g).length, 1);
  });

  test("renders semantic SaaS app shell regions and blocks", () => {
    const html = renderHtml(semanticSaasIr);

    assert.match(html, /data-screen-shell="app"/);
    assert.match(html, /data-screen-kind="dashboard"/);
    assert.match(html, /data-gap="lg"/);
    assert.match(html, /--spec-ui-gap: 18px/);
    assert.match(html, /class="spec-ui-regions spec-ui-app-layout"/);
    assert.match(html, /data-region-type="sidebar"/);
    assert.match(html, /data-region-type="topbar"/);
    assert.match(html, /data-region-type="content"/);
    assert.match(html, /data-region-type="aside"/);
    assert.match(html, /data-region-type="footer"/);
    assert.match(html, /data-block-type="metric-row"/);
    assert.match(html, /data-block-type="data-table"/);
    assert.match(html, /<table class="spec-ui-table">/);
    assert.match(html, /<th scope="col">Account<\/th>/);
    assert.match(html, /<td>Healthy<\/td>/);
    assert.match(html, /data-block-type="settings-group"/);
  });

  test("renders semantic marketing shell regions and conversion blocks", () => {
    const html = renderHtml(semanticMarketingIr);

    assert.match(html, /data-screen-shell="marketing"/);
    assert.match(html, /data-screen-kind="landing"/);
    assert.match(html, /data-gap="xl"/);
    assert.match(html, /--spec-ui-gap: 28px/);
    assert.match(html, /class="spec-ui-regions spec-ui-marketing-layout"/);
    assert.match(html, /grid-template-areas: "navbar" "content" "footer"/);
    assert.match(html, /data-region-type="navbar"/);
    assert.match(html, /data-region-type="main"/);
    assert.match(html, /data-region-type="footer"/);
    assert.match(html, /data-block-type="hero"/);
    assert.match(html, /data-block-type="logo-cloud"/);
    assert.match(html, /data-block-type="feature-grid"/);
    assert.match(html, /data-block-type="pricing"/);
    assert.match(html, /data-block-type="testimonial-group"/);
    assert.match(html, /data-block-type="faq"/);
    assert.match(html, /data-block-type="cta"/);
    assert.match(html, /Ship product decisions faster/);
  });

  test("keeps semantic action hooks and state interactions data driven", () => {
    const appHtml = renderHtml(semanticSaasIr);
    const marketingHtml = renderHtml(semanticMarketingIr);

    assert.match(
      appHtml,
      /data-element-id="nav-settings" data-element-type="nav-item" data-action-type="navigate" data-action-target="settings"/
    );
    assert.match(
      appHtml,
      /data-element-id="open-risk" data-element-type="button" data-action-type="open-modal" data-action-target="risk-drawer"/
    );
    assert.match(
      appHtml,
      /data-element-id="close-risk" data-element-type="button" data-action-type="close-modal" data-action-target="risk-drawer"/
    );
    assert.match(appHtml, /data-state-id="risk-drawer"/);
    assert.match(
      appHtml,
      /data-state-id="risk-drawer" data-state-type="drawer" hidden/
    );
    assert.match(appHtml, /\.spec-ui-state-overlay/);
    assert.match(appHtml, /place-items: center/);
    assert.match(appHtml, /exclusiveOverlay/);
    assert.match(
      marketingHtml,
      /data-action-type="show-state" data-action-target="pricing-note"/
    );
    assert.match(
      marketingHtml,
      /data-action-type="navigate" data-action-target="signup"/
    );
  });

  test("renders semantic HTML deterministically without external runtime hooks", () => {
    const html = renderHtml(semanticMarketingIr);

    assert.equal(html, renderHtml(semanticMarketingIr));
    assert.doesNotMatch(html, /<link\b/i);
    assert.doesNotMatch(html, /\ssrc=/i);
    assert.doesNotMatch(html, /@import/i);
    assert.doesNotMatch(html, /fetch\(/i);
  });

  test("exposes baseline and bootstrap-html adapter registry entries", () => {
    assert.deepEqual(Object.keys(HTML_ADAPTER_REGISTRY).sort(), [
      "baseline",
      "bootstrap-html"
    ]);
    assert.equal(HTML_ADAPTER_REGISTRY.baseline.resolvedTarget, "baseline");
    assert.equal(
      HTML_ADAPTER_REGISTRY["bootstrap-html"].resolvedLibrary.pinnedMajor,
      "5"
    );
    assert.equal(
      HTML_ADAPTER_REGISTRY["bootstrap-html"].assetProvenance,
      "repo-vendored-inline"
    );
  });

  test("renders bootstrap-html as deterministic standalone HTML with pinned provenance", () => {
    const ir = {
      ...semanticSaasIr,
      metadata: {
        ...semanticSaasIr.metadata,
        renderingTarget: {
          target: "bootstrap-html",
          version: "0.1.0",
          resolvedTarget: "bootstrap-html"
        },
        tokens: {
          brand: "teal",
          radius: "sm",
          density: "compact",
          treatment: "outlined"
        }
      }
    };
    const html = renderHtml(ir);

    assert.equal(html, renderHtml(ir));
    assert.match(html, /data-spec-ui-adapter="bootstrap-html"/);
    assert.match(html, /data-bootstrap-provenance="repo-vendored-inline"/);
    assert.match(html, /name="spec-ui-bootstrap" content="5\.3-compatible"/);
    assert.match(html, /Bootstrap 5\.3-compatible support layer/);
    assert.doesNotMatch(html, /<link\b/i);
    assert.doesNotMatch(html, /\ssrc=/i);
    assert.doesNotMatch(html, /https?:\/\//i);
    assert.doesNotMatch(html, /@import/i);
    assert.doesNotMatch(html, /fetch\(/i);
  });

  test("maps semantic SaaS blocks to Bootstrap-compatible markup", () => {
    const html = renderHtml(semanticSaasIr, { adapter: "bootstrap-html" });

    assert.match(html, /class="spec-bs-shell container-fluid"/);
    assert.match(html, /class="row g-4"/);
    assert.match(html, /class="card spec-bs-block spec-bs-block-metric-row/);
    assert.match(html, /class="table-responsive"/);
    assert.match(html, /<table class="table">/);
    assert.match(html, /class="form-check spec-bs-element"/);
    assert.match(html, /class="btn btn-primary spec-bs-action"/);
    assert.match(html, /data-action-type="open-modal" data-action-target="risk-drawer"/);
    assert.match(html, /class="card spec-bs-state spec-bs-state-drawer"/);
  });

  test("maps semantic marketing blocks and layout controls deterministically", () => {
    const ir = {
      ...semanticMarketingIr,
      metadata: {
        ...semanticMarketingIr.metadata,
        renderingTarget: {
          target: "bootstrap-html",
          version: "0.1.0",
          resolvedTarget: "bootstrap-html"
        }
      },
      screens: semanticMarketingIr.screens.map((screen) =>
        screen.id === "landing"
          ? {
              ...screen,
              layout: {
                density: "comfortable",
                padding: "lg",
                width: "wide",
                align: "start",
                overflow: "contain"
              },
              regions: screen.regions.map((region) => ({
                ...region,
                blocks: region.blocks.map((block) =>
                  block.id === "features"
                    ? {
                        ...block,
                        layout: {
                          columns: "3",
                          collapse: "stack",
                          text: "wrap"
                        }
                      }
                    : block
                )
              }))
            }
          : screen
      )
    };
    const html = renderHtml(ir);

    assert.match(html, /spec-bs-screen-marketing/);
    assert.match(html, /spec-bs-marketing-hero/);
    assert.match(html, /class="display-6 spec-bs-element"/);
    assert.match(html, /class="lead spec-bs-element"/);
    assert.match(html, /spec-bs-block-feature-grid/);
    assert.match(html, /data-layout-density="comfortable"/);
    assert.match(html, /data-layout-columns="3"/);
    assert.match(html, /spec-bs-columns-3/);
    assert.match(html, /spec-bs-collapse-stack/);
    assert.match(html, /spec-bs-text-wrap/);
  });

  test("rejects unsupported adapters and unsupported bootstrap semantic details", () => {
    assert.throws(
      () => renderHtml(semanticSaasIr, { adapter: "tailwind" }),
      (error) => {
        assert.ok(error instanceof RenderHtmlError);
        assert.equal(error.errors[0].code, "unsupported_adapter");
        return true;
      }
    );

    assert.throws(
      () => renderHtml({
        metadata: {
          title: "Bad",
          renderingTarget: {
            target: "bootstrap-html",
            resolvedTarget: "bootstrap-html"
          }
        },
        screens: [
          {
            id: "home",
            title: "Home",
            shell: "app",
            kind: "dashboard",
            regions: [
              {
                id: "main",
                title: "Main",
                type: "content",
                blocks: [
                  {
                    id: "chart",
                    title: "Chart",
                    type: "chart",
                    layout: { padding: "giant" },
                    items: [
                      {
                        id: "raw",
                        type: "text",
                        label: "Raw",
                        props: { class: "btn btn-primary" }
                      }
                    ],
                    actions: [
                      {
                        id: "launch",
                        label: "Launch",
                        type: "launch",
                        target: "home"
                      }
                    ]
                  }
                ]
              }
            ],
            sections: [],
            states: []
          }
        ]
      }),
      (error) => {
        assert.ok(error instanceof RenderHtmlError);
        assert.deepEqual(error.errors.map((item) => item.code), [
          "unsupported_layout_control",
          "unsupported_semantic_block",
          "raw_implementation_detail",
          "unsupported_interaction"
        ]);
        return true;
      }
    );
  });
});
