import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test } from "node:test";

import { compileToIr, CompilationError, serializeIr } from "../src/compiler.js";
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
      "screen",
      "section",
      "element",
      "action",
      "state",
      "transition"
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
        sourceHash: sourceHash(validSpec),
        compiledAt: null
      },
      screens: [
        {
          id: "dashboard",
          title: "Dashboard",
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
});
