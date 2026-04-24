import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseSpec } from "../src/parser.js";
import { validateSource } from "../src/validation.js";

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
});
