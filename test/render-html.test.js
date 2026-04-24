import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { renderHtml } from "../src/render-html.js";

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
});
